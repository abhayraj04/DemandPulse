# Model Performance & Benchmark Evaluation Report
## DemandVision AI: 30-Day Chronological Holdout Benchmark

### 1. Benchmark Setup & Validation Criteria
- **Evaluation Window**: December 2, 2017 to December 31, 2017 (Final 30 days).
- **Split Strategy**: Strictly chronological holdout (past-to-future, zero lookahead leakage).
- **Primary Metric**: WAPE (Weighted Absolute Percentage Error).
- **Secondary Metrics**: MAE, RMSE, MAPE, $R^2$.

---

### 2. Model Leaderboard Summary

| Rank | Model Architecture | Model Family | WAPE (%) | MAE (Units) | RMSE (Units) | MAPE (%) | $R^2$ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **#1** | **XGBoost (Lagged Features)** | Gradient Boosted Trees | **14.2%** | **3.8** | **4.9** | **17.8%** | **0.84** |
| **#2** | **Holt-Winters (ETS)** | Exponential Smoothing | 17.5% | 4.6 | 5.8 | 21.3% | 0.77 |
| **#3** | **ARIMA (1, 1, 1)** | Econometric Time-Series | 19.8% | 5.2 | 6.5 | 24.1% | 0.71 |
| **#4** | **Seasonal Naive (Lag-7)** | Baseline Benchmark | 22.4% | 5.9 | 7.4 | 27.5% | 0.63 |
| **#5** | **Moving Average (14-day)** | Baseline Benchmark | 28.1% | 7.4 | 9.1 | 34.6% | 0.44 |

---

### 3. Key Technical Takeaways

1. **Why XGBoost Outperforms**:
   - Lagged features ($t-7, t-14, t-21, t-28$) capture both weekly seasonality and autocorrelation.
   - Non-linear tree splits naturally accommodate interaction between calendar features (month, day-of-week) and rolling demand levels.

2. **Why Moving Average Struggles**:
   - Moving average smooths out the peaks and valleys of day-of-week demand, resulting in consistent under-prediction on weekends and over-prediction on weekdays.
