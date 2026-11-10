"""Baseline and Statistical Forecasting Models for DemandVision AI
Includes Naive, Moving Average, and Exponential Smoothing forecasters.
"""

from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from backend.forecasting.evaluation import evaluate_forecast


class NaiveForecaster:
    """Naive baseline model: Projects the most recent observed sales (or 7-day seasonal lag) forward."""
    
    def __init__(self, seasonal_lag: int = 7):
        self.seasonal_lag = seasonal_lag
        self.last_values: np.ndarray = np.array([])
        self.last_value: float = 0.0
        self.std_err: float = 0.0
        
    def fit(self, y: pd.Series) -> "NaiveForecaster":
        values = y.values.astype(float)
        if len(values) == 0:
            return self
        self.last_value = float(values[-1])
        # Store last seasonal cycle for seasonal naive projection
        if len(values) >= self.seasonal_lag:
            self.last_values = values[-self.seasonal_lag:]
            # Compute empirical residual standard deviation
            diffs = values[self.seasonal_lag:] - values[:-self.seasonal_lag]
            self.std_err = float(np.std(diffs)) if len(diffs) > 0 else 5.0
        else:
            self.last_values = np.array([self.last_value])
            self.std_err = float(np.std(values)) if len(values) > 1 else 5.0
        return self

    def predict(self, horizon: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Predicts future points with 95% confidence intervals."""
        if len(self.last_values) == 0:
            preds = np.zeros(horizon)
        elif len(self.last_values) >= self.seasonal_lag:
            # Tile seasonal values
            repeats = (horizon // self.seasonal_lag) + 1
            preds = np.tile(self.last_values, repeats)[:horizon]
        else:
            preds = np.repeat(self.last_value, horizon)
            
        preds = np.clip(preds, 0, None)
        # Margin of error increases slightly with horizon
        margin = 1.96 * self.std_err * np.sqrt(np.linspace(1, 1.5, horizon))
        lower = np.clip(preds - margin, 0, None)
        upper = preds + margin
        return preds, lower, upper


class MovingAverageForecaster:
    """Moving Average baseline: Predicts the rolling mean of the last K days."""
    
    def __init__(self, window: int = 14):
        self.window = window
        self.ma_value: float = 0.0
        self.std_err: float = 0.0
        
    def fit(self, y: pd.Series) -> "MovingAverageForecaster":
        values = y.values.astype(float)
        if len(values) == 0:
            return self
        effective_window = min(self.window, len(values))
        self.ma_value = float(np.mean(values[-effective_window:]))
        residuals = values[-effective_window:] - self.ma_value
        self.std_err = float(np.std(residuals)) if len(residuals) > 1 else 5.0
        return self

    def predict(self, horizon: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        preds = np.repeat(self.ma_value, horizon)
        margin = 1.96 * self.std_err * np.sqrt(np.linspace(1, 1.4, horizon))
        lower = np.clip(preds - margin, 0, None)
        upper = preds + margin
        return preds, lower, upper


class ExponentialSmoothingForecaster:
    """Exponential Smoothing model using Holt-Winters / ETS for trend and seasonality."""
    
    def __init__(self, seasonal_periods: int = 7):
        self.seasonal_periods = seasonal_periods
        self.fitted_model = None
        self.std_err: float = 0.0
        
    def fit(self, y: pd.Series) -> "ExponentialSmoothingForecaster":
        series = y.copy().astype(float)
        # Fill missing if any
        series = series.asfreq("D").ffill().bfill()
        
        try:
            if len(series) >= (self.seasonal_periods * 2):
                model = ExponentialSmoothing(
                    series,
                    trend="add",
                    seasonal="add",
                    seasonal_periods=self.seasonal_periods,
                    initialization_method="estimated"
                )
            else:
                model = ExponentialSmoothing(series, trend="add", initialization_method="estimated")
            self.fitted_model = model.fit(optimized=True)
            self.std_err = float(np.std(self.fitted_model.resid)) if hasattr(self.fitted_model, "resid") else 5.0
        except Exception:
            # Fallback to simple mean if optimization fails
            self.fitted_model = None
            self.std_err = float(np.std(series)) if len(series) > 1 else 5.0
            self._fallback_mean = float(series.mean())
        return self

    def predict(self, horizon: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if self.fitted_model is not None:
            try:
                preds = np.array(self.fitted_model.forecast(horizon))
            except Exception:
                preds = np.repeat(getattr(self, "_fallback_mean", 30.0), horizon)
        else:
            preds = np.repeat(getattr(self, "_fallback_mean", 30.0), horizon)
            
        preds = np.clip(preds, 0, None)
        margin = 1.96 * self.std_err * np.sqrt(np.linspace(1, 1.5, horizon))
        lower = np.clip(preds - margin, 0, None)
        upper = preds + margin
        return preds, lower, upper
