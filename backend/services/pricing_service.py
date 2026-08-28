"""
KarigarAI - Pricing Service

Handles:
- AI-powered price recommendations
- Cost analysis (materials + labour + margin)
- Market price comparison
- Competitive pricing analysis
- Price optimization suggestions
"""

import os
import random
from typing import Optional, Dict, List
from datetime import datetime, timezone

import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Category-specific base prices and market ranges (Indian Rupees)
CATEGORY_PRICING = {
    "Textiles": {
        "base_min": 400,
        "base_max": 3000,
        "avg_material_ratio": 0.45,
        "avg_labour_ratio": 0.35,
        "avg_margin": 0.20,
        "market_avg": 950,
        "demand_factor": 1.1,
    },
    "Handicrafts": {
        "base_min": 300,
        "base_max": 2500,
        "avg_material_ratio": 0.40,
        "avg_labour_ratio": 0.40,
        "avg_margin": 0.20,
        "market_avg": 750,
        "demand_factor": 1.05,
    },
    "Jewellery": {
        "base_min": 800,
        "base_max": 5000,
        "avg_material_ratio": 0.55,
        "avg_labour_ratio": 0.25,
        "avg_margin": 0.20,
        "market_avg": 1800,
        "demand_factor": 1.15,
    },
    "Home Decor": {
        "base_min": 350,
        "base_max": 2000,
        "avg_material_ratio": 0.35,
        "avg_labour_ratio": 0.40,
        "avg_margin": 0.25,
        "market_avg": 800,
        "demand_factor": 1.08,
    },
}

# Quality multipliers
QUALITY_MULTIPLIERS = {
    "high": 1.30,
    "premium": 1.40,
    "medium": 1.15,
    "standard": 1.00,
    "basic": 0.90,
}

# Seasonal demand patterns (simplified)
SEASONAL_FACTORS = {
    "january": 0.95, "february": 0.90, "march": 0.95,
    "april": 0.85, "may": 0.80, "june": 0.85,
    "july": 0.90, "august": 1.00, "september": 1.05,
    "october": 1.20, "november": 1.30, "december": 1.15,
}


