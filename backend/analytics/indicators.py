"""Statistical indicators and helper metrics for demand analysis.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List


def calculate_volatility_metrics(series: pd.Series) -> Dict[str, float]:
    """Calculates volatility indicators for a time series."""
    if len(series) < 2:
        return {"volatility": 0.0, "cv": 0.0, "skew": 0.0}
        
    mean = float(series.mean())
    std = float(series.std())
    cv = (std / mean) if mean > 0 else 0.0
    skew = float(series.skew()) if hasattr(series, "skew") else 0.0
    
    return {
        "mean": round(mean, 2),
        "std": round(std, 2),
        "cv": round(cv, 4),
        "skewness": round(skew, 2),
    }
