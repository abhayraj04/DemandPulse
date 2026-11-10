import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))
from config import PROCESSED_DATA_DIR, REPORT_DIR

import pandas as pd
import matplotlib.pyplot as plt


def main():
    path = PROCESSED_DATA_DIR / "train_clean.csv"
    if not path.exists():
        raise FileNotFoundError("Run python src/data/prepare_data.py first.")

    df = pd.read_csv(path, parse_dates=["date"])
    daily_total = df.groupby("date")["sales"].sum().sort_index()
    monthly_total = daily_total.resample("MS").sum()

    fig, ax = plt.subplots(figsize=(12, 5))
    monthly_total.plot(ax=ax)
    ax.set_title("Total Monthly Retail Sales")
    ax.set_xlabel("Month")
    ax.set_ylabel("Units sold")
    fig.tight_layout()

    output = REPORT_DIR / "monthly_sales_trend.png"
    fig.savefig(output, dpi=150)
    print(f"Chart saved to: {output}")
    print("\nMonthly sales summary:")
    print(monthly_total.describe())


if __name__ == "__main__":
    main()
