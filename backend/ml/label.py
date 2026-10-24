"""Add a real, labelled case to the training set, then retrain.

  python -m ml.label path/to/ipo-xray-report.json 1 "SEBI order WTM/xx/2024 (link)"
  python -m ml.label path/to/ipo-xray-report.json 0 "Listed 2023, no regulatory action"
  python -m ml.train

label 1 = regulator later found fraud / cancelled the issue, 0 = no action found.
Label from what happened AFTER the IPO, never from the model's own score."""
import csv
import json
import sys

from .features import FEATURES
from .train import REAL_CSV


def main():
    if len(sys.argv) < 4 or sys.argv[2] not in {"0", "1"}:
        sys.exit(__doc__)
    report = json.load(open(sys.argv[1], encoding="utf-8"))
    feats = report.get("features")
    if not feats:
        sys.exit("This report has no 'features' block. Download it again from the current version.")
    new = not REAL_CSV.exists() or REAL_CSV.stat().st_size == 0
    REAL_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(REAL_CSV, "a", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        if new:
            w.writerow(["company", "label", "source", *FEATURES])
        w.writerow([report.get("company", ""), sys.argv[2], sys.argv[3],
                    *["" if feats.get(f) is None else feats[f] for f in FEATURES]])
    print(f"Added {report.get('company')} as label {sys.argv[2]}. Run: python -m ml.train")


if __name__ == "__main__":
    main()
