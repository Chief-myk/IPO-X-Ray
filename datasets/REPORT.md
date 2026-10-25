# IPO X-Ray: real datasets and model evaluation

Generated 2026-10-25. Every row in these files was researched from public web pages, and every row carries its
source URL. No value was estimated or filled in by hand: a blank cell means the source did not state it.

## Files

| File | Rows | What it is |
|---|---|---|
| `real_ipo_listings.csv` | 200 (106 mainboard, 94 SME) | Listed IPOs 2021-2025: issue price/size, lot size, subscription by category, last pre-listing GMP (82 rows), listing-day open/close |
| `real_risk_labels.csv` | 66 (16 fraud, 50 clean) | SME IPOs labelled by later SEBI action, with IPO-time facts (revenue growth, employees, office address) |
| `risk_train_real_plus_synthetic.csv` | 66 real + 400 synthetic | The risk training table: real rows with sources, then synthetic rows made from them, marked `synthetic=1` |
| `synthetic_ipos.csv` | - | The older synthetic bootstrap data. Not used in the numbers below |

Sources: chittorgarh.com IPO pages (prices, sizes, dates), NSE issue-information pages (mainboard subscription),
ipocentral.in (SME subscription, GMP), investorgain.com (GMP), Groww (cross-checks), and news coverage / an NSE
circular for SEBI actions.

Synthetic rows exist only in `risk_train_real_plus_synthetic.csv` and are always marked. Every score below is
measured on real rows only.

## Risk model (fraud probability)

Label 1 = SEBI later passed an order against the company or its promoters over IPO fraud, diversion of IPO proceeds,
fictitious revenue, or misleading offer-document claims (16 SME issuers, 2013-2024, each linked to the order or an
exchange circular / news report on it). Three candidates were left out because SEBI's finding was not about the IPO
itself: Sigma Solve (general-corporate spend over the 25% cap), Accretion Pharmaceuticals (projections at an investor
meet) and V-Marc India (allotment to connected entities, then price manipulation). Label 0 = SME IPO of similar size,
2022-2024, with no SEBI order found in search.

Features excluded as label leakage: `company_sebi_orders`, `director_sebi_orders`, `complaints_count`,
`company_court_cases`. A search done today finds the very SEBI order that defines the label.

Retrained models: 5-fold CV repeated 5 times on the 66 real rows (mean ± std). For the "+ synthetic" models,
synthetic rows are generated inside each fold from that fold's training rows only, so the held-out rows never
shape them. The threshold is likewise picked inside each fold's training rows.

| Model | Precision | Recall | F1 | PR-AUC |
|---|---|---|---|---|
| **Logistic regression, real + synthetic, missing-value flags, tuned threshold** | 0.29 ± 0.06 | **0.55 ± 0.11** | **0.38 ± 0.07** | 0.36 |
| Gradient boosting, real + synthetic | 0.38 ± 0.07 | 0.25 ± 0.06 | 0.30 ± 0.06 | **0.38** |
| Gradient boosting, real only | 0.32 ± 0.09 | 0.23 ± 0.05 | 0.26 ± 0.07 | 0.29 |
| Logistic regression, real + synthetic, missing-value flags | 0.32 ± 0.07 | 0.23 ± 0.03 | 0.26 ± 0.04 | 0.35 |
| Logistic regression, real only | 0.30 ± 0.12 | 0.16 ± 0.06 | 0.21 ± 0.08 | 0.35 |
| Logistic regression, real + synthetic | 0.39 ± 0.12 | 0.13 ± 0.06 | 0.18 ± 0.07 | 0.35 |
| Current model (trained on synthetic data), scored on all 66 rows | 0.67 | 0.13 | 0.21 | 0.37 |
| Chance (16 of 66 positive) | - | - | - | 0.24 |

Reading: the best retrained model catches 55% of the fraud cases (the deployed model catches 13%), at the cost of
more false alarms (precision 0.29). PR-AUC is ~0.36-0.38 against 0.24 for chance: real but modest signal. An earlier
run with only 6 fraud cases showed F1 0.44; with 16 cases the numbers are lower but far more stable (std 0.07 vs
0.12), so 0.38 is the more trustworthy figure. Accuracy is not reported as the headline: always answering "clean"
already scores 76% here. The retrained model is saved as `backend/ml/models/risk_model_real.joblib`; the app still
serves the original model.

