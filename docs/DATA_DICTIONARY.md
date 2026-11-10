# Data Dictionary & Dataset Documentation
## DemandVision AI: Kaggle Store Item Demand Forecasting Dataset

### 1. Dataset Overview

The dataset used across DemandVision AI is sourced from the official **Kaggle Store Item Demand Forecasting Challenge**:
- **Source URL**: [https://www.kaggle.com/competitions/demand-forecasting-kernels-only/data](https://www.kaggle.com/competitions/demand-forecasting-kernels-only/data)
- **Timeframe**: January 1, 2013 to December 31, 2017 (5 full calendar years, 1,826 days).
- **Entities**: 10 distinct retail store locations (`store`) and 50 unique consumer product SKUs (`item`).
- **Total Historical Observations**: Exactly 913,000 daily sales records (10 stores × 50 items × 1,826 days = 913,000 rows).
- **Target Variable**: Units sold per day (`sales`).

---

### 2. Schema Definition

| Column Name | Data Type | Description | Valid Range / Unique Values | Example |
| :--- | :--- | :--- | :--- | :--- |
| `date` | `datetime64[ns]` | Transaction calendar date of the recorded sales | `2013-01-01` to `2017-12-31` | `2013-01-01` |
| `store` | `int16` | Unique numeric identifier for the retail store location | Integers `1` through `10` | `1` |
| `item` | `int16` | Unique numeric identifier for the retail merchandise SKU | Integers `1` through `50` | `1` |
| `sales` | `float32` / `int` | Number of units sold on the given date at the given store | Integer `0` to `231` (Mean: 52.25) | `13` |

---

### 3. Data Integrity & Validation Audit

Running `backend/data/validator.py` executes an automated statistical validation audit:

- **Missing Values**: 0 across all 4 columns (0.0%).
- **Duplicate Rows**: 0 exact duplicates detected.
- **Negative Values**: 0 negative observations.
- **Zero Sales Days**: 1,304 records (0.14% of observations), correctly handled using epsilon smoothing in percentage error calculations.
- **Chronological Completeness**: Full continuity with 0 missing dates in the 5-year sequence.

---

### 4. Storage & Processing Strategy

1. **Raw Storage (`data/raw/`)**:
   - `data/raw/train.csv` (17.3 MB): Original uncompressed Kaggle training dataset. Left completely unaltered to ensure strict data lineage.
   - `data/raw/test.csv` (975 KB) and `sample_submission.csv` (394 KB).

2. **Processed Storage (`data/processed/`)**:
   - `train_clean.csv`: Cleaned, type-standardized, and chronologically ordered by `store`, `item`, and `date`.
   - `monthly_sales.csv`: Pre-aggregated monthly unit totals across each store-item pair (30,000 rows).
   - `daily_total_sales.csv`: Macro aggregated daily sales across the entire chain (1,826 rows).
   - `dataset_metadata.json`: Precomputed dataset statistics and boundaries for sub-millisecond API response times.
   - `data_quality_report.json`: Automated data validation audit report.
