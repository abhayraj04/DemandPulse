"""ABC-XYZ Inventory Segmentation Analysis for DemandPulse
Industry-standard multi-criteria inventory categorization combining:
1. ABC Analysis: Revenue/value contribution (Pareto 80/15/5 rule).
2. XYZ Analysis: Demand predictability via Coefficient of Variation (CV = sigma / mu).

Provides a 9-quadrant supply chain policy matrix with tailored replenishment guidance.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.data.loader import get_data_loader
from backend.data.catalog import get_product, get_store


STRATEGY_DESCRIPTIONS = {
    "AX": {
        "title": "High Value, Constant Demand",
        "strategy": "Just-In-Time (JIT) automated replenishment with minimal safety buffer. High supplier collaboration.",
        "replenishment_model": "Automated Continuous Review",
        "priority": "Critical High",
    },
    "AY": {
        "title": "High Value, Fluctuating Demand",
        "strategy": "Machine Learning forecasting (XGBoost) with weekly dynamic safety buffer reviews.",
        "replenishment_model": "Periodic Review with ML Forecast",
        "priority": "High",
    },
    "AZ": {
        "title": "High Value, Erratic / Volatile",
        "strategy": "Close planner monitoring, strategic buffer stock, vendor-managed consignment, and scenario simulations.",
        "replenishment_model": "Dynamic Safety Buffer + Scenario Lab",
        "priority": "Urgent Watch",
    },
    "BX": {
        "title": "Medium Value, Constant Demand",
        "strategy": "Periodic automated reorder, standard EOQ batch sizes, and standard safety stocks.",
        "replenishment_model": "Economic Order Quantity (EOQ)",
        "priority": "Medium",
    },
    "BY": {
        "title": "Medium Value, Fluctuating Demand",
        "strategy": "Statistical time-series forecasting (ETS/ARIMA) with seasonal inventory adjustments.",
        "replenishment_model": "Seasonal Dynamic Buffer",
        "priority": "Medium",
    },
    "BZ": {
        "title": "Medium Value, Erratic / Volatile",
        "strategy": "Batch ordering with buffer against stockouts; maintain alert thresholds for demand spikes.",
        "replenishment_model": "Buffer-Stock Replenishment",
        "priority": "Medium Watch",
    },
    "CX": {
        "title": "Low Value, Constant Demand",
        "strategy": "Bulk ordering to minimize transaction costs; automated two-bin replenishment system with low management overhead.",
        "replenishment_model": "Two-Bin Automated System",
        "priority": "Routine Low",
    },
    "CY": {
        "title": "Low Value, Fluctuating Demand",
        "strategy": "Periodic reviews with economic batch purchasing; monitor for seasonal dead stock.",
        "replenishment_model": "Periodic Batch Purchase",
        "priority": "Routine",
    },
    "CZ": {
        "title": "Low Value, Erratic / Volatile",
        "strategy": "Minimal on-hand stock or order-on-demand; review for SKU rationalization to avoid capital lockup.",
        "replenishment_model": "Order-on-Demand / Rationalization",
        "priority": "Monitor / Cull",
    },
}


def calculate_abc_xyz_analysis(store: Optional[int] = None) -> Dict[str, Any]:
    """Computes comprehensive ABC-XYZ inventory segmentation across retail products."""
    loader = get_data_loader()
    if not loader.is_available():
        return {"error": "Dataset is currently unavailable."}

    df = loader.get_data(store=store)
    if df.empty:
        return {"error": f"No sales data found for store {store}."}

    store_meta = get_store(store) if store else {
        "name": "Pan-India Retail Network",
        "city": "All 10 Metro Hubs",
        "state": "National",
    }

    # Daily aggregation per item to calculate mean and volatility
    items = sorted(df["item"].unique().tolist())
    item_stats: List[Dict[str, Any]] = []

    for it in items:
        sub = df[df["item"] == it]
        daily_sales = sub.groupby("date")["sales"].sum()
        
        total_units = float(daily_sales.sum())
        mean_daily = float(daily_sales.mean()) if len(daily_sales) > 0 else 0.0
        std_daily = float(daily_sales.std()) if len(daily_sales) > 1 else 0.0
        
        # Coefficient of Variation (CV = sigma / mu)
        cv = (std_daily / mean_daily) if mean_daily > 0 else 0.0

        prod = get_product(int(it))
        unit_price = float(prod.get("unit_price", 100.0))
        total_revenue = total_units * unit_price

        item_stats.append({
            "item_id": int(it),
            "product_id": prod.get("product_id", f"P{it:03d}"),
            "product_name": prod.get("name", f"Item {it}"),
            "brand": prod.get("brand", "Generic"),
            "category": prod.get("category", "General"),
            "package_size": prod.get("package_size", "1 Unit"),
            "unit_price": unit_price,
            "unit_cost": float(prod.get("unit_cost", unit_price * 0.7)),
            "total_units": total_units,
            "avg_daily_demand": round(mean_daily, 2),
            "std_daily_demand": round(std_daily, 2),
            "cv": round(cv, 3),
            "total_revenue": round(total_revenue, 2),
        })

    # Sort descending by total revenue for ABC analysis
    item_stats.sort(key=lambda x: x["total_revenue"], reverse=True)
    total_network_revenue = sum(x["total_revenue"] for x in item_stats)

    cum_rev = 0.0
    for it in item_stats:
        cum_rev += it["total_revenue"]
        cum_pct = (cum_rev / total_network_revenue * 100.0) if total_network_revenue > 0 else 0.0
        it["cumulative_revenue"] = round(cum_rev, 2)
        it["cumulative_percentage"] = round(cum_pct, 2)

        # ABC Classification (80% / 15% / 5%)
        if cum_pct <= 80.0 or (it == item_stats[0]):
            it["abc_class"] = "A"
        elif cum_pct <= 95.0:
            it["abc_class"] = "B"
        else:
            it["abc_class"] = "C"

        # XYZ Classification (CV thresholds: X <= 0.35, Y <= 0.55, Z > 0.55)
        cv = it["cv"]
        if cv <= 0.35:
            it["xyz_class"] = "X"
            it["predictability"] = "High Predictability (Constant)"
        elif cv <= 0.55:
            it["xyz_class"] = "Y"
            it["predictability"] = "Medium Predictability (Variable)"
        else:
            it["xyz_class"] = "Z"
            it["predictability"] = "Low Predictability (Erratic)"

        segment = f"{it['abc_class']}{it['xyz_class']}"
        it["segment"] = segment
        meta_strat = STRATEGY_DESCRIPTIONS.get(segment, {})
        it["segment_title"] = meta_strat.get("title", "")
        it["strategy"] = meta_strat.get("strategy", "")
        it["replenishment_model"] = meta_strat.get("replenishment_model", "")
        it["priority"] = meta_strat.get("priority", "Standard")

    # 3x3 Matrix Grid Aggregation
    matrix_grid: Dict[str, Dict[str, Any]] = {}
    for abc in ["A", "B", "C"]:
        for xyz in ["X", "Y", "Z"]:
            seg = f"{abc}{xyz}"
            seg_items = [x for x in item_stats if x["segment"] == seg]
            seg_revenue = sum(x["total_revenue"] for x in seg_items)
            matrix_grid[seg] = {
                "segment": seg,
                "abc_class": abc,
                "xyz_class": xyz,
                "count": len(seg_items),
                "total_revenue": round(seg_revenue, 2),
                "revenue_share_pct": round((seg_revenue / total_network_revenue * 100.0), 2) if total_network_revenue > 0 else 0.0,
                "strategy": STRATEGY_DESCRIPTIONS.get(seg, {}).get("strategy", ""),
                "priority": STRATEGY_DESCRIPTIONS.get(seg, {}).get("priority", ""),
                "items": [
                    {
                        "product_id": x["product_id"],
                        "name": x["product_name"],
                        "cv": x["cv"],
                        "revenue": x["total_revenue"],
                    }
                    for x in seg_items[:5]
                ],
            }

    # Summary Breakdown
    a_items = [x for x in item_stats if x["abc_class"] == "A"]
    b_items = [x for x in item_stats if x["abc_class"] == "B"]
    c_items = [x for x in item_stats if x["abc_class"] == "C"]

    summary = {
        "total_skus": len(item_stats),
        "total_revenue_inr": round(total_network_revenue, 2),
        "abc_distribution": {
            "A": {
                "count": len(a_items),
                "pct_skus": round(len(a_items) / len(item_stats) * 100.0, 1),
                "revenue_inr": round(sum(x["total_revenue"] for x in a_items), 2),
                "revenue_share_pct": round(sum(x["total_revenue"] for x in a_items) / total_network_revenue * 100.0, 1),
            },
            "B": {
                "count": len(b_items),
                "pct_skus": round(len(b_items) / len(item_stats) * 100.0, 1),
                "revenue_inr": round(sum(x["total_revenue"] for x in b_items), 2),
                "revenue_share_pct": round(sum(x["total_revenue"] for x in b_items) / total_network_revenue * 100.0, 1),
            },
            "C": {
                "count": len(c_items),
                "pct_skus": round(len(c_items) / len(item_stats) * 100.0, 1),
                "revenue_inr": round(sum(x["total_revenue"] for x in c_items), 2),
                "revenue_share_pct": round(sum(x["total_revenue"] for x in c_items) / total_network_revenue * 100.0, 1),
            },
        },
        "xyz_distribution": {
            "X": len([x for x in item_stats if x["xyz_class"] == "X"]),
            "Y": len([x for x in item_stats if x["xyz_class"] == "Y"]),
            "Z": len([x for x in item_stats if x["xyz_class"] == "Z"]),
        },
    }

    return {
        "status": "success",
        "store": store,
        "store_meta": store_meta,
        "summary": summary,
        "matrix_grid": matrix_grid,
        "items": item_stats,
        "disclaimer": "ABC categorization derived from cumulative configured sales value. XYZ classification derived from historical coefficient of variation (CV). All revenues estimated based on configured demo prices.",
    }
