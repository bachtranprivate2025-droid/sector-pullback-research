"""Build the static report data for both samples."""
import json, hashlib, os, sys, datetime
import numpy as np, pandas as pd
import vn_pullback as E

OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/vnsite/site"
os.makedirs(OUT, exist_ok=True)
SAMPLES = [("ten-year", "2016-11-04", "2026-11-03", "10y"), ("full", "2008-01-02", "2026-11-03", "full")]
GROUPS = ["all", "early", "middle", "recent", "cost_stress", "drop3"]
MKEYS = ["n", "wins", "pf", "wr", "avg", "median", "worst", "closed_dd", "avg_excess_vni"]
CARD_SETUPS = [("D20", 0.75, "reclaim", "up", "L4K"), ("W20", 0.5, "reclaim", "up", "L4K"), ("D50", 0.5, "touch", "all", "BR3")]
GRID_MAS = ["D20", "D50", "D100", "W20", "W100", "SWING_LOW"]
GRID_POL = ["L4K", "L20", "BR3", "B3", "Rmix", "VNI"]
CUR_HOLDS = [5, 10, 20, 40, 60]


def key(ma, w, conf, trend, pol, hold):
    return (ma, w, conf, trend, pol, hold)


def curated_ids(rows):
    idx = {key(r["ma"], r["width_atr"], r["confirmation"], r["trend"], r["policy"], r["hold"]): r["id"] for r in rows}
    setups = list(CARD_SETUPS)
    for ma in GRID_MAS:
        for pol in GRID_POL:
            s = (ma, None, "sweep_close", "up", pol) if ma == "SWING_LOW" else (ma, 0.5, "reclaim", "up", pol)
            if s not in setups: setups.append(s)
    cur = []
    for h in CUR_HOLDS:
        for s in setups:
            cur.append(idx[key(*s, h)])
    # cards first (hold 20 versions first so DATA.curated[0..2] are the cards)
    first = [idx[key(*s, 20)] for s in CARD_SETUPS]
    return first + [c for c in cur if c not in first], setups


def rnd(x, d=6):
    if x is None: return None
    if isinstance(x, float): return float(f"{x:.{d}g}")
    return x


def encode(rows):
    out = []
    for r in rows:
        yc = ",".join(f"{k}:{v}" for k, v in r["sample"]["year_counts"].items())
        s = r["sample"]
        out.append([r["id"], r["ma"], r["width_atr"], r["confirmation"], r["trend"], r["hold"], r["policy"],
                    s["first_signal"], s["last_signal"], s["first_entry"], s["last_exit"], yc,
                    r["spike_baskets"], r["baskets_with_recovering_bottom"]] +
                   [[rnd(r[g][k]) for k in MKEYS] for g in GROUPS])
    return out


def results_csv(rows, meta, path):
    recs = []
    for r in rows:
        d = dict(data_source="Finlens chart (ICB L2 + VNINDEX), giá chỉ số", evaluation_start=meta["start"], evaluation_end=meta["end"],
                 universe=f"{meta['eligible_min']}-{meta['eligible_max']} ngành ICB cấp 2 đủ 200 phiên", id=r["id"], ma=r["ma"],
                 width_atr=r["width_atr"], confirmation=r["confirmation"], trend=r["trend"], hold=r["hold"], policy=r["policy"],
                 spike_baskets=r["spike_baskets"], baskets_with_recovering_bottom=r["baskets_with_recovering_bottom"])
        for g in GROUPS:
            for k in MKEYS:
                if k == "wins": continue
                d[f"{g}_{k}"] = r[g][k]
        recs.append(d)
    pd.DataFrame(recs).to_csv(path, index=False, encoding="utf-8-sig")


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


