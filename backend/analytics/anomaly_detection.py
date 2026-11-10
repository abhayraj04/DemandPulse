"""Statistical Anomaly Detection Service for DemandVision AI
Identifies statistical outliers in daily retail sales transactions using rolling Z-scores
and moving window confidence thresholds.

Statistical Methodology:
1. Calculates 14-day rolling mean (μ_t) and rolling standard deviation (σ_t).
2. Derives Z-Score = (Actual - μ_t) / σ_t.
3. Classifies deviations:
   - |Z| >= 3.0: High Severity Anomaly (Critical Spike or Drop)
   - 2.5 <= |Z| < 3.0: Moderate Anomaly (Warning)
   - |Z| < 2.5: Normal transaction variance within confidence interval.

Language Rule:
"An unusual sales deviation was detected compared with the recent historical pattern."
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.data.loader import get_data_loader
from backend.data.catalog import get_product, get_store


def detect_sales_anomalies(
    store: Optional[int] = None,
    item: Optional[int] = None,
    window_days: int = 14,
    threshold_z: float = 2.5,
    limit: int = 50
) -> Dict[str, Any]:
    """Detects statistical sales anomalies across historical time series."""
    loader = get_data_loader()
    if not loader.is_available():
        return {"anomalies": [], "summary": {}}

    df = loader.get_data(store=store, item=item)
    if df.empty:
        return {"anomalies": [], "summary": {}}

    # Group by date if both store & item are filtered, or analyze aggregate daily series
    if store is not None and item is not None:
        daily_series = df.groupby("date", as_index=False)["sales"].sum().sort_values("date").reset_index(drop=True)
    elif item is not None:
        daily_series = df.groupby("date", as_index=False)["sales"].sum().sort_values("date").reset_index(drop=True)
    elif store is not None:
        daily_series = df.groupby("date", as_index=False)["sales"].sum().sort_values("date").reset_index(drop=True)
    else:
        # Chain-wide daily aggregated transactions
        daily_series = df.groupby("date", as_index=False)["sales"].sum().sort_values("date").reset_index(drop=True)

    # Rolling window statistics
    daily_series["rolling_mean"] = daily_series["sales"].rolling(window=window_days, min_periods=window_days // 2).mean()
    daily_series["rolling_std"] = daily_series["sales"].rolling(window=window_days, min_periods=window_days // 2).std().fillna(1.0)
    daily_series["rolling_std"] = daily_series["rolling_std"].replace(0, 1.0)

    daily_series["z_score"] = (daily_series["sales"] - daily_series["rolling_mean"]) / daily_series["rolling_std"]
    daily_series["expected_lower"] = np.maximum(0, daily_series["rolling_mean"] - (threshold_z * daily_series["rolling_std"]))
    daily_series["expected_upper"] = daily_series["rolling_mean"] + (threshold_z * daily_series["rolling_std"])

    # Filter anomaly rows
    anomaly_df = daily_series[daily_series["z_score"].abs() >= threshold_z].copy()
    anomaly_df["abs_z"] = anomaly_df["z_score"].abs()
    anomaly_df = anomaly_df.sort_values("abs_z", ascending=False).head(limit)

    anomalies: List[Dict[str, Any]] = []
    spike_count = 0
    drop_count = 0

    prod_info = get_product(item) if item else None
    store_info = get_store(store) if store else None

    for _, row in anomaly_df.iterrows():
        actual = float(row["sales"])
        expected = float(row["rolling_mean"])
        z = float(row["z_score"])
        dev_pct = ((actual - expected) / expected * 100.0) if expected > 0 else 0.0

        if z >= 3.0:
            severity = "Critical Spike"
            severity_badge = "rose"
            spike_count += 1
            direction = "positive"
        elif z <= -3.0:
            severity = "Critical Drop"
            severity_badge = "amber"
            drop_count += 1
            direction = "negative"
        elif z > 0:
            severity = "Moderate Spike"
            severity_badge = "cyan"
            spike_count += 1
            direction = "positive"
        else:
            severity = "Moderate Drop"
            severity_badge = "slate"
            drop_count += 1
            direction = "negative"

        anomalies.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "store_id": store,
            "store_name": store_info["name"] if store_info else "Chain-Wide Aggregated",
            "city": store_info["city"] if store_info else "National",
            "item_id": item,
            "product_id": prod_info.get("product_id", f"P0{item}") if prod_info else None,
            "product_name": prod_info["name"] if prod_info else "All Catalog SKUs",
            "actual_sales": int(round(actual)),
            "expected_mean": round(expected, 1),
            "expected_lower": round(float(row["expected_lower"]), 1),
            "expected_upper": round(float(row["expected_upper"]), 1),
            "z_score": round(z, 2),
            "deviation_pct": round(dev_pct, 1),
            "severity": severity,
            "severity_badge": severity_badge,
            "direction": direction,
            "explanation": (
                f"An unusual sales deviation of {dev_pct:+.1f}% was detected compared with the recent historical pattern "
                f"(Actual: {int(actual):,} units vs. Expected: {int(expected):,} units, Z: {z:+.2f})."
            ),
        })

    return {
        "store": store,
        "item": item,
        "window_days": window_days,
        "threshold_z": threshold_z,
        "summary": {
            "total_anomalies_detected": len(anomalies),
            "spikes_count": spike_count,
            "drops_count": drop_count,
            "max_z_score": round(float(anomaly_df["abs_z"].max()), 2) if not anomaly_df.empty else 0.0,
        },
        "anomalies": anomalies,
        "disclaimer": "An unusual sales deviation was detected compared with the recent historical pattern.",
    }
