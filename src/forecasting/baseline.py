import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))
from config import PROCESSED_DATA_DIR, REPORT_DIR

import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np


def main():
    path = PROCESSED_DATA_DIR / "monthly_sales.csv"
    if not path.exists():
        raise FileNotFoundError("Run python src/data/prepare_data.py first.")

    df = pd.read_csv(path, parse_dates=["date"])

    # Starter example: forecast total monthly sales across all stores/items.
    series = df.groupby("date")["sales"].sum().sort_index()

    if len(series) < 6:
        raise ValueError("At least 6 monthly observations are needed.")

    # Chronological holdout: last 3 months are test data.
    train, test = series.iloc[:-3], series.iloc[-3:]

    # Naive baseline: each future month is predicted using the last training month.
    predictions = np.repeat(train.iloc[-1], len(test))

    mae = mean_absolute_error(test, predictions)
    rmse = np.sqrt(mean_squared_error(test, predictions))

    results = pd.DataFrame({
        "date": test.index,
        "actual_sales": test.values,
        "predicted_sales": predictions,
    })
    output = REPORT_DIR / "baseline_forecast.csv"
    results.to_csv(output, index=False)

    print("Naive baseline results")
    print(f"MAE:  {mae:,.2f}")
    print(f"RMSE: {rmse:,.2f}")
    print(f"Predictions saved to: {output}")
    print("\nThis is a simple benchmark, not the final forecasting model.")


if __name__ == "__main__":
    main()
