"""Model Performance Center Endpoints
"""

from fastapi import APIRouter, Query, HTTPException
from backend.data.loader import get_data_loader
from backend.forecasting.validation import perform_walk_forward_validation

router = APIRouter()


@router.get("/models/performance")
def get_model_performance(
    store: int = Query(1, ge=1, le=10),
    item: int = Query(1, ge=1, le=50),
    horizon: int = Query(30, ge=7, le=90),
):
    """Executes chronological walk-forward validation and returns model comparison leaderboard."""
    store_val = store if isinstance(store, int) else 1
    item_val = item if isinstance(item, int) else 1
    horizon_val = horizon if isinstance(horizon, int) else 30

    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    df = loader.get_data(store=store_val, item=item_val)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available for selected store/item.")

    try:
        val_results = perform_walk_forward_validation(df, test_horizon=horizon_val)
        val_results["store"] = store_val
        val_results["item"] = item_val
        return val_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
