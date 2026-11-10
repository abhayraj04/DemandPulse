"""Demand and Inventory Risk Engine for DemandVision AI
Multi-factor risk scoring and classification system for retail replenishment.

Risk Factors Evaluated:
1. Stockout Vulnerability: Current stock vs. Lead Time Demand (LTD) + Safety Stock.
2. Demand Volatility: Historical coefficient of variation (CV) indicating erratic purchase spikes.
3. Forecast Uncertainty: Dispersion in prediction intervals.
4. Momentum & Trend Decay: Deceleration in recent 30-day velocity.
5. Reorder Timing Exposure: Number of buffer days remaining before stockouts occur.

Classifications:
- High Risk: Stock depletes before shipment arrival or extreme demand dispersion.
- Medium Risk: Buffer approaches threshold; reorder required within 3-5 days.
- Low Risk: Inventory comfortably above reorder threshold with stable velocity.

Language Standard:
All alerts explicitly state:
"Potential stockout risk based on configured inventory assumptions."
"""

from typing import Dict, Any, List, Optional
import math
import numpy as np
import pandas as pd

from backend.data.loader import get_data_loader
from backend.data.catalog import get_product, get_store
from backend.inventory.calculations import calculate_inventory_metrics


def evaluate_demand_and_inventory_risks(
    store: Optional[int] = 1,
    lead_time_days: int = 7,
    target_service_level: int = 95,
    top_n_items: int = 25
) -> Dict[str, Any]:
    """Evaluates multi-factor inventory and demand risks across catalog items for a store."""
    store_val = store if isinstance(store, int) else 1
    loader = get_data_loader()
    df = loader.get_data(store=store_val)
    if df.empty:
        return {"items": [], "summary": {}}

    store_meta = get_store(store_val)
    items = sorted(df["item"].unique().tolist())[:top_n_items]

    evaluated_items: List[Dict[str, Any]] = []
    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0
    total_capital_at_risk = 0.0

    for item_id in items:
        prod = get_product(int(item_id))
        item_df = df[df["item"] == item_id].sort_values("date")
        recent_90 = item_df.tail(90)["sales"]
        recent_30 = item_df.tail(30)["sales"]
        prior_30 = item_df.iloc[-60:-30]["sales"]

        avg_daily_demand = float(recent_90.mean()) if len(recent_90) > 0 else 1.0
        daily_std = float(recent_90.std()) if len(recent_90) > 1 else (avg_daily_demand * 0.25)
        cv = (daily_std / avg_daily_demand) if avg_daily_demand > 0 else 1.0

        # Trend momentum
        mean_recent_30 = float(recent_30.mean()) if len(recent_30) > 0 else 1.0
        mean_prior_30 = float(prior_30.mean()) if len(prior_30) > 0 else 1.0
        momentum_pct = ((mean_recent_30 - mean_prior_30) / mean_prior_30 * 100.0) if mean_prior_30 > 0 else 0.0

        # Realistic current stock derivation
        days_factor = 5 + (int(item_id) * 3) % 25
        current_stock = int(round(avg_daily_demand * days_factor))

        inv_metrics = calculate_inventory_metrics(
            current_stock=current_stock,
            lead_time_days=lead_time_days,
            avg_daily_demand=avg_daily_demand,
            daily_demand_std=daily_std,
            target_service_level=target_service_level
        )

        days_remaining = inv_metrics["days_of_inventory_remaining"]
        rop = inv_metrics["reorder_point"]
        safety_stock = inv_metrics["safety_stock"]
        ltd = inv_metrics["lead_time_demand"]

        # Multi-factor Risk Scoring (0 to 100)
        # Factor A: Stock vs ROP (0 to 45 pts)
        stock_ratio = current_stock / rop if rop > 0 else 1.0
        if stock_ratio < 0.6:
            score_stock = 45.0
        elif stock_ratio < 1.0:
            score_stock = 30.0 + (1.0 - stock_ratio) * 35.0
        elif stock_ratio < 1.5:
            score_stock = 15.0 * (1.5 - stock_ratio)
        else:
            score_stock = 0.0

        # Factor B: Days of Supply vs Lead Time (0 to 30 pts)
        if days_remaining <= lead_time_days:
            score_timing = 30.0
        elif days_remaining <= (lead_time_days + 4):
            score_timing = 18.0
        else:
            score_timing = max(0.0, 10.0 - (days_remaining - lead_time_days))

        # Factor C: Demand Volatility CV (0 to 15 pts)
        score_volatility = min(15.0, cv * 12.0)

        # Factor D: Trend Momentum Risk (0 to 10 pts)
        score_trend = 10.0 if momentum_pct < -15.0 else (5.0 if momentum_pct < -5.0 else 0.0)

        total_risk_score = round(score_stock + score_timing + score_volatility + score_trend, 1)
        total_risk_score = float(np.clip(total_risk_score, 0.0, 100.0))

        # Risk Tier Classification
        if total_risk_score >= 65.0 or days_remaining < lead_time_days:
            risk_level = "High Risk"
            risk_badge = "rose"
            high_risk_count += 1
            explanation = (
                f"Current supply ({days_remaining:.1f} days) is insufficient for the {lead_time_days}-day supplier lead time window. "
                "Potential stockout risk based on configured inventory assumptions."
            )
            action = f"Generate emergency purchase order for {inv_metrics['suggested_order_quantity']} units immediately to avoid stockout."
            revenue_risk = round(max(0.0, lead_time_days - days_remaining) * avg_daily_demand * prod["unit_price"], 2)
            total_capital_at_risk += revenue_risk
        elif total_risk_score >= 35.0 or current_stock <= rop:
            risk_level = "Medium Risk"
            risk_badge = "amber"
            medium_risk_count += 1
            explanation = (
                f"Stock has breached the reorder threshold (ROP: {rop} units). "
                "Potential stockout risk based on configured inventory assumptions."
            )
            action = f"Schedule standard replenishment PO ({inv_metrics['suggested_order_quantity']} units) within the next 48 hours."
            revenue_risk = 0.0
        else:
            risk_level = "Low Risk"
            risk_badge = "emerald"
            low_risk_count += 1
            explanation = (
                f"Healthy inventory buffer ({days_remaining:.1f} days remaining). "
                "Demand pace is consistent with standard replenishment schedules."
            )
            action = "Maintain current supply monitoring; no procurement intervention required."
            revenue_risk = 0.0

        evaluated_items.append({
            "item_id": int(item_id),
            "product_id": prod.get("product_id", f"P{item_id:03d}"),
            "product_name": prod["name"],
            "brand": prod["brand"],
            "category": prod["category"],
            "package_size": prod.get("package_size", "Standard Pack"),
            "configured_price_inr": prod.get("configured_price_inr", prod["unit_price"]),
            "unit_cost_inr": prod.get("unit_cost_inr", prod["unit_cost"]),
            "risk_score": total_risk_score,
            "risk_level": risk_level,
            "risk_badge": risk_badge,
            "current_stock": current_stock,
            "safety_stock": safety_stock,
            "reorder_point": rop,
            "lead_time_demand": ltd,
            "days_remaining": days_remaining,
            "avg_daily_demand": round(avg_daily_demand, 1),
            "volatility_cv": round(cv, 2),
            "momentum_pct": round(momentum_pct, 1),
            "suggested_order": inv_metrics["suggested_order_quantity"],
            "reorder_cost_inr": round(inv_metrics["suggested_order_quantity"] * prod["unit_cost"], 2),
            "revenue_at_risk_inr": revenue_risk,
            "explanation": explanation,
            "recommended_action": action,
        })

    # Sort descending by risk score
    evaluated_items.sort(key=lambda x: x["risk_score"], reverse=True)

    return {
        "store": store_val,
        "store_name": store_meta["name"],
        "city": store_meta["city"],
        "lead_time_days": lead_time_days,
        "service_level": target_service_level,
        "summary": {
            "total_items_evaluated": len(evaluated_items),
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "total_revenue_at_risk_inr": round(total_capital_at_risk, 2),
            "overall_risk_index": round(
                sum(i["risk_score"] for i in evaluated_items) / len(evaluated_items), 1
            ) if evaluated_items else 0.0,
        },
        "items": evaluated_items,
        "disclaimer": (
            "Potential stockout risk based on configured inventory assumptions. "
            "Inventory counts represent configurable simulation inputs."
        ),
    }
