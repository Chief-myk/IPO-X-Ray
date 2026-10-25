# Listing-gain range: old vs retrained, on real IPOs

Real IPOs: 200. Scored on the newest 40 (out of time). 80% range.

Lower interval score is better; coverage should be near 0.80. F1 is for 'listing gain > 0'.

| Method | Model | Coverage | Avg width | Interval score | MAE (median) | F1 gain>0 |
|---|---|---|---|---|---|---|
| Same-board history | synthetic-only | 0.825 | 68.1 | 88.2 | 17.5 | 0.75 |
| Same-board history | retrained on real | 0.725 | 90.0 | 121.6 | 20.5 | 0.75 |
| GMP + its past error | synthetic-only | 0.775 | 52.7 | 74.2 | 15.1 | 0.762 |
| GMP + its past error | retrained on real | 0.825 | 66.7 | 84.9 | 16.2 | 0.774 |
| Calibrated quantile model | synthetic-only | 0.675 | 39.1 | 65.1 | 13.8 | 0.8 |
| Calibrated quantile model | retrained on real | 1.0 | 87.6 | 87.6 | 16.7 | 0.8 |

Served before: Calibrated quantile model. Served now: GMP + its past error.
