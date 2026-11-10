"""DemandVision AI - Backend Configuration
Defines paths, application settings, and dataset schemas.
"""

import os
from pathlib import Path

# Root directory of the DemandVision AI project
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Data directories
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODEL_DIR = PROJECT_ROOT / "models"
REPORT_DIR = PROJECT_ROOT / "reports"
FRONTEND_DIST_DIR = PROJECT_ROOT / "frontend" / "dist"

# Default files
TRAIN_FILE = RAW_DATA_DIR / "train.csv"
TEST_FILE = RAW_DATA_DIR / "test.csv"
SAMPLE_SUBMISSION_FILE = RAW_DATA_DIR / "sample_submission.csv"

CLEAN_DATA_FILE = PROCESSED_DATA_DIR / "train_clean.csv"
MONTHLY_DATA_FILE = PROCESSED_DATA_DIR / "monthly_sales.csv"
DAILY_TOTAL_FILE = PROCESSED_DATA_DIR / "daily_total_sales.csv"
METADATA_FILE = PROCESSED_DATA_DIR / "dataset_metadata.json"
QUALITY_REPORT_FILE = PROCESSED_DATA_DIR / "data_quality_report.json"

# Create directories if they do not exist
for directory in (DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, MODEL_DIR, REPORT_DIR):
    directory.mkdir(parents=True, exist_ok=True)

# Required dataset columns
REQUIRED_COLUMNS = ["date", "store", "item", "sales"]

# API and Server configuration
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
APP_NAME = "DemandVision AI"
APP_VERSION = "1.0.0"
API_PREFIX = "/api"
