"""Past IPOs: the data the listing-range model learns from.

One row per listed IPO. Real rows live in data/ipo_history.csv (you import or add them); a synthetic
bootstrap (synth.py) fills in until there are enough real ones. Every row says which it is.

  python -m ipo_decide.history import past_ipos.csv --board MAINBOARD --source "Kaggle: Indian IPO data"
  python -m ipo_decide.history add --name "ABC Ltd" --symbol ABC-SM.NS --board SME --listing-date 2025-02-14 \
        --issue-price 120 --sub-total 210 --sub-retail 180 --sub-nii 400 [--gmp 45]
  python -m ipo_decide.history stats

`import` accepts the column names used by the common public IPO datasets (IPOName, Issue_Size,
Subscription_QIB/HNI/RII/Total, Issue_price, Listing_Gains_Percent, ...): see ALIASES. `add` fills the
listing-day open/close and the Nifty's 20-session return from Yahoo Finance via market.py.
"""
import argparse
import csv
import math
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
REAL_CSV = HERE / "data" / "ipo_history.csv"

COLUMNS = ["name", "board", "listing_date", "issue_price", "issue_size_cr", "lot_size",
           "sub_retail", "sub_nii", "sub_qib", "sub_total", "gmp_pct", "market_ret_20d",
           "listing_open", "listing_close", "source", "synthetic"]
NUMERIC = ["issue_price", "issue_size_cr", "lot_size", "sub_retail", "sub_nii", "sub_qib", "sub_total",
           "gmp_pct", "market_ret_20d", "listing_open", "listing_close"]
BOARDS = ("SME", "MAINBOARD")

# lower-cased, punctuation-free header -> our column. First match wins.
ALIASES = {
    "name": ["name", "iponame", "ipo", "company", "companyname", "issuer", "issuername"],
    "board": ["board", "segment", "issuetype", "type"],
    "listing_date": ["listingdate", "listdate", "date", "listedon", "listing"],
    "issue_price": ["issueprice", "offerprice", "issuepricers", "price", "finalissueprice"],
    "issue_size_cr": ["issuesizecr", "issuesize", "issuesizerscr", "sizecr", "size", "issueamount"],
    "lot_size": ["lotsize", "marketlot", "minlot", "lot"],
    "sub_retail": ["subretail", "subscriptionrii", "subscriptionretail", "rii", "retail", "retailsubscription", "riisubscription"],
    "sub_nii": ["subnii", "subscriptionhni", "subscriptionnii", "hni", "nii", "niisubscription", "hnisubscription"],
    "sub_qib": ["subqib", "subscriptionqib", "qib", "qibsubscription"],
    "sub_total": ["subtotal", "subscriptiontotal", "total", "overall", "totalsubscription", "subscription"],
    "gmp_pct": ["gmppct", "gmppercent", "gmpperc"],
    "gmp_rs": ["gmp", "gmprs", "greymarketpremium"],
    "market_ret_20d": ["marketret20d", "niftyret20d"],
    "listing_open": ["listingopen", "listingdayopen", "openprice", "listingprice", "open"],
    "listing_close": ["listingclose", "listingdayclose", "closeprice", "close"],
    "listing_gain_pct": ["listinggainspercent", "listinggainpct", "listinggain", "listinggains", "listingdaygain", "listinggainsopen"],
    "source": ["source"],
}

DATE_FORMATS = ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d/%m/%y", "%d-%m-%y", "%d-%b-%Y", "%d-%b-%y",
                "%d %b %Y", "%b %d, %Y", "%d %B %Y", "%B %d, %Y", "%Y/%m/%d"]


def _key(h: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (h or "").lower())


def parse_date(s) -> str | None:
    s = (str(s or "")).strip()
    if not s:
        return None
    s = s.split("T")[0].split(" 00:00")[0]
    for f in DATE_FORMATS:
        try:
            return datetime.strptime(s, f).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def parse_num(s) -> float | None:
    if s is None:
        return None
    if isinstance(s, (int, float)):
        return None if (isinstance(s, float) and math.isnan(s)) else float(s)
    t = re.sub(r"[₹,%x×\s]|rs\.?|cr\.?", "", str(s).strip().lower())
    if t in {"", "-", "na", "nan", "none", "null"}:
        return None
    try:
        return float(t)
    except ValueError:
        return None


