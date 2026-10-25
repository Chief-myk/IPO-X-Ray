# Risk model: real-data evaluation

Rows: 66 (16 positive). Threshold 0.5.

Excluded as label leakage (agents find the post-IPO regulator action itself): company_court_cases, company_sebi_orders, complaints_count, director_sebi_orders.

## Time split (oldest 70% train, newest 30% test)

Test rows: 20 (1 positive). Small: treat numbers as indicative.

| Model | Precision | Recall | F1 | PR-AUC | ROC-AUC |
|---|---|---|---|---|---|
| Current (synthetic-trained) | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| Gradient boosting, real only | 0.0 | 0.0 | 0.0 | 0.059 | 0.158 |
| Logistic regression, real only | 0.0 | 0.0 | 0.0 | 0.05 | 0.0 |
| Gradient boosting, real + synthetic | 0.0 | 0.0 | 0.0 | 0.056 | 0.105 |
| Logistic regression, real + synthetic | 0.0 | 0.0 | 0.0 | 0.05 | 0.0 |
| Logistic regression, real + synthetic, missing-value flags | 0.0 | 0.0 | 0.0 | 0.05 | 0.0 |
| Same, threshold tuned inside the training rows | 0.0 | 0.0 | 0.0 | 0.05 | 0.0 |
| Always 'clean' | 0.0 | 0.0 | 0.0 | 0.05 | 0.5 |

## Repeated 5-fold CV on real rows (5 repeats, mean ± std)

Synthetic rows are generated inside each fold from that fold's training rows only, and every score is on held-out real rows.

| Model | Precision | Recall | F1 | PR-AUC |
|---|---|---|---|---|
| Gradient boosting, real only | 0.318 ± 0.093 | 0.225 ± 0.05 | 0.263 ± 0.066 | 0.293 ± 0.018 |
| Logistic regression, real only | 0.3 ± 0.12 | 0.163 ± 0.064 | 0.207 ± 0.075 | 0.349 ± 0.036 |
| Gradient boosting, real + synthetic | 0.381 ± 0.068 | 0.25 ± 0.055 | 0.299 ± 0.056 | 0.378 ± 0.071 |
| Logistic regression, real + synthetic | 0.388 ± 0.122 | 0.125 ± 0.056 | 0.183 ± 0.073 | 0.35 ± 0.027 |
| Logistic regression, real + synthetic, missing-value flags | 0.324 ± 0.068 | 0.225 ± 0.03 | 0.263 ± 0.037 | 0.352 ± 0.015 |
| Same, threshold tuned inside the training rows | 0.292 ± 0.063 | 0.55 ± 0.108 | 0.378 ± 0.069 | 0.361 ± 0.028 |
| Current (synthetic-trained), scored on all 66 rows | 0.667 | 0.125 | 0.211 | 0.366 |

The current model never saw any real row, so it is scored on all of them; the retrained models are scored only on rows held out of their own training fold.

Saved as risk_model_real.joblib: Same, threshold tuned inside the training rows (best mean CV F1).
