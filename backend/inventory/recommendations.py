"""Inventory Recommendations Service for DemandVision AI
Generates actionable inventory guidance across stores and products using forecast calculations.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.data.loader import get_data_loader
from backend.inventory.calculations import calculate_inventory_metrics


def get_inventory_recommendations(
    store: Optional[int] = 1,
    lead_time_days: int = 7,
    current_stock_override: Optional[float] = None,
    target_service_level: int = 95,
    top_n_items: int = 15
) -> Dict[str, Any]:
    """Generates an inventory recommendation summary across items for a store."""
    loader = get_data_loader()
    df = loader.get_data(store=store)
    
    if df.empty:
        return {"error": f"No data found for Store {store}."}

    # Aggregate item statistics
    items = sorted(df["item"].unique().tolist())
    recommendations: List[Dict[str, Any]] = []
    
    critical_count = 0
    reorder_count = 0
    healthy_count = 0
    total_suggested_reorder_units = 0

    for item_id in items[:top_n_items]:
        item_df = df[df["item"] == item_id].sort_values("date")
        recent_sales = item_df.tail(90)["sales"]
        
        avg_demand = float(recent_sales.mean())
        std_demand = float(recent_sales.std()) if len(recent_sales) > 1 else (avg_demand * 0.25)
        
        # If user did not override current stock, simulate an operational stock level (e.g. 10-25 days of demand)
        if current_stock_override is not None:
            stock = float(current_stock_override)
        else:
            # Deterministic simulation based on item_id to give diverse, realistic statuses
            days_factor = 5 + (item_id * 3) % 25 # between 5 and 29 days
            stock = round(avg_demand * days_factor)

        metrics = calculate_inventory_metrics(
            current_stock=stock,
            lead_time_days=lead_time_days,
            avg_daily_demand=avg_demand,
            daily_demand_std=std_demand,
            target_service_level=target_service_level
        )
        
        if metrics["status"] == "CRITICAL_STOCKOUT_RISK":
            critical_count += 1
        elif metrics["status"] == "REORDER_REQUIRED":
            reorder_count += 1
        else:
            healthy_count += 1
            
        total_suggested_reorder_units += int(metrics["suggested_order_quantity"])

        recommendations.append({
            "item_id": int(item_id),
            "item_name": f"Item {int(item_id)}",
            "store_id": store,
            "current_stock": int(stock),
            "avg_daily_demand": metrics["avg_daily_demand"],
            "safety_stock": metrics["safety_stock"],
            "reorder_point": metrics["reorder_point"],
            "days_remaining": metrics["days_of_inventory_remaining"],
            "suggested_order": int(metrics["suggested_order_quantity"]),
            "status": metrics["status"],
            "severity": metrics["severity"],
            "alert_message": metrics["alert_message"],
        })

    # Sort so critical risks appear at the top
    status_priority = {"CRITICAL_STOCKOUT_RISK": 0, "REORDER_REQUIRED": 1, "EXCESS_INVENTORY": 2, "HEALTHY": 3}
    recommendations.sort(key=lambda x: status_priority.get(x["status"], 4))

    return {
        "store": store,
        "lead_time_days": lead_time_days,
        "target_service_level": target_service_level,
        "summary": {
            "total_items_analyzed": len(recommendations),
            "critical_stockout_risks": critical_count,
            "reorders_needed": reorder_count,
            "healthy_levels": healthy_count,
            "total_suggested_reorder_units": total_suggested_reorder_units,
        },
        "recommendations": recommendations,
        "disclaimer": (
            "Safety stock and reorder point calculations are derived from historical sales variance and user parameters. "
            "No native on-hand inventory exists in the Kaggle dataset; stock values represent user inputs or simulation."
        )
    }
