"""Overview and Dataset Management Endpoints
"""

import shutil
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, UploadFile, File
from backend.data.loader import get_data_loader
from backend.data.processor import process_raw_dataset
from backend.analytics.sales_analysis import compute_executive_overview
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
    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(
            status_code=503,
            detail="Dataset is not available. Please upload train.csv or verify data setup."
        )

    df = loader.get_data(store=store, item=item, start_date=start_date, end_date=end_date)
    return compute_executive_overview(df, filtered_store=store, filtered_item=item)


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
