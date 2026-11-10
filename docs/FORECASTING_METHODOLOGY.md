# Forecasting Methodology & Machine Learning Architecture
## DemandVision AI: Time-Series Science & Validation

### 1. The Core Retail Demand Forecasting Problem

In retail merchandising and supply chain management, demand forecasting entails estimating future unit sales $\hat{y}_{t+h}$ over a multi-day horizon $h \in \{7, 30, 90\}$ given historical sales observations $y_1, y_2, \dots, y_t$.

Retail demand series are characterized by:
1. **Strong Day-of-Week Seasonality**: Higher sales on Friday, Saturday, and Sunday compared to midweek baselines.
2. **Annual Seasonality**: Peak retail demand occurring in summer months (June–August) and troughs in January–February.
3. **Multi-Year Macro Trend**: Organic customer growth over time.
4. **Idiosyncratic Noise**: Unscheduled promotions, weather shocks, and stock limitations.

---

### 2. Implemented Forecasting Model Architectures

DemandVision AI implements 5 distinct model families to provide a fair, rigorous comparative benchmark:

#### Model 1: Seasonal Naive Baseline (Lag-7)
- **Mathematical Formulation**:
  $$\hat{y}_{t+h} = y_{t+h - 7 \times \lceil h/7 \rceil}$$
- **Role**: Essential benchmark. Any machine learning model that fails to outperform seasonal persistence is not adding genuine predictive value.

#### Model 2: 14-Day Moving Average
- **Mathematical Formulation**:
  $$\hat{y}_{t+h} = \frac{1}{K} \sum_{i=0}^{K-1} y_{t-i} \quad \text{where } K = 14$$
- **Role**: Simple smoothing benchmark that tracks short-term changes in demand level.

#### Model 3: ARIMA (Autoregressive Integrated Moving Average)
- **Mathematical Formulation**:
  $$(1 - \sum_{i=1}^p \phi_i L^i) (1 - L)^d y_t = (1 + \sum_{j=1}^q \theta_j L^j) \epsilon_t$$
- **Configuration**: ARIMA(1, 1, 1). Captures stationary differenced autoregressive memory and moving average shocks.

#### Model 4: Holt-Winters Exponential Smoothing (ETS)
- **Mathematical Formulation**:
  Additive formulation decomposing the series into level ($\ell_t$), trend ($b_t$), and seasonal components ($s_t$ with period $m=7$):
  $$\hat{y}_{t+h} = \ell_t + h b_t + s_{t + h - m(k+1)}$$
- **Role**: Highly interpretable statistical benchmark modeling cyclical weekly waves.

#### Model 5: XGBoost with Chronologically Lagged Features (Recommended)
- **Feature Engineering Strategy**:
  - **Lagged Values**: $y_{t-7}, y_{t-14}, y_{t-21}, y_{t-28}$ (capturing past weekly cycles without data leakage).
  - **Rolling Statistics**: 7-day, 14-day, and 30-day rolling means and standard deviations computed strictly on shifted past series ($y_{t-1}$).
  - **Calendar Features**: Day of week, day of month, month of year, weekend binary flag.
- **Multi-Step Recursive Strategy**:
  Forecasts are generated recursively step-by-step: each day's prediction is fed back into the rolling feature window to forecast the subsequent day, ensuring strict chronological realism.
- **Empirical Prediction Intervals**:
  $$\hat{y}_{t+h} \pm 1.96 \cdot \sigma_{\text{resid}} \sqrt{1 + \frac{h}{2 H}}$$
  Provides 95% probabilistic confidence intervals that appropriately widen as the forecast horizon extends into the future.

---

### 3. Chronological Model Evaluation Metrics

Standard regression metrics like MSE or $R^2$ are often uninformative or misleading for intermittent retail time-series. We prioritize retail industry standards:

1. **WAPE (Weighted Absolute Percentage Error - Gold Standard)**:
   $$\text{WAPE} = \frac{\sum_{i=1}^n |y_i - \hat{y}_i|}{\sum_{i=1}^n y_i} \times 100$$
   Unlike MAPE, WAPE does not blow up when actual sales are 0 or near 0, weighting error proportionally to sales volume.

2. **MAE (Mean Absolute Error)**:
   $$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |y_i - \hat{y}_i|$$
   Directly interpretable as the average unit forecasting error per day.

3. **RMSE (Root Mean Squared Error)**:
   $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2}$$
   Penalizes large outlier forecast errors heavily, crucial for preventing severe under-ordering.

4. **MAPE (Mean Absolute Percentage Error)**:
   Computed with epsilon smoothing ($\epsilon = 10^{-5}$) to prevent division by zero:
   $$\text{MAPE} = \frac{100}{n} \sum_{i=1}^n \frac{|y_i - \hat{y}_i|}{\max(y_i, \epsilon)}$$

---

### 4. Zero Data Leakage Guarantee

In academic and real-world time-series forecasting, standard random K-Fold cross validation is mathematically invalid because future observations are used to predict past values. DemandVision AI enforces **chronological walk-forward holdout validation**, partitioning the dataset strictly by calendar date:
- Train: historical window $[t_0, T - h]$.
- Test: holdout window $[T - h + 1, T]$.
- Features for day $t$ only utilize data from days $\le t - 1$.
