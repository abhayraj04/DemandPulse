"""Data Processor for DemandVision AI
Handles cleaning, chronological sorting, aggregation, and caching of processed data.
Keeps raw files untouched.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd

from backend.config import (
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    TRAIN_FILE,
    CLEAN_DATA_FILE,
    MONTHLY_DATA_FILE,
    DAILY_TOTAL_FILE,
    METADATA_FILE,
    QUALITY_REPORT_FILE,
)
from backend.data.validator import validate_dataframe, DataValidationError


def process_raw_dataset(
    input_path: Optional[Path] = None,
    output_dir: Optional[Path] = None
) -> Dict[str, Any]:
    """Cleans and processes raw retail sales dataset into structured formats.
    
    Args:
        input_path: Path to the raw CSV file. Defaults to TRAIN_FILE.
        output_dir: Directory where processed files will be saved.
        
    Returns:
        Dict containing processing metadata and validation summary.
    """
    raw_path = input_path or TRAIN_FILE
    out_dir = output_dir or PROCESSED_DATA_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw dataset file not found at: {raw_path}")
        
    print(f"[Processor] Reading raw dataset from {raw_path}...")
    df_raw = pd.read_csv(raw_path)
    
    # 1. Validation
    validation_report = validate_dataframe(df_raw)
    if not validation_report["is_valid"]:
        issues_str = "; ".join(validation_report["issues"])
        raise DataValidationError(f"Dataset validation failed: {issues_str}")
        
    print("[Processor] Dataset validation passed successfully.")
    
    # 2. Cleaning & Type Standardization
    df = df_raw.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["store"] = pd.to_numeric(df["store"], errors="coerce").astype(int)
    df["item"] = pd.to_numeric(df["item"], errors="coerce").astype(int)
    df["sales"] = pd.to_numeric(df["sales"], errors="coerce").astype(float)
    
    # Drop duplicates & sort chronologically
    df = df.drop_duplicates(subset=["date", "store", "item"])
    df = df.sort_values(["store", "item", "date"]).reset_index(drop=True)
    
    # 3. Save clean daily dataset
    clean_csv = out_dir / "train_clean.csv"
    df.to_csv(clean_csv, index=False)
    print(f"[Processor] Cleaned dataset saved to: {clean_csv} ({len(df):,} rows)")
    
    # 4. Generate Monthly Aggregations
    # month timestamp format (1st of each month)
    df_monthly = (
        df.assign(month=df["date"].dt.to_period("M").dt.to_timestamp())
          .groupby(["month", "store", "item"], as_index=False)["sales"]
          .sum()
          .rename(columns={"month": "date"})
          .sort_values(["store", "item", "date"])
          .reset_index(drop=True)
    )
    monthly_csv = out_dir / "monthly_sales.csv"
    df_monthly.to_csv(monthly_csv, index=False)
    print(f"[Processor] Monthly aggregated dataset saved to: {monthly_csv} ({len(df_monthly):,} rows)")
    
    # 5. Daily macro total aggregation (across all stores and items)
    daily_total = (
        df.groupby("date", as_index=False)["sales"]
          .agg(total_sales="sum", avg_sales="mean", records="count")
          .sort_values("date")
          .reset_index(drop=True)
    )
    daily_csv = out_dir / "daily_total_sales.csv"
    daily_total.to_csv(daily_csv, index=False)
    
    # 6. Precompute store and item summaries for instant dashboard queries
    store_summary = (
        df.groupby("store", as_index=False)["sales"]
          .agg(total_sales="sum", avg_daily_sales="mean", count="count")
          .sort_values("total_sales", ascending=False)
          .reset_index(drop=True)
    )
    
    item_summary = (
        df.groupby("item", as_index=False)["sales"]
          .agg(total_sales="sum", avg_daily_sales="mean", count="count")
          .sort_values("total_sales", ascending=False)
          .reset_index(drop=True)
    )
    
    top_store = int(store_summary.iloc[0]["store"])
    top_item = int(item_summary.iloc[0]["item"])
    
    # 7. Metadata and Quality report
    metadata = {
        "processed_at": pd.Timestamp.now().isoformat(),
        "total_rows": len(df),
        "total_units_sold": int(df["sales"].sum()),
        "unique_stores": sorted(df["store"].unique().tolist()),
        "unique_items": sorted(df["item"].unique().tolist()),
        "store_count": int(df["store"].nunique()),
        "item_count": int(df["item"].nunique()),
        "date_start": df["date"].min().strftime("%Y-%m-%d"),
        "date_end": df["date"].max().strftime("%Y-%m-%d"),
        "total_days": int((df["date"].max() - df["date"].min()).days) + 1,
        "overall_daily_average": round(float(daily_total["total_sales"].mean()), 2),
        "top_performing_store": top_store,
        "highest_selling_item": top_item,
        "files": {
            "clean_csv": str(clean_csv.name),
            "monthly_csv": str(monthly_csv.name),
            "daily_total_csv": str(daily_csv.name),
        }
    }
    
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    with open(QUALITY_REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(validation_report, f, indent=2)
        
    print("[Processor] Processing complete. Metadata & Quality Report written.")
    return metadata


if __name__ == "__main__":
    process_raw_dataset()
