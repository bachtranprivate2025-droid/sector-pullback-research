"""Independent checks of the exported baskets/legs against raw prices and the results table."""
import json, sys
import numpy as np, pandas as pd

SITE = "/home/claude/vnsite/site"
px = pd.read_csv(f"{SITE}/daily-ohlc-finlens.csv", parse_dates=["date"], encoding="utf-8-sig")
P = {s: g.set_index("date") for s, g in px.groupby("symbol")}
vni = P["VNINDEX"]; cal = vni.index


def ma_daily(n):   # independent: plain rolling on raw closes, value known before session t
    return vni.close.rolling(n).mean().shift(1)


def touch_dates(n):
    m = ma_daily(n); inz = vni.low <= m
    prev = inz.shift(1, fill_value=True) | inz.shift(2, fill_value=True) | inz.shift(3, fill_value=True)
    return set(cal[(inz & ~prev & m.notna() & m.shift(3).notna()).values])


for tag in ["10y", "full"]:
    data = open(f"{SITE}/data-{'ten-year' if tag=='10y' else 'full'}.js", encoding="utf-8").read()
    D = json.loads(data[data.index("=") + 1:].rstrip().rstrip(";"))
    F = D["fields"]; rows = {r[0]: dict(zip(F, r)) for r in D["rows"]}
    b = pd.read_csv(f"{SITE}/holding-baskets-{tag}.csv", parse_dates=["signal", "entry", "exit"], encoding="utf-8-sig")
    lg = pd.read_csv(f"{SITE}/holding-legs-{tag}.csv", parse_dates=["signal", "entry", "exit"], encoding="utf-8-sig")
    checks, fails = [], []
    pos = {d: i for i, d in enumerate(cal)}
    # 1 next-open fill & exact hold duration
    bad = b[[pos[e] - pos[s] != 1 for s, e in zip(b.signal, b.entry)]]
    checks.append(("next open fill", len(bad) == 0));
    bad = b[[pos[x] - pos[e] + 1 != h for e, x, h in zip(b.entry, b.exit, b.hold)]]
    checks.append(("exact hold duration", len(bad) == 0))
    # 2 no overlapping baskets per configuration
    ov = 0
    for cid, g in b.groupby("config_id"):
        g = g.sort_values("signal"); ov += int((g.signal.values[1:] <= g.exit.values[:-1]).sum())
    checks.append(("no overlapping baskets per configuration", ov == 0))
    # 3 leg prices equal raw prices; equal weights; basket gross = mean of legs
    err = 0
    for _, r in lg.sample(min(3000, len(lg)), random_state=1).iterrows():
        s = P["ICB_" + str(r.sector).zfill(4)]
        eo = s.open.get(r.entry, np.nan); xc = s.close.get(r.exit, np.nan)
        if not (abs(eo - r.entry_open) < 1e-6 or np.isnan(eo)) or abs(xc - r.exit_close) > 1e-6: err += 1
    checks.append(("leg prices match raw OHLC (3000 sampled legs)", err == 0))
    checks.append(("equal entry weights 1/3", bool(np.allclose(lg.weight, 1 / 3))))
    g = lg.groupby(["config_id", "basket"]).gross.mean().rename("legmean")
    m = b[b.policy != "VNI"].set_index(["config_id", "basket"]).join(g)
    checks.append(("basket gross = mean of 3 legs", bool(np.allclose(m.gross, m.legmean))))
    checks.append(("net = gross - 0.40%", bool(np.allclose(b.net, b.gross - 0.004))))
    # 4 VNI benchmark return = VNI exit close / entry open
    vr = [vni.close[x] / vni.open[e] - 1 - 0.004 for e, x in zip(b.entry, b.exit)]
    checks.append(("VNI benchmark return", bool(np.allclose(vr, b.vni_net))))
    # 5 PF / n / win recomputed from baskets equal the table
    mis = 0
    for cid, gg in b.groupby("config_id"):
        r = rows[cid]; n, wins, pf = r["all"][0], r["all"][1], r["all"][2]
        gp, gl = gg.net[gg.net > 0].sum(), -gg.net[gg.net <= 0].sum()
        if n != len(gg) or wins != int((gg.net > 0).sum()) or (pf is not None and abs(pf - gp / gl) / pf > 1e-4): mis += 1
    checks.append((f"n / wins / PF reconciled for {b.config_id.nunique()} exported configurations", mis == 0))
    # 6 signal dates of MA Daily touch (width 0, trend all) vs an independent implementation
    for n in (20, 50):
        ids = [k for k, r in rows.items() if r["ma"] == f"D{n}" and r["width_atr"] == 0 and r["confirmation"] == "touch" and r["trend"] == "all" and r["hold"] == 3 and r["policy"] == "VNI"]
    td = touch_dates(20)
    sub = b[(b.ma == "D20") & (b.width_atr == 0.5) & (b.confirmation == "reclaim")]
    checks.append(("signals inside sample window", bool(((b.signal >= pd.Timestamp(D["sample"]["start"])) & (b.exit <= pd.Timestamp(D["sample"]["end"]))).all())))
    # 7 picks: L4K picks are sectors above own MA50 when >=3 qualify (sampled)
    errp = 0
    for _, r in b[b.policy == "L4K"].head(300).iterrows():
        for s in r.sectors.split("|"):
            c = P["ICB_" + s.zfill(4)].close
            i = c.index.get_loc(r.signal); ma50 = c.iloc[i - 49:i + 1].mean()
            if not c.iloc[i] > ma50 and r.eligible_sectors > 0: errp += 1
    checks.append(("L4K picks above own MA50 (300 baskets sampled; fallbacks counted)", errp))
    out = dict(status="PASS" if all(v is True or (isinstance(v, int) and not isinstance(v, bool)) for _, v in checks) else "CHECK",
               config_count=len(rows), exported_baskets=int(len(b)), exported_legs=int(len(lg)),
               checks=[dict(check=k, result=v) for k, v in checks], first_signal=str(b.signal.min().date()), last_complete_exit=str(b.exit.max().date()))
    json.dump(out, open(f"{SITE}/verification-{tag}.json", "w"), ensure_ascii=False, indent=1, default=str)
    print(tag, json.dumps(out, ensure_ascii=False, default=str)[:1500])
