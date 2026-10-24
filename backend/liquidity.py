"""Feature 5: Can I Actually Exit? A liquidity trap simulator.

A price on screen is not a price you can sell at. Given a position and the stock's real recent trading
(volume, zero-volume days, lower-circuit locks, volatility), we simulate selling it day by day under a few
stress scenarios and report how long the exit takes, the average price realised and the capital at risk.

Deterministic, no randomness: the same inputs always give the same answer. Every assumption is returned
with the result so the user can see (and change) it. It is an estimate, not a forecast.

Model, per trading day:
  you can sell at most `participation` x that day's volume (rounded down to whole lots, carried over)
  your fills move the price against you by  sigma x sqrt(shares_sold / day_volume)  (square-root impact),
  never more than one circuit band in a day
  scenarios change the reference price path and how many buyers turn up
"""
import math
import statistics

import market

MAX_DAYS = 250   # about one trading year; beyond this the exit is reported as "not within a year"


def stats(rows: list[dict], band_pct: float) -> dict:
    """Liquidity facts from daily OHLCV rows."""
    vols = [r["volume"] for r in rows]
    closes = [r["close"] for r in rows]
    rets = [math.log(closes[i] / closes[i - 1]) for i in range(1, len(closes)) if closes[i - 1] > 0 and closes[i] > 0]
    nonzero = [v for v in vols if v > 0]
    zero_days = len(vols) - len(nonzero)
    lc_days, uc_days, run, max_lc_run = 0, 0, 0, 0
    tol = 0.35  # a close within 0.35 percentage points of the band counts as a circuit hit
    for i in range(1, len(rows)):
        prev, r = rows[i - 1]["close"], rows[i]
        chg = (r["close"] / prev - 1) * 100 if prev else 0
        locked_low = chg <= -(band_pct - tol) and r["close"] <= r["low"] * 1.0005
        locked_high = chg >= band_pct - tol and r["close"] >= r["high"] * 0.9995
        lc_days += locked_low
        uc_days += locked_high
        run = run + 1 if locked_low else 0
        max_lc_run = max(max_lc_run, run)
    zero_frac = zero_days / len(vols) if vols else 1.0
    base_vol = statistics.median(nonzero) * (1 - zero_frac) if nonzero else 0.0
    return {
        "sessions": len(rows), "from": rows[0]["date"] if rows else None, "to": rows[-1]["date"] if rows else None,
        "last_close": closes[-1] if closes else None,
        "median_volume": statistics.median(vols) if vols else 0,
        "median_nonzero_volume": statistics.median(nonzero) if nonzero else 0,
        "effective_daily_volume": round(base_vol),
        "median_traded_value": statistics.median([r["close"] * r["volume"] for r in rows]) if rows else 0,
        "zero_volume_days": zero_days, "zero_volume_pct": round(100 * zero_frac, 1),
        "lower_circuit_days": lc_days, "upper_circuit_days": uc_days, "max_consecutive_lower_circuits": max_lc_run,
        "daily_volatility_pct": round(100 * statistics.pstdev(rets), 2) if len(rets) > 1 else None,
    }


