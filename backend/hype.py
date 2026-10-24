"""Feature 4: Truth vs Hype. Audit an influencer's public, timestamped stock calls against what the price did next.

Calls come from pasted text (parsed here) or from a TinyFish agent that reads public pages (a Telegram channel's
public preview, X/YouTube posts). Each call is scored on real daily prices:

  entry  = OPEN of the first session AFTER the call date (the call's time of day is usually unknown, so we never
           assume a fill at a price seen before the call)
  exit   = stop loss hit, target hit, or the close after `horizon` sessions, whichever comes first.
           If target and stop are both inside one day's range we assume the stop (we cannot know the order).
  costs  = round-trip cost % (brokerage, STT, exchange fees, GST, stamp duty and slippage) taken off every call
  vs Nifty 50 over the same dates, so a rising market does not look like skill.

Calls without enough price data are reported as "insufficient data", never scored.
"""
import re
import statistics
from datetime import datetime, timedelta

import collect
import market
from collect import _arr, _obj, _s, _top

BENCHMARK = "^NSEI"
DEFAULT_HORIZON = 20       # trading sessions, about one month
DEFAULT_COST_PCT = 0.30    # round trip, delivery trade in a small/mid cap
STAKE = 10_000             # rupees per call for the "if you followed every call" curve

MONTHS = {m: i for i, m in enumerate(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}
MONTH_WORDS = {m.upper() for m in MONTHS} | {"JANUARY", "FEBRUARY", "MARCH", "APRIL", "JUNE", "JULY", "AUGUST", "SEPT",
                                              "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"}
STOP_WORDS = {"BUY", "SELL", "SHORT", "LONG", "ADD", "EXIT", "TARGET", "TGT", "SL", "STOP", "LOSS", "CMP", "NSE", "BSE", "RS",
              "INR", "TP", "AT", "ABOVE", "BELOW", "FOR", "IN", "ON", "AND", "THE", "NOW", "IPO", "SME", "DAYS", "WEEKS",
              "MONTHS", "DOUBLE", "ACCUMULATE", "INTRADAY", "SWING", "POSITIONAL", "HOLD", "NIFTY", "OK", "TO", "OF", "X",
              "STOCK", "SHARE", "SHARES", "CALL", "TIP", "JACKPOT", "MULTIBAGGER", "TRIPLE", "UPPER", "CIRCUIT", "SURE", "SHOT"}


# ---- parsing pasted calls ------------------------------------------------------------------------

def _date(text: str) -> str | None:
    t = text.lower()
    m = re.search(r"\b(20\d\d)[-/.](\d{1,2})[-/.](\d{1,2})\b", t)
    if m:
        y, mo, d = map(int, m.groups())
    else:
        m = re.search(r"\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d\d|\d\d)\b", t)           # Indian order: day first
        if m:
            d, mo, y = map(int, m.groups())
        else:
            m = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3})[a-z]*,?\s+(20\d\d)\b", t)
            if m and m.group(2) in MONTHS:
                d, mo, y = int(m.group(1)), MONTHS[m.group(2)], int(m.group(3))
            else:
                m = re.search(r"\b([a-z]{3})[a-z]*\s+(\d{1,2}),?\s+(20\d\d)\b", t)
                if not (m and m.group(1) in MONTHS):
                    return None
                d, mo, y = int(m.group(2)), MONTHS[m.group(1)], int(m.group(3))
    y += 2000 if y < 100 else 0
    try:
        return datetime(y, mo, d).strftime("%Y-%m-%d")
    except ValueError:
        return None


def _num(s: str | None) -> float | None:
    try:
        return float(s.replace(",", "")) if s else None
    except ValueError:
        return None


_PRICE = r"(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)"


