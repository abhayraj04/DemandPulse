"""Forecast Service for DemandVision AI
Coordinates model training, forecasting, caching, and evaluation across models.
"""

from typing import Dict, Any, List, Optional
import time
import pandas as pd
import numpy as np

from backend.data.loader import get_data_loader
from backend.forecasting.baseline import NaiveForecaster, MovingAverageForecaster, ExponentialSmoothingForecaster
from backend.forecasting.arima_model import ARIMAForecaster
from backend.forecasting.xgboost_model import XGBoostForecaster
from backend.forecasting.evaluation import evaluate_forecast


AVAILABLE_MODELS = [
    {
        "id": "xgboost",
        "name": "XGBoost (Lagged Features)",
        "type": "Machine Learning",
        "description": "Gradient boosted decision trees using chronological lags (7, 14, 21, 28) and rolling statistics.",
        "recommended": True,
    },
    {
        "id": "arima",
        "name": "ARIMA (1, 1, 1)",
        "type": "Statistical Time-Series",
        "description": "Autoregressive Integrated Moving Average capturing autoregression and shock persistence.",
        "recommended": False,
    },
    {
        "id": "exponential_smoothing",
        "name": "Exponential Smoothing (ETS)",
        "type": "Statistical Time-Series",
        "description": "Holt-Winters exponential smoothing modeling additive level, trend, and 7-day seasonality.",
        "recommended": False,
    },
    {
        "id": "moving_average",
        "name": "Moving Average (14-day)",
        "type": "Baseline",
        "description": "Simple rolling average of the last 14 days of historical demand.",
        "recommended": False,
    },
    {
        "id": "naive",
        "name": "Seasonal Naive (Lag-7)",
        "type": "Baseline",
        "description": "Projects the exact day-of-week demand from 7 days prior as a baseline benchmark.",
        "recommended": False,
    },
]


