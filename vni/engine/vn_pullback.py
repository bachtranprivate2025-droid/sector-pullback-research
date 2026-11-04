"""VNINDEX pullback & sweep research — 19 ICB level-2 sectors (Finlens data).

Methodology mirrors the reference SPY/sector-ETF report, adapted to Vietnam:
  * signal series  : VNINDEX daily OHLC
  * universe       : 19 ICB L2 sector indices, eligible after 200 prior closes
  * MA Daily       : SMA of closes up to the PRIOR session
  * MA Weekly      : SMA of closes of COMPLETED weeks before the signal week
  * zone           : MA +/- width * ATR14 (Wilder, prior session)
  * touch          : low enters zone after 3 sessions whose low stayed above it (gap-through counts)
  * hold           : touch day close >= MA centre
  * reclaim        : first close >= MA centre on touch day or up to 5 sessions later
  * sweep          : confirmed swing low (2 left / 2 right), age <= 40, low < pivot & close > pivot;
                     *_next_confirm waits for next session close > sweep-day high
  * trade          : basket picked at signal close, bought at next open, 1/3 each,
                     sold at close of holding session H (entry session = #1), no overlap, no stop
  * cost           : 0.40% round trip on basket capital (stress 1.00%)
"""
import glob, json, os, sys, hashlib
import numpy as np, pandas as pd

DATA = os.environ.get("FINLENS_DATA", "/home/claude/data")
COST, COST_STRESS = 0.004, 0.010
HOLDS = [3, 5, 10, 20, 40, 60]
TRENDS = ["all", "up"]
WIDTHS = [0.0, 0.25, 0.5, 0.75]
CONFS = ["touch", "hold", "reclaim"]
MAS = [f"D{n}" for n in (10, 20, 50, 100, 200)] + [f"W{n}" for n in (10, 20, 50, 100, 200)]
POLICIES = ["L4K", "L20", "L60", "B3", "BR3", "Cmix", "Rmix", "B3switch", "VNI"]

NAMES = {}


def load():
    ix = pd.read_csv(f"{DATA}/vn30.csv", parse_dates=["date"])
    v = ix[ix.symbol == "VNINDEX"].set_index("date").sort_index()
    cal = v.index
    O, H, L, C = {}, {}, {}, {}
    for f in sorted(glob.glob(f"{DATA}/icb/ICB_*.csv")):
        code = os.path.basename(f).split("_")[1]
        NAMES[code] = " ".join(os.path.basename(f)[:-4].split("_")[2:])
        d = pd.read_csv(f, parse_dates=["date"]).set_index("date").sort_index()
        d = d[~d.index.duplicated()].reindex(cal)
        O[code], H[code], L[code], C[code] = d.open, d.high, d.low, d.close
    S = pd.DataFrame(C).columns
    return v, pd.DataFrame(O)[S], pd.DataFrame(H)[S], pd.DataFrame(L)[S], pd.DataFrame(C)[S]


def wilder_atr(h, l, c, n=14):
    pc = c.shift(1)
    tr = pd.concat([h - l, (h - pc).abs(), (l - pc).abs()], axis=1).max(axis=1)
    atr = tr.copy() * np.nan
    vals = tr.values; out = np.full(len(vals), np.nan)
    if len(vals) > n:
        out[n] = np.nanmean(vals[1:n + 1])
        for i in range(n + 1, len(vals)):
            out[i] = (out[i - 1] * (n - 1) + vals[i]) / n
    return pd.Series(out, index=c.index)


def ma_series(v, key):
    n = int(key[1:])
    if key[0] == "D":
        return v.close.rolling(n).mean().shift(1)           # prior session
    wk = v.index.to_period("W-FRI")
    wclose = v.close.groupby(wk).last()
    wma = wclose.rolling(n).mean().shift(1)                  # completed weeks before signal week
    return pd.Series(wma.reindex(wk).values, index=v.index)