def parse_line(line: str) -> dict | None:
    """One line of pasted text -> a call, or None when it has no date or no stock symbol."""
    raw = line.strip()
    if not raw:
        return None
    low = raw.lower()
    date = _date(raw)
    direction = "sell" if re.search(r"\b(sell|short|exit)\b", low) else "buy"
    sym = None
    m = re.search(r"\b(?:buy|sell|short|long|accumulate|add)\b\s*:?\s*([A-Za-z][A-Za-z0-9&-]{1,19})", raw, re.I)
    if m and m.group(1).upper() not in STOP_WORDS:
        sym = m.group(1).upper()
    if not sym:   # otherwise the first all-caps word that is not a keyword or a month name
        sym = next((t for t in re.findall(r"\b[A-Z][A-Z0-9&-]{1,19}\b", raw)
                    if t not in STOP_WORDS and t not in MONTH_WORDS), None)
    if not date or not sym:
        return None
    target = _num((re.search(r"\b(?:target|tgt|tp)s?\s*[:@-]?\s*" + _PRICE, low) or [None, None])[1])
    stop = _num((re.search(r"\b(?:sl|stop\s*-?\s*loss|stoploss)\s*[:@-]?\s*" + _PRICE, low) or [None, None])[1])
    mult = 3.0 if re.search(r"\btriple\b|\b3\s*x\b", low) else 2.0 if re.search(r"\bdouble\b|\b2\s*x\b", low) else None
    horizon = None
    h = re.search(r"\b(?:in|within)\s+(\d+)\s*(day|week|month|year)s?\b", low)
    if h:
        n, unit = int(h.group(1)), h.group(2)
        horizon = max(1, round(n * {"day": 5 / 7, "week": 5, "month": 21, "year": 250}[unit]))
    return {"date": date, "symbol": sym, "direction": direction, "target": target, "stop": stop,
            "target_multiple": mult, "horizon": horizon, "text": raw[:280], "source_url": (re.search(r"https?://\S+", raw) or [None])[0]}


def parse_text(text: str) -> dict:
    calls, skipped = [], []
    for line in (text or "").splitlines():
        if not line.strip():
            continue
        c = parse_line(line)
        (calls if c else skipped).append(c or line.strip()[:200])
    return {"calls": calls, "skipped": skipped}


# ---- collecting public calls with an agent -------------------------------------------------------

def collect_job(handle: str) -> dict:
    h = handle.strip()
    m = re.search(r"(?:t\.me/(?:s/)?|telegram\.me/)([A-Za-z0-9_]{4,})", h)
    if m:   # a public Telegram channel has a no-login web preview at t.me/s/<name>
        url = f"https://t.me/s/{m.group(1)}"
        where = f"the public Telegram channel preview {url} (scroll up for older posts)"
    elif h.startswith("http"):
        url, where = h, f"this public page {h}"
    else:
        url, where = collect._search(f'"{h}" stock target buy call'), f'public posts by "{h}" (X/Twitter, YouTube video titles and descriptions, Telegram public previews, blogs)'
    goal = (f"Read {where} and list up to 25 specific Indian stock recommendations that were made publicly, oldest "
            f"first is fine. Only include a call when the post date is visible. For each return the post date "
            f"(YYYY-MM-DD), the NSE symbol or company name, buy or sell, target price and stop loss if stated, the "
            f"stated time frame, a short exact quote, and the URL of the post." + collect.RULES)
    call = _obj(date=_s(), symbol=_s(), company=_s(), direction=_s(), target={"type": "number", "nullable": True},
                stop={"type": "number", "nullable": True}, timeframe=_s(), quote=_s(), source_url=_s())
    return {"label": f"calls:{h}", "goal": goal, "url": url, "expect": ["calls"], "schema": _top(calls=_arr(call, 25))}


