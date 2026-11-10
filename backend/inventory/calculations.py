"""Inventory Intelligence Calculations for DemandVision AI
Implements standard inventory formulas: Safety Stock, Reorder Point, and Stockout Risk.
All formulas are documented with statistical assumptions.
"""

import math
from typing import Dict, Any


SERVICE_LEVEL_Z = {
    85: 1.04,
    90: 1.28,
    95: 1.645,
    98: 2.05,
    99: 2.33,
}


def calculate_inventory_metrics(
    current_stock: float,
    lead_time_days: int,
    avg_daily_demand: float,
    daily_demand_std: float,
    target_service_level: int = 95,
    review_period_days: int = 30
) -> Dict[str, Any]:
    """Calculates inventory requirements, safety stock, and reorder triggers.
    
    Args:
        current_stock: Current on-hand inventory units.
        lead_time_days: Supplier delivery lead time in days.
        avg_daily_demand: Expected daily demand (from model forecast).
        daily_demand_std: Standard deviation of daily demand.
        target_service_level: Desired cycle service level percentage (e.g. 95%).
        review_period_days: Reorder review cycle horizon (e.g. 30 days).
        
    Returns:
        Dict with safety stock, reorder point, recommended order quantity, and risk state.
    """
    z_score = SERVICE_LEVEL_Z.get(target_service_level, 1.645)
    
    # 1. Safety Stock: Z * sigma_d * sqrt(LeadTime)
    safety_stock = z_score * daily_demand_std * math.sqrt(max(1, lead_time_days))
    safety_stock = round(safety_stock, 1)

    # 2. Lead Time Demand: avg_daily_demand * LeadTime
    lead_time_demand = round(avg_daily_demand * lead_time_days, 1)

    # 3. Reorder Point (ROP): Lead Time Demand + Safety Stock
    reorder_point = round(lead_time_demand + safety_stock, 1)

    # 4. Days of Inventory Remaining (DOIR)
    if avg_daily_demand > 0:
        days_remaining = round(current_stock / avg_daily_demand, 1)
    else:
        days_remaining = 999.0

    # 5. Suggested Reorder Quantity
    # Target maximum inventory = Lead time demand + Review period demand + Safety stock
    review_demand = avg_daily_demand * review_period_days
    order_up_to_level = lead_time_demand + review_demand + safety_stock
    
    if current_stock <= reorder_point:
        suggested_order = max(0.0, round(order_up_to_level - current_stock, 1))
    else:
        suggested_order = 0.0

    # 6. Risk Status & Alerts
    if days_remaining < lead_time_days:
        status = "CRITICAL_STOCKOUT_RISK"
        severity = "high"
        alert_message = (
            f"Stockout Imminent! Current inventory ({int(current_stock)} units) lasts ~{days_remaining} days, "
            f"which is less than supplier lead time ({lead_time_days} days). Stockout will occur before resupply."
        )
    elif current_stock <= reorder_point:
        status = "REORDER_REQUIRED"
        severity = "medium"
        alert_message = (
            f"Reorder Point Reached. Stock ({int(current_stock)} units) has fallen to or below ROP ({int(reorder_point)} units). "
            f"Place an order for ~{int(suggested_order)} units to maintain {target_service_level}% service level."
        )
    elif days_remaining > (lead_time_days + review_period_days * 2):
        status = "EXCESS_INVENTORY"
        severity = "low"
        alert_message = (
            f"Overstock Notice. Inventory ({int(current_stock)} units) covers {days_remaining} days of demand. "
            f"Consider reducing future order quantities to minimize holding costs."
        )
    else:
        status = "HEALTHY"
        severity = "normal"
        alert_message = (
            f"Inventory Level Optimal. Stock covers {days_remaining} days of demand, "
            f"well above the reorder point ({int(reorder_point)} units)."
        )

    return {
        "current_stock": current_stock,
        "lead_time_days": lead_time_days,
        "target_service_level": target_service_level,
        "z_score": z_score,
        "avg_daily_demand": round(avg_daily_demand, 2),
        "daily_demand_std": round(daily_demand_std, 2),
        "safety_stock": safety_stock,
        "lead_time_demand": lead_time_demand,
        "reorder_point": reorder_point,
        "days_of_inventory_remaining": days_remaining,
        "suggested_order_quantity": suggested_order,
        "status": status,
        "severity": severity,
        "alert_message": alert_message,
        "formulas_used": {
            "safety_stock": "Z * sigma_daily * sqrt(lead_time)",
            "reorder_point": "lead_time_demand + safety_stock",
            "suggested_order": "max(0, (lead_time_demand + cycle_demand + safety_stock) - current_stock)",
        }
    }