def gain_open_pct(row) -> float | None:
    if row.get("listing_open") and row.get("issue_price"):
        return 100 * (row["listing_open"] / row["issue_price"] - 1)
    return None


def gain_close_pct(row) -> float | None:
    if row.get("listing_close") and row.get("issue_price"):
        return 100 * (row["listing_close"] / row["issue_price"] - 1)
    return None


def normalise(raw: dict) -> dict | None:
    """One row in our schema, or None when it cannot be used (no date, price or listing outcome)."""
    r = {c: raw.get(c) for c in COLUMNS}
    for c in NUMERIC:
        r[c] = parse_num(r[c])
    r["listing_date"] = parse_date(r["listing_date"])
    b = str(r.get("board") or "").upper()
    r["board"] = "SME" if "SME" in b or "EMERGE" in b else "MAINBOARD" if b else None
    r["synthetic"] = 1 if str(raw.get("synthetic") or "0").strip() in {"1", "true", "True"} else 0
    r["name"] = (str(r.get("name") or "")).strip()[:120]
    r["source"] = (str(r.get("source") or "")).strip()[:200]
    if r["listing_open"] is None and raw.get("listing_gain_pct") is not None and r["issue_price"]:
        g = parse_num(raw["listing_gain_pct"])
        if g is not None:
            r["listing_open"] = round(r["issue_price"] * (1 + g / 100), 2)
    if r["gmp_pct"] is None and raw.get("gmp_rs") is not None and r["issue_price"]:
        g = parse_num(raw["gmp_rs"])
        if g is not None:
            r["gmp_pct"] = round(100 * g / r["issue_price"], 2)
    if not (r["name"] and r["listing_date"] and r["issue_price"] and r["listing_open"] and r["board"] in BOARDS):
        return None
    return r


def load_real() -> list[dict]:
    if not REAL_CSV.exists():
        return []
    with open(REAL_CSV, newline="", encoding="utf-8") as fh:
        rows = [normalise(r) for r in csv.DictReader(fh)]
    return [r for r in rows if r and not r["synthetic"]]


def save_real(rows: list[dict]):
    REAL_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(REAL_CSV, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS)
        w.writeheader()
        for r in sorted(rows, key=lambda r: (r["listing_date"], r["name"])):
            w.writerow({c: ("" if r.get(c) is None else r[c]) for c in COLUMNS})


def merge(new_rows: list[dict]) -> tuple[int, int]:
    """Adds rows to the real dataset; a row with the same name and listing date replaces the old one."""
    by_key = {(r["name"].lower(), r["listing_date"]): r for r in load_real()}
    added = 0
    for r in new_rows:
        k = (r["name"].lower(), r["listing_date"])
        added += k not in by_key
        by_key[k] = r
    save_real(list(by_key.values()))
    return added, len(by_key)


def import_csv(path: str, board: str | None = None, source: str = "") -> dict:
    """Reads someone else's CSV, maps its headers through ALIASES, keeps rows that have an outcome."""
    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        headers = reader.fieldnames or []
        mapping = {}
        for col, names in ALIASES.items():
            for h in headers:
                if _key(h) in names and h not in mapping.values():
                    mapping[col] = h
                    break
        kept, skipped = [], 0
        for raw in reader:
            row = {col: raw.get(h) for col, h in mapping.items()}
            if board and not row.get("board"):
                row["board"] = board
            row["source"] = row.get("source") or source or Path(path).name
            row["synthetic"] = 0
            n = normalise(row)
            if n:
                kept.append(n)
            else:
                skipped += 1
    added, total = merge(kept) if kept else (0, len(load_real()))
    missing = [c for c in ("name", "listing_date", "issue_price") if c not in mapping]
    if "listing_open" not in mapping and "listing_gain_pct" not in mapping:
        missing.append("listing_open or listing_gain_pct")
    return {"mapped": mapping, "kept": len(kept), "skipped": skipped, "added": added, "total_real": total,
            "missing_required": missing}