class PricingService:
    """Service for AI-powered product pricing."""

    def __init__(self):
        pass

    async def recommend_price(
        self,
        material_cost: float,
        labour_cost: float,
        category: str = "Handicrafts",
        quality: str = "medium",
        product_name: str = "",
    ) -> dict:
        """
        Generate AI price recommendation based on costs and market data.

        Returns:
            recommended_price: int
            price_range: {min, max}
            cost_breakdown: dict
            market_analysis: dict
            explanation: str
        """
        # Get category data
        cat_data = CATEGORY_PRICING.get(category, CATEGORY_PRICING["Handicrafts"])
        quality_mult = QUALITY_MULTIPLIERS.get(quality, 1.0)

        # Get seasonal factor
        month = datetime.now().strftime("%B").lower()
        seasonal = SEASONAL_FACTORS.get(month, 1.0)

        # Calculate costs
        total_cost = material_cost + labour_cost
        margin = total_cost * cat_data["avg_margin"]
        raw_price = (total_cost + margin) * quality_mult * seasonal * cat_data["demand_factor"]

        # Round to nearest 9 or 49 for psychological pricing
        recommended = self._psychological_price(raw_price)

        # Calculate range (±10%)
        range_min = self._psychological_price(recommended * 0.90)
        range_max = self._psychological_price(recommended * 1.10)

        # Market analysis
        market_avg = cat_data["market_avg"] * quality_mult * seasonal
        is_competitive = recommended <= market_avg * 1.15

        # Determine competitive status
        if recommended < market_avg * 0.85:
            competitive_status = "below_market"
            status_label = "Below Market Average"
        elif recommended > market_avg * 1.15:
            competitive_status = "above_market"
            status_label = "Above Market Average"
        else:
            competitive_status = "competitive"
            status_label = "Competitive"

        # Build explanation
        explanation_parts = [
            f"Based on your costs (₹{material_cost:.0f} materials + ₹{labour_cost:.0f} labour)",
            f"with {quality} quality tier",
            f"and current {category} market trends",
        ]
        if seasonal > 1.05:
            explanation_parts.append(f"(seasonal demand is high)")
        elif seasonal < 0.95:
            explanation_parts.append(f"(seasonal demand is low)")

        # Try AI-enhanced pricing
        ai_result = None
        if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("sk-your"):
            ai_result = await self._get_ai_pricing_suggestion(
                material_cost, labour_cost, category, quality, product_name
            )

        return {
            "recommended_price": recommended,
            "price_range": {
                "min": range_min,
                "max": range_max,
            },
            "cost_breakdown": {
                "material_cost": material_cost,
                "labour_cost": labour_cost,
                "total_cost": total_cost,
                "margin": round(margin, 2),
                "quality_multiplier": quality_mult,
                "seasonal_factor": seasonal,
            },
            "market_analysis": {
                "market_average": round(market_avg),
                "competitive_status": competitive_status,
                "status_label": status_label,
                "demand_factor": cat_data["demand_factor"],
                "seasonal_factor": seasonal,
            },
            "explanation": ". ".join(explanation_parts) + ".",
            "ai_enhanced": ai_result is not None,
            "ai_suggestion": ai_result,
        }

    def _psychological_price(self, price: float) -> int:
        """Round price to a psychologically appealing number."""
        price = int(round(price))
        if price < 100:
            # Round to nearest 9
            return max(49, (price // 10) * 10 - 1)
        elif price < 500:
            # Round to nearest 49
            return (price // 50) * 50 - 1
        elif price < 1000:
            # Round to nearest 99
            return (price // 100) * 100 - 1
        else:
            # Round to nearest 99
            return (price // 100) * 100 - 1

    async def _get_ai_pricing_suggestion(
        self,
        material_cost: float,
        labour_cost: float,
        category: str,
        quality: str,
        product_name: str,
    ) -> Optional[dict]:
        """Get AI-enhanced pricing suggestion from OpenAI."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": OPENAI_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an expert pricing consultant for Indian handicraft products. Analyze costs and suggest optimal pricing. Return JSON with: suggested_price, reasoning, tips (list).",
                            },
                            {
                                "role": "user",
                                "content": f"Product: {product_name}\nCategory: {category}\nQuality: {quality}\nMaterial cost: ₹{material_cost}\nLabour cost: ₹{labour_cost}\n\nSuggest the best selling price.",
                            },
                        ],
                        "response_format": {"type": "json_object"},
                        "max_tokens": 300,
                    },
                    timeout=20.0,
                )

                if response.status_code == 200:
                    import json
                    content = response.json()["choices"][0]["message"]["content"]
                    return json.loads(content)

        except Exception:
            pass

        return None

    def get_market_insights(self, category: str) -> dict:
        """Get market insights for a category."""
        cat_data = CATEGORY_PRICING.get(category, CATEGORY_PRICING["Handicrafts"])
        month = datetime.now().strftime("%B").lower()

        return {
            "category": category,
            "market_average": cat_data["market_avg"],
            "price_range": {
                "min": cat_data["base_min"],
                "max": cat_data["base_max"],
            },
            "demand_factor": cat_data["demand_factor"],
            "seasonal_factor": SEASONAL_FACTORS.get(month, 1.0),
            "recommended_margin": cat_data["avg_margin"] * 100,
            "trend": "increasing" if cat_data["demand_factor"] > 1.05 else "stable",
        }

    def batch_pricing(self, products: List[dict]) -> List[dict]:
        """Generate pricing recommendations for multiple products."""
        results = []
        for product in products:
            material = product.get("material_cost", 300)
            labour = product.get("labour_cost", 200)
            cat = product.get("category", "Handicrafts")
            quality = product.get("quality", "medium")

            total = material + labour
            cat_data = CATEGORY_PRICING.get(cat, CATEGORY_PRICING["Handicrafts"])
            quality_mult = QUALITY_MULTIPLIERS.get(quality, 1.0)

            price = total * (1 + cat_data["avg_margin"]) * quality_mult
            price = self._psychological_price(price)

            results.append({
                "product_name": product.get("name", "Unknown"),
                "recommended_price": price,
                "is_profitable": price > total * 1.2,
            })

        return results


# Singleton
pricing_service = PricingService()
