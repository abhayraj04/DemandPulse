"""Comprehensive QA and Integration Test Suite for DemandVision AI
Tests data validation, preprocessing, forecasting models, inventory formulas, and API routes.
"""

import pytest
import pandas as pd
import numpy as np

from backend.data.validator import validate_dataframe
from backend.forecasting.evaluation import evaluate_forecast
from backend.forecasting.baseline import NaiveForecaster, MovingAverageForecaster, ExponentialSmoothingForecaster
from backend.forecasting.arima_model import ARIMAForecaster
from backend.forecasting.xgboost_model import XGBoostForecaster
from backend.inventory.calculations import calculate_inventory_metrics
from backend.api.routes.health import get_health_status
from backend.api.routes.overview import get_executive_overview, get_dataset_status, get_dataset_quality_report
from backend.api.routes.sales import get_sales_trends, get_product_rankings, get_store_rankings, get_detailed_analytics
from backend.api.routes.forecasting import get_decomposition, get_forecast, get_forecasting_models
from backend.api.routes.models import get_model_performance
from backend.api.routes.inventory import get_inventory_recommendations_get
from backend.api.routes.insights import get_ai_insights


def test_health_endpoint():
    """Verifies that the health status returns healthy and app metadata."""
    res = get_health_status()
    assert res.status == "healthy"
    assert res.app_name in ("DemandPulse", "DemandVision Pro", "DemandVision AI")
    assert res.dataset_loaded is True


def test_data_validator_valid():
    """Verifies validator passes a correct retail DataFrame."""
    df = pd.DataFrame({
        "date": ["2017-01-01", "2017-01-02", "2017-01-03"],
        "store": [1, 1, 1],
        "item": [1, 1, 1],
        "sales": [10, 15, 20],
    })
    res = validate_dataframe(df)
    assert res["is_valid"] is True
    assert res["total_rows"] == 3
    assert res["sales_summary"]["total_units_sold"] == 45


def test_data_validator_invalid_columns():
    """Verifies validator flags missing columns."""
    df = pd.DataFrame({"date": ["2017-01-01"], "sales": [10]})
    res = validate_dataframe(df)
    assert res["is_valid"] is False
    assert len(res["missing_columns"]) > 0


def test_forecast_evaluation_metrics():
    """Verifies accurate calculation of MAE, RMSE, MAPE, WAPE, and R2."""
    actual = np.array([100.0, 120.0, 110.0, 90.0])
    pred = np.array([105.0, 115.0, 112.0, 88.0])
    metrics = evaluate_forecast(actual, pred)
    
    assert metrics["mae"] == 3.5
    assert metrics["rmse"] > 0
    assert metrics["wape"] == round((14.0 / 420.0) * 100, 2)
    assert metrics["r2"] > 0.8


def test_inventory_calculations():
    """Verifies safety stock, reorder point, and replenishment logic."""
    metrics = calculate_inventory_metrics(
        current_stock=50,
        lead_time_days=7,
        avg_daily_demand=20.0,
        daily_demand_std=5.0,
        target_service_level=95
    )
    # Lead time demand = 20 * 7 = 140
    # Safety stock = 1.645 * 5 * sqrt(7) ~ 21.76
    # ROP = 140 + 21.8 = 161.8
    assert metrics["lead_time_demand"] == 140.0
    assert metrics["safety_stock"] > 20.0
    assert metrics["reorder_point"] > 160.0
    assert metrics["status"] == "CRITICAL_STOCKOUT_RISK"
    assert metrics["suggested_order_quantity"] > 0


