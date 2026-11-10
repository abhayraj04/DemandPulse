# DemandPulse
## Enterprise AI Retail Sales Forecasting & Inventory Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.32+-FF4B4B.svg)](https://streamlit.io/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Render](https://img.shields.io/badge/Render-Deployment_Ready-46E3B7.svg)](https://render.com/)
[![Tests](https://img.shields.io/badge/Tests-16%20Passed-10B981.svg)]()
[![Currency](https://img.shields.io/badge/Localization-INR%20%E2%82%B9-F59E0B.svg)]()

> **Predict Demand. Optimize Inventory. Mitigate Stockout Risks. Empower Enterprise Decision-Making.**

---

### Executive Overview

**DemandPulse** is an enterprise-grade retail sales forecasting and inventory intelligence platform. Built from the ground up as a production full-stack Data Science and Machine Learning application, it empowers retail planners, supply chain directors, and merchandising leads to uncover historical consumption patterns, predict future SKU-level customer demand with probabilistic confidence bounds, and execute automated, statistically sound replenishment decisions.

The application operates on the genuine **Kaggle Store Item Demand Forecasting Challenge** dataset (913,000 verified daily transactions across 10 stores and 50 products spanning 2013 to 2017) enriched with an **Indian Retail Localization Layer** (100 FMCG SKUs across 7 categories, 10 metro cities, configurable INR (₹) demonstration prices, and automated purchase order generation).

---

### 12 Production Dashboard Modules

| # | Module Name | Core Capabilities |
| :-: | :--- | :--- |
| **1** | **Executive Overview** | Composite Business Health Radar, INR (₹) Revenue Tracking, 5-Year Monthly Sales Area Chart, Product Intelligence Score Leaderboard, Demand & Inventory Risk Radar, and Statistical Anomaly Ticker. |
| **2** | **Sales Analytics** | Statistical distributions (Mean, Median, Std Dev, Variance, IQR), Day-of-Week Seasonality (Mon–Sun), 12-Month Annual Seasonality Curve, and Top 10 vs Bottom 10 SKU rankings. |
| **3** | **Time-Series Explorer** | Classical Decomposition into **Observed, Trend, Seasonal, and Residual components**, 7/30-day Rolling Moving Averages, Autocorrelation (ACF) & Partial Autocorrelation (PACF), and Augmented Dickey-Fuller (ADF) Stationarity Test. |
| **4** | **Demand Forecasting Lab** | Multi-model probabilistic forecasting over 7, 30, or 90 days. Interactive fan chart with 95% confidence intervals, **plus a 30-Day Forward Demand Calendar** displaying daily cards with peak spikes, weekend surges, and stockout exhaustion dates. |
| **5** | **What-If Simulation Lab** | Interactive stress-testing sandbox with scenario presets (Base, +10%, +20% Festive Surge, -10% Contraction) and real-time sliders for Demand Shock %, On-Hand Stock, Supplier Lead Time, Service Level, and Unit Price (₹) with financial delta recalculations. |
| **6** | **Demand Velocity Heatmap** | Multidimensional cross-tabulation matrix explorer: Products × Stores (50 SKUs across 10 cities), Day-of-Week × Month (Seasonality), and Stores × Month with glowing normalized cell intensity gradients. |
| **7** | **Inventory Intelligence** | User-configurable supplier lead times (3–30 days) and target service levels (85%–99%). Automated calculation of Safety Stock ($Z \times \sigma_d \times \sqrt{L}$), Reorder Points (ROP), Days Remaining, and instant CSV purchase order export in INR (₹). |
| **8** | **Product Catalog & Pricing** | Master catalog of 100 Indian FMCG SKUs (P001–P100), brand metadata, package sizes, forecast availability filters (`Available` vs `Catalog Only`), and instant modal price editor with persistent backend storage. |
| **9** | **Data Science & ML Lab** | Technical pipeline audit: 913,000-record quality audit (0 nulls, 0 duplicates), Chronological Walk-Forward zero-leakage diagram, interactive engineered feature matrix sample, and **XGBoost Feature Importance** explainability bar chart with analytical takeaways. |
| **10** | **Model Performance Center** | Cross-model leaderboard evaluating Naive, Moving Average, Holt-Winters Exponential Smoothing, SARIMA, and XGBoost on identical out-of-sample chronological holdout windows using WAPE, MAE, RMSE, MAPE, and $R^2$. |
| **11** | **AI Business Insights** | Rule-based decision intelligence engine translating real mathematical calculations into 7 categorized supply chain action signals (Growth, Decline, Seasonality, Anomaly, Risk, Model Performance). |
| **12** | **Dataset Management** | Interactive dataset status monitor, Kaggle dataset documentation, drag-and-drop CSV uploader, and automated 6-point data quality audit report. |

---

### Platform Architecture

DemandPulse is deployable as:
1. **ONE Web Service** on Render, Heroku, or Docker (bundling React 18 SPA + FastAPI REST API).
2. **Pure Python Interactive Streamlit App** (`streamlit_app.py`) for 1-click Streamlit Community Cloud deployment.

```
[Browser / Mobile Client]
       │
       │ HTTP / JSON Requests (Port 8000)
       ▼
[Single Web Service Instance]
       │
  ┌────┴────────────────────────────────────────┐
  │         FastAPI Web Application             │
  │                                             │
  │  ├── /api/health                            │
  │  ├── /api/overview                          │
  │  ├── /api/sales/*                           │
  │  ├── /api/timeseries/decomposition          │
  │  ├── /api/forecast & /api/forecast/calendar │
  │  ├── /api/catalog/products (100 SKUs)       │
  │  ├── /api/analytics/product-scores          │
  │  ├── /api/analytics/risks                   │
  │  ├── /api/analytics/anomalies               │
  │  ├── /api/analytics/heatmap                 │
  │  ├── /api/datascience/lab                   │
  │  ├── /api/inventory/recommendations         │
  │  └── /* ──> React 18 SPA Production Bundle  │
  └──────────────────┬──────────────────────────┘
                     │
         [In-Memory Data Loader]
                     │
     ┌───────────────┴───────────────┐
     ▼                               ▼
[Statistical & Decomposition]   [ML Engine & XGBoost]
- Statsmodels ARIMA (1,1,1)     - Lag Features (t-7, 14, 21, 28)
- Classical Decomposition       - Rolling Stats (Mean, Std)
- Holt-Winters Exp. Smoothing   - Recursive Multi-Step Horizon
- ADF Stationarity Test         - 95% Confidence Bounds
```

---

### Installation & Quick Start

#### Prerequisites
- Python 3.11+ (tested on Python 3.11, 3.12, 3.14)
- Node.js 18+ and npm

#### 1. Clone & Set Up Backend
```bash
git clone https://github.com/abhayraj04/DemandVision.git
cd DemandVision

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt
```

#### 2. Run Streamlit App Directly
```bash
streamlit run streamlit_app.py
```
*Opens interactive Streamlit interface on `http://localhost:8501`.*

#### 3. Or Build & Run Full-Stack FastAPI + React Web Service
```bash
# Build React Frontend
cd frontend
npm install
npm run build
cd ..

# Run Automated Backend Tests (16 passed)
python -m pytest tests/test_backend.py -v

# Start FastAPI Production Web Service
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Open **`http://127.0.0.1:8000`** in your browser. Interactive OpenAPI documentation is accessible at **`http://127.0.0.1:8000/api/docs`**.

---

### Cloud Deployment (Streamlit, Render & GitHub)

#### 1. Push to GitHub
```bash
git add .
git commit -m "feat: complete DemandPulse ready for deployment"
git branch -M main
git remote add origin https://github.com/abhayraj04/DemandVision.git
git push -u origin main
```
*A GitHub Actions CI workflow (`.github/workflows/ci.yml`) will automatically trigger, verifying the build and running the 16 unit tests on Ubuntu.*

#### 2. Deploy to Streamlit Community Cloud
1. Go to [share.streamlit.io](https://share.streamlit.io) and connect GitHub.
2. Select repository `abhayraj04/DemandVision`, branch `main`, and main file path `streamlit_app.py`.
3. Click **Deploy!**

#### 3. Deploy to Render (Blueprint)
1. Navigate to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Select your repository `abhayraj04/DemandVision`.
4. Render automatically reads [`render.yaml`](render.yaml), installs Python 3.11 & Node 20, runs [`build.sh`](build.sh), and starts the single-service app.
5. Click **Apply** to deploy live.

*See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Docker and manual deployment steps.*

---

### Key Formulas

1. **Safety Stock ($SS$):**
   $$SS = Z \times \sigma_d \times \sqrt{L}$$
   *(where $Z=1.65$ for 95% service level, $\sigma_d$ is daily standard deviation, $L$ is lead time in days)*

2. **Reorder Point ($ROP$):**
   $$ROP = (\bar{d} \times L) + SS$$

3. **Economic Order Quantity ($EOQ$):**
   $$EOQ = \sqrt{\frac{2 \times D \times S}{H}}$$

4. **Weighted Absolute Percentage Error ($WAPE$):**
   $$WAPE = \frac{\sum_{t=1}^N |y_t - \hat{y}_t|}{\sum_{t=1}^N y_t} \times 100\%$$

---

### Interview Preparation & Recruiter Walkthrough

When presenting DemandPulse in interviews, highlight these three technical achievements:

1. **Zero Data Leakage:** Explain why standard cross-validation destroys time-series validity and how chronological walk-forward splits preserve future out-of-sample purity.
2. **Feature Engineering & Explainability:** Discuss why 7-day autoregressive lags dominate retail demand (capturing weekly shopping patterns) and show how XGBoost feature importance validates this domain intuition.
3. **Closing the Loop from ML to Business Action:** Emphasize that raw forecasts are useless without inventory operationalization—show how predictions directly dictate safety stocks, reorder points, and automated purchase orders.

See [docs/PROJECT_STORY.md](docs/PROJECT_STORY.md) for the complete interview guide.
