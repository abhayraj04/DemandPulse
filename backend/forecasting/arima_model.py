"""ARIMA Forecasting Engine for DemandVision AI
Fits Autoregressive Integrated Moving Average models with confidence intervals.
"""

from typing import Tuple, Dict, Any, Optional
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA


class ARIMAForecaster:
    """ARIMA forecaster with automatic fallback and prediction interval generation."""
    
    def __init__(self, order: Tuple[int, int, int] = (1, 1, 1)):
        self.order = order
        self.fitted_model = None
        self.last_series = None
        self.std_err: float = 5.0
        
    def fit(self, y: pd.Series) -> "ARIMAForecaster":
        series = y.copy().astype(float)
        # Use last 365 observations for speed and relevance in retail demand
        if len(series) > 365:
            series = series.iloc[-365:]
        self.last_series = series
        
        try:
            model = ARIMA(series, order=self.order)
            self.fitted_model = model.fit()
            self.std_err = float(np.std(self.fitted_model.resid))
        except Exception as e:
            # Fallback to simple AR(1) or differenced model
            try:
                model = ARIMA(series, order=(1, 0, 0))
                self.fitted_model = model.fit()
                self.std_err = float(np.std(self.fitted_model.resid))
            except Exception:
                self.fitted_model = None
                self.std_err = float(np.std(series)) if len(series) > 1 else 5.0
        return self

    def predict(self, horizon: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if self.fitted_model is not None:
            try:
                forecast_res = self.fitted_model.get_forecast(steps=horizon)
                preds = np.array(forecast_res.predicted_mean)
                conf_int = forecast_res.conf_int(alpha=0.05)
                lower = np.array(conf_int.iloc[:, 0])
                upper = np.array(conf_int.iloc[:, 1])
            except Exception:
                last_val = float(self.last_series.iloc[-1]) if self.last_series is not None else 30.0
                preds = np.repeat(last_val, horizon)
                margin = 1.96 * self.std_err
                lower = preds - margin
                upper = preds + margin
        else:
            last_val = float(self.last_series.iloc[-1]) if self.last_series is not None else 30.0
            preds = np.repeat(last_val, horizon)
            margin = 1.96 * self.std_err
            lower = preds - margin
            upper = preds + margin

        preds = np.clip(preds, 0, None)
        lower = np.clip(lower, 0, None)
        upper = np.clip(upper, 0, None)
        return preds, lower, upper
