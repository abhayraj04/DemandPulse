# Exploratory Data Analysis (EDA) Summary Report
## DemandVision AI: Retail Sales Intelligence Findings

### 1. Dataset Dimensions & Completeness
- **Total Records**: 913,000 daily observations.
- **Timeline**: 2013-01-01 to 2017-12-31 (1,826 days).
- **Locations**: 10 distinct store locations.
- **Assortment**: 50 unique items.
- **Completeness**: 0 missing values, 0 duplicate rows, and continuous daily sequences.

---

### 2. Key Findings & Empirical Insights

1. **Top Stores & Sales Concentration**:
   - **Store #2** and **Store #8** are the highest revenue locations, generating ~13.7% and ~13.5% of total sales volume respectively.
   - **Store #7** is the lowest performing store (~7.7% of volume), indicating geographic footprint variance.

2. **SKU Velocity & Pareto Dynamics**:
   - **Item #15** and **Item #28** lead the product assortment with over 1.6 million units sold each.
   - Low-volume products like **Item #5** generate ~350,000 units over the 5-year period.

3. **Weekly Seasonality**:
   - Friday through Sunday shows a +32.4% uplift compared to Monday through Thursday baselines.
   - Saturday is the peak volume day across all 10 locations.

4. **Annual Seasonality & Troughs**:
   - Summer surge: Demand rises steadily from March, peaking in July (~2.9 million units chain-wide).
   - Winter trough: January and February exhibit annual troughs (~1.6 million units chain-wide).