def test_forecasting_models_fit_and_predict():
    """Verifies all forecasting models fit and predict given horizons."""
    dates = pd.date_range("2017-01-01", periods=100, freq="D")
    sales = np.random.poisson(lam=30, size=100) + np.sin(np.linspace(0, 10, 100)) * 5
    series = pd.Series(sales, index=dates)
    df = pd.DataFrame({"date": dates, "sales": sales})

    # Naive
    naive = NaiveForecaster().fit(series)
    p_n, l_n, u_n = naive.predict(7)
    assert len(p_n) == 7
    assert (p_n >= 0).all()

    # Moving Average
    ma = MovingAverageForecaster().fit(series)
    p_m, l_m, u_m = ma.predict(7)
    assert len(p_m) == 7

    # Exponential Smoothing
    ets = ExponentialSmoothingForecaster().fit(series)
    p_e, _, _ = ets.predict(7)
    assert len(p_e) == 7

    # ARIMA
    arima = ARIMAForecaster().fit(series)
    p_a, _, _ = arima.predict(7)
    assert len(p_a) == 7

    # XGBoost
    xgb_forecaster = XGBoostForecaster(n_estimators=10).fit(df)
    p_x, _, _ = xgb_forecaster.predict(7)
    assert len(p_x) == 7


def test_api_overview_routes():
    """Verifies executive overview and dataset status calculations."""
    overview = get_executive_overview(store=1, item=1)
    assert "total_units_sold" in overview
    assert overview["total_units_sold"] > 0
    assert len(overview["monthly_trend"]) > 0

    status = get_dataset_status()
    assert status["dataset_available"] is True
    assert status["total_records"] == 913000

    report = get_dataset_quality_report()
    assert report["is_valid"] is True


def test_api_sales_routes():
    """Verifies sales trends, product rankings, and store distributions."""
    trends = get_sales_trends(store=1, item=1, granularity="monthly")
    assert len(trends["trends"]) > 0

    products = get_product_rankings(store=1, limit=10)
    assert len(products["products"]) == 10

    stores = get_store_rankings()
    assert len(stores["stores"]) == 10

    analytics = get_detailed_analytics(store=1, item=1)
    assert "summary_stats" in analytics
    assert len(analytics["weekly_pattern"]) == 7


def test_api_forecasting_and_decomposition():
    """Verifies time-series decomposition and forecast generation."""
    decomp = get_decomposition(store=1, item=1, period=7)
    assert len(decomp["dates"]) > 0
    assert "trend" in decomp
    assert "stationarity" in decomp

    models_list = get_forecasting_models()
    assert len(models_list["models"]) >= 4

    forecast_res = get_forecast(store=1, item=1, model_id="xgboost", horizon=14)
    assert len(forecast_res["forecast"]) == 14
    assert "metrics" in forecast_res
    assert forecast_res["metrics"]["wape"] > 0


def test_api_model_performance_leaderboard():
    """Verifies walk-forward chronological evaluation leaderboard."""
    perf = get_model_performance(store=1, item=1, horizon=14)
    assert "leaderboard" in perf
    assert len(perf["leaderboard"]) >= 3
    assert "best_model" in perf


def test_api_inventory_recommendations():
    """Verifies inventory recommendation output."""
    inv = get_inventory_recommendations_get(store=1, lead_time_days=7, target_service_level=95, top_n_items=5)
    assert "recommendations" in inv
    assert len(inv["recommendations"]) == 5
    assert inv["summary"]["total_items_analyzed"] == 5


def test_api_insights():
    """Verifies AI business insights extraction from real data."""
    res = get_ai_insights(store=1, item=1)
    assert "insights" in res
    assert len(res["insights"]) > 0
    assert "title" in res["insights"][0]


