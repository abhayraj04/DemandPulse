"""Forecasting and Time-Series Analytics Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from backend.data.loader import get_data_loader
from backend.analytics.time_series import compute_time_series_decomposition
from backend.forecasting.forecast_service import get_forecast_service

router = APIRouter()


@router.get("/timeseries/decomposition")
def get_decomposition(
    store: Optional[int] = Query(1),
    item: Optional[int] = Query(1),
    period: int = Query(7, ge=2, le=365),
    model_type: str = Query("additive", pattern="^(additive|multiplicative)$"),
):
    """Computes classical time series decomposition (Trend, Seasonality, Residuals)."""
    # Sanitize inputs if called directly outside FastAPI injection
    store_val = store if isinstance(store, int) else 1
    item_val = item if isinstance(item, int) else 1
    period_val = period if isinstance(period, int) else 7
    model_type_val = model_type if isinstance(model_type, str) and model_type in ["additive", "multiplicative"] else "additive"

    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    df = loader.get_data(store=store_val, item=item_val)
    if df.empty:
        raise HTTPException(status_code=404, detail="No observations found for specified filters.")

    result = compute_time_series_decomposition(df, period=period_val, model_type=model_type_val)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/forecast")
def get_forecast(
    store: int = Query(1, ge=1, le=10),
    item: int = Query(1, ge=1, le=50),
    model_id: str = Query("xgboost"),
    horizon: int = Query(30, ge=7, le=90),
):
    """Generates future sales forecast and prediction intervals for a store & item."""
    store_val = store if isinstance(store, int) else 1
    item_val = item if isinstance(item, int) else 1
    model_id_val = model_id if isinstance(model_id, str) else "xgboost"
    horizon_val = horizon if isinstance(horizon, int) else 30

    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    service = get_forecast_service()
    result = service.generate_forecast(store=store_val, item=item_val, model_id=model_id_val, horizon=horizon_val)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/forecast/models")
def get_forecasting_models():
    """Lists supported forecasting models with descriptions and metadata."""
    service = get_forecast_service()
    return {"models": service.get_available_models()}
