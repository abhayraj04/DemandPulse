# DemandVision AI 
## Retail Sales Forecasting & Inventory Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF.svg)](https://vitejs.dev/)
[![Render](https://img.shields.io/badge/Render-Deployment_Ready-46E3B7.svg)](https://render.com/)
[![Tests](https://img.shields.io/badge/Tests-13%20Passed-10B981.svg)]()

> **Predict Demand. Optimize Inventory. Make Smarter Decisions.**

---

### Executive Overview

**DemandVision AI** is an enterprise-grade retail sales forecasting and inventory intelligence web platform. Built completely from scratch as a full-stack data science and machine learning application, it enables retail planners, supply chain directors, and store managers to understand historical sales dynamics, predict SKU-level future customer demand with confidence intervals, and execute automated, statistically sound replenishment decisions.

The application leverages the genuine **Kaggle Store Item Demand Forecasting Challenge** dataset (913,000 verified daily transactions across 10 stores and 50 products from 2013 to 2017) to deliver authentic, zero-fabrication predictive analytics.

---

### Key Capabilities & Business Questions Answered

1. **Volume & Leader Benchmarking**: Which retail locations and products drive the majority of store revenue?
2. **Growth Trajectory**: Are sales expanding or contracting across multi-year and month-over-month horizons?
3. **Weekly & Annual Seasonality**: What is the quantifiable weekend uplift vs. weekday baseline? What are peak summer surge months?
4. **Time-Series Decomposition**: How does underlying consumer trend separate from recurring seasonal cycles and irregular noise?
5. **Multi-Horizon Probabilistic Forecasting**: How many units of Item #15 will Store #2 sell over the next 7, 30, or 90 days?
6. **Model Leaderboard**: Which algorithm (XGBoost, ARIMA, Holt-Winters, Moving Average, Naive) performs best on out-of-sample holdout tests?
7. **Statistical Inventory Planning**: How much safety stock is required to maintain a 95% or 99% cycle service level?
8. **Stockout Risk Detection**: Which SKUs will stock out before supplier replenishment deliveries arrive?

---

### Platform Architecture

DemandVision AI is deployed as **ONE Web Service** on Render, bundling the React 18 production build inside FastAPI's static mount with SPA catch-all routing:

```
[Browser Client]
       │
       │ HTTP / JSON Requests (Port 8000)
       ▼
[Render Web Service]
       │
  ┌────┴────────────────────────────────────────┐
  │         FastAPI Single Web Application      │
  │                                             │
  │  ├── /api/health                            │
  │  ├── /api/overview                          │
  │  ├── /api/sales/*                           │
  │  ├── /api/timeseries/decomposition          │
  │  ├── /api/forecast & /api/models/*          │
  │  ├── /api/inventory/recommendations         │
  │  ├── /api/insights                          │
  │  └── /* ──> React SPA Production Build      │
  └──────────────────┬──────────────────────────┘
                     │
         [In-Memory Data Loader]
                     │
     ┌───────────────┴───────────────┐
     ▼                               ▼
[Statistical & Decomposition]   [ML Engine & XGBoost]
- Statsmodels ARIMA (1,1,1)     - Lag Features (7, 14, 21, 28)
- Classical Decomposition       - Rolling Statistics
- Holt-Winters Exp. Smoothing   - Recursive Multi-Step
- ADF Stationarity Test         - 95% Prediction Bounds
```

---

### 9 Functional Dashboard Modules

| # | Module Name | Core Features |
| :-: | :--- | :--- |
| **1** | **Executive Overview** | Real-time KPIs (Total units sold, average daily sales, top store, top SKU), 5-year monthly area trend, daily sales trajectory, and store comparative distributions. |
| **2** | **Sales Analytics** | Statistical distributions (Mean, Median, Std Dev, Variance, IQR, Skewness), Day-of-week seasonality (Mon–Sun), 12-month annual seasonality curve, and Top 5 vs Bottom 5 SKU rankings. |
| **3** | **Time-Series Explorer** | Classical seasonal decomposition into **Observed, Trend, Seasonal, and Residual components**, rolling averages (7-day, 30-day), Autocorrelation (ACF) & Partial Autocorrelation (PACF) lag analysis, and Augmented Dickey-Fuller (ADF) stationarity test. |
| **4** | **Demand Forecasting Lab** | Multi-model probabilistic forecasting for any Store and Item over 7, 30, or 90 days. Dynamic confidence interval fan charts ($95\%$ bounds), holdout accuracy metrics, and daily projection breakdown tables. |
| **5** | **Inventory Intelligence** | User-configurable supplier lead times (3–30 days) and target service levels ($85\%–99\%$). Automated calculation of Safety Stock ($Z \times \sigma_d \times \sqrt{L}$), Reorder Points (ROP), Days of Inventory Remaining, and automated Purchase Order suggestions. |
| **6** | **Model Performance Center** | Cross-model leaderboard evaluating XGBoost, ARIMA, ETS, Moving Average, and Seasonal Naive on identical chronological holdout windows using WAPE, MAE, RMSE, MAPE, and $R^2$. |
| **7** | **AI Business Insights** | Rule-based decision intelligence engine translating real analytical findings into tactical supply chain action items (Demand Surges, Volatility warnings, Stockout alarms). |
| **8** | **Dataset Management** | Interactive dataset status monitor, Kaggle dataset documentation, drag-and-drop CSV uploader, and automated 6-point data quality audit report. |
| **9** | **About Project** | Comprehensive architectural briefing, mathematical formula references, and technical recruiter guide. |

---

### Technology Stack

- **Frontend**:
  - React 18 with TypeScript
  - Vite 5 (Bundler & dev server)
  - Tailwind CSS (Enterprise dark navy design system)
  - Recharts (Responsive analytical charting)
  - Lucide React (Clean icon system)
- **Backend & Data Science**:
  - Python 3.11+ / 3.14
  - FastAPI & Uvicorn (Asynchronous REST API)
  - Pandas & NumPy (Data engineering & aggregation)
  - Statsmodels (ARIMA, Holt-Winters, Seasonal Decomposition, ADF test)
  - XGBoost (Gradient-boosted decision trees with recursive multi-step forecasting)
  - Scikit-learn (Evaluation metrics & validation)
  - Pydantic v2 (Strict schema validation)
  - Pytest (Automated test suite)
- **Deployment**:
  - Render (Single Web Service with `build.sh` and `render.yaml`)

---

### Dataset Details

- **Dataset**: Kaggle Store Item Demand Forecasting Challenge
- **Source**: [https://www.kaggle.com/competitions/demand-forecasting-kernels-only/data](https://www.kaggle.com/competitions/demand-forecasting-kernels-only/data)
- **Rows**: 913,000 verified observations
- **Columns**: `date` (YYYY-MM-DD), `store` (1–10), `item` (1–50), `sales` (Units sold)
- **Storage Strategy**:
  - `data/raw/`: Original unaltered raw CSVs (`train.csv`, `test.csv`, `sample_submission.csv`).
  - `data/processed/`: Standardized, chronologically sorted datasets (`train_clean.csv`, `monthly_sales.csv`, `daily_total_sales.csv`, `dataset_metadata.json`).

---

### Local Installation & Quickstart

#### Prerequisites
- Python 3.10+ (tested on Python 3.11, 3.12, 3.14)
- Node.js 18+ & npm 9+

#### 1. Clone Repository & Setup Virtual Environment
```bash
git clone https://github.com/abhayraj/DemandVision-AI.git
cd DemandVision-AI

# Create and activate Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
```

#### 2. Process the Kaggle Dataset
The raw Kaggle dataset is already stored in `data/raw/train.csv`. Process and generate the optimized cache:
```bash
python -m backend.data.processor
```

#### 3. Build the Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

#### 4. Run the Integrated Application
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser at:
- **Application Dashboard**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
- **System Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Running Automated Tests

Run the complete 13-point test suite covering validation, forecasting algorithms, inventory mathematics, and API endpoints:
```bash
python -m pytest tests/test_backend.py -v
```

---

### Render Single Web Service Deployment

DemandVision AI is configured for 1-click deployment on Render:

1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
3. Connect your repository.
4. Render will automatically detect `render.yaml` or you can configure:
   - **Environment**: `Python`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Click **Create Web Service**.

Detailed deployment documentation is available in [docs/DEPLOYMENT.md](file:///C:/Users/abhay/Downloads/DemandVision-AI-Starter/DemandVision-AI/docs/DEPLOYMENT.md).

---

### Technical Documentation Sitemap

- [System Architecture](file:///C:/Users/abhay/Downloads/DemandVision-AI-Starter/DemandVision-AI/docs/ARCHITECTURE.md)
- [Data Dictionary & Provenance](file:///C:/Users/abhay/Downloads/DemandVision-AI-Starter/DemandVision-AI/docs/DATA_DICTIONARY.md)
- [Forecasting Methodology & Zero Data Leakage](file:///C:/Users/abhay/Downloads/DemandVision-AI-Starter/DemandVision-AI/docs/FORECASTING_METHODOLOGY.md)
- [Inventory Replenishment Methodology](file:///C:/Users/abhay/Downloads/DemandVision-AI-Starter/DemandVision-AI/docs/INVENTORY_METHODOLOGY.md)
- [Render Deployment Guide](file:///C:/Users/abhay/Downloads/DemandVision-AI-Starter/DemandVision-AI/docs/DEPLOYMENT.md)

---

### License

This project is open-source under the MIT License. Historical sales dataset is sourced from the Kaggle Store Item Demand Forecasting Challenge for educational and portfolio demonstration.