audit_written = False
for sid, start, end, tag in SAMPLES:
    rows, _, _, meta, _ = E.run(start, end, sid, OUT)
    cur, setups = curated_ids(rows)
    keep = set(cur)
    idx = {key(r["ma"], r["width_atr"], r["confirmation"], r["trend"], r["policy"], r["hold"]): r["id"] for r in rows}
    for s in setups:
        keep.add(idx[key(*s, 3)])
    rows, baskets, legs, meta, (v, O, H, L, C, pk) = E.run(start, end, sid, OUT, keep_ids=keep)
    assets = dict(csv=f"research-results-{tag}.csv", methodology=f"research-methodology-{tag}.md", baskets=f"holding-baskets-{tag}.csv",
                  legs=f"holding-legs-{tag}.csv", prices="daily-ohlc-finlens.csv", verification=f"verification-{tag}.json", sourceAudit="source-audit.json")
    results_csv(rows, meta, f"{OUT}/{assets['csv']}")
    pd.DataFrame(baskets).to_csv(f"{OUT}/{assets['baskets']}", index=False, encoding="utf-8-sig")
    pd.DataFrame(legs).to_csv(f"{OUT}/{assets['legs']}", index=False, encoding="utf-8-sig")
    data = dict(asof=meta["end"], universe=list(C.columns), universe_names=E.NAMES, count=len(rows), curated=cur, holding_periods=E.HOLDS,
                assets=assets, sample=dict(id=sid, start=meta["start"], end=meta["end"], sessions=meta["sessions"],
                                           source="Finlens · chỉ số ngành ICB cấp 2 & VNINDEX", eligible_min=meta["eligible_min"], eligible_max=meta["eligible_max"],
                                           period_grouping="signal_date"),
                groups=GROUPS, mkeys=MKEYS,
                fields=["id", "ma", "width_atr", "confirmation", "trend", "hold", "policy", "first_signal", "last_signal", "first_entry", "last_exit",
                        "year_counts", "spike_baskets", "baskets_with_recovering_bottom"] + GROUPS,
                rows=encode(rows))
    js = "window.RESEARCH_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    open(f"{OUT}/data-{sid}.js", "w", encoding="utf-8").write(js)
    meta["rows"] = len(rows); meta["baskets_exported"] = len(baskets)
    json.dump(dict(meta=meta, curated=cur), open(f"/home/claude/vnsite/engine/meta-{sid}.json", "w"), ensure_ascii=False, indent=1)
    if not audit_written:
        px = []
        for c in C.columns:
            px.append(pd.DataFrame({"date": C.index.date, "symbol": "ICB_" + c, "name": E.NAMES[c], "open": O[c].values, "high": H[c].values, "low": L[c].values, "close": C[c].values}).dropna(subset=["close"]))
        px.append(pd.DataFrame({"date": v.index.date, "symbol": "VNINDEX", "name": "VN-Index", "open": v.open.values, "high": v.high.values, "low": v.low.values, "close": v.close.values}))
        pxd = pd.concat(px); pxd.to_csv(f"{OUT}/daily-ohlc-finlens.csv", index=False, encoding="utf-8-sig")
        src = {}
        for c in C.columns:
            s = C[c].dropna(); src["ICB_" + c] = dict(name=E.NAMES[c], first=str(s.index[0].date()), last=str(s.index[-1].date()), rows=int(len(s)),
                                                      first_eligible=str(C.index[np.argmax(pk.elig[:, list(C.columns).index(c)])].date()))
        src["VNINDEX"] = dict(first=str(v.index[0].date()), last=str(v.index[-1].date()), rows=int(len(v)))
        json.dump(dict(provider="Finlens (finlens.vn) — dữ liệu chart TradingView/UDF, tài khoản của người dùng", fetched="2026-11-04",
                       note="Giá chỉ số ngành do Finlens tính; chưa xác minh có cộng cổ tức hay không. Ngày 04/11/2026 (phiên đang chạy khi tải) đã bị loại.",
                       calendar="Lịch giao dịch VNINDEX; ngành thiếu phiên để trống, không điền giá giả",
                       prices_sha256=sha(f"{OUT}/daily-ohlc-finlens.csv"), sources=src), open(f"{OUT}/source-audit.json", "w"), ensure_ascii=False, indent=1)
        audit_written = True
    print(sid, meta)
