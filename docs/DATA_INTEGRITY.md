# DemandVision Pro — Data Integrity & Localization Policy

## 1. Core Principle: Zero Synthetic Fabrication
DemandVision Pro never manufactures fake transactional sales data, synthetic random numbers, or artificial historical curves. All predictive models, exploratory data analytics, seasonality profiles, and inventory calculations derive directly from a verified 913,000-row public retail transaction dataset.

---

## 2. Dataset Architecture & Verification

| Property | Value | Verification Method |
| :--- | :--- | :--- |
| **Total Records** | 913,000 daily observations | `df.shape[0] == 913000` |
| **Date Span** | 2013-01-01 to 2017-12-31 (1,826 days) | Continuous daily frequency without temporal gaps |
| **Store Entities** | 10 distinct physical retail stores | IDs 1 through 10 |
| **Item Entities** | 50 distinct consumer product items | IDs 1 through 50 |
| **Data Completeness** | 100.0% (0 missing values, 0 duplicates) | Audited on server boot by `backend/data/validator.py` |

---

## 3. The Localization Layer (Indian Retail Context)

The underlying benchmark dataset utilizes generic numeric identifiers (`store: 1..10`, `item: 1..50`). To provide immediate business context for Indian retail supply chain analysis:

### Store Mapping
Stores are mapped to 10 prominent Indian commercial and metropolitan centers:
- Store 1: Hyderabad (Telangana)
- Store 2: Bengaluru (Karnataka)
- Store 3: Mumbai (Maharashtra)
- Store 4: Delhi (NCR)
- Store 5: Pune (Maharashtra)
- Store 6: Chennai (Tamil Nadu)
- Store 7: Kolkata (West Bengal)
- Store 8: Ahmedabad (Gujarat)
- Store 9: Jaipur (Rajasthan)
- Store 10: Patna (Bihar)

### Catalog Mapping (100 SKUs)
- **P001 to P050 (`Forecast Availability: Available`):** Mapped 1-to-1 to historical dataset items 1 through 50 across top Indian consumer categories:
  - Staples, Rice and Pulses (e.g., Aashirvaad Whole Wheat Atta, Daawat Basmati Rice)
  - Edible Oils, Ghee and Spices (e.g., Fortune Sunlite Refined Oil, Everest Turmeric)
  - Dairy, Breakfast and Bakery (e.g., Amul Taaza Milk, Britannia Good Day)
  - Beverages and Packaged Drinks (e.g., Tata Tea Premium, Red Bull)
  - Snacks, Biscuits and Confectionery (e.g., Lay's Classic Salted, Cadbury Dairy Milk)
  - Personal Care and Hygiene (e.g., Dettol Bathing Soap, Colgate Strong Teeth)
  - Home and Household Cleaning (e.g., Surf Excel Quick Wash, Vim Dishwash Liquid)
- **P051 to P100 (`Forecast Availability: Catalog Only`):** Extended master catalog items for supply chain planning and pricing configuration. These do not have historical transaction data and are cleanly labeled in the interface without fabricating sales.

---

## 4. Configurable Demonstration Pricing Policy
- Since the public benchmark dataset records volume units only, monetary revenues and stock values are calculated dynamically using:
  $$\text{Estimated Revenue} = \text{Sales Units} \times \text{Configured Demo Unit Price (₹ INR)}$$
- All prices are fully editable by the user in the **Product Catalog & Pricing Workspace** or via `POST /api/catalog/products/{product_id}/price`.
- Overridden prices are persisted to `data/processed/configured_prices.json` and immediately update executive summaries, forecasted revenues, and purchase order reorder values.
- **Mandatory User-Facing Notice:** Every monetary value generated using demonstration prices is labeled with:
  > *"Estimated based on configured demo prices"*