def from_agent(result: dict | None) -> list[dict]:
    out = []
    for c in (result or {}).get("calls") or []:
        if not isinstance(c, dict):
            continue
        date = _date(str(c.get("date") or ""))
        sym = re.sub(r"[^A-Za-z0-9&.-]", "", str(c.get("symbol") or "")).upper()
        if not date or not sym:
            continue
        line = parse_line(f"{date} {c.get('direction') or 'buy'} {sym} {c.get('timeframe') or ''} {c.get('quote') or ''}") or {}
        out.append({"date": date, "symbol": sym, "direction": "sell" if str(c.get("direction", "")).lower() in {"sell", "short", "exit"} else "buy",
                    "target": c.get("target"), "stop": c.get("stop"), "target_multiple": line.get("target_multiple"),
                    "horizon": line.get("horizon"), "text": str(c.get("quote") or "")[:280], "source_url": c.get("source_url")})
    return out


# ---- scoring calls against prices ----------------------------------------------------------------

def _window(symbol, date, horizon):
    start = (datetime.strptime(date, "%Y-%m-%d") - timedelta(days=7)).strftime("%Y-%m-%d")
    end = (datetime.strptime(date, "%Y-%m-%d") + timedelta(days=int(horizon * 1.6) + 15)).strftime("%Y-%m-%d")
    return market.history(symbol, start, end)


def evaluate(call: dict, horizon: int = DEFAULT_HORIZON, cost_pct: float = DEFAULT_COST_PCT) -> dict:
    out = {**call, "status": "insufficient_data"}
    try:
        datetime.strptime(call.get("date") or "", "%Y-%m-%d")
    except ValueError:
        return {**out, "reason": "No valid call date."}
    h = int(call.get("horizon") or horizon)
    data = _window(call["symbol"], call["date"], h)
    if not data:
        return {**out, "reason": f"No price history found for {call['symbol']}."}
    rows = [r for r in data["rows"] if r["date"] > call["date"]]
    if not rows:
        return {**out, "reason": "No trading session after the call date yet."}
    entry = rows[0]["open"]
    if not entry or entry <= 0:
        return {**out, "reason": "Entry price unavailable."}
    buy = call.get("direction", "buy") != "sell"
    # Yahoo prices are adjusted for later splits/bonuses; bring the levels quoted in the call onto the same scale
    f = market.split_factor(data["symbol"], call["date"])
    target = call["target"] / f if call.get("target") else (entry * call["target_multiple"] if call.get("target_multiple") and buy else None)
    stop = call["stop"] / f if call.get("stop") else None
    notes = []
    if target and buy and target <= entry or target and not buy and target >= entry:
        target = None   # a "target" already passed at entry is not a forecast; judge on the horizon instead
        notes.append("target was already passed at entry, so it was ignored")
    if stop and buy and stop >= entry or stop and not buy and stop <= entry:
        stop = None     # likewise a stop already broken at entry: a follower could not have used it
        notes.append("stop loss was already broken at entry, so it was ignored")
    window = rows[:h]
    exit_px, exit_date, reason = None, None, None
    worst = entry
    for r in window:
        worst = min(worst, r["low"]) if buy else max(worst, r["high"])
        stop_hit = stop and (r["low"] <= stop if buy else r["high"] >= stop)
        tgt_hit = target and (r["high"] >= target if buy else r["low"] <= target)
        if stop_hit:   # gaps through the stop fill at the open, which is worse
            exit_px = min(r["open"], stop) if buy else max(r["open"], stop)
            exit_date, reason = r["date"], "stop loss hit"
            break
        if tgt_hit:
            exit_px = max(r["open"], target) if buy else min(r["open"], target)
            exit_date, reason = r["date"], "target hit"
            break
    status = "closed"
    if exit_px is None:
        last = window[-1]
        exit_px, exit_date = last["close"], last["date"]
        if len(window) < h:
            status, reason = "open", f"still open: only {len(window)} of {h} sessions have passed"
        else:
            reason = f"time frame ended ({h} sessions)"
    gross = (exit_px / entry - 1) * 100 * (1 if buy else -1)
    net = gross - cost_pct
    mae = (worst / entry - 1) * 100 * (1 if buy else -1)
    bench = market.history(BENCHMARK, rows[0]["date"], exit_date)
    bench_ret = None
    if bench and bench["rows"]:
        b = bench["rows"]
        bench_ret = (b[-1]["close"] / b[0]["open"] - 1) * 100 * (1 if buy else -1)
    # prices are shown on the scale of the day of the call, so they match the numbers the influencer quoted
    return {**out, "status": status, "resolved_symbol": data["symbol"], "entry_date": rows[0]["date"],
            "entry_price": round(entry * f, 2), "exit_date": exit_date, "exit_price": round(exit_px * f, 2), "exit_reason": reason,
            "split_factor": f if f != 1 else None, "level_notes": notes,
            "target_used": round(target * f, 2) if target else None, "target_hit": reason == "target hit" if target else None,
            "gross_pct": round(gross, 2), "net_pct": round(net, 2), "worst_drawdown_pct": round(min(0.0, mae), 2),
            "nifty_pct": round(bench_ret, 2) if bench_ret is not None else None,
            "excess_vs_nifty_pct": round(net - bench_ret, 2) if bench_ret is not None else None,
            "price_source": data.get("source_url")}