def _run(shares, lot, price0, base_vol, sigma, band, participation, path, label, overhang=None):
    """path: list of (reference_price, buyer_multiplier) per day; last entry repeats until done."""
    remaining, acc, proceeds, impact_cost, days = shares, 0.0, 0.0, 0.0, []
    for d in range(MAX_DAYS):
        ref, mult = path[min(d, len(path) - 1)]
        vol = base_vol * mult
        other = overhang[d] if overhang and d < len(overhang) else 0
        my_share = remaining / (remaining + other) if remaining + other > 0 else 0
        acc += participation * vol * my_share
        sell = min(remaining, int(acc // lot) * lot)
        acc -= sell
        if sell > 0 and vol > 0:
            impact = min(band, sigma * math.sqrt((sell + other) / vol))
            px = ref * (1 - impact)
            proceeds += sell * px
            impact_cost += sell * (ref - px)
            remaining -= sell
        days.append({"day": d + 1, "ref_price": round(ref, 2), "sold": sell, "remaining": remaining})
        if remaining == 0:
            break
    sold = shares - remaining
    screen = shares * price0
    return {
        "scenario": label["key"], "title": label["title"], "description": label["desc"],
        "days_to_exit": len(days) if remaining == 0 else None,
        "exited_within_days": len(days),
        "shares_sold": sold, "shares_unsold": remaining,
        "avg_exit_price": round(proceeds / sold, 2) if sold else None,
        "proceeds": round(proceeds), "screen_value": round(screen),
        # unsold shares are counted at the last reference price, so "capital at risk" never hides them
        "value_if_unsold_marked": round(remaining * days[-1]["ref_price"]) if days else 0,
        "loss_vs_screen": round(screen - proceeds - (remaining * days[-1]["ref_price"] if days else 0)),
        "loss_vs_screen_pct": round(100 * (screen - proceeds - (remaining * days[-1]["ref_price"] if days else 0)) / screen, 1) if screen else None,
        "slippage_pct": round(100 * impact_cost / (proceeds + impact_cost), 2) if proceeds + impact_cost else None,
        "path": days[:120],
    }


def _falling(price, band, target_drop, mult_falling, mult_after):
    """Reference path that falls one circuit band a day until `target_drop` is reached."""
    path, p, floor = [], price, price * (1 - target_drop)
    while p > floor * 1.0001:
        p = max(floor, p * (1 - band))
        path.append((p, mult_falling))
    path.append((floor, mult_after))
    return path


def simulate(*, symbol: str | None = None, shares: int | None = None, amount: float | None = None,
             price: float | None = None, daily_volume: float | None = None, volatility_pct: float | None = None,
             lot_size: int = 1, band_pct: float = 5.0, participation_pct: float = 10.0, drop_pct: float = 20.0,
             lc_days: int | None = None, lc_buyer_pct: float = 5.0, lockin_shares: int | None = None,
             lockin_sell_pct: float = 25.0, lookback: int = 120) -> dict:
    notes, data = [], None
    if symbol:
        data = market.recent(symbol, lookback)
        if not data:
            notes.append(f"No price history found for '{symbol}'. Try the exact exchange symbol (e.g. ABC-SM.NS for NSE Emerge, a 6-digit BSE code), or enter price and volume by hand.")
    st = stats(data["rows"], band_pct) if data else None
    if st and st["sessions"] < 20:
        notes.append(f"Only {st['sessions']} sessions of history: treat the volume estimate as rough.")

    price = price or (st and st["last_close"])
    if not price:
        return {"ok": False, "error": "Need a price: give a symbol with trading history, or enter the price.", "notes": notes}
    base_vol = daily_volume if daily_volume is not None else (st["effective_daily_volume"] if st else None)
    if base_vol is None:
        return {"ok": False, "error": "Need daily volume: give a symbol with trading history, or enter average daily volume.", "notes": notes}
    sigma = (volatility_pct if volatility_pct is not None else (st and st["daily_volatility_pct"]))
    if sigma is None:
        sigma = 3.0
        notes.append("Daily volatility unknown, assumed 3% (typical for small caps).")
    sigma /= 100
    lot = max(1, int(lot_size or 1))
    if shares is None and amount:
        shares = int(amount // price)
    shares = (int(shares or 0) // lot) * lot
    if shares <= 0:
        return {"ok": False, "error": f"Position is smaller than one lot of {lot} shares.", "notes": notes}

    band, part = band_pct / 100, participation_pct / 100
    observed_lc = st["max_consecutive_lower_circuits"] if st else 0
    lc_n = int(lc_days if lc_days is not None else max(3, observed_lc))
    assumptions = [
        f"You sell at most {participation_pct:g}% of each day's volume (selling more just pushes the price down further).",
        f"Normal daily volume {base_vol:,.0f} shares" + (" (median of trading days, scaled down for days with no trades)." if daily_volume is None and st else " (entered by hand)."),
        f"Price impact = daily volatility {100 * sigma:.2f}% x sqrt(your shares / day volume), capped at the {band_pct:g}% circuit band.",
        f"Shares are sold in whole lots of {lot}.",
    ]

    def L(key, title, desc):
        return {"key": key, "title": title, "desc": desc}

    scenarios = [
        _run(shares, lot, price, base_vol, sigma, band, part, [(price, 1.0)],
             L("normal", "Normal market", "Price holds and buyers turn up as they have recently.")),
        _run(shares, lot, price, base_vol, sigma, band, part, _falling(price, band, drop_pct / 100, 0.5, 0.7),
             L("price_drop", f"Price falls {drop_pct:g}%", f"Price slides one {band_pct:g}% band a day to -{drop_pct:g}%. Buyers halve while it falls, then recover to 70%.")),
        _run(shares, lot, price, base_vol, sigma, band, part,
             [(price * (1 - band) ** (i + 1), lc_buyer_pct / 100) for i in range(lc_n)] + [(price * (1 - band) ** lc_n, 0.6)],
             L("lower_circuit", f"Lower circuit for {lc_n} days",
               f"Stock is locked at lower circuit {lc_n} days in a row"
               + (f" (worst run seen in history: {observed_lc}). " if st else ". ") +
               f"Only {lc_buyer_pct:g}% of normal buyers appear while locked, sellers queue, then 60% return.")),
    ]
    if lockin_shares:
        per_day = lockin_shares * lockin_sell_pct / 100 / 10
        over = [per_day] * 10
        path, p = [], price
        for _ in range(10):   # the extra selling also pushes the reference price down, at most one band a day
            p *= 1 - min(band, sigma * math.sqrt(per_day / base_vol)) if base_vol else 1 - band
            path.append((p, 1.0))
        scenarios.append(_run(shares, lot, price, base_vol, sigma, band, part, path,
                              L("lockin", "Lock-in expiry",
                                f"{lockin_sell_pct:g}% of the {lockin_shares:,} newly unlocked shares are sold over 10 sessions. "
                                "You compete with them for the same buyers, pro rata."), overhang=over))

    worst = max(scenarios, key=lambda s: s["loss_vs_screen"])
    adv_days = shares / (part * base_vol) if base_vol else None
    return {
        "ok": True, "symbol": data["symbol"] if data else None, "name": data.get("name") if data else None,
        "source_url": data.get("source_url") if data else None, "fetched_at": data.get("fetched_at") if data else None,
        "position": {"shares": shares, "price": round(price, 2), "screen_value": round(shares * price), "lot_size": lot,
                     "pct_of_daily_volume": round(100 * shares / base_vol, 1) if base_vol else None},
        "market": st, "assumptions": assumptions, "notes": notes, "scenarios": scenarios,
        "headline": {
            "screen_value": round(shares * price),
            "normal_days": scenarios[0]["days_to_exit"],
            "min_days_at_participation": math.ceil(adv_days) if adv_days else None,
            "worst_scenario": worst["title"], "worst_loss": worst["loss_vs_screen"], "worst_loss_pct": worst["loss_vs_screen_pct"],
        },
        "disclaimer": "Simulation from recent trading data and stated assumptions. Not a forecast and not investment advice.",
    }