def touch_days(v, ma, atr, w):
    up = (ma + w * atr).values; low = v.low.values
    inz = low <= up
    out = []
    for t in range(3, len(low)):
        if np.isnan(up[t]) or np.isnan(up[t - 3]):
            continue
        if inz[t] and not inz[t - 1] and not inz[t - 2] and not inz[t - 3]:
            out.append(t)
    return out


def signals_ma(v, ma, atr, w, conf):
    T = touch_days(v, ma, atr, w)
    c, m = v.close.values, ma.values
    if conf == "touch":
        return T
    if conf == "hold":
        return [t for t in T if c[t] >= m[t]]
    out = []
    for t in T:
        for j in range(t, min(t + 6, len(c))):
            if c[j] >= m[j]:
                out.append(j); break
    return sorted(set(out))


def signals_sweep(v, conf, left=2, right=2, max_age=40):
    lo, hi, c = v.low.values, v.high.values, v.close.values
    n = len(lo); pivots = []
    for p in range(left, n - right):
        if all(lo[p] < lo[p - k] for k in range(1, left + 1)) and all(lo[p] < lo[p + k] for k in range(1, right + 1)):
            pivots.append(p)
    used = set(); out = []
    for t in range(n):
        cand = [p for p in pivots if p + right < t and t - p <= max_age and p not in used]
        if not cand:
            continue
        p = max(cand)                                       # most recent confirmed pivot
        lvl = lo[p]
        if lo[t] < lvl and c[t] > lvl:
            used.add(p)
            if conf == "sweep_close":
                out.append((t, p))
            elif t + 1 < n and c[t + 1] > hi[t]:
                out.append((t + 1, p))
    return out


class Picker:
    def __init__(self, v, O, C):
        self.C = C.values; self.O = O.values; self.cols = list(C.columns)
        self.vc = v.close.values
        cnt = C.notna().cumsum().shift(1).fillna(0).values
        self.elig = (cnt >= 200) & C.notna().values
        self.ma50 = C.rolling(50).mean().values
        self.cache = {}

    def perf(self, t, n, j=None):
        if t - n < 0: return np.nan
        a = self.C[t] / self.C[t - n] - 1
        return a if j is None else a[j]

    def vperf(self, t, n):
        return self.vc[t] / self.vc[t - n] - 1

    def pick(self, pol, t):
        key = (pol, t)
        if key in self.cache: return self.cache[key]
        el = np.where(self.elig[t] & self.elig[t - 1])[0]
        res = self._pick(pol, t, el) if len(el) >= 6 else ([], False, 0)
        self.cache[key] = res
        return res

    def _top(self, scores, el, k=3, exclude=()):
        s = [(scores[j], j) for j in el if j not in exclude and not np.isnan(scores[j])]
        s.sort(key=lambda x: -x[0]); return [j for _, j in s[:k]]

    def _bottom(self, scores, el, k):
        s = [(scores[j], j) for j in el if not np.isnan(scores[j])]
        s.sort(key=lambda x: x[0]); return [j for _, j in s[:k]]

    def _pick(self, pol, t, el):
        p20, p20y = self.perf(t, 20), self.perf(t - 1, 20)
        p3, r1 = self.perf(t, 3), self.perf(t, 1)
        v3, v1 = self.vperf(t, 3), self.vperf(t, 1)
        b3 = self._bottom(p20y, el, 3); b4 = self._bottom(p20y, el, 4)
        rec = [j for j in b3 if p3[j] > 0 and p3[j] > v3 and r1[j] > 0 and r1[j] > v1]
        spike = bool(b3) and np.mean(p3[b3]) > 0 and np.mean(p3[b3]) > v3 and np.mean(r1[b3]) > 0 and np.mean(r1[b3]) > v1
        if pol == "L20": out = self._top(p20, el)
        elif pol == "L60": out = self._top(self.perf(t, 60), el)
        elif pol == "L4K":
            ranks = np.zeros(len(self.cols))
            for n in (5, 21, 63, 126):
                pr = self.perf(t, n); order = sorted(el, key=lambda j: pr[j])
                for r, j in enumerate(order): ranks[j] += r
            ok = [j for j in el if self.C[t, j] > self.ma50[t, j]]
            out = self._top(ranks, ok if len(ok) >= 3 else el)
            if len(out) < 3: out += self._top(ranks, el, 3 - len(out), exclude=out)
        elif pol == "B3": out = b3
        elif pol == "BR3": out = self._top(p3, b4)
        elif pol == "Rmix":
            out = rec[:3]; out += self._top(p20, el, 3 - len(out), exclude=out)
        elif pol == "Cmix":
            top3_3d = set(self._top(p3, el))
            pri = [j for j in b4 if j in top3_3d and p3[j] > 0 and p3[j] > v3]
            pri.sort(key=lambda j: -p3[j]); out = pri[:3]
            out += self._top(p20, el, 3 - len(out), exclude=out)
        elif pol == "B3switch": out = b3 if spike else self._top(p20, el)
        else: out = []
        return out, spike, len(rec)


