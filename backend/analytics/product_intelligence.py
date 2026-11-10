"""Product Intelligence Score Engine for DemandVision AI
Calculates a transparent, reproducible, normalized 0-100 score for commercial products.

Scoring Components (Total = 100):
1. Sales Growth Rate (0-25 pts): 1-year sales velocity and momentum.
2. Demand Consistency (0-25 pts): Inverse of coefficient of variation (low volatility = high predictability).
3. Demand Volume Pace (0-20 pts): Percentile rank of daily unit volume across the retail catalog.
4. Sales Distribution Stability (0-15 pts): Low skewness and controlled outlier variance.
5. Inventory Health Alignment (0-15 pts): Low stockout vulnerability and healthy safety coverage.

Classification Tiers:
- 80–100: High Opportunity
- 60–79:  Strong Performance
- 40–59:  Monitor
- 0–39:   High Risk
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.data.loader import get_data_loader
from backend.data.catalog import get_product, get_all_products


def calculate_product_intelligence_scores(
    store: Optional[int] = None,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Calculates reproducible 0-100 Product Intelligence Scores for all available SKUs."""
    loader = get_data_loader()
    if not loader.is_available():
        return []

    df = loader.get_data(store=store)
    if df.empty:
        return []

    # Get max date to partition into recent 365 days vs prior 365 days
    max_date = df["date"].max()
    cutoff_1yr = max_date - pd.Timedelta(days=365)
    cutoff_2yr = max_date - pd.Timedelta(days=730)

    recent_df = df[df["date"] > cutoff_1yr]
    prior_df = df[(df["date"] > cutoff_2yr) & (df["date"] <= cutoff_1yr)]

    items = sorted(df["item"].unique().tolist())
    all_scores: List[Dict[str, Any]] = []

    # Pre-calculate catalog-wide volume distribution for relative percentile scoring
    item_recent_totals = recent_df.groupby("item")["sales"].sum().to_dict()
    volume_values = list(item_recent_totals.values())
    p25_vol = np.percentile(volume_values, 25) if volume_values else 1000
    p75_vol = np.percentile(volume_values, 75) if volume_values else 5000
    p95_vol = np.percentile(volume_values, 95) if volume_values else 10000

    for item_id in items:
        prod = get_product(int(item_id))
        if category and category != "all" and prod["category"].lower() != category.lower():
            continue

        item_recent = recent_df[recent_df["item"] == item_id]["sales"]
        item_prior = prior_df[prior_df["item"] == item_id]["sales"]

        recent_units = float(item_recent.sum()) if len(item_recent) > 0 else 1.0
        prior_units = float(item_prior.sum()) if len(item_prior) > 0 else 1.0

        # 1. Sales Growth Score (0 to 25)
        # Growth rate = (recent - prior) / prior
        growth_rate = ((recent_units - prior_units) / prior_units) if prior_units > 0 else 0.0
        # Normalize: -20% or less = 5 pts, 0% = 15 pts, +20% or more = 25 pts
        growth_score = float(np.clip(15.0 + (growth_rate * 50.0), 0.0, 25.0))

        # 2. Demand Consistency Score (0 to 25)
        mean_sales = float(item_recent.mean()) if len(item_recent) > 0 else 1.0
        std_sales = float(item_recent.std()) if len(item_recent) > 1 else 0.5
        cv = (std_sales / mean_sales) if mean_sales > 0 else 1.0
        # Lower CV is more consistent. CV of 0.25 -> ~22 pts, CV of 1.0 -> ~8 pts
        consistency_score = float(np.clip(25.0 * (1.0 - min(1.0, cv / 1.5)), 0.0, 25.0))

        # 3. Demand Volume Pace Score (0 to 20)
        # Scaled against 95th percentile
        vol_ratio = min(1.0, recent_units / p95_vol) if p95_vol > 0 else 0.5
        volume_score = float(np.clip(vol_ratio * 20.0, 0.0, 20.0))

        # 4. Sales Volatility & Skew Stability Score (0 to 15)
        # Measure IQR vs range dispersion
        q25 = float(item_recent.quantile(0.25)) if len(item_recent) > 0 else 1.0
        q75 = float(item_recent.quantile(0.75)) if len(item_recent) > 0 else 2.0
        max_s = float(item_recent.max()) if len(item_recent) > 0 else 3.0
        iqr = max(1.0, q75 - q25)
        spike_ratio = (max_s - q75) / iqr
        # Controlled spikes (ratio < 3.0) get full marks; erratic spikes lose points
        stability_score = float(np.clip(15.0 - max(0.0, (spike_ratio - 2.0) * 3.0), 0.0, 15.0))

        # 5. Inventory Health & Predictability Alignment (0 to 15)
        # Based on demand predictability enabling high service level at low safety buffer
        buffer_ratio = (std_sales * np.sqrt(7)) / (mean_sales * 7) if mean_sales > 0 else 0.5
        inventory_score = float(np.clip(15.0 * (1.0 - min(1.0, buffer_ratio)), 3.0, 15.0))

        total_score = round(growth_score + consistency_score + volume_score + stability_score + inventory_score, 1)
        total_score = float(np.clip(total_score, 0.0, 100.0))

        # Classification
        if total_score >= 80.0:
            tier = "High Opportunity"
            tier_badge = "emerald"
            summary_desc = "High volume velocity with steady demand consistency and strong growth trajectory."
        elif total_score >= 60.0:
            tier = "Strong Performance"
            tier_badge = "cyan"
            summary_desc = "Reliable demand profile with healthy turnover and predictable replenishment requirements."
        elif total_score >= 40.0:
            tier = "Monitor"
            tier_badge = "amber"
            summary_desc = "Moderate volatility or slowing growth. Requires active buffer monitoring."
        else:
            tier = "High Risk"
            tier_badge = "rose"
            summary_desc = "Erratic demand fluctuations or negative growth velocity. Prone to forecast error."

        all_scores.append({
            "item_id": int(item_id),
            "product_id": prod.get("product_id", f"P{item_id:03d}"),
            "product_name": prod["name"],
            "brand": prod["brand"],
            "category": prod["category"],
            "package_size": prod.get("package_size", "Standard Pack"),
            "configured_price_inr": prod.get("configured_price_inr", prod["unit_price"]),
            "overall_score": total_score,
            "tier": tier,
            "tier_badge": tier_badge,
            "summary_desc": summary_desc,
            "components": {
                "sales_growth": {
                    "score": round(growth_score, 1),
                    "max": 25,
                    "label": "Sales Growth Velocity",
                    "metric": f"{growth_rate * 100:+.1f}% YoY",
                },
                "demand_consistency": {
                    "score": round(consistency_score, 1),
                    "max": 25,
                    "label": "Demand Regularity (Inv. CV)",
                    "metric": f"CV: {cv:.2f}",
                },
                "volume_pace": {
                    "score": round(volume_score, 1),
                    "max": 20,
                    "label": "Volume Benchmark",
                    "metric": f"{int(recent_units):,} units/yr",
                },
                "stability": {
                    "score": round(stability_score, 1),
                    "max": 15,
                    "label": "Distribution Stability",
                    "metric": f"Spike Ratio: {spike_ratio:.1f}x",
                },
                "inventory_alignment": {
                    "score": round(inventory_score, 1),
                    "max": 15,
                    "label": "Predictability Alignment",
                    "metric": f"Buffer Ratio: {buffer_ratio:.2f}",
                },
            },
            "recent_annual_units": int(recent_units),
            "growth_rate_pct": round(growth_rate * 100, 1),
            "avg_daily_demand": round(mean_sales, 1),
        })

    # Sort descending by overall score
    all_scores.sort(key=lambda x: x["overall_score"], reverse=True)
    # Assign ranks
    for rank, item_data in enumerate(all_scores, start=1):
        item_data["rank"] = rank

    return all_scores
