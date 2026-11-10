"""Pydantic Models and Schemas for DemandVision AI
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DatasetStatusResponse(BaseModel):
    dataset_available: bool
    raw_file_exists: bool
    raw_file_path: str
    raw_file_size_bytes: int
    clean_file_exists: bool
    total_records: int
    stores: List[int]
    items: List[int]
    date_range: Optional[Dict[str, Any]] = None
    dataset_source: str
    source_url: str


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    dataset_loaded: bool
    environment: str


class InventoryRecommendationRequest(BaseModel):
    store: Optional[int] = Field(default=1, description="Store ID (1-10)")
    lead_time_days: int = Field(default=7, ge=1, le=60, description="Supplier lead time in days")
    current_stock_override: Optional[float] = Field(default=None, ge=0, description="Optional manual inventory override")
    target_service_level: int = Field(default=95, description="Target service level percentage (85, 90, 95, 98, 99)")
    top_n_items: int = Field(default=15, ge=1, le=50, description="Number of items to analyze")


class ForecastRequest(BaseModel):
    store: int = Field(default=1, ge=1, le=10)
    item: int = Field(default=1, ge=1, le=50)
    model_id: str = Field(default="xgboost")
    horizon: int = Field(default=30, ge=7, le=90)
