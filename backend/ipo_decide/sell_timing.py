"""Sell timing: what you keep, after charges and tax, if you sell at the listing open, at the listing-day close,
after 1 / 3 / 6 months, on the last short-term day, or on the first long-term day.

Price paths (Monte Carlo, fixed seed, so the same inputs give the same answer):
  listing open    upcoming IPO: samples from the listing-gain range (listing.py or your own)
                  already listed: today's price from Yahoo (or the one you type), no listing step
  listing close   open x a close/open ratio drawn from past listings of the same board (history data)
  later dates     log-returns with Student-t(4) daily shocks (fat tails, as small caps have), scaled to the stock's
                  own daily volatility when it has 20+ sessions, else a board default; drift is yours to set (default 0)
All horizons share the same paths, so "holding beats selling at the open" is a like-for-like comparison.

The long-term question gets its own answer: waiting for LTCG saves (20% - 12.5%) of the gain plus the exemption,
but only if the price does not fall by more than that saving in the meantime. We give that break-even fall and
how often the price model falls further over the wait.
"""
from datetime import date, datetime, timedelta

import numpy as np

from . import history, listing
from .money import net_of_sale, summary
from .rules import add_months, add_working_days, first_long_term_day, is_long_term, v

PATHS = 20000
BOARD_DAILY_VOL = {"SME": 3.5, "MAINBOARD": 2.2}   # % per day, used only when the stock has no history of its own
T_DF = 4


def _d(s) -> date:
    return s if isinstance(s, date) else datetime.strptime(str(s), "%Y-%m-%d").date()


def _trading_days(a: date, b: date) -> int:
    n, d = 0, a
    while d < b:
        d += timedelta(days=1)
        n += d.weekday() < 5
    return n


def _close_open_ratios(board: str) -> np.ndarray:
    rows = history.load_real()
    real = [r for r in rows if r["board"] == board and r.get("listing_close") and r.get("listing_open")]
    if len(real) < 40:
        from .synth import generate
        real += [r for r in generate() if r["board"] == board]
    return np.array([r["listing_close"] / r["listing_open"] for r in real])


def _stock_history(symbol: str):
    import market
    data = market.recent(symbol, 120)
    if not data or len(data["rows"]) < 2:
        return None
    closes = np.array([r["close"] for r in data["rows"]])
    rets = np.diff(np.log(closes))
    return {"symbol": data["symbol"], "name": data.get("name"), "last_close": float(closes[-1]), "last_date": data["rows"][-1]["date"],
            "sessions": len(closes), "daily_vol_pct": float(100 * rets.std()) if len(rets) >= 20 else None,
            "source_url": data.get("source_url"), "fetched_at": data.get("fetched_at")}


