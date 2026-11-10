# Inventory Intelligence & Replenishment Methodology
## DemandVision AI: Statistical Supply Chain Analytics

### 1. The Inventory Optimization Problem

A forecasting model is only as valuable as the business decisions it enables. In retail operations, managers must balance two competing costs:
1. **Stockout Costs**: Lost revenue, lost customer goodwill, and empty shelves.
2. **Holding Costs**: Capital tie-up, warehousing costs, spoilage, and depreciation.

Because raw historical sales datasets (such as Kaggle Store Item Demand) contain sales transactions rather than internal warehouse inventory balances, supplier lead times, or purchase order records, DemandVision AI implements a transparent, configurable planning engine based on classic statistical inventory theory.

---

### 2. Core Mathematical Formulations

#### 1. Daily Demand Distribution
Let $d_1, d_2, \dots, d_n$ represent the daily forecast demand rates, with expected daily mean $\mu_d$ and daily standard deviation $\sigma_d$:
$$\mu_d = \frac{1}{n} \sum_{i=1}^n d_i, \quad \sigma_d = \sqrt{\frac{1}{n-1} \sum_{i=1}^n (d_i - \mu_d)^2}$$

#### 2. Statistical Safety Stock
Safety stock protects against stochastic demand surges during the replenishment lead time window ($L$ days):
$$\text{Safety Stock} = Z \times \sigma_d \times \sqrt{L}$$
Where $Z$ is the inverse standard normal cumulative distribution value corresponding to the user-selected cycle service level (CSL):
- $85\%$ Service Level: $Z = 1.04$
- $90\%$ Service Level: $Z = 1.28$
- $95\%$ Service Level (Default): $Z = 1.645$
- $98\%$ Service Level: $Z = 2.05$
- $99\%$ Service Level: $Z = 2.33$

#### 3. Lead Time Demand (LTD)
The expected cumulative units consumed while awaiting delivery from the supplier:
$$\text{LTD} = \mu_d \times L$$

#### 4. Reorder Point (ROP)
The inventory threshold that triggers an automated purchase requisition:
$$\text{ROP} = \text{LTD} + \text{Safety Stock} = (\mu_d \times L) + (Z \times \sigma_d \times \sqrt{L})$$

#### 5. Days of Inventory Remaining (DOIR)
Estimated duration before on-hand inventory is exhausted at current sales velocity:
$$\text{DOIR} = \frac{I_{\text{current}}}{\mu_d}$$

#### 6. Suggested Order Quantity (Order-Up-To Level)
When current inventory $I_{\text{current}} \le \text{ROP}$, the system calculates the replenishment order quantity to cover both the lead time and the operational review cycle period ($R = 30$ days):
$$\text{Target Level} = \text{LTD} + (\mu_d \times R) + \text{Safety Stock}$$
$$\text{Suggested Order} = \max(0, \text{Target Level} - I_{\text{current}})$$

---

### 3. Automated Risk Classification Matrix

The engine categorizes every SKU into four distinct operational states:

| Status Code | Condition | Priority | Automated Action Required |
| :--- | :--- | :--- | :--- |
| **`CRITICAL_STOCKOUT_RISK`** | $\text{DOIR} < L$ | Critical / High | Immediate expedited shipment or inter-store transfer; stockout will occur before standard supplier delivery arrives. |
| **`REORDER_REQUIRED`** | $I_{\text{current}} \le \text{ROP}$ | Medium | Standard purchase order creation for the suggested replenishment quantity. |
| **`HEALTHY`** | $\text{ROP} < I_{\text{current}} \le \text{Target Level}$ | Normal | Optimal inventory buffer; no procurement required. |
| **`EXCESS_INVENTORY`** | $\text{DOIR} > L + (2 \times R)$ | Low | Overstock notice; defer subsequent orders to reduce working capital tie-up. |

---

### 4. Recruiter & Interview Discussion Notes

- **Question**: *"Why not just keep safety stock equal to 10 days of average sales?"*
  - **Answer**: *"A flat day buffer ignores demand variance. A predictable product with low standard deviation requires much less safety stock than a volatile SKU with high demand spikes, even if their average daily sales are identical. The formula $Z \times \sigma_d \times \sqrt{L}$ mathematically accounts for variance and supplier lead time."*
- **Question**: *"Does the Kaggle dataset have warehouse inventory?"*
  - **Answer**: *"No, which is why our platform provides interactive parameters for supplier lead time and current stock. This transparent separation between known historical transactions and user-configured inventory parameters demonstrates supply chain domain knowledge rather than presenting arbitrary fake inventory numbers."*
