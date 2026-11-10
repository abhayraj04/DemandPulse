"""AI Business Insights Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from backend.data.loader import get_data_loader
from backend.insights.engine import InsightsEngine

router = APIRouter()
_insights_engine = InsightsEngine()


@router.get("/insights")
def get_ai_insights(
    store: Optional[int] = Query(None),
    item: Optional[int] = Query(None),
):
    """Generates rule-based business insights and action items grounded in actual sales & forecasts."""
    loader = get_data_loader()
    if not loader.is_available():
        raise HTTPException(status_code=503, detail="Dataset not loaded.")

    insights = _insights_engine.generate_insights(store=store, item=item)
    return {
        "store": store,
        "item": item,
        "total_insights": len(insights),
        "insights": insights,
    }
