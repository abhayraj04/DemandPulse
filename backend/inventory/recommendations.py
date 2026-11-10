"""Inventory Recommendations Service for DemandVision AI
Generates actionable inventory guidance across stores and products using forecast calculations.
"""

import math
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.data.loader import get_data_loader
from backend.data.catalog import get_product, get_store
from backend.inventory.calculations import calculate_inventory_metrics


def get_inventory_recommendations(
    store: Optional[int] = 1,
    lead_time_days: int = 7,
    current_stock_override: Optional[float] = None,
    target_service_level: int = 95,
    top_n_items: int = 15
) -> Dict[str, Any]:
    """Generates an inventory recommendation summary across items for a store enriched with real products."""
    store_val = store if isinstance(store, int) else 1
    loader = get_data_loader()
    df = loader.get_data(store=store_val)
    
    if df.empty:
        return {"error": f"No data found for Store {store_val}."}

    store_meta = get_store(store_val)
    items = sorted(df["item"].unique().tolist())
    recommendations: List[Dict[str, Any]] = []
    
    critical_count = 0
    reorder_count = 0
    healthy_count = 0
    total_suggested_reorder_units = 0
    total_suggested_reorder_cost = 0.0
    total_revenue_at_risk = 0.0
    total_working_capital = 0.0

    for item_id in items[:top_n_items]:
        prod = get_product(int(item_id))
        item_df = df[df["item"] == item_id].sort_values("date")
        recent_sales = item_df.tail(90)["sales"]
        
        avg_demand = float(recent_sales.mean())
        std_demand = float(recent_sales.std()) if len(recent_sales) > 1 else (avg_demand * 0.25)
        
        # Determine current stock
        if current_stock_override is not None:
            stock = float(current_stock_override)
        else:
            # Deterministic realistic stock level
            days_factor = 5 + (item_id * 3) % 25
            stock = round(avg_demand * days_factor)

        metrics = calculate_inventory_metrics(
            current_stock=stock,
            lead_time_days=lead_time_days,
            avg_daily_demand=avg_demand,
            daily_demand_std=std_demand,
            target_service_level=target_service_level
        )

        suggested_order = int(metrics["suggested_order_quantity"])
        order_cost = round(suggested_order * prod["unit_cost"], 2)
        stock_value = round(stock * prod["unit_cost"], 2)
        total_working_capital += stock_value

        # Calculate revenue at risk if critical stockout
        revenue_risk = 0.0
        if metrics["status"] == "CRITICAL_STOCKOUT_RISK":
            critical_count += 1
            gap_days = max(0.0, lead_time_days - metrics["days_of_inventory_remaining"])
            revenue_risk = round(gap_days * avg_demand * prod["unit_price"], 2)
            total_revenue_at_risk += revenue_risk
        elif metrics["status"] == "REORDER_REQUIRED":
            reorder_count += 1
        else:
            healthy_count += 1
            
        total_suggested_reorder_units += suggested_order
        total_suggested_reorder_cost += order_cost

        # Economic Order Quantity (EOQ): sqrt(2*D*S / H)
        # S = order setup cost (₹500 INR), H = annual holding cost (20% of unit cost)
        annual_demand = avg_demand * 365
        holding_cost_annual = max(1.0, prod["unit_cost"] * 0.20)
        eoq = round(math.sqrt((2 * annual_demand * 500) / holding_cost_annual))

        recommendations.append({
            "item_id": int(item_id),
            "product_id": prod.get("product_id", f"P{int(item_id):03d}"),
            "item_name": prod["name"],
            "sku": prod["sku"],
            "category": prod["category"],
            "brand": prod["brand"],
            "package_size": prod.get("package_size", "Standard Pack"),
            "unit_price": prod["unit_price"],
            "unit_cost": prod["unit_cost"],
            "margin_pct": prod["margin_pct"],
            "store_id": store_val,
            "current_stock": int(stock),
            "stock_value_usd": stock_value,
            "stock_value_inr": stock_value,
            "avg_daily_demand": metrics["avg_daily_demand"],
            "safety_stock": metrics["safety_stock"],
            "reorder_point": metrics["reorder_point"],
            "days_remaining": metrics["days_of_inventory_remaining"],
            "suggested_order": suggested_order,
            "suggested_order_cost_usd": order_cost,
            "suggested_order_cost_inr": order_cost,
            "revenue_at_risk_usd": revenue_risk,
            "revenue_at_risk_inr": revenue_risk,
            "eoq": eoq,
            "status": metrics["status"],
            "severity": metrics["severity"],
            "alert_message": metrics["alert_message"],
            "forecast_availability": prod.get("forecast_availability", "Available"),
        })

    # Sort so critical risks appear at top
    status_priority = {"CRITICAL_STOCKOUT_RISK": 0, "REORDER_REQUIRED": 1, "EXCESS_INVENTORY": 2, "HEALTHY": 3}
    recommendations.sort(key=lambda x: status_priority.get(x["status"], 4))

    return {
        "store": store_val,
        "store_name": store_meta["name"],
        "lead_time_days": lead_time_days,
        "target_service_level": target_service_level,
        "currency": "INR",
        "currency_symbol": "₹",
        "summary": {
            "total_items_analyzed": len(recommendations),
            "critical_stockout_risks": critical_count,
            "reorders_needed": reorder_count,
            "healthy_levels": healthy_count,
            "total_suggested_reorder_units": total_suggested_reorder_units,
            "total_suggested_reorder_cost_usd": round(total_suggested_reorder_cost, 2),
            "total_suggested_reorder_cost_inr": round(total_suggested_reorder_cost, 2),
            "total_revenue_at_risk_usd": round(total_revenue_at_risk, 2),
            "total_revenue_at_risk_inr": round(total_revenue_at_risk, 2),
            "total_working_capital_held_usd": round(total_working_capital, 2),
            "total_working_capital_held_inr": round(total_working_capital, 2),
        },
        "recommendations": recommendations,
        "disclaimer": (
            "Safety stock and reorder point calculations are derived from historical sales variance and user parameters. "
            "Estimated based on configured demo prices. Store locations and Indian product names illustrate enterprise inventory replenishment intelligence."
        )
    }
