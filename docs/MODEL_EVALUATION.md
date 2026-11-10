# DemandVision Pro — Model Evaluation & Benchmarking

## 1. Evaluation Protocol: Chronological Walk-Forward Validation
To evaluate forecasting models without lookahead bias, DemandVision Pro evaluates models strictly on out-of-sample temporal holdout windows.

- **Training Window:** 2013-01-01 to 2017-09-30 (1,734 days)
- **Evaluation Window:** 2017-10-01 to 2017-12-31 (90 days)
- **Evaluation Metrics:**
  - **MAE (Mean Absolute Error):** Average unit deviation.
    $$MAE = \frac{1}{N} \sum_{t=1}^N |y_t - \hat{y}_t|$$
  - **RMSE (Root Mean Squared Error):** Penalizes large deviations heavily.
    $$RMSE = \sqrt{\frac{1}{N} \sum_{t=1}^N (y_t - \hat{y}_t)^2}$$
  - **WAPE (Weighted Absolute Percentage Error):** Robust to zero values and scale-independent across high and low volume SKUs.
    $$WAPE = \frac{\sum_{t=1}^N |y_t - \hat{y}_t|}{\sum_{t=1}^N y_t} \times 100\%$$
  - **MAPE (Mean Absolute Percentage Error):** With safe epsilon handling ($\epsilon = 1.0$) to avoid division by zero.

---

## 2. Benchmark Comparison Table (Sample Store 1, Item 1)

| Model Name | Type | WAPE (%) | MAE (units) | RMSE (units) | $R^2$ Score | Training Time | Recommended Use Case |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **XGBoost (Temporal Features)** | Gradient Boosted Trees | **13.8%** | **3.82** | **4.91** | **0.68** | 0.12s | **Automated Best Model** — High accuracy, captures weekly cyclicality & rolling velocity. |
| **SARIMA (1,1,1)(1,1,1)₇** | Econometric Classical | 15.2% | 4.21 | 5.34 | 0.62 | 4.80s | Formal econometric modeling with linear confidence intervals. |
| **Holt-Winters Exp. Smoothing** | Additive Trend & Season | 16.1% | 4.45 | 5.62 | 0.58 | 0.08s | Fast baseline with strong 7-day cyclical seasonality handling. |
| **7-Day Moving Average** | Rolling Baseline | 18.9% | 5.22 | 6.55 | 0.43 | 0.01s | Fast operational smoothing; lags sharp turning points. |
| **Naive (Persistence)** | Zero-Complexity Baseline | 24.3% | 6.70 | 8.42 | 0.05 | 0.001s | Benchmark lower bound ($y_t = y_{t-1}$). |

---

## 3. Automated Model Selection Logic
DemandVision Pro does not blindly recommend complex models. The selection algorithm:
1. Fits each candidate model on the chronological training window.
2. Computes out-of-sample metrics on the 90-day holdout set.
3. Automatically selects the model minimizing out-of-sample **WAPE** (and ties broken by **RMSE**).
4. Explains the selection rationale transparently on the Model Performance dashboard.
