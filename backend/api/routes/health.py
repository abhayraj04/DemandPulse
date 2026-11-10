"""Health Check Endpoint
"""

from fastapi import APIRouter
from backend.config import APP_NAME, APP_VERSION, ENVIRONMENT
from backend.data.loader import get_data_loader
from backend.schemas.models import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health_status():
    """Returns application health and dataset availability status."""
    loader = get_data_loader()
    return HealthResponse(
        status="healthy",
        app_name=APP_NAME,
        version=APP_VERSION,
        dataset_loaded=loader.is_available(),
        environment=ENVIRONMENT,
    )
