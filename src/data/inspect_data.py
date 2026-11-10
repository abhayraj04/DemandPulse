import sys
from pathlib import Path

# Allow running this file from the project root.
sys.path.append(str(Path(__file__).resolve().parents[2]))
from config import TRAIN_FILE

import pandas as pd


def main():
    if not TRAIN_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {TRAIN_FILE}\n"
            "Download train.csv from Kaggle and place it in data/raw/."
        )

    df = pd.read_csv(TRAIN_FILE)
    required = {"date", "store", "item", "sales"}
    missing = required - set(df.columns)

    print("\n--- DATASET OVERVIEW ---")
    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")
    print(f"Column names: {list(df.columns)}")

    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    print("\n--- FIRST FIVE ROWS ---")
    print(df.head().to_string(index=False))
    print("\n--- DATA TYPES ---")
    print(df.dtypes)
    print("\n--- MISSING VALUES ---")
    print(df.isna().sum())
    print("\n--- DUPLICATE ROWS ---")
    print(df.duplicated().sum())
    print("\n--- DATE RANGE ---")
    print(df["date"].min(), "to", df["date"].max())
    print("\n--- SALES SUMMARY ---")
    print(df["sales"].describe())


if __name__ == "__main__":
    main()
