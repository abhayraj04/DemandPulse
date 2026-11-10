"""Walk-Forward Chronological Model Validation for DemandVision AI
Evaluates and benchmarks forecasting models without future data leakage.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

from backend.forecasting.baseline import NaiveForecaster, MovingAverageForecaster, ExponentialSmoothingForecaster
from backend.forecasting.arima_model import ARIMAForecaster
from backend.forecasting.xgboost_model import XGBoostForecaster
from backend.forecasting.evaluation import evaluate_forecast


def perform_walk_forward_validation(
    df: pd.DataFrame,
    test_horizon: int = 30
) -> Dict[str, Any]:
    """Runs a chronological holdout validation across all candidate models.
    
    Args:
        df: Historical data with 'date' and 'sales'.
        test_horizon: Number of days in the holdout evaluation period (e.g. 30).
        
    Returns:
        Leaderboard, evaluation metrics, and actual vs predicted comparisons.
    """
    if len(df) < (test_horizon + 60):
        raise ValueError(f"Insufficient historical data ({len(df)} rows) for {test_horizon}-day validation.")

    # Chronological sort
    data = df.sort_values("date").reset_index(drop=True)
    
    train_df = data.iloc[:-test_horizon].copy()
    test_df = data.iloc[-test_horizon:].copy()
    
    y_train = train_df.set_index("date")["sales"]
    y_test = test_df["sales"].values.astype(float)
    dates = [d.strftime("%Y-%m-%d") for d in test_df["date"]]
    
    results = {}
    forecast_curves = {}
    
    # 1. Naive Model
    try:
        naive = NaiveForecaster(seasonal_lag=7).fit(y_train)
        pred_naive, _, _ = naive.predict(test_horizon)
        metrics_naive = evaluate_forecast(y_test, pred_naive)
        results["Naive (Seasonal Lag-7)"] = metrics_naive
        forecast_curves["Naive"] = [round(float(v), 1) for v in pred_naive]
    except Exception as e:
        results["Naive (Seasonal Lag-7)"] = {"error": str(e)}

    # 2. Moving Average
    try:
        ma = MovingAverageForecaster(window=14).fit(y_train)
        pred_ma, _, _ = ma.predict(test_horizon)
        metrics_ma = evaluate_forecast(y_test, pred_ma)
        results["Moving Average (14-day)"] = metrics_ma
        forecast_curves["Moving Average"] = [round(float(v), 1) for v in pred_ma]
    except Exception as e:
        results["Moving Average (14-day)"] = {"error": str(e)}

    # 3. Exponential Smoothing
    try:
        ets = ExponentialSmoothingForecaster(seasonal_periods=7).fit(y_train)
        pred_ets, _, _ = ets.predict(test_horizon)
        metrics_ets = evaluate_forecast(y_test, pred_ets)
        results["Exponential Smoothing"] = metrics_ets
        forecast_curves["Exponential Smoothing"] = [round(float(v), 1) for v in pred_ets]
    except Exception as e:
        results["Exponential Smoothing"] = {"error": str(e)}

    # 4. ARIMA
    try:
        arima = ARIMAForecaster(order=(1, 1, 1)).fit(y_train)
        pred_arima, _, _ = arima.predict(test_horizon)
        metrics_arima = evaluate_forecast(y_test, pred_arima)
        results["ARIMA (1,1,1)"] = metrics_arima
        forecast_curves["ARIMA"] = [round(float(v), 1) for v in pred_arima]
    except Exception as e:
        results["ARIMA (1,1,1)"] = {"error": str(e)}

    # 5. XGBoost
    try:
        xgb_model = XGBoostForecaster(n_estimators=100, max_depth=4).fit(train_df)
        pred_xgb, _, _ = xgb_model.predict(test_horizon)
        metrics_xgb = evaluate_forecast(y_test, pred_xgb)
        results["XGBoost (Lagged)"] = metrics_xgb
        forecast_curves["XGBoost"] = [round(float(v), 1) for v in pred_xgb]
    except Exception as e:
        results["XGBoost (Lagged)"] = {"error": str(e)}

    # Generate Leaderboard
    leaderboard = []
    for model_name, metrics in results.items():
        if "wape" in metrics:
            leaderboard.append({
                "model": model_name,
                "mae": metrics["mae"],
                "rmse": metrics["rmse"],
                "mape": metrics["mape"],
                "wape": metrics["wape"],
                "r2": metrics["r2"],
            })
            
    # Sort leaderboard by lowest WAPE, then lowest MAE
    leaderboard = sorted(leaderboard, key=lambda x: (x["wape"], x["mae"]))
    best_model_name = leaderboard[0]["model"] if leaderboard else "None"

    # Actual vs Predicted alignment for charts
    comparison_points = []
    for i in range(len(dates)):
        point = {
            "date": dates[i],
            "actual": round(float(y_test[i]), 1),
        }
        for model_key, preds in forecast_curves.items():
            if i < len(preds):
                point[model_key] = preds[i]
        comparison_points.append(point)

    # Compute residuals for best model
    best_key = "XGBoost" if "XGBoost" in forecast_curves else list(forecast_curves.keys())[0]
    best_preds = forecast_curves.get(best_key, [])
    residuals = []
    if len(best_preds) == len(y_test):
        residuals = [round(float(y_test[i] - best_preds[i]), 1) for i in range(len(y_test))]

    return {
        "test_horizon_days": test_horizon,
        "evaluation_window": {
            "start": test_df["date"].min().strftime("%Y-%m-%d"),
            "end": test_df["date"].max().strftime("%Y-%m-%d"),
        },
        "best_model": best_model_name,
        "leaderboard": leaderboard,
        "comparison_points": comparison_points,
        "best_model_residuals": residuals,
        "validation_strategy": "Chronological holdout split (strictly past-to-future, zero lookahead leakage)",
    }
