"""Inventory Intelligence & Data Export Endpoints for DemandPulse
"""

from typing import Optional
import io
import csv
from fastapi import APIRouter, Query, HTTPException, Body
from fastapi.responses import Response

from backend.data.loader import get_data_loader
from backend.inventory.recommendations import get_inventory_recommendations
from backend.inventory.abc_xyz import calculate_abc_xyz_analysis
from backend.forecasting.forecast_service import get_forecast_service
from backend.data.catalog import get_product, get_store
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


@router.get("/inventory/abc-xyz")
def get_abc_xyz_analysis_endpoint(
    store: Optional[int] = Query(None, description="Optional Store ID (1-10); None for national"),
):
    """Computes ABC-XYZ inventory segmentation (Pareto value & demand volatility matrix)."""
    store_val = store if isinstance(store, int) else None
    res = calculate_abc_xyz_analysis(store=store_val)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@router.get("/export/forecast-csv")
def export_forecast_csv_endpoint(
    store: int = Query(1, ge=1, le=10),
    item: int = Query(1, ge=1, le=50),
    horizon: int = Query(30, ge=7, le=90),
    model_id: str = Query("xgboost"),
):
    """Exports time series forecast points to a downloadable CSV file."""
    store_val = store if isinstance(store, int) else 1
    item_val = item if isinstance(item, int) else 1
    horizon_val = horizon if isinstance(horizon, int) else 30
    model_val = model_id if isinstance(model_id, str) else "xgboost"

    service = get_forecast_service()
    res = service.generate_forecast(store=store_val, item=item_val, model_id=model_val, horizon=horizon_val)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])

    prod = get_product(item_val)
    store_meta = get_store(store_val)
    unit_price = float(prod.get("unit_price", 100))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "date",
        "store_id",
        "store_name",
        "item_id",
        "product_id",
        "product_name",
        "category",
        "brand",
        "forecast_model",
        "predicted_sales_units",
        "lower_bound_95",
        "upper_bound_95",
        "unit_price_inr",
        "estimated_revenue_inr",
    ])

    for pt in res.get("forecast", []):
        pred = pt.get("predicted_sales", 0.0)
        writer.writerow([
            pt.get("date"),
            store_val,
            store_meta.get("city", f"Store {store_val}"),
            item_val,
            prod.get("product_id"),
            prod.get("name"),
            prod.get("category"),
            prod.get("brand"),
            res.get("model_name"),
            pred,
            pt.get("lower_bound", 0.0),
            pt.get("upper_bound", 0.0),
            unit_price,
            round(pred * unit_price, 2),
        ])

    csv_data = output.getvalue()
    filename = f"DemandPulse_Forecast_Store{store_val}_{prod.get('product_id', f'P{item_val}')}_{model_val}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/inventory-po-csv")
def export_inventory_po_csv_endpoint(
    store: int = Query(1, ge=1, le=10),
    lead_time_days: int = Query(7, ge=1, le=60),
    target_service_level: int = Query(95),
):
    """Exports inventory replenishment purchase orders to a downloadable CSV file."""
    store_val = store if isinstance(store, int) else 1
    lead_time_val = lead_time_days if isinstance(lead_time_days, int) else 7
    service_level_val = target_service_level if isinstance(target_service_level, int) else 95

    rec = get_inventory_recommendations(
        store=store_val,
        lead_time_days=lead_time_val,
        target_service_level=service_level_val,
        top_n_items=50,
    )
    if "error" in rec:
        raise HTTPException(status_code=400, detail=rec["error"])

    store_meta = get_store(store_val)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "product_id",
        "sku",
        "item_name",
        "brand",
        "category",
        "package_size",
        "store_id",
        "store_city",
        "current_stock",
        "avg_daily_demand",
        "safety_stock",
        "reorder_point",
        "days_inventory_left",
        "inventory_status",
        "severity",
        "suggested_order_qty",
        "unit_cost_inr",
        "unit_price_inr",
        "total_order_cost_inr",
        "revenue_at_risk_inr",
        "eoq",
    ])

    for it in rec.get("recommendations", []):
        writer.writerow([
            it.get("product_id"),
            it.get("sku"),
            it.get("item_name"),
            it.get("brand"),
            it.get("category"),
            it.get("package_size"),
            store_val,
            store_meta.get("city"),
            it.get("current_stock"),
            it.get("avg_daily_demand"),
            it.get("safety_stock"),
            it.get("reorder_point"),
            it.get("days_remaining"),
            it.get("status"),
            it.get("severity"),
            it.get("suggested_order"),
            it.get("unit_cost"),
            it.get("unit_price"),
            it.get("suggested_order_cost_inr"),
            it.get("revenue_at_risk_inr"),
            it.get("eoq"),
        ])

    csv_data = output.getvalue()
    filename = f"DemandPulse_Replenishment_PO_Store{store_val}_{store_meta.get('city')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/abc-xyz-csv")
def export_abc_xyz_csv_endpoint(
    store: Optional[int] = Query(None, description="Optional Store ID (1-10)"),
):
    """Exports the ABC-XYZ 9-segment categorization matrix to CSV."""
    store_val = store if isinstance(store, int) else None
    res = calculate_abc_xyz_analysis(store=store_val)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "item_id",
        "product_id",
        "product_name",
        "brand",
        "category",
        "package_size",
        "unit_price_inr",
        "total_units_sold",
        "total_revenue_inr",
        "cumulative_revenue_inr",
        "cumulative_percentage",
        "abc_class",
        "coefficient_of_variation_cv",
        "xyz_class",
        "segment",
        "segment_title",
        "replenishment_model",
        "priority_level",
        "supply_chain_strategy",
    ])

    for it in res.get("items", []):
        writer.writerow([
            it.get("item_id"),
            it.get("product_id"),
            it.get("product_name"),
            it.get("brand"),
            it.get("category"),
            it.get("package_size"),
            it.get("unit_price"),
            it.get("total_units"),
            it.get("total_revenue"),
            it.get("cumulative_revenue"),
            it.get("cumulative_percentage"),
            it.get("abc_class"),
            it.get("cv"),
            it.get("xyz_class"),
            it.get("segment"),
            it.get("segment_title"),
            it.get("replenishment_model"),
            it.get("priority"),
            it.get("strategy"),
        ])

    csv_data = output.getvalue()
    store_suffix = f"Store{store_val}" if store_val else "National"
    filename = f"DemandPulse_ABC_XYZ_Segmentation_{store_suffix}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
