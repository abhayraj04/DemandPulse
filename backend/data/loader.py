"""Data Loader for DemandVision AI
Thread-safe cached data loader providing filtered views, summaries, and metadata.
Optimized for low-memory enterprise deployment.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
import threading
import pandas as pd

from backend.config import (
    TRAIN_FILE,
    CLEAN_DATA_FILE,
    MONTHLY_DATA_FILE,
    DAILY_TOTAL_FILE,
    METADATA_FILE,
    QUALITY_REPORT_FILE,
)
from backend.data.processor import process_raw_dataset


class DataLoader:
    """Singleton data manager that holds cleaned datasets in memory and serves fast queries."""
    
    _instance: Optional["DataLoader"] = None
    _lock = threading.Lock()
    
    def __new__(cls) -> "DataLoader":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance
            
    def __init__(self) -> None:
        if getattr(self, "_initialized", False):
            return
        self._df: Optional[pd.DataFrame] = None
        self._monthly_df: Optional[pd.DataFrame] = None
        self._daily_total_df: Optional[pd.DataFrame] = None
        self._metadata: Optional[Dict[str, Any]] = None
        self._quality_report: Optional[Dict[str, Any]] = None
        self._is_loaded: bool = False
        self._load_lock = threading.Lock()
        self._initialized = True
        
        # Initial check
        self.load_data()
        
    def is_available(self) -> bool:
        """Checks if dataset is loaded and available."""
        return self._is_loaded and self._df is not None and not self._df.empty
        
    def load_data(self, force_reload: bool = False) -> bool:
        """Loads or reloads processed dataset into memory."""
        with self._load_lock:
            if self._is_loaded and not force_reload:
                return True
                
            # If clean file doesn't exist but raw does, process it
            if not CLEAN_DATA_FILE.exists():
                if TRAIN_FILE.exists():
                    print("[DataLoader] Clean file not found, processing raw dataset...")
                    try:
                        process_raw_dataset()
                    except Exception as e:
                        print(f"[DataLoader] Failed to process raw dataset: {e}")
                        self._is_loaded = False
                        return False
                else:
                    print("[DataLoader] Neither clean nor raw train.csv found.")
                    self._is_loaded = False
                    return False
                    
            try:
                print(f"[DataLoader] Reading cleaned data from {CLEAN_DATA_FILE}...")
                # Optimized dtypes: int16 for store & item, float32 for sales
                self._df = pd.read_csv(
                    CLEAN_DATA_FILE,
                    dtype={"store": "int16", "item": "int16", "sales": "float32"},
                    parse_dates=["date"]
                )
                
                if MONTHLY_DATA_FILE.exists():
                    self._monthly_df = pd.read_csv(
                        MONTHLY_DATA_FILE,
                        dtype={"store": "int16", "item": "int16", "sales": "float32"},
                        parse_dates=["date"]
                    )
                    
                if DAILY_TOTAL_FILE.exists():
                    self._daily_total_df = pd.read_csv(
                        DAILY_TOTAL_FILE,
                        dtype={"total_sales": "float32", "avg_sales": "float32", "records": "int32"},
                        parse_dates=["date"]
                    )
                    
                if METADATA_FILE.exists():
                    with open(METADATA_FILE, "r", encoding="utf-8") as f:
                        self._metadata = json.load(f)
                        
                if QUALITY_REPORT_FILE.exists():
                    with open(QUALITY_REPORT_FILE, "r", encoding="utf-8") as f:
                        self._quality_report = json.load(f)
                        
                self._is_loaded = True
                print(f"[DataLoader] Successfully loaded {len(self._df):,} rows.")
                return True
            except Exception as e:
                print(f"[DataLoader] Error loading clean dataset: {e}")
                self._is_loaded = False
                return False

    def get_status(self) -> Dict[str, Any]:
        """Returns the current status of the dataset files and loading state."""
        raw_exists = TRAIN_FILE.exists()
        raw_size = TRAIN_FILE.stat().st_size if raw_exists else 0
        clean_exists = CLEAN_DATA_FILE.exists()
        
        return {
            "dataset_available": self.is_available(),
            "raw_file_exists": raw_exists,
            "raw_file_path": str(TRAIN_FILE),
            "raw_file_size_bytes": raw_size,
            "clean_file_exists": clean_exists,
            "total_records": len(self._df) if self.is_available() else 0,
            "stores": self._metadata.get("unique_stores", []) if self._metadata else [],
            "items": self._metadata.get("unique_items", []) if self._metadata else [],
            "date_range": {
                "start": self._metadata.get("date_start") if self._metadata else None,
                "end": self._metadata.get("date_end") if self._metadata else None,
                "total_days": self._metadata.get("total_days") if self._metadata else 0,
            } if self._metadata else None,
            "dataset_source": "Kaggle Store Item Demand Forecasting Challenge",
            "source_url": "https://www.kaggle.com/competitions/demand-forecasting-kernels-only/data",
        }

    def get_metadata(self) -> Optional[Dict[str, Any]]:
        return self._metadata

    def get_quality_report(self) -> Optional[Dict[str, Any]]:
        return self._quality_report

    def get_data(
        self,
        store: Optional[int] = None,
        item: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        monthly: bool = False
    ) -> pd.DataFrame:
        """Filters the primary dataset based on store, item, and date boundaries."""
        if not self.is_available():
            return pd.DataFrame(columns=["date", "store", "item", "sales"])
            
        df = self._monthly_df if monthly and self._monthly_df is not None else self._df
        if df is None:
            return pd.DataFrame(columns=["date", "store", "item", "sales"])
            
        mask = pd.Series(True, index=df.index)
        
        if store is not None and isinstance(store, (int, float)):
            mask &= (df["store"] == int(store))
        if item is not None and isinstance(item, (int, float)):
            mask &= (df["item"] == int(item))
        if start_date is not None and isinstance(start_date, str) and start_date.strip():
            mask &= (df["date"] >= pd.to_datetime(start_date))
        if end_date is not None and isinstance(end_date, str) and end_date.strip():
            mask &= (df["date"] <= pd.to_datetime(end_date))
            
        return df[mask].copy()


# Global singleton helper
def get_data_loader() -> DataLoader:
    """Access the singleton data loader."""
    return DataLoader()
