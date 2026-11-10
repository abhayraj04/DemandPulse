# System Architecture & Technical Design
## DemandVision AI: Retail Sales Forecasting & Inventory Intelligence Platform

### 1. High-Level System Architecture

DemandVision AI is engineered as a unified, high-performance web service combining an asynchronous Python REST API with a compiled React single-page application (SPA).

```
+-------------------------------------------------------------------------+
|                              Web Browser                                |
|  - Enterprise Dark Navy Theme (Tailwind CSS)                            |
|  - Real-time Recharts Interactive Visualizations                        |
|  - 9 Specialized Business Intelligence Modules                          |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTP / JSON (Port 8000)
                                     v
+------------------------------------+------------------------------------+
|                      Render Single Web Service                          |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                     FastAPI Application (ASGI)                    |  |
|  |                                                                   |  |
|  |   [Static Mount: /]             [/api/* REST Endpoints]           |  |
|  |   - Serves Vite React Build     - /api/health                     |  |
|  |   - SPA Fallback routing        - /api/overview                   |  |
|  |   - Serves /assets/* bundles    - /api/sales/*                    |  |
|  |                                 - /api/timeseries/*               |  |
|  |                                 - /api/forecast/*                 |  |
|  |                                 - /api/models/*                   |  |
|  |                                 - /api/inventory/*                |  |
|  |                                 - /api/insights                   |  |
|  |                                 - /api/dataset/*                  |  |
|  +-----------------------------------+-------------------------------+  |
|                                      |                                  |
|                                      v                                  |
|  +-------------------------------------------------------------------+  |
|  |                   Data Loader & Cache Layer (Singleton)          |  |
|  |   - In-memory DataFrame holding 913,000 clean records             |  |
|  |   - Fast dtype optimization (int16 stores/items, float32 sales)   |  |
|  |   - Precomputed monthly & daily aggregate tables                  |  |
|  +-------------------+-------------------------------+---------------+  |
|                      |                               |                  |
|                      v                               v                  |
|  +-----------------------+       +-----------------------------------+  |
|  |   Analytics Engine    |       |        Forecasting Engine         |  |
|  | - Trend & Seasonality |       | - Naive (Seasonal Lag-7)          |  |
|  | - Classical Decomp    |       | - Moving Average (14-day)         |  |
|  | - Rolling Volatility  |       | - ARIMA (1, 1, 1)                 |  |
|  | - ACF & PACF          |       | - Holt-Winters Exp. Smoothing     |  |
|  | - ADF Stationarity    |       | - XGBoost (Lagged recursive trees)|  |
|  +-----------------------+       +-----------------------------------+  |
|                      |                               |                  |
|                      +---------------+---------------+                  |
|                                      |                                  |
|                                      v                                  |
|  +-------------------------------------------------------------------+  |
|  |                     Supply Chain Intelligence                     |  |
|  | - Statistical Safety Stock: Z * sigma_d * sqrt(LeadTime)          |  |
|  | - Dynamic Reorder Point: Lead Time Demand + Safety Stock          |  |
|  | - Days of Inventory Remaining (DOIR) & Stockout Risk Warning      |  |
|  | - Rule-Based Automated AI Business Intelligence Engine            |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

### 2. Backend Architecture & Design Patterns

1. **Singleton Data Layer (`backend/data/loader.py`)**:
   - Loads the 913,000 historical rows on startup into memory.
   - Memory footprint is minimized (~30 MB) using compact datatypes: `int16` for Store IDs (1–10) and Item SKUs (1–50), and `float32` for sales quantities.
   - Slices filtered queries in sub-millisecond speeds.

2. **Modular Service Separation**:
   - `analytics/`: Pure statistical analysis and rolling indicators.
   - `forecasting/`: Model definitions adhering to a standard `fit(y) -> predict(horizon)` interface.
   - `inventory/`: Standard inventory math models with zero hardcoded business logic.
   - `insights/`: Rule-based evaluation generating actionable business recommendations.

3. **Single Web Service Deployment**:
   - Both the React frontend and FastAPI backend are built and packaged together.
   - When running on Render, only one free-tier web service is consumed, eliminating cross-origin CORS latency and multi-server costs.

---

### 3. Frontend Architecture

1. **Modular Page Architecture**:
   - 9 dedicated business intelligence views matching the enterprise specifications.
   - Global reactive filter state synchronized across tabs (`selectedStore`, `selectedItem`).
2. **Design System**:
   - Dark navy palette (`#0B0F19`, `#111827`, `#1E293B`) with emerald green positive signals and cyan/blue analytical curves.
   - Recharts responsive charts featuring custom tooltips, gradients, and legend styling.
3. **Data Integrity & Recruiter Safety**:
   - Every single statistic, metric card, and forecast chart maps 1:1 to genuine backend calculations.
   - No mock data or fake numbers.
