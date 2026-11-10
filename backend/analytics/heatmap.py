"""Demand Heatmap Service for DemandVision AI
Cross-tabulates multi-dimensional retail sales matrices for interactive heatmaps.

Supported Heatmap Views:
1. Products × Stores (50 Products × 10 Indian Metro Stores)
2. Day of Week × Month (7 Days × 12 Months Seasonality)
3. Store Locations × Month (10 Stores × 12 Months)
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.data.loader import get_data_loader
from backend.data.catalog import get_product, get_store, get_all_stores


def generate_demand_heatmap(
    matrix_type: str = "products_by_stores",
    store: Optional[int] = None,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """Generates normalized cross-tabulation matrix for retail demand heatmaps."""
    loader = get_data_loader()
    if not loader.is_available():
        return {"rows": [], "columns": [], "matrix": []}

    df = loader.get_data()
    if df.empty:
        return {"rows": [], "columns": [], "matrix": []}

    if matrix_type == "dow_by_month":
        df_copy = df.copy()
        if store:
            df_copy = df_copy[df_copy["store"] == store]
        df_copy["dow"] = df_copy["date"].dt.day_name()
        df_copy["month"] = df_copy["date"].dt.strftime("%b")
        df_copy["month_num"] = df_copy["date"].dt.month

        dow_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        pivot = df_copy.pivot_table(
            index="dow",
            columns="month",
            values="sales",
            aggfunc="mean"
        ).reindex(index=dow_order, columns=month_order).fillna(0)

        min_val = float(pivot.values.min())
        max_val = float(pivot.values.max())
        val_range = max_val - min_val if max_val > min_val else 1.0

        matrix_cells = []
        for r_idx, r_name in enumerate(dow_order):
            for c_idx, c_name in enumerate(month_order):
                val = float(pivot.loc[r_name, c_name])
                intensity = round((val - min_val) / val_range, 3)
                matrix_cells.append({
                    "row": r_name,
                    "column": c_name,
                    "value": round(val, 1),
                    "intensity": intensity,
                    "label": f"{r_name} in {c_name}: {round(val, 1)} units/day",
                })

        return {
            "matrix_type": "dow_by_month",
            "title": "Seasonality Heatmap: Day of Week × Month",
            "subtitle": "Average daily sales pace contrasting weekday volume vs. seasonal peaks",
            "rows": dow_order,
            "columns": month_order,
            "min_val": round(min_val, 1),
            "max_val": round(max_val, 1),
            "cells": matrix_cells,
        }

    elif matrix_type == "store_by_month":
        df_copy = df.copy()
        df_copy["month"] = df_copy["date"].dt.strftime("%b")
        month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        pivot = df_copy.pivot_table(
            index="store",
            columns="month",
            values="sales",
            aggfunc="sum"
        ).reindex(columns=month_order).fillna(0)

        store_rows = []
        for s_id in sorted(df_copy["store"].unique()):
            st = get_store(int(s_id))
            store_rows.append(f"{s_id}. {st['city']}")

        min_val = float(pivot.values.min())
        max_val = float(pivot.values.max())
        val_range = max_val - min_val if max_val > min_val else 1.0

        matrix_cells = []
        for s_idx, s_id in enumerate(sorted(df_copy["store"].unique())):
            st = get_store(int(s_id))
            r_name = f"{s_id}. {st['city']}"
            for c_name in month_order:
                val = float(pivot.loc[s_id, c_name])
                intensity = round((val - min_val) / val_range, 3)
                matrix_cells.append({
                    "row": r_name,
                    "column": c_name,
                    "value": int(round(val)),
                    "intensity": intensity,
                    "label": f"{st['city']} in {c_name}: {int(val):,} units",
                })

        return {
            "matrix_type": "store_by_month",
            "title": "Store Performance Heatmap: 10 Indian Metro Stores × Month",
            "subtitle": "Total volume throughput across retail outlets and calendar months",
            "rows": store_rows,
            "columns": month_order,
            "min_val": int(min_val),
            "max_val": int(max_val),
            "cells": matrix_cells,
        }

    else:
        # Default: Products × Stores
        df_copy = df.copy()
        if category and category != "all":
            valid_items = [
                p["item_id"] for p in [get_product(i) for i in range(1, 51)]
                if p["category"].lower() == category.lower()
            ]
            df_copy = df_copy[df_copy["item"].isin(valid_items)]

        # Average daily demand matrix: 50 items × 10 stores
        pivot = df_copy.pivot_table(
            index="item",
            columns="store",
            values="sales",
            aggfunc="mean"
        ).fillna(0)

        store_names = []
        for s_id in range(1, 11):
            st = get_store(s_id)
            store_names.append(f"{s_id}. {st['city']}")

        product_rows = []
        for it_id in sorted(pivot.index):
            prod = get_product(int(it_id))
            product_rows.append(f"{prod.get('product_id', f'P{it_id:03d}')} • {prod['name'][:22]}")

        min_val = float(pivot.values.min())
        max_val = float(pivot.values.max())
        val_range = max_val - min_val if max_val > min_val else 1.0

        matrix_cells = []
        for it_id in sorted(pivot.index):
            prod = get_product(int(it_id))
            r_name = f"{prod.get('product_id', f'P{it_id:03d}')} • {prod['name'][:22]}"
            for s_id in range(1, 11):
                st = get_store(s_id)
                c_name = f"{s_id}. {st['city']}"
                val = float(pivot.loc[it_id, s_id])
                intensity = round((val - min_val) / val_range, 3)
                matrix_cells.append({
                    "row": r_name,
                    "column": c_name,
                    "value": round(val, 1),
                    "intensity": intensity,
                    "item_id": int(it_id),
                    "store_id": s_id,
                    "product_name": prod["name"],
                    "city": st["city"],
                    "label": f"{prod['name']} in {st['city']}: {round(val, 1)} units/day",
                })

        return {
            "matrix_type": "products_by_stores",
            "title": "Demand Distribution Matrix: Products × Stores",
            "subtitle": "Cross-tabulation of average daily sales volume across 50 SKUs and 10 Indian retail stores",
            "rows": product_rows,
            "columns": store_names,
            "min_val": round(min_val, 1),
            "max_val": round(max_val, 1),
            "cells": matrix_cells,
        }