def test_indian_retail_catalog_and_stores():
    """Verifies 100 Indian products catalog, 10 Indian cities, and forecast availability."""
    from backend.data.catalog import get_all_products, get_product_by_id, get_all_stores, get_store
    prods = get_all_products()
    assert len(prods) == 100

    # P001 to P050 available
    p1 = get_product_by_id("P001")
    assert p1 is not None
    assert p1["name"] == "Aashirvaad Whole Wheat Atta"
    assert p1["brand"] == "Aashirvaad"
    assert p1["package_size"] == "5 kg"
    assert p1["category"] == "Staples"
    assert p1["forecast_availability"] == "Available"
    assert p1["configured_price_inr"] > 0

    # P051 to P100 catalog only
    p51 = get_product_by_id("P051")
    assert p51 is not None
    assert p51["name"] == "Coca-Cola"
    assert p51["forecast_availability"] == "Catalog Only"

    p100 = get_product_by_id("P100")
    assert p100 is not None
    assert p100["name"] == "Catch Black Pepper"
    assert p100["forecast_availability"] == "Catalog Only"

    # 10 Indian Store locations
    stores = get_all_stores()
    assert len(stores) == 10
    cities = {s["city"] for s in stores}
    expected_cities = {"Hyderabad", "Bengaluru", "Mumbai", "Delhi", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Patna"}
    assert cities == expected_cities


def test_update_demo_price():
    """Verifies configurable demo price updates dynamically recalculate."""
    from backend.data.catalog import update_product_price, get_product_by_id
    updated = update_product_price("P008", 35.0) # Tata Salt
    assert updated is not None
    assert updated["configured_price_inr"] == 35.0
    assert updated["unit_price"] == 35.0
    p = get_product_by_id("P008")
    assert p["configured_price_inr"] == 35.0


def test_advanced_analytics_endpoints():
    """Verifies product scores, risk engine, anomaly detection, heatmap, calendar, and data science lab."""
    from backend.analytics.product_intelligence import calculate_product_intelligence_scores
    from backend.inventory.risk_engine import evaluate_demand_and_inventory_risks
    from backend.analytics.anomaly_detection import detect_sales_anomalies
    from backend.analytics.heatmap import generate_demand_heatmap
    from backend.forecasting.calendar import generate_forecast_calendar
    from backend.analytics.data_science_lab import get_data_science_lab_analytics

    # 1. Product Intelligence Scores
    scores = calculate_product_intelligence_scores(store=1)
    assert len(scores) == 50
    assert 0.0 <= scores[0]["overall_score"] <= 100.0
    assert scores[0]["tier"] in ["High Opportunity", "Strong Performance", "Monitor", "High Risk"]
    assert "components" in scores[0]

    # 2. Risk Engine
    risks = evaluate_demand_and_inventory_risks(store=1, lead_time_days=7)
    assert "summary" in risks
    assert len(risks["items"]) > 0
    assert risks["items"][0]["risk_level"] in ["High Risk", "Medium Risk", "Low Risk"]

    # 3. Anomaly Detection
    anomalies = detect_sales_anomalies(store=1, item=1)
    assert "anomalies" in anomalies
    assert "summary" in anomalies

    # 4. Heatmap
    heatmap = generate_demand_heatmap(matrix_type="dow_by_month")
    assert len(heatmap["cells"]) == 84 # 7 days * 12 months
    assert "intensity" in heatmap["cells"][0]

    # 5. Forecast Calendar
    cal = generate_forecast_calendar(store=1, item=1, horizon_days=14)
    assert len(cal["calendar_days"]) == 14
    assert "intensity" in cal["calendar_days"][0]

    # 6. Data Science Lab
    lab = get_data_science_lab_analytics(store=1, item=1)
    assert "data_quality_audit" in lab
    assert lab["data_quality_audit"]["missing_values"] == 0
    assert len(lab["model_explainability"]["feature_importance"]) > 0


def test_frontend_dist_integration():
    """Verifies production frontend build and SPA assets exist."""
    from backend.config import FRONTEND_DIST_DIR
    assert FRONTEND_DIST_DIR.exists()
    index_file = FRONTEND_DIST_DIR / "index.html"
    assert index_file.exists()
    assert index_file.stat().st_size > 500
    assets_dir = FRONTEND_DIST_DIR / "assets"
    assert assets_dir.exists()
    css_files = list(assets_dir.glob("*.css"))
    js_files = list(assets_dir.glob("*.js"))
    assert len(css_files) > 0
    assert len(js_files) > 0
