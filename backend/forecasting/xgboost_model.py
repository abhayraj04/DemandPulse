"""XGBoost Forecasting Engine for DemandVision AI
Constructs lagged and calendar features and performs recursive multi-step forecasting.
Guarantees chronological feature engineering without lookahead leakage.
"""

from typing import Tuple, Dict, Any, List, Optional
import numpy as np
import pandas as pd
import xgboost as xgb


class XGBoostForecaster:
    """Gradient boosted tree forecaster using engineered time-series features."""
    
    def __init__(self, n_estimators: int = 100, max_depth: int = 4, learning_rate: float = 0.05):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.model: Optional[xgb.XGBRegressor] = None
        self.last_history: Optional[pd.DataFrame] = None
        self.feature_names: List[str] = []
        self.std_err: float = 5.0
        
    @staticmethod
    def create_features(df: pd.DataFrame) -> pd.DataFrame:
        """Engineers lagged, rolling, and calendar features chronologically.
        
        Args:
            df: DataFrame containing 'date' and 'sales' sorted chronologically.
            
        Returns:
            DataFrame with engineered feature columns.
        """
        data = df.copy().sort_values("date").reset_index(drop=True)
        
        # Calendar features
        data["day_of_week"] = data["date"].dt.dayofweek
        data["day_of_month"] = data["date"].dt.day
        data["month"] = data["date"].dt.month
        data["is_weekend"] = (data["day_of_week"] >= 5).astype(int)
        
        # Lagged features (past observations only)
        for lag in [7, 14, 21, 28]:
            data[f"sales_lag_{lag}"] = data["sales"].shift(lag)
            
        # Rolling statistics (past observations only: shift(1) avoids target leakage)
        shifted = data["sales"].shift(1)
        data["rolling_mean_7"] = shifted.rolling(window=7, min_periods=1).mean()
        data["rolling_mean_14"] = shifted.rolling(window=14, min_periods=1).mean()
        data["rolling_mean_30"] = shifted.rolling(window=30, min_periods=1).mean()
        data["rolling_std_7"] = shifted.rolling(window=7, min_periods=1).std().fillna(0)
        
        return data

    def fit(self, df_history: pd.DataFrame) -> "XGBoostForecaster":
        """Fits XGBoost on chronological feature set.
        
        Args:
            df_history: DataFrame with 'date' and 'sales'.
        """
        self.last_history = df_history.copy().sort_values("date").reset_index(drop=True)
        
        # Keep up to 2 years for fast fitting in SaaS environment
        if len(self.last_history) > 730:
            fit_df = self.last_history.iloc[-730:].copy()
        else:
            fit_df = self.last_history.copy()
            
        features_df = self.create_features(fit_df)
        
        # Drop rows where lag features are NaN (e.g. initial 28 days)
        valid_df = features_df.dropna().reset_index(drop=True)
        
        feature_cols = [
            "day_of_week", "day_of_month", "month", "is_weekend",
            "sales_lag_7", "sales_lag_14", "sales_lag_21", "sales_lag_28",
            "rolling_mean_7", "rolling_mean_14", "rolling_mean_30", "rolling_std_7"
        ]
        self.feature_names = feature_cols
        
        X = valid_df[feature_cols]
        y = valid_df["sales"]
        
        self.model = xgb.XGBRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            random_state=42,
            n_jobs=1
        )
        self.model.fit(X, y)
        
        # Compute in-sample residual standard deviation
        in_sample_preds = self.model.predict(X)
        residuals = y - in_sample_preds
        self.std_err = float(np.std(residuals)) if len(residuals) > 0 else 5.0
        return self

    def predict(self, horizon: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Multi-step recursive forecasting without future data leakage."""
        if self.model is None or self.last_history is None:
            preds = np.repeat(30.0, horizon)
            return preds, np.clip(preds - 10, 0, None), preds + 10

        # Working history to recursively append predicted values
        sim_df = self.last_history.copy().sort_values("date").reset_index(drop=True)
        last_date = sim_df["date"].max()
        
        future_preds: List[float] = []
        
        for step in range(1, horizon + 1):
            next_date = last_date + pd.Timedelta(days=step)
            
            # Create features using current sim_df
            temp_df = pd.concat([
                sim_df,
                pd.DataFrame([{"date": next_date, "sales": np.nan}])
            ], ignore_index=True)
            
            feat_df = self.create_features(temp_df)
            row_features = feat_df.iloc[-1:][self.feature_names]
            
            # Predict next step
            pred_val = float(self.model.predict(row_features)[0])
            pred_val = max(0.0, pred_val) # non-negative
            
            future_preds.append(pred_val)
            
            # Append predicted value into sim_df for recursive lag computation
            sim_df = pd.concat([
                sim_df,
                pd.DataFrame([{"date": next_date, "sales": pred_val}])
            ], ignore_index=True)

        preds = np.array(future_preds)
        # Margin increases slightly over longer forecast horizons
        margin = 1.96 * self.std_err * np.sqrt(np.linspace(1.0, 1.6, horizon))
        lower = np.clip(preds - margin, 0, None)
        upper = preds + margin
        
        return preds, lower, upper
