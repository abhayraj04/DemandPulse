"""Time-Series Analytics for DemandVision AI
Provides decomposition, rolling metrics, autocorrelation (ACF/PACF), and stationarity tests.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import acf, pacf, adfuller


def compute_time_series_decomposition(
    df: pd.DataFrame,
    period: int = 7,
    model_type: str = "additive"
) -> Dict[str, Any]:
    """Performs classical seasonal decomposition into Trend, Seasonality, and Residuals.
    
    Args:
        df: Filtered DataFrame containing date and sales.
        period: Seasonality frequency (7 for weekly cycle in daily data).
        model_type: 'additive' or 'multiplicative'.
        
    Returns:
        Dict with decomposed series and educational explanations.
    """
    if df.empty:
        return {"error": "No data available for decomposition"}
        
    # Aggregate to single continuous daily series
    daily = (
        df.groupby("date")["sales"]
          .sum()
          .asfreq("D")
          .ffill()
          .sort_index()
    )
    
    if len(daily) < (period * 2):
        return {"error": f"Need at least {period * 2} observations for seasonal decomposition."}

    # Ensure no zero/negative values if multiplicative
    if model_type == "multiplicative":
        if (daily <= 0).any():
            # Add small epsilon to avoid zero division in multiplicative model
            daily = daily + 0.001

    try:
        decomp = seasonal_decompose(daily, model=model_type, period=period, extrapolate_trend="freq")
    except Exception as e:
        # Fallback to additive
        decomp = seasonal_decompose(daily, model="additive", period=period, extrapolate_trend="freq")
        model_type = "additive"

    # Take the last 180 points for fast, readable display in the dashboard
    display_slice = slice(-180, None) if len(daily) > 180 else slice(None)
    
    dates = [d.strftime("%Y-%m-%d") for d in daily.index[display_slice]]
    observed_vals = [round(float(v), 2) for v in daily.values[display_slice]]
    trend_vals = [round(float(v), 2) if not np.isnan(v) else None for v in decomp.trend.values[display_slice]]
    seasonal_vals = [round(float(v), 2) for v in decomp.seasonal.values[display_slice]]
    resid_vals = [round(float(v), 2) if not np.isnan(v) else None for v in decomp.resid.values[display_slice]]

    # Rolling statistics over the full series
    rolling_7 = daily.rolling(window=7, min_periods=1).mean()
    rolling_30 = daily.rolling(window=30, min_periods=1).mean()
    rolling_std_7 = daily.rolling(window=7, min_periods=1).std().fillna(0)

    rolling_data = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "actual": round(float(act), 2),
            "ma_7": round(float(m7), 2),
            "ma_30": round(float(m30), 2),
            "std_7": round(float(s7), 2),
        }
        for d, act, m7, m30, s7 in zip(
            daily.index[display_slice],
            daily.values[display_slice],
            rolling_7.values[display_slice],
            rolling_30.values[display_slice],
            rolling_std_7.values[display_slice],
        )
    ]

    # Autocorrelation (ACF) and PACF (up to 30 lags)
    max_lags = min(30, len(daily) // 2 - 1)
    acf_values = acf(daily, nlags=max_lags, fft=True).tolist()
    pacf_values = pacf(daily, nlags=max_lags).tolist()
    
    acf_pacf_data = [
        {
            "lag": i,
            "acf": round(float(acf_values[i]), 3),
            "pacf": round(float(pacf_values[i]), 3),
        }
        for i in range(1, len(acf_values))
    ]

    # Stationarity test: Augmented Dickey-Fuller (ADF)
    try:
        adf_res = adfuller(daily.dropna())
        adf_stat = float(adf_res[0])
        p_val = float(adf_res[1])
        crit_vals = {k: float(v) for k, v in adf_res[4].items()}
        is_stationary = p_val < 0.05
    except Exception:
        adf_stat = 0.0
        p_val = 1.0
        crit_vals = {}
        is_stationary = False

    return {
        "model_type": model_type,
        "period": period,
        "sample_size": len(daily),
        "dates": dates,
        "observed": observed_vals,
        "trend": trend_vals,
        "seasonal": seasonal_vals,
        "residual": resid_vals,
        "rolling_metrics": rolling_data,
        "acf_pacf": acf_pacf_data,
        "stationarity": {
            "test_name": "Augmented Dickey-Fuller (ADF)",
            "test_statistic": round(adf_stat, 4),
            "p_value": round(p_val, 4),
            "is_stationary": is_stationary,
            "critical_values": crit_vals,
            "interpretation": (
                "The series is stationary (p < 0.05). Mean and variance are relatively stable over time."
                if is_stationary
                else "The series exhibits non-stationarity (p >= 0.05). Differencing or detrending is advised."
            )
        },
        "explanations": {
            "trend": "Reflects the long-term upward or downward movement in sales, smoothing out weekly spikes and random noise.",
            "seasonality": f"Captures periodic fluctuations that repeat every {period} days (e.g. higher weekend traffic vs. midweek lulls).",
            "residual": "The irregular, random noise component remaining after isolating the trend and seasonal patterns.",
            "acf": "Measures how current sales correlate with past sales at different day lags. Peaks at lag 7 indicate strong weekly cycles.",
        }
    }
