"""Sales Analytics Engine for DemandVision AI
Computes executive metrics, sales trends, rankings, distributions, and comparisons.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd


def compute_executive_overview(
    df: pd.DataFrame,
    filtered_store: Optional[int] = None,
    filtered_item: Optional[int] = None
) -> Dict[str, Any]:
    """Calculates high-level executive KPIs and charts from filtered sales data."""
    if df.empty:
        return {
            "total_units_sold": 0,
            "number_of_stores": 0,
            "number_of_products": 0,
            "average_daily_sales": 0.0,
            "highest_selling_product": None,
            "best_performing_store": None,
            "sales_growth_pct": 0.0,
            "monthly_trend": [],
            "daily_trend": [],
            "top_products": [],
            "store_comparison": [],
        }

    total_units = int(df["sales"].sum())
    num_stores = int(df["store"].nunique())
    num_items = int(df["item"].nunique())
    
    # Daily aggregation for average daily sales and trend
    daily_group = df.groupby("date", as_index=False)["sales"].sum().sort_values("date")
    avg_daily_sales = round(float(daily_group["sales"].mean()), 2)
    
    # Store performance
    store_group = (
        df.groupby("store", as_index=False)["sales"]
          .sum()
          .sort_values("sales", ascending=False)
    )
    best_store = int(store_group.iloc[0]["store"]) if not store_group.empty else None
    
    # Product performance
    item_group = (
        df.groupby("item", as_index=False)["sales"]
          .sum()
          .sort_values("sales", ascending=False)
    )
    top_item = int(item_group.iloc[0]["item"]) if not item_group.empty else None

    # Monthly trend & growth calculation
    df_copy = df.copy()
    df_copy["month_period"] = df_copy["date"].dt.to_period("M")
    monthly_group = (
        df_copy.groupby("month_period")["sales"]
               .sum()
               .reset_index()
               .sort_values("month_period")
    )
    monthly_group["date"] = monthly_group["month_period"].dt.to_timestamp().dt.strftime("%Y-%m-%d")
    
    growth_pct = 0.0
    if len(monthly_group) >= 2:
        last_month = monthly_group.iloc[-1]["sales"]
        prev_month = monthly_group.iloc[-2]["sales"]
        if prev_month > 0:
            growth_pct = round(float(((last_month - prev_month) / prev_month) * 100), 2)

    # Format monthly trend points
    monthly_trend = [
        {"date": row["date"], "sales": int(row["sales"])}
        for _, row in monthly_group.iterrows()
    ]

    # For daily trend, if large, take weekly resample for responsive charting or last 180 days
    if len(daily_group) > 365:
        # Sample or take weekly average to keep UI ultra responsive
        daily_trend_df = daily_group.tail(180)
    else:
        daily_trend_df = daily_group

    daily_trend = [
        {"date": row["date"].strftime("%Y-%m-%d"), "sales": round(float(row["sales"]), 1)}
        for _, row in daily_trend_df.iterrows()
    ]

    # Top 10 products
    top_10_df = item_group.head(10)
    top_products = [
        {"item": f"Item {int(row['item'])}", "item_id": int(row["item"]), "sales": int(row["sales"])}
        for _, row in top_10_df.iterrows()
    ]

    # Store comparison
    store_comparison = [
        {"store": f"Store {int(row['store'])}", "store_id": int(row["store"]), "sales": int(row["sales"])}
        for _, row in store_group.iterrows()
    ]

    return {
        "total_units_sold": total_units,
        "number_of_stores": num_stores,
        "number_of_products": num_items,
        "average_daily_sales": avg_daily_sales,
        "highest_selling_product": top_item,
        "best_performing_store": best_store,
        "sales_growth_pct": growth_pct,
        "monthly_trend": monthly_trend,
        "daily_trend": daily_trend,
        "top_products": top_products,
        "store_comparison": store_comparison,
    }


def compute_detailed_sales_analytics(df: pd.DataFrame) -> Dict[str, Any]:
    """Generates detailed sales analytics including distribution, seasonality, and comparisons."""
    if df.empty:
        return {
            "summary_stats": {},
            "weekly_pattern": [],
            "monthly_pattern": [],
            "top_performers": [],
            "bottom_performers": [],
            "sales_distribution": [],
            "yearly_comparison": [],
        }

    # Summary statistics
    sales_series = df["sales"]
    mean_val = float(sales_series.mean())
    median_val = float(sales_series.median())
    std_val = float(sales_series.std())
    variance_val = float(sales_series.var())
    cv = (std_val / mean_val) if mean_val > 0 else 0.0

    summary_stats = {
        "mean_sales": round(mean_val, 2),
        "median_sales": round(median_val, 2),
        "std_deviation": round(std_val, 2),
        "variance": round(variance_val, 2),
        "coefficient_of_variation": round(cv, 4),
        "min_sales": float(sales_series.min()),
        "max_sales": float(sales_series.max()),
        "p25": float(sales_series.quantile(0.25)),
        "p75": float(sales_series.quantile(0.75)),
        "total_volume": int(sales_series.sum()),
    }

    # Weekly Pattern (Day of week: Mon=0, Sun=6)
    df_copy = df.copy()
    df_copy["day_of_week"] = df_copy["date"].dt.day_name()
    day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_group = df_copy.groupby("day_of_week")["sales"].mean().reindex(day_order).fillna(0)
    weekly_pattern = [
        {"day": day, "avg_sales": round(float(val), 2)}
        for day, val in day_group.items()
    ]

    # Monthly Seasonality Pattern (Jan - Dec)
    df_copy["month_name"] = df_copy["date"].dt.month_name()
    month_order = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    month_group = df_copy.groupby("month_name")["sales"].mean().reindex(month_order).fillna(0)
    monthly_pattern = [
        {"month": m, "avg_sales": round(float(val), 2)}
        for m, val in month_group.items()
    ]

    # Item rankings (Top 5 and Bottom 5)
    item_perf = (
        df.groupby("item", as_index=False)["sales"]
          .agg(total_sales="sum", avg_sales="mean", records="count")
          .sort_values("total_sales", ascending=False)
    )
    top_5 = [
        {"item": f"Item {int(r['item'])}", "item_id": int(r["item"]), "total_sales": int(r["total_sales"]), "avg_sales": round(float(r["avg_sales"]), 1)}
        for _, r in item_perf.head(5).iterrows()
    ]
    bottom_5 = [
        {"item": f"Item {int(r['item'])}", "item_id": int(r["item"]), "total_sales": int(r["total_sales"]), "avg_sales": round(float(r["avg_sales"]), 1)}
        for _, r in item_perf.tail(5).sort_values("total_sales").iterrows()
    ]

    # Sales Distribution (Histogram Bins)
    counts, bin_edges = np.histogram(sales_series, bins=15)
    sales_distribution = [
        {
            "bin_range": f"{int(bin_edges[i])}-{int(bin_edges[i+1])}",
            "count": int(counts[i]),
            "percentage": round(float(counts[i] / len(sales_series)) * 100, 2)
        }
        for i in range(len(counts))
    ]

    # Yearly trend comparison
    df_copy["year"] = df_copy["date"].dt.year
    yearly_group = df_copy.groupby("year")["sales"].agg(total_sales="sum", avg_sales="mean").reset_index()
    yearly_comparison = [
        {
            "year": int(r["year"]),
            "total_sales": int(r["total_sales"]),
            "avg_daily_sales": round(float(r["avg_sales"]), 1)
        }
        for _, r in yearly_group.iterrows()
    ]

    return {
        "summary_stats": summary_stats,
        "weekly_pattern": weekly_pattern,
        "monthly_pattern": monthly_pattern,
        "top_performers": top_5,
        "bottom_performers": bottom_5,
        "sales_distribution": sales_distribution,
        "yearly_comparison": yearly_comparison,
    }