def analyse(*, board: str, issue_price: float, shares: int, allotment_date: str | None = None, listing_date: str | None = None,
            symbol: str | None = None, current_price: float | None = None, gain_range: dict | None = None,
            model_inputs: dict | None = None, daily_vol_pct: float | None = None, drift_annual_pct: float = 0.0,
            alt_return_pct: float = 7.0, surcharge: float = 0.0, ltcg_exemption_left: float | None = None,
            brokerage: float = 0.0, today: str | None = None) -> dict:
    board = "SME" if str(board).upper() == "SME" else "MAINBOARD"
    if not issue_price or not shares:
        return {"ok": False, "error": "Need the issue price and the number of shares allotted."}
    notes = []
    today_d = _d(today) if today else date.today()
    stock = _stock_history(symbol) if symbol else None
    if symbol and not stock:
        notes.append(f"No price history for '{symbol}'. Using the price and volatility you entered, or defaults.")
    listed = bool(stock or current_price)
    rng = np.random.default_rng(2024)

    # ----- where the paths start -----
    if listed:
        p0 = float(current_price or stock["last_close"])
        start = _d(stock["last_date"]) if stock and not current_price else today_d
        listing_d = _d(listing_date) if listing_date else start
        allot_d = _d(allotment_date) if allotment_date else listing_d - timedelta(days=1)
        if not (allotment_date or listing_date):
            notes.append("Allotment date not given, so it is taken as yesterday: the short/long-term dates below may be wrong. "
                         "Enter it (it is on your demat statement).")
        starts = np.full(PATHS, p0)
        pred = None
    else:
        if gain_range and all(gain_range.get(k) is not None for k in ("lo", "median", "hi")):
            pred = {"board": board, "range_pct": {k: float(gain_range[k]) for k in ("lo", "median", "hi")}, "method_label": "Your own range"}
        else:
            given = {k: x for k, x in (model_inputs or {}).items() if x is not None}
            pred = listing.predict({**given, "board": board, "issue_price": issue_price})
        listing_d = _d(listing_date) if listing_date else add_working_days(today_d, 3)
        allot_d = _d(allotment_date) if allotment_date else listing_d - timedelta(days=1)
        start = listing_d
        g = listing.quantile_samples(pred, PATHS, seed=5)
        starts = issue_price * (1 + g / 100)

    vol = daily_vol_pct if daily_vol_pct is not None else (stock and stock["daily_vol_pct"])
    if vol is None:
        vol = BOARD_DAILY_VOL[board]
        notes.append(f"Daily volatility assumed {vol}% (typical for {'SME' if board == 'SME' else 'mainboard'} stocks after listing). "
                     "Give a listed symbol, or set it yourself, for the stock's own figure.")
    sigma = vol / 100
    mu_daily = np.log1p(drift_annual_pct / 100) / 248
    t_scale = np.sqrt((T_DF - 2) / T_DF)   # so the t shocks have the stated volatility

    # ----- horizons -----
    last_st = add_months(allot_d, 12)
    first_lt = first_long_term_day(allot_d)
    hz = []
    if not listed:
        hz += [("listing_open", "Listing day, at the open", listing_d), ("listing_close", "Listing day, at the close", listing_d)]
    else:
        hz += [("now", f"Now (₹{p0:,.2f})", start)]
    for m in (1, 3, 6):
        d = add_months(listing_d if not listed else start, m)
        if d < last_st:
            hz.append((f"m{m}", f"After {m} month{'s' if m > 1 else ''}", d))
    if last_st > start:
        hz.append(("last_short", "Last short-term day", last_st))
    hz.append(("first_long", "First long-term day", max(first_lt, start)))
    hz.sort(key=lambda h: (h[2], h[0] != "listing_open"))

    # ----- simulate one set of paths across all horizons -----
    co = _close_open_ratios(board)
    price, t_prev, results, at = starts.copy(), start, [], {}
    for key, label, d in hz:
        if key == "listing_close":
            price = price * co[rng.integers(0, len(co), PATHS)]
        elif key not in ("listing_open", "now"):
            n = _trading_days(t_prev, d)
            if n > 0:
                shocks = rng.standard_t(T_DF, (PATHS,)) * t_scale * sigma * np.sqrt(n)
                price = price * np.exp(shocks + (mu_daily - sigma ** 2 / 2) * n)
            t_prev = d
        lt = is_long_term(allot_d, d)
        r = net_of_sale(shares, issue_price, price, long_term=lt, ltcg_exemption_left=ltcg_exemption_left,
                        surcharge=surcharge, brokerage=brokerage)
        at[key] = {"in_hand": r["in_hand"], "date": d, "median_price": float(np.median(price))}
        results.append({"key": key, "label": label, "date": d.isoformat(), "tax_type": "LTCG" if lt else "STCG",
                        "tax_rate_pct": round(100 * r["rate"], 1), "days_held": (d - allot_d).days,
                        "price": summary(price, 2), "profit": summary(r["profit"]), "tax": summary(r["tax"]),
                        "charges_mean": round(float(np.mean(r["charges"]))),
                        "p_loss": round(float(np.mean(r["profit"] < 0)), 3), "_in_hand": r["in_hand"]})

    # ----- compare every horizon with selling at the first moment and parking the money at alt_return -----
    first = results[0]
    for res in results:
        yrs = max(0, (_d(res["date"]) - _d(first["date"])).days) / 365
        bench = first["_in_hand"] * (1 + alt_return_pct / 100) ** yrs
        res["p_beats_first"] = None if res is first else round(float(np.mean(res["_in_hand"] > bench)), 3)
        res["edge_vs_first"] = None if res is first else summary(res["_in_hand"] - bench)
    best = max(results, key=lambda r: r["profit"]["p50"])

    # ----- the long-term wait, priced -----
    # From the first moment you could sell: holding until the first long-term day saves tax if the price stays put.
    # How far can it fall before that saving is gone, and how often does the price model fall further?
    ltcg = None
    first_key = results[0]["key"]
    if "first_long" in at and first_key != "first_long" and at["first_long"]["date"] > at[first_key]["date"]:
        ref = float(np.median(at[first_key]["in_hand"]))
        px = np.array([at[first_key]["median_price"]])
        st = net_of_sale(shares, issue_price, px, long_term=False, surcharge=surcharge, brokerage=brokerage)
        lt_ = net_of_sale(shares, issue_price, px, long_term=True, ltcg_exemption_left=ltcg_exemption_left,
                          surcharge=surcharge, brokerage=brokerage)
        saving = float(st["tax"][0] - lt_["tax"][0])
        value = float(px[0]) * shares
        breakeven = 100 * saving / value if value else None
        n_days = _trading_days(at[first_key]["date"], at["first_long"]["date"])
        ltcg = {"from": results[0]["label"], "until": at["first_long"]["date"].isoformat(),
                "tax_saving_at_median_price": round(saving), "breakeven_fall_pct": round(breakeven, 2) if breakeven is not None else None,
                "wait_trading_days": n_days, "median_in_hand_now": round(ref),
                "p_long_beats_first": results[[r["key"] for r in results].index("first_long")]["p_beats_first"],
                "explain": "Holding past the 12-month mark switches the tax from 20% to 12.5% and uses the yearly LTCG exemption. "
                           "If the price stays where it is, that is the saving below. A fall of more than the break-even wipes it out."}
        if breakeven is not None and n_days > 0:
            draws = rng.standard_t(T_DF, PATHS) * t_scale * sigma * np.sqrt(n_days) + (mu_daily - sigma ** 2 / 2) * n_days
            ltcg["p_fall_more_than_breakeven"] = round(float(np.mean(np.exp(draws) - 1 < -breakeven / 100)), 3)

    for r in results:
        r.pop("_in_hand")
    return {
        "ok": True, "board": board, "status": "listed" if listed else "upcoming",
        "position": {"shares": shares, "issue_price": issue_price, "cost": round(shares * issue_price),
                     "allotment_date": allot_d.isoformat(), "listing_date": listing_d.isoformat()},
        "stock": stock, "listing_range": pred and {"range_pct": pred["range_pct"], "method": pred.get("method_label")},
        "horizons": results, "best_by_median": best["key"], "ltcg_wait": ltcg,
        "inputs": {"daily_vol_pct": round(vol, 2), "drift_annual_pct": drift_annual_pct, "alt_return_pct": alt_return_pct,
                   "surcharge": surcharge, "ltcg_exemption_left": v("ltcg_exemption") if ltcg_exemption_left is None else ltcg_exemption_left,
                   "brokerage": brokerage},
        "assumptions": [
            "Profit is money in hand after STT, exchange and SEBI charges, GST, the DP charge and capital-gains tax, minus what you paid.",
            "Short-term (held 12 months or less from allotment): 20% + 4% cess. Long-term: 12.5% + 4% cess above the yearly ₹1.25 lakh exemption.",
            "A loss pays no tax here; it could reduce tax on your other gains, which this does not count.",
            f"Later prices: fat-tailed random walk, daily volatility {vol:.2f}%, drift {drift_annual_pct:g}% a year. No view on direction unless you set one.",
            "With drift 0 the AVERAGE price stays flat, yet the MIDDLE price slips over time: swings are lopsided "
            "(a 50% fall needs a 100% rise to undo), so most paths end a little lower while a few end much higher.",
            f"'Beats selling first' compares with selling at the first horizon and earning {alt_return_pct:g}% a year on the money elsewhere.",
            "Small SME positions may not be sellable in one go; check the Liquidity simulator before relying on a price.",
        ],
        "notes": notes,
        "disclaimer": "Simulated outcomes from stated assumptions, not a forecast or investment advice. Verify tax with the Income-tax Act or a CA.",
    }