The time-split table in `backend/ml/data/eval_report.md` is not meaningful here: 10 of the 16 fraud cases listed in
2013-2021, so the newest 30% of rows hold only one fraud case.

## Listing-gain range model

Scored on the newest 40 real IPOs (Jan-Sep 2025), out of time; trained on the 160 older ones. 80% prediction range:
coverage should be near 0.80, and lower interval score is better (it punishes ranges that are too wide and ranges
that miss).

| Method | Trained on | Coverage | Avg width (pp) | Interval score | MAE of median (pp) | F1 gain>0 |
|---|---|---|---|---|---|---|
| **GMP + its past error (served now)** | real | **0.825** | 66.7 | 84.9 | 16.2 | 0.77 |
| Calibrated quantile model | real | 1.00 | 87.6 | 87.6 | 16.7 | 0.80 |
| Same-board history | real | 0.725 | 90.0 | 121.6 | 20.5 | 0.75 |
| Calibrated quantile model | synthetic only (old) | 0.675 | 39.1 | 65.1 | 13.8 | 0.80 |
| GMP + its past error | real + synthetic (experiment) | 0.775 | 53.8 | 73.5 | 15.2 | 0.75 |
| Always "gain > 0" | - | - | - | - | - | 0.75 |

Reading: with 200 real IPOs the app now trains on real data only and serves "GMP + its past error", the method whose
80% range actually covered 82.5% of the 2025 test IPOs. The old synthetic-only model has a better interval score,
but its ranges are too narrow: they promised 80% and covered 67.5%. Keeping synthetic rows in training improved the
interval score in one experiment (73.5) at slightly lower coverage; that setting was found by looking at this test
set, so it is not adopted. F1 for "gain > 0" lifts only slightly over always guessing "gain" (0.80 vs 0.75).
GMP is present for 82 of 200 IPOs (18 of the 40 test IPOs).

## Limitations

- Small: 66 labelled risk rows with 16 fraud cases; 200 listing rows.
- Era mismatch: most fraud cases are 2013-2021 issues, all clean ones are 2022-2024. The three features carry no
  date, but SME issues in those years may differ in ways that leak into growth and size.
- Weak negatives: "no SEBI action found" is web search, not a check of SEBI's orders database. Jungle Camps India
  has no SEBI action but later had a BSE fine and an FIR.
- Risk features: only 3 of the model's 17 features can be researched from public IPO pages. Revenue is "total
  income" as reproduced on chittorgarh, not read from the prospectus PDF. Address is the current contact address.
- Subscription totals: some SME rows use allotment-basis figures (chittorgarh), the rest final-day bid figures.
  Eleven older SME rows take the highest "Day N" row as the final day.
- GMP is unofficial grey-market data from IPO trackers, the last figure at most 4 days before listing.
- Listing close is the listing-day last trade on chittorgarh, not the exchange's official close.
- Positives are SEBI interim or final orders; some are under appeal at SAT.

## How to make the models more accurate

1. Better features, now the biggest lever: a search of ~2,300 SEBI order PDFs (2015-2026) turned up only 13 more SME
   IPO cases, so labels are close to exhausted. Of the model's 17 features only 3 can be filled from public IPO
   pages; vendor, director and domain-age checks taken from pre-listing snapshots would add the most.
   Clean negatives from 2013-2021 would also remove the era mismatch.
2. GMP for every listing row: 118 of 200 still have none.
3. Fill the agent features at IPO time (vendors, directors, domain age), from cached snapshots taken before listing,
   so they do not leak later outcomes.
4. Add IPO-time features that are cheap and public: lead manager history, auditor, promoter holding, issue size vs
   net worth, OFS share.
5. Re-evaluate with rolling time splits (several test windows instead of one) so a setting like "keep synthetic
   rows" can be chosen without looking at the final test set.
