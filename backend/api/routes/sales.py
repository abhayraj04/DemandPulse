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
    """Returns products ranked by total volume, revenue, and unit economics."""
    from backend.data.catalog import get_product
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

    enriched_products = []
    for _, row in grouped.iterrows():
        p_id = int(row["item"])
        prod = get_product(p_id)
        total_units = int(row["total_units"])
        revenue = round(total_units * prod["unit_price"], 2)
        gross_profit = round(revenue * (prod["margin_pct"] / 100), 2)
        enriched_products.append({
            "item_id": p_id,
            "item_name": prod["name"],
            "sku": prod["sku"],
            "category": prod["category"],
            "brand": prod["brand"],
            "unit_price": prod["unit_price"],
            "unit_cost": prod["unit_cost"],
            "margin_pct": prod["margin_pct"],
            "total_units": total_units,
            "avg_daily_sales": round(float(row["avg_daily"]), 1),
            "std_daily_sales": round(float(row["std_daily"]), 1),
            "estimated_revenue": revenue,
            "estimated_gross_profit": gross_profit,
        })

    return {
        "store": store,
        "total_analyzed": len(enriched_products),
        "products": enriched_products,
    }


@router.get("/sales/stores")
def get_store_rankings():
    """Returns all 10 stores ranked by total sales, city, region, and market share."""
    from backend.data.catalog import get_store, get_product
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
    avg_inr_price = sum(get_product(i)["configured_price_inr"] for i in range(1, 51)) / 50.0
    enriched_stores = []
    for _, row in grouped.iterrows():
        s_id = int(row["store"])
        st_info = get_store(s_id)
        units = int(row["total_units"])
        est_rev = round(units * avg_inr_price, 2)
        enriched_stores.append({
            "store_id": s_id,
            "store_name": st_info["name"],
            "short_name": st_info["short_name"],
            "city": st_info["city"],
            "state": st_info["state"],
            "region": st_info["region"],
            "manager": st_info["manager"],
            "sqft": st_info["sqft"],
            "total_units": units,
            "avg_daily_sales": round(float(row["avg_daily"]), 1),
            "market_share_pct": round(float(units / total_chain_units) * 100, 2),
            "estimated_revenue": est_rev,
        })

    return {"stores": enriched_stores}


@router.get("/sales/categories")
def get_category_breakdown(
    store: Optional[int] = Query(None)
):
    """Aggregates sales volume and estimated revenue by retail category department."""
    from backend.data.catalog import get_product
    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    df = loader.get_data(store=store)
    if df.empty:
        return {"categories": []}

    # Item sums
    item_sums = df.groupby("item")["sales"].sum().to_dict()
    category_data: dict = {}

    for item_id, units in item_sums.items():
        prod = get_product(int(item_id))
        cat = prod["category"]
        if cat not in category_data:
            category_data[cat] = {
                "category": cat,
                "total_units": 0,
                "estimated_revenue": 0.0,
                "skus_count": 0,
            }
        category_data[cat]["total_units"] += int(units)
        category_data[cat]["estimated_revenue"] += round(int(units) * prod["unit_price"], 2)
        category_data[cat]["skus_count"] += 1

    total_units_all = sum(c["total_units"] for c in category_data.values())
    cat_list = list(category_data.values())
    for c in cat_list:
        c["volume_share_pct"] = round((c["total_units"] / total_units_all) * 100, 1) if total_units_all > 0 else 0
        c["estimated_revenue"] = round(c["estimated_revenue"], 2)

    cat_list.sort(key=lambda x: x["total_units"], reverse=True)
    return {"categories": cat_list}


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
