"""Turn the web-researched CSVs into (a) the judge-facing datasets and (b) the project's training inputs.

  python -m ml.import_research <research_dir>

Reads from <research_dir> (missing files are skipped; a company/IPO seen twice keeps its first row):
  risk_labelled_ipos.csv, risk_more_positives.csv, risk_more_negatives.csv
                           labelled IPOs with IPO-time facts (growth, employees, residential office)
  mainboard_ipos.csv, sme_ipos.csv, listings_more.csv
                           listed IPOs with subscription, GMP where found, and listing-day prices

Writes:
  datasets/real_risk_labels.csv       as researched, with sources (for judges)
  datasets/real_ipo_listings.csv      mainboard + SME together, with sources (for judges)
  backend/ml/data/real_ipos.csv       risk rows in the model's feature columns (input to ml.evaluate_real)
  backend/ipo_decide/data/ipo_history.csv   via history.import_csv (input to the listing-range model)

Only three risk features can be researched from public IPO pages: growth_multiple, log_employees and
address_residential. Every other model feature is left blank, which the model treats as 'unknown'.
"""
import csv
import math
import sys
from pathlib import Path

from ml.features import FEATURES

BACKEND = Path(__file__).resolve().parent.parent
DATASETS = BACKEND.parent / "datasets"
REAL_IPOS = BACKEND / "ml" / "data" / "real_ipos.csv"


def _num(v):
    try:
        return float(str(v).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def _read_many(paths, key):
    """Rows from several CSVs, first occurrence of each key (case-insensitive) wins."""
    rows, header, seen = [], None, set()
    for p in paths:
        if not Path(p).exists():
            print(f"missing {p}, skipped")
            continue
        with open(p, newline="", encoding="utf-8-sig") as fh:
            rd = csv.DictReader(fh)
            header = header or rd.fieldnames
            for r in rd:
                k = r[key].strip().lower().removesuffix(" ltd.").removesuffix(" limited").strip()
                if k and k not in seen:
                    seen.add(k)
                    rows.append(r)
    return rows, header


def risk(*srcs: Path):
    rows, header = _read_many(srcs, "company")
    DATASETS.mkdir(exist_ok=True)
    with open(DATASETS / "real_risk_labels.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=header, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    cols = ["company", "label", "listing_or_order_date", "source_url", "notes", *FEATURES]
    with open(REAL_IPOS, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        for r in rows:
            out = {f: "" for f in FEATURES}
            g = _num(r.get("growth_multiple"))
            if g is None:
                a, b = _num(r.get("revenue_latest_cr")), _num(r.get("revenue_prev_cr"))
                g = round(a / b, 3) if a is not None and b else None
            e = _num(r.get("employees"))
            res = _num(r.get("address_residential"))
            out.update({"growth_multiple": "" if g is None else g,
                        "log_employees": "" if e is None else round(math.log1p(e), 4),
                        "address_residential": "" if res is None else int(res)})
            w.writerow({"company": r["company"], "label": r["label"], "listing_or_order_date": r.get("listing_date", ""),
                        "source_url": r.get("label_source_url") or r.get("feature_source_url", ""),
                        "notes": r.get("notes", ""), **out})
    print(f"risk: {len(rows)} rows -> {REAL_IPOS}")


def listings(*srcs: Path):
    rows, header = _read_many(srcs, "name")
    if not rows:
        return
    out = DATASETS / "real_ipo_listings.csv"
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=header, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    from ipo_decide import history
    res = history.import_csv(str(out), source="web research (see source column)")
    print(f"listings: {len(rows)} researched -> {out}; import: {res}")


if __name__ == "__main__":
    d = Path(sys.argv[1])
    risk(d / "risk_labelled_ipos.csv", d / "risk_more_positives.csv", d / "risk_more_negatives.csv")
    listings(d / "mainboard_ipos.csv", d / "sme_ipos.csv", d / "listings_more.csv")
