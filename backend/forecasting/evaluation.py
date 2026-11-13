"""Forecasting Evaluation Metrics for DemandVision AI
Computes MAE, RMSE, MAPE (with zero-protection), WAPE, and R2.
"""

from typing import Dict, Any, Union
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def evaluate_forecast(
    y_true: Union[np.ndarray, pd.Series, list],
    y_pred: Union[np.ndarray, pd.Series, list],
    epsilon: float = 1e-5
) -> Dict[str, float]:
    """Calculates standardized retail forecasting evaluation metrics.
    
    Args:
        y_true: Ground truth observed sales.
        y_pred: Predicted forecast values.
        epsilon: Constant to prevent division by zero in MAPE.
        
    Returns:
        Dict with MAE, RMSE, MAPE, WAPE, R2, and residual statistics.
    """
    actual = np.asarray(y_true, dtype=float)
    predicted = np.asarray(y_pred, dtype=float)
    
    # Clip negative predictions since retail sales cannot be negative
    predicted = np.clip(predicted, 0, None)
    
    if len(actual) == 0 or len(predicted) == 0:
        return {
            "mae": 0.0,
            "rmse": 0.0,
            "mape": 0.0,
            "wape": 0.0,
            "r2": 0.0,
            "mean_residual": 0.0,
            "std_residual": 0.0,
        }

    # Mean Absolute Error (MAE)
    mae = float(mean_absolute_error(actual, predicted))
    
    # Root Mean Squared Error (RMSE)
    rmse = float(np.sqrt(mean_squared_error(actual, predicted)))
    
    # Mean Absolute Percentage Error (MAPE) with zero handling
    # If actual == 0, replace denominator with epsilon
    denom = np.where(actual == 0, epsilon, actual)
    mape = float(np.mean(np.abs((actual - predicted) / denom)) * 100)
    
    # Weighted Absolute Percentage Error (WAPE)
    # Industry gold-standard: sum(|actual - pred|) / sum(actual) * 100
    sum_actual = float(np.sum(actual))
    if sum_actual > 0:
        wape = float((np.sum(np.abs(actual - predicted)) / sum_actual) * 100)
    else:
        wape = 0.0

    # Coefficient of Determination (R²)
    try:
        if np.var(actual) > 0:
            r2 = float(r2_score(actual, predicted))
        else:
            r2 = 0.0
    except Exception:
        r2 = 0.0

    # Residual analysis and tracking signal diagnostics
    residuals = actual - predicted
    mean_residual = float(np.mean(residuals))
    std_residual = float(np.std(residuals))
    cumulative_error = float(np.sum(residuals))

    # Tracking Signal = Cumulative Forecast Error / MAD (MAE)
    # Industry standard control limits are between -4.0 and +4.0
    if mae > 0:
        tracking_signal = float(cumulative_error / mae)
    else:
        tracking_signal = 0.0

    if tracking_signal >= 4.0:
        bias_status = "Under-Forecasting (Actuals > Forecasts)"
    elif tracking_signal <= -4.0:
        bias_status = "Over-Forecasting (Forecasts > Actuals)"
    else:
        bias_status = "Unbiased (Within ±4 MAD Control Limits)"

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2),
        "wape": round(wape, 2),
        "r2": round(r2, 4),
        "mean_residual": round(mean_residual, 2),
        "std_residual": round(std_residual, 2),
        "cumulative_error": round(cumulative_error, 2),
        "tracking_signal": round(tracking_signal, 2),
        "bias_status": bias_status,
    }
