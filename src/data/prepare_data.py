import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))
from config import TRAIN_FILE, PROCESSED_DATA_DIR

import pandas as pd


def main():
    if not TRAIN_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {TRAIN_FILE}. Add train.csv to data/raw/."
        )

    df = pd.read_csv(TRAIN_FILE)
    required = {"date", "store", "item", "sales"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    # Work on a copy; never modify the raw CSV.
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["store"] = pd.to_numeric(df["store"], errors="coerce")
    df["item"] = pd.to_numeric(df["item"], errors="coerce")
    df["sales"] = pd.to_numeric(df["sales"], errors="coerce")

    df = df.dropna(subset=["date", "store", "item", "sales"])
    df = df.drop_duplicates()
    df = df.sort_values(["store", "item", "date"])

    if (df["sales"] < 0).any():
        raise ValueError("Negative sales values found. Review data before continuing.")

    output = PROCESSED_DATA_DIR / "train_clean.csv"
    df.to_csv(output, index=False)

    monthly = (
        df.assign(month=df["date"].dt.to_period("M").dt.to_timestamp())
          .groupby(["month", "store", "item"], as_index=False)["sales"]
          .sum()
          .rename(columns={"month": "date"})
          .sort_values(["store", "item", "date"])
    )
    monthly_output = PROCESSED_DATA_DIR / "monthly_sales.csv"
    monthly.to_csv(monthly_output, index=False)

    print(f"Cleaned daily data saved to: {output}")
    print(f"Monthly aggregated data saved to: {monthly_output}")
    print(f"Rows after cleaning: {len(df):,}")


if __name__ == "__main__":
    main()
