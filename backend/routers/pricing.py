"""
KarigarAI - Pricing Router

Endpoints:
- POST /api/pricing/recommend       - Get AI price recommendation
- GET  /api/pricing/market/{category} - Get market insights for a category
- POST /api/pricing/batch           - Batch pricing for multiple products
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel, Field

from services.pricing_service import pricing_service

router = APIRouter(prefix="/api/pricing", tags=["pricing"])


# ---- Schemas ----
class PriceRecommendRequest(BaseModel):
    material_cost: float = Field(..., ge=0, description="Raw material cost in ₹")
    labour_cost: float = Field(..., ge=0, description="Labour cost in ₹")
    category: str = Field("Handicrafts", description="Product category")
    quality: str = Field("medium", description="Quality tier: high, medium, standard")
    product_name: str = Field("", description="Product name for context")


class CostBreakdown(BaseModel):
    material_cost: float
    labour_cost: float
    total_cost: float
    margin: float
    quality_multiplier: float
    seasonal_factor: float


class MarketAnalysis(BaseModel):
    market_average: float
    competitive_status: str
    status_label: str
    demand_factor: float
    seasonal_factor: float


class PriceRecommendResponse(BaseModel):
    recommended_price: int
    price_range: dict
    cost_breakdown: CostBreakdown
    market_analysis: MarketAnalysis
    explanation: str
    ai_enhanced: bool = False
    ai_suggestion: Optional[dict] = None


class MarketInsightsResponse(BaseModel):
    category: str
    market_average: float
    price_range: dict
    demand_factor: float
    seasonal_factor: float
    recommended_margin: float
    trend: str


class BatchPricingRequest(BaseModel):
    products: List[dict]


class BatchPricingItem(BaseModel):
    product_name: str
    recommended_price: int
    is_profitable: bool


class BatchPricingResponse(BaseModel):
    results: List[BatchPricingItem]
    total_products: int
    profitable_count: int


# ---- Endpoints ----
@router.post("/recommend", response_model=PriceRecommendResponse)
async def recommend_price(request: PriceRecommendRequest):
    """
    Get AI-powered price recommendation based on costs, category, and quality.

    The recommendation considers:
    - Material and labour costs
    - Category-specific market rates
    - Quality tier multiplier
    - Current seasonal demand
    - Market competition
    """

    if request.material_cost + request.labour_cost == 0:
        raise HTTPException(
            status_code=400,
            detail="At least material or labour cost must be greater than 0"
        )

    result = await pricing_service.recommend_price(
        material_cost=request.material_cost,
        labour_cost=request.labour_cost,
        category=request.category,
        quality=request.quality,
        product_name=request.product_name,
    )

    return PriceRecommendResponse(
        recommended_price=result["recommended_price"],
        price_range=result["price_range"],
        cost_breakdown=CostBreakdown(**result["cost_breakdown"]),
        market_analysis=MarketAnalysis(**result["market_analysis"]),
        explanation=result["explanation"],
        ai_enhanced=result.get("ai_enhanced", False),
        ai_suggestion=result.get("ai_suggestion"),
    )


@router.get("/market/{category}", response_model=MarketInsightsResponse)
def get_market_insights(category: str):
    """Get market insights for a specific product category."""
    valid_categories = ["Textiles", "Handicrafts", "Jewellery", "Home Decor"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Valid: {', '.join(valid_categories)}"
        )

    insights = pricing_service.get_market_insights(category)
    return MarketInsightsResponse(**insights)


@router.post("/batch", response_model=BatchPricingResponse)
async def batch_pricing(request: BatchPricingRequest):
    """Generate pricing recommendations for multiple products at once."""
    if not request.products:
        raise HTTPException(status_code=400, detail="No products provided")

    results = pricing_service.batch_pricing(request.products)
    profitable = sum(1 for r in results if r["is_profitable"])

    return BatchPricingResponse(
        results=[BatchPricingItem(**r) for r in results],
        total_products=len(results),
        profitable_count=profitable,
    )
