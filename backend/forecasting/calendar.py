"""Forecast Calendar & Forward-Looking Risk Timeline Service for DemandVision AI
Generates an operational day-by-day forecast schedule highlighting demand intensity,
high/low traffic days, and potential inventory exhaustion checkpoints.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.data.loader import get_data_loader
from backend.data.catalog import get_product, get_store
from backend.forecasting.forecast_service import get_forecast_service


def generate_forecast_calendar(
    store: int = 1,
    item: int = 1,
    horizon_days: int = 30,
    model_id: str = "xgboost",
    current_stock_override: Optional[int] = None
) -> Dict[str, Any]:
    """Generates a day-by-day forward forecast timeline with demand intensity flags."""
    service = get_forecast_service()
    forecast_res = service.generate_forecast(
        store=store,
        item=item,
        horizon=horizon_days,
        model_id=model_id
    )

    if "error" in forecast_res:
        return {"error": forecast_res["error"], "days": []}

    prod = get_product(item)
    st = get_store(store)

    forecast_points = forecast_res["forecast"]
    daily_preds = [p["predicted_sales"] for p in forecast_points]
    avg_pred = float(np.mean(daily_preds)) if daily_preds else 10.0
    p75_pred = float(np.percentile(daily_preds, 75)) if daily_preds else avg_pred * 1.15
    p25_pred = float(np.percentile(daily_preds, 25)) if daily_preds else avg_pred * 0.85

    # Determine starting inventory baseline
    if current_stock_override is not None:
        stock = int(current_stock_override)
    else:
        days_factor = 5 + (int(item) * 3) % 25
        stock = int(round(avg_pred * days_factor))

    running_stock = stock
    stockout_day: Optional[str] = None
    stockout_day_index: Optional[int] = None
    cumulative_demand = 0.0

    calendar_days: List[Dict[str, Any]] = []

    for idx, pt in enumerate(forecast_points, start=1):
        dt = pd.to_datetime(pt["date"])
        pred_units = pt["predicted_sales"]
        cumulative_demand += pred_units
        running_stock -= pred_units

        # Demand classification
        if pred_units >= p75_pred:
            intensity = "Peak Spike"
            intensity_badge = "amber"
        elif pred_units <= p25_pred:
            intensity = "Low Demand"
            intensity_badge = "slate"
        else:
            intensity = "Normal Demand"
            intensity_badge = "cyan"

        # Check for stockout breach
        is_stockout_risk = False
        if running_stock <= 0 and stockout_day is None:
            stockout_day = pt["date"]
            stockout_day_index = idx
            is_stockout_risk = True
        elif running_stock <= 0:
            is_stockout_risk = True

        calendar_days.append({
            "day_index": idx,
            "date": pt["date"],
            "day_name": dt.day_name(),
            "short_date": dt.strftime("%d %b"),
            "predicted_units": round(pred_units, 1),
            "lower_bound": pt["lower_bound"],
            "upper_bound": pt["upper_bound"],
            "cumulative_demand": round(cumulative_demand, 1),
            "projected_remaining_stock": max(0, int(round(running_stock))),
            "intensity": intensity,
            "intensity_badge": intensity_badge,
            "is_weekend": dt.dayofweek in [5, 6],
            "is_stockout_risk": is_stockout_risk,
        })

    return {
        "store": store,
        "store_name": st["name"],
        "city": st["city"],
        "item": item,
        "product_id": prod.get("product_id", f"P0{item}"),
        "product_name": prod["name"],
        "category": prod["category"],
        "brand": prod["brand"],
        "configured_price_inr": prod.get("configured_price_inr", prod["unit_price"]),
        "model_used": forecast_res["model_name"],
        "horizon_days": horizon_days,
        "starting_stock": stock,
        "total_forecast_units": forecast_res["summary"]["total_predicted_units"],
        "estimated_forecast_revenue_inr": round(
            forecast_res["summary"]["total_predicted_units"] * prod["unit_price"], 2
        ),
        "avg_daily_demand": forecast_res["summary"]["avg_daily_forecast"],
        "stockout_depletion_date": stockout_day,
        "stockout_days_from_today": stockout_day_index,
        "calendar_days": calendar_days,
        "disclaimer": (
            "Forecasts are probabilistic mathematical estimates based on historical patterns, not guaranteed future outcomes. "
            "Estimated based on configured demo prices."
        ),
    }
