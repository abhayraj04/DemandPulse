"""Inventory Intelligence Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Body
from backend.data.loader import get_data_loader
from backend.inventory.recommendations import get_inventory_recommendations
from backend.schemas.models import InventoryRecommendationRequest

router = APIRouter()


@router.post("/inventory/recommendations")
def post_inventory_recommendations(
    payload: InventoryRecommendationRequest = Body(...)
):
    """Calculates inventory replenishment recommendations based on user assumptions and demand forecasts."""
    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    result = get_inventory_recommendations(
        store=payload.store,
        lead_time_days=payload.lead_time_days,
        current_stock_override=payload.current_stock_override,
        target_service_level=payload.target_service_level,
        top_n_items=payload.top_n_items,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/inventory/recommendations")
def get_inventory_recommendations_get(
    store: int = Query(1, ge=1, le=10),
    lead_time_days: int = Query(7, ge=1, le=60),
    target_service_level: int = Query(95),
    top_n_items: int = Query(15, ge=1, le=50),
    current_stock_override: Optional[float] = Query(None, ge=0),
):
    """GET equivalent for fetching inventory recommendations."""
    store_val = store if isinstance(store, int) else 1
    lead_time_val = lead_time_days if isinstance(lead_time_days, int) else 7
    service_level_val = target_service_level if isinstance(target_service_level, int) else 95
    top_n_val = top_n_items if isinstance(top_n_items, int) else 15
    stock_override_val = current_stock_override if isinstance(current_stock_override, (int, float)) else None

    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    result = get_inventory_recommendations(
        store=store_val,
        lead_time_days=lead_time_val,
        current_stock_override=stock_override_val,
        target_service_level=service_level_val,
        top_n_items=top_n_val,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