class ForecastService:
    """Service to handle model selection, training, evaluation, and forecast generation."""
    
    def __init__(self):
        self._cache: Dict[str, Any] = {}
        
    def get_available_models(self) -> List[Dict[str, Any]]:
        return AVAILABLE_MODELS

    def generate_forecast(
        self,
        store: int = 1,
        item: int = 1,
        model_id: str = "xgboost",
        horizon: int = 30
    ) -> Dict[str, Any]:
        """Generates future forecast and historical context for a specific store and item."""
        cache_key = f"{store}_{item}_{model_id}_{horizon}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        loader = get_data_loader()
        df = loader.get_data(store=store, item=item)
        
        if df.empty:
            return {"error": f"No data found for Store {store}, Item {item}."}

        # Daily series sorted chronologically
        daily_df = df.groupby("date", as_index=False)["sales"].sum().sort_values("date").reset_index(drop=True)
        
        # Chronological holdout evaluation for recent metrics (e.g. past 30 days)
        eval_horizon = min(30, len(daily_df) // 4)
        train_eval = daily_df.iloc[:-eval_horizon]
        test_eval = daily_df.iloc[-eval_horizon:]
        
        # Select and train forecaster
        model_id_clean = model_id.lower().strip()
        start_time = time.time()
        
        if model_id_clean == "naive":
            model = NaiveForecaster(seasonal_lag=7).fit(daily_df.set_index("date")["sales"])
            # In-sample validation
            eval_model = NaiveForecaster(seasonal_lag=7).fit(train_eval.set_index("date")["sales"])
            eval_preds, _, _ = eval_model.predict(eval_horizon)
        elif model_id_clean == "moving_average":
            model = MovingAverageForecaster(window=14).fit(daily_df.set_index("date")["sales"])
            eval_model = MovingAverageForecaster(window=14).fit(train_eval.set_index("date")["sales"])
            eval_preds, _, _ = eval_model.predict(eval_horizon)
        elif model_id_clean == "exponential_smoothing":
            model = ExponentialSmoothingForecaster(seasonal_periods=7).fit(daily_df.set_index("date")["sales"])
            eval_model = ExponentialSmoothingForecaster(seasonal_periods=7).fit(train_eval.set_index("date")["sales"])
            eval_preds, _, _ = eval_model.predict(eval_horizon)
        elif model_id_clean == "arima":
            model = ARIMAForecaster(order=(1, 1, 1)).fit(daily_df.set_index("date")["sales"])
            eval_model = ARIMAForecaster(order=(1, 1, 1)).fit(train_eval.set_index("date")["sales"])
            eval_preds, _, _ = eval_model.predict(eval_horizon)
        else: # default xgboost
            model_id_clean = "xgboost"
            model = XGBoostForecaster(n_estimators=100, max_depth=4).fit(daily_df)
            eval_model = XGBoostForecaster(n_estimators=100, max_depth=4).fit(train_eval)
            eval_preds, _, _ = eval_model.predict(eval_horizon)

        train_time = round(time.time() - start_time, 3)
        metrics = evaluate_forecast(test_eval["sales"].values, eval_preds)

        # Future forecast
        future_preds, lower_bound, upper_bound = model.predict(horizon)
        last_date = daily_df["date"].max()
        future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, horizon + 1)]

        # Recent historical points for charting (last 90 days)
        history_slice = daily_df.tail(90)
        history_points = [
            {
                "date": row["date"].strftime("%Y-%m-%d"),
                "sales": round(float(row["sales"]), 1),
                "is_forecast": False
            }
            for _, row in history_slice.iterrows()
        ]

        # Future forecast points
        forecast_points = [
            {
                "date": f_date.strftime("%Y-%m-%d"),
                "predicted_sales": round(float(p), 1),
                "lower_bound": round(float(low), 1),
                "upper_bound": round(float(up), 1),
                "is_forecast": True
            }
            for f_date, p, low, up in zip(future_dates, future_preds, lower_bound, upper_bound)
        ]

        # Forecast summary statistics
        total_predicted_units = int(np.sum(future_preds))
        avg_predicted_daily = round(float(np.mean(future_preds)), 1)
        peak_predicted_daily = round(float(np.max(future_preds)), 1)

        # Financial unit economics enrichment
        from backend.data.catalog import get_product, get_store
        prod_meta = get_product(item)
        store_meta = get_store(store)

        predicted_revenue = round(total_predicted_units * prod_meta["unit_price"], 2)
        predicted_cost = round(total_predicted_units * prod_meta["unit_cost"], 2)
        predicted_gross_profit = round(predicted_revenue - predicted_cost, 2)

        result = {
            "store": store,
            "store_name": store_meta["name"],
            "item": item,
            "product_name": prod_meta["name"],
            "sku": prod_meta["sku"],
            "category": prod_meta["category"],
            "brand": prod_meta["brand"],
            "unit_price": prod_meta["unit_price"],
            "unit_cost": prod_meta["unit_cost"],
            "margin_pct": prod_meta["margin_pct"],
            "model_id": model_id_clean,
            "model_name": next((m["name"] for m in AVAILABLE_MODELS if m["id"] == model_id_clean), model_id_clean),
            "horizon_days": horizon,
            "forecast_date": last_date.strftime("%Y-%m-%d"),
            "training_time_seconds": train_time,
            "metrics": metrics,
            "summary": {
                "total_predicted_units": total_predicted_units,
                "avg_daily_forecast": avg_predicted_daily,
                "peak_daily_forecast": peak_predicted_daily,
                "predicted_revenue": predicted_revenue,
                "predicted_cost": predicted_cost,
                "predicted_gross_profit": predicted_gross_profit,
            },
            "history": history_points,
            "forecast": forecast_points,
            "combined_series": history_points + forecast_points,
            "disclaimer": "Forecasts are probabilistic mathematical estimates based on historical patterns, not guaranteed future outcomes."
        }
        
        self._cache[cache_key] = result
        return result


_forecast_service: Optional[ForecastService] = None

def get_forecast_service() -> ForecastService:
    global _forecast_service
    if _forecast_service is None:
        _forecast_service = ForecastService()
    return _forecast_service
