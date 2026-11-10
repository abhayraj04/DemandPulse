"""Overview and Dataset Management Endpoints
"""

import shutil
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, UploadFile, File
from backend.data.loader import get_data_loader
from backend.data.processor import process_raw_dataset
from backend.analytics.sales_analysis import compute_executive_overview
from backend.data.catalog import get_all_products, get_product, get_all_stores, get_store, get_all_categories
from backend.config import TRAIN_FILE, RAW_DATA_DIR

router = APIRouter()


@router.get("/overview")
def get_executive_overview(
    store: Optional[int] = Query(None, description="Filter by Store ID (1-10)"),
    item: Optional[int] = Query(None, description="Filter by Item ID (1-50)"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """Returns Executive Overview KPIs, trends, and comparisons."""
    store_val = store if isinstance(store, int) else None
    item_val = item if isinstance(item, int) else None
    start_val = start_date if isinstance(start_date, str) and start_date.strip() else None
    end_val = end_date if isinstance(end_date, str) and end_date.strip() else None

    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(
            status_code=503,
            detail="Dataset is not available. Please upload train.csv or verify data setup."
        )

    df = loader.get_data(store=store_val, item=item_val, start_date=start_val, end_date=end_val)
    overview = compute_executive_overview(df, filtered_store=store_val, filtered_item=item_val)

    # Enrich with catalog names and financial metrics
    if overview.get("highest_selling_product"):
        prod = get_product(overview["highest_selling_product"])
        overview["top_product_details"] = prod
    if overview.get("best_performing_store"):
        st = get_store(overview["best_performing_store"])
        overview["top_store_details"] = st

    # Estimate total revenue and gross profit from catalog unit economics
    total_revenue = 0.0
    total_cost = 0.0
    for prod_rank in overview.get("top_products", []):
        p_id = prod_rank["item_id"]
        prod_info = get_product(p_id)
        prod_rank["product_name"] = prod_info["name"]
        prod_rank["category"] = prod_info["category"]
        prod_rank["brand"] = prod_info["brand"]
        prod_rank["sku"] = prod_info["sku"]
        prod_rank["unit_price"] = prod_info["unit_price"]
        prod_rank["revenue"] = round(prod_rank["sales"] * prod_info["unit_price"], 2)

    for st_rank in overview.get("store_comparison", []):
        s_id = st_rank["store_id"]
        st_info = get_store(s_id)
        st_rank["store_name"] = st_info["name"]
        st_rank["city"] = st_info["city"]
        st_rank["state"] = st_info["state"]
        st_rank["region"] = st_info["region"]

    # Calculate average revenue approximation
    avg_price = 14.85 # weighted catalog average
    avg_margin = 0.58
    total_units = overview.get("total_units_sold", 0)
    overview["estimated_gross_revenue"] = round(total_units * avg_price, 2)
    overview["estimated_gross_profit"] = round(overview["estimated_gross_revenue"] * avg_margin, 2)
    overview["average_gross_margin_pct"] = round(avg_margin * 100, 1)

    return overview


@router.get("/catalog/products")
def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """Returns the complete 50-item commercial product catalog with search & filtering."""
    products = get_all_products()
    if category and isinstance(category, str) and category != "all":
        products = [p for p in products if p["category"].lower() == category.lower()]
    if search and isinstance(search, str) and search.strip():
        term = search.strip().lower()
        products = [p for p in products if term in p["name"].lower() or term in p["sku"].lower() or term in p["brand"].lower()]
    return {
        "total": len(products),
        "categories": get_all_categories(),
        "products": products,
    }


@router.get("/catalog/stores")
def list_stores(
    region: Optional[str] = Query(None)
):
    """Returns the 10 metropolitan retail store locations and profiles."""
    stores = get_all_stores()
    if region and isinstance(region, str) and region != "all":
        stores = [s for s in stores if s["region"].lower() == region.lower()]
    return {
        "total": len(stores),
        "stores": stores,
    }


@router.get("/dataset/status")
def get_dataset_status():
    """Returns dataset loading state, row counts, and data dictionary metadata."""
    loader = get_data_loader()
    return loader.get_status()


@router.get("/dataset/quality")
def get_dataset_quality_report():
    """Returns detailed data validation metrics, missing values, duplicates, and range."""
    loader = get_data_loader()
    report = loader.get_quality_report()
    if not report:
        raise HTTPException(status_code=404, detail="Quality report not found.")
    return report


@router.post("/dataset/upload")
async def upload_dataset_csv(file: UploadFile = File(...)):
    """Accepts user upload of train.csv, validates it, and triggers processing."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp_path = RAW_DATA_DIR / "uploaded_train.csv"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Move or replace train.csv
        shutil.move(temp_path, TRAIN_FILE)
        
        # Trigger processing
        metadata = process_raw_dataset()
        
        # Reload memory cache
        loader = get_data_loader()
        loader.load_data(force_reload=True)
        
        return {
            "message": "Dataset uploaded and processed successfully.",
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded file: {str(e)}")
