"""Sales Analytics Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from backend.data.loader import get_data_loader
from backend.analytics.sales_analysis import compute_detailed_sales_analytics

router = APIRouter()


@router.get("/sales/trends")
def get_sales_trends(
    store: Optional[int] = Query(None),
    item: Optional[int] = Query(None),
    granularity: str = Query("monthly", pattern="^(daily|weekly|monthly)$"),
):
    """Returns aggregated time series trends at specified granularity."""
    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    df = loader.get_data(store=store, item=item)
    if df.empty:
        return {"trends": []}

    if granularity == "monthly":
        df_copy = df.copy()
        df_copy["period"] = df_copy["date"].dt.to_period("M")
        agg = df_copy.groupby("period")["sales"].agg(total_sales="sum", avg_sales="mean").reset_index()
        agg["date"] = agg["period"].dt.to_timestamp().dt.strftime("%Y-%m-%d")
    elif granularity == "weekly":
        df_copy = df.copy()
        df_copy["period"] = df_copy["date"].dt.to_period("W")
        agg = df_copy.groupby("period")["sales"].agg(total_sales="sum", avg_sales="mean").reset_index()
        agg["date"] = agg["period"].dt.start_time.dt.strftime("%Y-%m-%d")
    else: # daily
        agg = df.groupby("date", as_index=False)["sales"].agg(total_sales="sum", avg_sales="mean")
        agg["date"] = agg["date"].dt.strftime("%Y-%m-%d")

    return {
        "granularity": granularity,
        "store": store,
        "item": item,
        "trends": [
            {
                "date": row["date"],
                "total_sales": round(float(row["total_sales"]), 1),
                "avg_sales": round(float(row["avg_sales"]), 1)
            }
            for _, row in agg.iterrows()
        ]
    }


@router.get("/sales/products")
def get_product_rankings(
    store: Optional[int] = Query(None),
    limit: int = Query(50, ge=5, le=50)
):
    """Returns products ranked by total volume and daily average sales."""
    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    df = loader.get_data(store=store)
    if df.empty:
        return {"products": []}

    grouped = (
        df.groupby("item", as_index=False)["sales"]
          .agg(total_units="sum", avg_daily="mean", std_daily="std", record_count="count")
          .sort_values("total_units", ascending=False)
          .head(limit)
    )

    return {
        "store": store,
        "products": [
            {
                "item_id": int(row["item"]),
                "item_name": f"Item {int(row['item'])}",
                "total_units": int(row["total_units"]),
                "avg_daily_sales": round(float(row["avg_daily"]), 1),
                "std_daily_sales": round(float(row["std_daily"]), 1),
            }
            for _, row in grouped.iterrows()
        ]
    }


@router.get("/sales/stores")
def get_store_rankings():
    """Returns all 10 stores ranked by total sales and performance metrics."""
    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    df = loader.get_data()
    if df.empty:
        return {"stores": []}

    grouped = (
        df.groupby("store", as_index=False)["sales"]
          .agg(total_units="sum", avg_daily="mean", std_daily="std")
          .sort_values("total_units", ascending=False)
    )

    total_chain_units = float(df["sales"].sum())
    return {
        "stores": [
            {
                "store_id": int(row["store"]),
                "store_name": f"Store {int(row['store'])}",
                "total_units": int(row["total_units"]),
                "avg_daily_sales": round(float(row["avg_daily"]), 1),
                "market_share_pct": round(float(row["total_units"] / total_chain_units) * 100, 2),
            }
            for _, row in grouped.iterrows()
        ]
    }


@router.get("/sales/analytics")
def get_detailed_analytics(
    store: Optional[int] = Query(None),
    item: Optional[int] = Query(None),
):
    """Returns deep statistical analytics: distribution, DOW, month patterns, performers."""
    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    df = loader.get_data(store=store, item=item)
    return compute_detailed_sales_analytics(df)
