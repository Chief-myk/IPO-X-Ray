"""Daily price/volume history for NSE/BSE stocks, used by the liquidity simulator and the prediction auditor.

Source: Yahoo Finance's public chart endpoint (no key). Every response is cached in data/cache/market/, and
DEMO_MODE=1 only reads that cache, same rule as collect.py. A symbol that cannot be resolved returns None,
never invented prices.

  python market.py RELIANCE            # resolves RELIANCE.NS, prints the last sessions
"""
import json
import re
import sys
import time
from datetime import datetime, timedelta, timezone

import httpx

import collect

MARKET_DIR = collect.CACHE_DIR / "market"
IST = timezone(timedelta(hours=5, minutes=30))
URL = "https://query1.finance.yahoo.com/v8/finance/chart/{sym}"
CACHE_TTL = 6 * 3600   # re-fetch live data after 6 hours


def candidates(symbol: str) -> list[str]:
    """User input -> Yahoo symbols to try. SME stocks on NSE Emerge are usually listed as SYMBOL-SM.NS,
    BSE SME by scrip code (e.g. 543921.BO)."""
    s = re.sub(r"\s+", "", (symbol or "").upper())
    if not s:
        return []
    if "." in s or s.startswith("^"):
        return [s]
    if s.isdigit():
        return [f"{s}.BO"]
    return [f"{s}.NS", f"{s}-SM.NS", f"{s}-ST.NS", f"{s}.BO"]


def _parse(j: dict) -> dict | None:
    res = ((j or {}).get("chart") or {}).get("result")
    if not res:
        return None
    r = res[0]
    ts = r.get("timestamp") or []
    q = ((r.get("indicators") or {}).get("quote") or [{}])[0]
    rows = []
    for i, t in enumerate(ts):
        o, h, lo, c, v = (q.get(k, [None] * len(ts))[i] for k in ("open", "high", "low", "close", "volume"))
        if c is None or o is None or h is None or lo is None:
            continue           # a session Yahoo has no prices for: skip it, do not fill it in
        rows.append({"date": datetime.fromtimestamp(t, IST).strftime("%Y-%m-%d"),
                     "open": o, "high": h, "low": lo, "close": c, "volume": int(v or 0)})
    if not rows:
        return None
    meta = r.get("meta") or {}
    return {"symbol": meta.get("symbol"), "name": meta.get("longName") or meta.get("shortName"),
            "currency": meta.get("currency"), "exchange": meta.get("exchangeName"), "rows": rows}


def _cache_file(sym: str, start: str, end: str):
    return MARKET_DIR / f"{re.sub(r'[^A-Za-z0-9._^-]', '_', sym)}_{start}_{end}.json"


def _fetch(sym: str, start: str, end: str) -> dict | None:
    path = _cache_file(sym, start, end)
    if path.exists() and (collect.demo_mode() or time.time() - path.stat().st_mtime < CACHE_TTL or end < _today()):
        return json.loads(path.read_text())
    if collect.demo_mode():
        return None
    p1 = int(datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=IST).timestamp())
    p2 = int((datetime.strptime(end, "%Y-%m-%d") + timedelta(days=1)).replace(tzinfo=IST).timestamp())
    try:
        r = httpx.get(URL.format(sym=sym), params={"period1": p1, "period2": p2, "interval": "1d"},
                      headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
        data = _parse(r.json())
    except (httpx.HTTPError, ValueError):
        return None
    if data:
        data["fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        data["source_url"] = f"https://finance.yahoo.com/quote/{sym}/history"
        MARKET_DIR.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data))
    return data


def _today() -> str:
    return datetime.now(IST).strftime("%Y-%m-%d")


def history(symbol: str, start: str, end: str | None = None) -> dict | None:
    """Daily OHLCV between two dates (YYYY-MM-DD, inclusive). Tries each candidate symbol in turn."""
    end = min(end or _today(), _today())
    for sym in candidates(symbol):
        data = _fetch(sym, start, end)
        if data and data.get("rows"):
            return data
    return None


def splits(resolved_symbol: str) -> list[dict]:
    """Every split / bonus Yahoo knows for this exact symbol: [{date, ratio}], ratio = new shares per old share.
    Yahoo's daily prices are already adjusted for these, so a price quoted before a split must be divided by
    the product of the ratios of all later splits before it is compared with them."""
    path = MARKET_DIR / f"{re.sub(r'[^A-Za-z0-9._^-]', '_', resolved_symbol)}_splits.json"
    if path.exists() and (collect.demo_mode() or time.time() - path.stat().st_mtime < 24 * 3600):
        return json.loads(path.read_text())
    if collect.demo_mode():
        return []
    try:
        r = httpx.get(URL.format(sym=resolved_symbol), params={"range": "max", "interval": "1mo", "events": "split"},
                      headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
        res = ((r.json().get("chart") or {}).get("result") or [{}])[0]
    except (httpx.HTTPError, ValueError, IndexError):
        return []
    out = []
    for s in ((res.get("events") or {}).get("splits") or {}).values():
        num, den = s.get("numerator"), s.get("denominator")
        if num and den:
            out.append({"date": datetime.fromtimestamp(s["date"], IST).strftime("%Y-%m-%d"), "ratio": num / den})
    out.sort(key=lambda s: s["date"])
    MARKET_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out))
    return out


def split_factor(resolved_symbol: str, after: str) -> float:
    """Product of split ratios with an ex-date after `after` (YYYY-MM-DD). 1.0 when there were none."""
    f = 1.0
    for s in splits(resolved_symbol):
        if s["date"] > after:
            f *= s["ratio"]
    return f


def recent(symbol: str, days: int = 120) -> dict | None:
    start = (datetime.now(IST) - timedelta(days=int(days * 1.6) + 10)).strftime("%Y-%m-%d")
    data = history(symbol, start)
    if data:
        data = {**data, "rows": data["rows"][-days:]}
    return data


if __name__ == "__main__":
    d = recent(sys.argv[1] if len(sys.argv) > 1 else "RELIANCE", 10)
    print(json.dumps(d, indent=2) if d else "No data for that symbol.")