def metrics(r, bench=None):
    r = np.asarray(r, float)
    if len(r) == 0:
        return dict(n=0, wins=0, pf=None, wr=None, avg=None, median=None, worst=None, closed_dd=None, avg_excess_vni=None)
    g, l = r[r > 0].sum(), -r[r <= 0].sum()
    eq = np.cumprod(1 + r); dd = float((eq / np.maximum.accumulate(eq) - 1).min())
    return dict(n=int(len(r)), wins=int((r > 0).sum()), pf=float(g / l) if l > 0 else None, wr=float((r > 0).mean()),
                avg=float(r.mean()), median=float(np.median(r)), worst=float(r.min()), closed_dd=min(dd, 0.0),
                avg_excess_vni=float(np.mean(r - np.asarray(bench))) if bench is not None else None)


def run(start, end, sample_id, out_dir, keep_ids=None):
    v, O, H, L, C = load()
    idx = v.index; s_i = idx.searchsorted(pd.Timestamp(start)); e_i = idx.searchsorted(pd.Timestamp(end), side="right") - 1
    atr = wilder_atr(v.high, v.low, v.close).shift(1)
    pk = Picker(v, O, C); Ov, Cv = O.values, C.ffill().values
    vo, vc = v.open.values, v.close.values
    sig_sets = []
    for ma in MAS:
        m = ma_series(v, ma)
        up = (m > m.shift(10 if ma[0] == "D" else 20)).values
        for w in WIDTHS:
            for conf in CONFS:
                base = [(t, None) for t in signals_ma(v, m, atr, w, conf)]
                sig_sets.append((ma, w, conf, "all", base))
                sig_sets.append((ma, w, conf, "up", [(t, p) for t, p in base if up[t]]))
    m200 = v.close.rolling(200).mean().shift(1).values
    for conf in ["sweep_close", "sweep_next_confirm"]:
        base = signals_sweep(v, conf)
        sig_sets.append(("SWING_LOW", None, conf, "all", base))
        sig_sets.append(("SWING_LOW", None, conf, "up", [(t, p) for t, p in base if vc[t] > m200[t]]))
    rows, baskets, legs = [], [], []
    cid = 0
    for ma, w, conf, trend, sigs in sig_sets:
        sigs = [(t, p) for t, p in sigs if s_i <= t <= e_i]
        for hold in HOLDS:
            for pol in POLICIES:
                cid += 1
                busy = -1; rec = []
                for t, p in sigs:
                    if t <= busy: continue
                    ent, ex = t + 1, t + hold
                    if ex > e_i: break
                    picks, spike, nrec = pk.pick(pol if pol != "VNI" else "L20", t)
                    if pol != "VNI" and len(picks) < 3: continue
                    vni_ret = vc[ex] / vo[ent] - 1
                    if pol == "VNI":
                        gross = vni_ret; lg = []
                    else:
                        lg = []
                        for j in picks:
                            eo = Ov[ent, j]
                            if np.isnan(eo): eo = Cv[t, j]
                            lg.append((j, eo, Cv[ex, j], Cv[ex, j] / eo - 1))
                        gross = float(np.mean([x[3] for x in lg]))
                    rec.append(dict(t=t, ent=ent, ex=ex, gross=gross, net=gross - COST, vni_net=vni_ret - COST,
                                    spike=spike, nrec=nrec, picks=[pk.cols[j] for j in picks] if pol != "VNI" else ["VNINDEX"], legs=lg, pivot=p))
                    busy = ex
                net = [x["net"] for x in rec]; bench = [x["vni_net"] for x in rec]
                yrs = [idx[x["t"]].year for x in rec]
                def sub(f):
                    ss = [x for x, y in zip(rec, yrs) if f(y)]
                    return metrics([x["net"] for x in ss], [x["vni_net"] for x in ss])
                srt = sorted(net)
                row = dict(id=cid, ma=ma, width_atr=w, confirmation=conf, trend=trend, hold=hold, policy=pol,
                           sample=dict(first_signal=str(idx[rec[0]["t"]].date()) if rec else None, last_signal=str(idx[rec[-1]["t"]].date()) if rec else None,
                                       first_entry=str(idx[rec[0]["ent"]].date()) if rec else None, last_exit=str(idx[rec[-1]["ex"]].date()) if rec else None,
                                       year_counts={str(y): yrs.count(y) for y in sorted(set(yrs))}),
                           spike_baskets=int(sum(x["spike"] for x in rec)), baskets_with_recovering_bottom=int(sum(x["nrec"] > 0 for x in rec)),
                           all=metrics(net, bench), early=sub(lambda y: y <= 2022), middle=sub(lambda y: 2023 <= y <= 2024), recent=sub(lambda y: y >= 2025),
                           cost_stress=metrics([x["gross"] - COST_STRESS for x in rec], [x["vni_net"] - (COST_STRESS - COST) for x in rec]),
                           drop3=metrics(srt[:-3] if len(srt) > 3 else []))
                rows.append(row)
                if keep_ids is not None and cid in keep_ids:
                    for b, x in enumerate(rec, 1):
                        baskets.append(dict(config_id=cid, ma=ma, width_atr=w, confirmation=conf, trend=trend, hold=hold, policy=pol, basket=b,
                                            signal=str(idx[x["t"]].date()), entry=str(idx[x["ent"]].date()), exit=str(idx[x["ex"]].date()),
                                            sectors="|".join(x["picks"]), gross=x["gross"], net=x["net"], vni_net=x["vni_net"],
                                            eligible_sectors=int((pk.elig[x["t"]] & pk.elig[x["t"] - 1]).sum()), bottom3_spike=x["spike"],
                                            recovering_count=x["nrec"], pivot_date=str(idx[x["pivot"]].date()) if x["pivot"] is not None else ""))
                        for j, eo, xc, g in x["legs"]:
                            legs.append(dict(config_id=cid, basket=b, hold=hold, signal=str(idx[x["t"]].date()), entry=str(idx[x["ent"]].date()),
                                             exit=str(idx[x["ex"]].date()), sector=pk.cols[j], sector_name=NAMES[pk.cols[j]], weight=1 / 3,
                                             entry_open=eo, exit_close=xc, gross=g, net_weighted_contribution=(g - COST) / 3))
    meta = dict(start=str(idx[s_i].date()), end=str(idx[e_i].date()), sessions=int(e_i - s_i + 1),
                eligible_min=int(min((pk.elig[t] & pk.elig[t - 1]).sum() for t in range(s_i, e_i + 1))),
                eligible_max=int(max((pk.elig[t] & pk.elig[t - 1]).sum() for t in range(s_i, e_i + 1))))
    return rows, baskets, legs, meta, (v, O, H, L, C, pk)


if __name__ == "__main__":
    pass
