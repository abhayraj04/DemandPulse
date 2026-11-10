"""Data Validator for DemandVision AI
Validates raw datasets according to rigorous quality checks:
- Required column presence
- Data type consistency
- Missing value analysis
- Duplicate row detection
- Non-negative sales verification
- Chronological date range verification
"""

from typing import Dict, Any, List
import pandas as pd
from backend.config import REQUIRED_COLUMNS


class DataValidationError(Exception):
    """Exception raised when dataset fails critical validation."""
    pass


def validate_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """Inspects a pandas DataFrame and produces a detailed validation report.
    
    Args:
        df: Input DataFrame to validate.
        
    Returns:
        Dict containing validation metrics and status.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    column_names = list(df.columns)
    
    # 1. Required column check
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in column_names]
    is_valid = len(missing_cols) == 0 and total_rows > 0
    issues: List[str] = []
    
    if missing_cols:
        issues.append(f"Missing required columns: {', '.join(missing_cols)}")
    
    if total_rows == 0:
        issues.append("Dataset contains 0 rows.")
        return {
            "is_valid": False,
            "total_rows": 0,
            "total_columns": total_cols,
            "columns": column_names,
            "issues": issues,
            "missing_values": {},
            "duplicate_count": 0,
            "date_range": None,
            "store_count": 0,
            "item_count": 0,
            "sales_summary": None,
        }

    # 2. Missing value checks
    missing_counts = df.isna().sum().to_dict()
    missing_pct = {k: round((v / total_rows) * 100, 2) for k, v in missing_counts.items()}
    total_missing = sum(missing_counts.values())
    if total_missing > 0:
        issues.append(f"Found {total_missing} missing values across columns.")

    # 3. Duplicate row check
    duplicate_count = int(df.duplicated().sum())
    if duplicate_count > 0:
        issues.append(f"Found {duplicate_count} exact duplicate rows.")

    # 4. Check date column
    date_range = None
    if "date" in df.columns:
        parsed_dates = pd.to_datetime(df["date"], errors="coerce")
        invalid_dates = parsed_dates.isna().sum()
        if invalid_dates > 0:
            issues.append(f"Found {invalid_dates} invalid or unparseable date values.")
            is_valid = False
        else:
            date_range = {
                "start": parsed_dates.min().strftime("%Y-%m-%d"),
                "end": parsed_dates.max().strftime("%Y-%m-%d"),
                "total_days": int((parsed_dates.max() - parsed_dates.min()).days) + 1,
            }

    # 5. Check store and item columns
    store_count = 0
    item_count = 0
    if "store" in df.columns:
        stores = pd.to_numeric(df["store"], errors="coerce")
        if stores.isna().any():
            issues.append("Store ID contains non-numeric or null values.")
            is_valid = False
        else:
            store_count = int(stores.nunique())
            
    if "item" in df.columns:
        items = pd.to_numeric(df["item"], errors="coerce")
        if items.isna().any():
            issues.append("Item ID contains non-numeric or null values.")
            is_valid = False
        else:
            item_count = int(items.nunique())

    # 6. Sales value verification
    sales_summary = None
    if "sales" in df.columns:
        sales = pd.to_numeric(df["sales"], errors="coerce")
        if sales.isna().any():
            issues.append("Sales contains non-numeric or null values.")
            is_valid = False
        else:
            negative_sales = int((sales < 0).sum())
            if negative_sales > 0:
                issues.append(f"Found {negative_sales} negative sales observations.")
                is_valid = False
            
            zero_sales = int((sales == 0).sum())
            sales_summary = {
                "mean": round(float(sales.mean()), 2),
                "std": round(float(sales.std()), 2),
                "min": float(sales.min()),
                "p25": float(sales.quantile(0.25)),
                "median": float(sales.median()),
                "p75": float(sales.quantile(0.75)),
                "max": float(sales.max()),
                "zero_sales_count": zero_sales,
                "total_units_sold": int(sales.sum()),
            }

    return {
        "is_valid": is_valid,
        "total_rows": total_rows,
        "total_columns": total_cols,
        "columns": column_names,
        "missing_columns": missing_cols,
        "missing_values": missing_counts,
        "missing_percentages": missing_pct,
        "duplicate_count": duplicate_count,
        "date_range": date_range,
        "store_count": store_count,
        "item_count": item_count,
        "sales_summary": sales_summary,
        "issues": issues,
    }
