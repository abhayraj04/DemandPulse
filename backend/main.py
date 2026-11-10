"""DemandPulse - FastAPI Main Application
Serves the REST API and the React production build with single-service SPA fallback.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.config import (
    APP_NAME,
    APP_VERSION,
    DEBUG,
    FRONTEND_DIST_DIR,
)
from backend.data.loader import get_data_loader
from backend.api.routes import health, overview, sales, forecasting, models, inventory, insights, analytics_advanced


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes in-memory dataset loader on application boot."""
    print(f"[{APP_NAME}] Initializing backend services...")
    loader = get_data_loader()
    if loader.is_available():
        print(f"[{APP_NAME}] Dataset successfully loaded and ready.")
    else:
        print(f"[{APP_NAME}] Notice: Dataset pending setup or upload.")
    yield


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Enterprise Retail Sales Forecasting & Inventory Intelligence Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    debug=DEBUG,
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router, prefix="/api", tags=["System Health"])
app.include_router(overview.router, prefix="/api", tags=["Executive Overview & Data"])
app.include_router(sales.router, prefix="/api", tags=["Sales Analytics"])
app.include_router(forecasting.router, prefix="/api", tags=["Time-Series & Forecasting"])
app.include_router(models.router, prefix="/api", tags=["Model Performance"])
app.include_router(inventory.router, prefix="/api", tags=["Inventory Intelligence"])
app.include_router(insights.router, prefix="/api", tags=["AI Business Insights"])
app.include_router(analytics_advanced.router, prefix="/api", tags=["Advanced Analytics & Data Science"])


# Static file serving & SPA fallback
if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not intercept /api requests
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        
        file_path = FRONTEND_DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
            
        index_file = FRONTEND_DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
            
        return JSONResponse(status_code=404, content={"detail": "Frontend index.html not found"})
else:
    @app.get("/")
    async def root_placeholder():
        return {
            "app": APP_NAME,
            "version": APP_VERSION,
            "status": "API is active. Frontend build is pending or under development.",
            "api_documentation": "/api/docs",
            "health_check": "/api/health"
        }