def audit(calls: list[dict], horizon: int = DEFAULT_HORIZON, cost_pct: float = DEFAULT_COST_PCT,
          claimed_accuracy: float | None = None) -> dict:
    results = [evaluate(c, horizon, cost_pct) for c in calls[:60]]
    scored = [r for r in results if r["status"] in {"closed", "open"}]
    closed = [r for r in scored if r["status"] == "closed"]
    nets = [r["net_pct"] for r in closed]
    with_target = [r for r in closed if r["target_hit"] is not None]
    excess = [r["excess_vs_nifty_pct"] for r in closed if r["excess_vs_nifty_pct"] is not None]

    curve, cum, peak, max_dd = [], 0.0, 0.0, 0.0
    for r in sorted(closed, key=lambda r: r["exit_date"]):
        cum += STAKE * r["net_pct"] / 100
        peak = max(peak, cum)
        max_dd = max(max_dd, peak - cum)
        curve.append({"date": r["exit_date"], "symbol": r["symbol"], "pnl": round(cum)})

    win_rate = round(100 * sum(n > 0 for n in nets) / len(nets), 1) if nets else None
    summary = {
        "calls": len(results), "scored": len(scored), "closed": len(closed), "open": len(scored) - len(closed),
        "insufficient_data": len(results) - len(scored),
        "win_rate_pct": win_rate,
        "target_hit_rate_pct": round(100 * sum(r["target_hit"] for r in with_target) / len(with_target), 1) if with_target else None,
        "avg_net_pct": round(statistics.mean(nets), 2) if nets else None,
        "median_net_pct": round(statistics.median(nets), 2) if nets else None,
        "best": max(closed, key=lambda r: r["net_pct"], default=None),
        "worst": min(closed, key=lambda r: r["net_pct"], default=None),
        "losers": sum(n <= 0 for n in nets),
        "avg_excess_vs_nifty_pct": round(statistics.mean(excess), 2) if excess else None,
        "stake_per_call": STAKE, "total_pnl": round(cum), "max_drawdown": round(max_dd),
        "total_costs": round(STAKE * cost_pct / 100 * len(closed)),
        "claimed_accuracy_pct": claimed_accuracy,
        "claim_gap_pct": round(claimed_accuracy - win_rate, 1) if claimed_accuracy is not None and win_rate is not None else None,
    }
    enough = len(closed) >= 10
    return {"summary": summary, "results": results, "curve": curve,
            "method": {"horizon": horizon, "cost_pct": cost_pct, "benchmark": "Nifty 50",
                       "entry": "Open of the first trading session after the call date",
                       "same_day_rule": "If target and stop both fall inside one day's range, the stop is assumed"},
            "sample_note": None if enough else f"Only {len(closed)} closed call(s) could be scored. Too few to call this a track record.",
            "disclaimer": "Built only from the calls provided or found on public pages; posts that were deleted or never found are missing, "
                          "and that usually flatters the record. Not investment advice."}