def enrich_from_market(row: dict, symbol: str) -> dict:
    """Fills listing-day open/close from the stock's own history and the Nifty's 20-session return before listing."""
    import market   # backend/market.py; imported here so the module also works without the backend on the path
    d = row["listing_date"]
    end = (datetime.strptime(d, "%Y-%m-%d") + timedelta(days=10)).strftime("%Y-%m-%d")
    h = market.history(symbol, d, end)
    if h and h.get("rows"):
        first = h["rows"][0]
        if first["date"] == d or row.get("listing_open") is None:
            # Yahoo adjusts old prices for later splits/bonuses; undo that so they compare with the issue price
            f = market.split_factor(h["symbol"], d) if h.get("symbol") else 1.0
            row["listing_open"] = row.get("listing_open") or round(first["open"] * f, 2)
            row["listing_close"] = row.get("listing_close") or round(first["close"] * f, 2)
    start = (datetime.strptime(d, "%Y-%m-%d") - timedelta(days=45)).strftime("%Y-%m-%d")
    n = market.history("^NSEI", start, (datetime.strptime(d, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d"))
    if n and len(n["rows"]) >= 21 and row.get("market_ret_20d") is None:
        c = [x["close"] for x in n["rows"]]
        row["market_ret_20d"] = round(100 * (c[-1] / c[-21] - 1), 2)
    return row


def nifty_ret_20d(on: str | None = None) -> float | None:
    """Nifty 50 % return over the 20 sessions before `on` (default today). None when Yahoo has no data."""
    import market
    d = datetime.strptime(on, "%Y-%m-%d") if on else datetime.now()
    n = market.history("^NSEI", (d - timedelta(days=45)).strftime("%Y-%m-%d"), (d - timedelta(days=1)).strftime("%Y-%m-%d"))
    if not n or len(n["rows"]) < 21:
        return None
    c = [x["close"] for x in n["rows"]]
    return round(100 * (c[-1] / c[-21] - 1), 2)


def stats() -> dict:
    rows = load_real()
    by_board = {b: sum(r["board"] == b for r in rows) for b in BOARDS}
    years = sorted({r["listing_date"][:4] for r in rows})
    return {"real_rows": len(rows), "by_board": by_board, "years": years,
            "with_gmp": sum(r["gmp_pct"] is not None for r in rows),
            "with_category_subscription": sum(r["sub_retail"] is not None for r in rows)}


def _cli():
    p = argparse.ArgumentParser(prog="python -m ipo_decide.history")
    sub = p.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("import")
    i.add_argument("path")
    i.add_argument("--board", choices=BOARDS)
    i.add_argument("--source", default="")
    a = sub.add_parser("add")
    for f in ("name", "symbol", "listing-date"):
        a.add_argument(f"--{f}", required=True)
    a.add_argument("--board", choices=BOARDS, required=True)
    a.add_argument("--issue-price", type=float, required=True)
    for f in ("issue-size-cr", "lot-size", "sub-retail", "sub-nii", "sub-qib", "sub-total", "gmp"):
        a.add_argument(f"--{f}", type=float)
    a.add_argument("--source", default="manual entry")
    sub.add_parser("stats")
    args = p.parse_args()

    if args.cmd == "import":
        out = import_csv(args.path, args.board, args.source)
    elif args.cmd == "add":
        row = {"name": args.name, "board": args.board, "listing_date": parse_date(args.listing_date),
               "issue_price": args.issue_price, "issue_size_cr": args.issue_size_cr, "lot_size": args.lot_size,
               "sub_retail": args.sub_retail, "sub_nii": args.sub_nii, "sub_qib": args.sub_qib, "sub_total": args.sub_total,
               "gmp_pct": round(100 * args.gmp / args.issue_price, 2) if args.gmp is not None else None,
               "market_ret_20d": None, "listing_open": None, "listing_close": None,
               "source": f"{args.source}; prices: Yahoo Finance {args.symbol}", "synthetic": 0}
        row = enrich_from_market(row, args.symbol)
        if not row.get("listing_open"):
            print("Could not find listing-day prices for that symbol and date. Nothing saved.")
            sys.exit(1)
        added, total = merge([row])
        out = {"saved": row, "gain_open_pct": round(gain_open_pct(row), 2), "total_real": total}
    else:
        out = stats()
    import json
    print(json.dumps(out, indent=2, default=str))


if __name__ == "__main__":
    _cli()
