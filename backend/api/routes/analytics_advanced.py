"""Advanced Analytics Endpoints for DemandVision AI
Exposes Product Intelligence Scores, Anomaly Detection, Demand Heatmap matrices,
Forecast Calendar timelines, and Data Science Lab explainability metrics.
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from backend.analytics.product_intelligence import calculate_product_intelligence_scores
from backend.inventory.risk_engine import evaluate_demand_and_inventory_risks
from backend.analytics.anomaly_detection import detect_sales_anomalies
from backend.analytics.heatmap import generate_demand_heatmap
from backend.forecasting.calendar import generate_forecast_calendar
from backend.analytics.data_science_lab import get_data_science_lab_analytics

router = APIRouter()


@router.get("/analytics/product-scores")
def get_product_intelligence_scores_endpoint(
    store: Optional[int] = Query(None, description="Filter by Store ID (1-10)"),
    category: Optional[str] = Query(None, description="Filter by Category"),
):
    """Returns normalized 0-100 Product Intelligence Scores for catalog products."""
    scores = calculate_product_intelligence_scores(store=store, category=category)
    return {
        "total_scored": len(scores),
        "store": store,
        "category": category,
        "products": scores,
        "methodology": {
            "score_scale": "0 to 100",
            "components": [
                "Sales Growth Rate (0-25 pts)",
                "Demand Consistency (0-25 pts)",
                "Demand Volume Pace (0-20 pts)",
                "Sales Distribution Stability (0-15 pts)",
                "Inventory Predictability Alignment (0-15 pts)",
            ],
            "tiers": {
                "80-100": "High Opportunity",
                "60-79": "Strong Performance",
                "40-59": "Monitor",
                "0-39": "High Risk",
            },
        },
    }


@router.get("/analytics/risks")
def get_demand_and_inventory_risks_endpoint(
    store: Optional[int] = Query(1, ge=1, le=10, description="Store ID (1-10)"),
    lead_time_days: int = Query(7, ge=1, le=60, description="Supplier Lead Time in Days"),
    service_level: int = Query(95, ge=80, le=99, description="Target Service Level (e.g. 95)"),
    top_n: int = Query(25, ge=5, le=50, description="Top N SKUs to evaluate"),
):
    """Returns multi-factor inventory and demand risk classifications."""
    return evaluate_demand_and_inventory_risks(
        store=store,
        lead_time_days=lead_time_days,
        target_service_level=service_level,
        top_n_items=top_n
    )


@router.get("/analytics/anomalies")
def get_sales_anomalies_endpoint(
    store: Optional[int] = Query(None, description="Filter by Store ID (1-10)"),
    item: Optional[int] = Query(None, description="Filter by Item ID (1-50)"),
    window_days: int = Query(14, ge=7, le=60, description="Rolling window size in days"),
    threshold_z: float = Query(2.5, ge=1.5, le=5.0, description="Standard deviation Z-score threshold"),
    limit: int = Query(50, ge=10, le=200, description="Max anomalies to return"),
):
    """Returns statistical outliers detected via rolling Z-scores and confidence bands."""
    return detect_sales_anomalies(
        store=store,
        item=item,
        window_days=window_days,
        threshold_z=threshold_z,
        limit=limit
    )


@router.get("/analytics/heatmap")
def get_demand_heatmap_endpoint(
    matrix_type: str = Query("products_by_stores", pattern="^(products_by_stores|dow_by_month|store_by_month)$"),
    store: Optional[int] = Query(None, description="Filter by Store ID"),
    category: Optional[str] = Query(None, description="Filter by Category"),
):
    """Returns cross-tabulation matrix for demand heatmaps."""
    return generate_demand_heatmap(matrix_type=matrix_type, store=store, category=category)


@router.get("/forecast/calendar")
def get_forecast_calendar_endpoint(
    store: int = Query(1, ge=1, le=10),
    item: int = Query(1, ge=1, le=50),
    horizon: int = Query(30, ge=7, le=90),
    model_id: str = Query("xgboost"),
    stock_override: Optional[int] = Query(None, ge=0),
):
    """Returns day-by-day forward-looking forecast calendar and exhaustion checkpoints."""
    return generate_forecast_calendar(
        store=store,
        item=item,
        horizon_days=horizon,
        model_id=model_id,
        current_stock_override=stock_override
    )


@router.get("/datascience/lab")
def get_datascience_lab_endpoint(
    store: int = Query(1, ge=1, le=10),
    item: int = Query(1, ge=1, le=50),
):
    """Returns data quality audit, feature engineering pipeline, and XGBoost feature importance."""
    return get_data_science_lab_analytics(store=store, item=item)
