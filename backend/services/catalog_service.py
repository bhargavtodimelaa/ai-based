"""
KarigarAI - Catalog Service

Handles:
- Generating product listings from voice/text descriptions
- Multi-language product content generation
- Product keyword extraction
- Category classification
- Listing optimization
"""

import os
import re
import uuid
from typing import Optional, List
from datetime import datetime, timezone

import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Category mappings for classification
CATEGORY_KEYWORDS = {
    "Textiles": ["silk", "cotton", "saree", "dupatta", "weaving", "woven", "fabric", "thread", "loom", "zari", "embroidery", "纺织", "cloth", "textile"],
    "Handicrafts": ["basket", "bamboo", "wood", "carved", "pottery", "terracotta", "clay", "jute", "leather", "craft", "handmade"],
    "Jewellery": ["necklace", "earring", "bangle", "ring", "silver", "gold", "bead", "pendant", "chain", "anklet", "bracelet"],
    "Home Decor": ["vase", "lamp", "candle", "frame", "decor", "decorative", "mirror", "rug", "mat", "cushion", "brass"],
}

# Quality tiers
QUALITY_TIERS = {
    "high": {"multiplier": 1.3, "label": "High"},
    "medium": {"multiplier": 1.15, "label": "Medium"},
    "standard": {"multiplier": 1.0, "label": "Standard"},
}

# Demo product names for listing generation
DEMO_PRODUCT_NAMES = [
    "Handwoven Silk Saree",
    "Bamboo Storage Basket",
    "Terracotta Decorative Vase",
    "Handmade Jute Tote Bag",
    "Carved Wooden Jewelry Box",
    "Silver Filigree Necklace",
    "Block Print Cotton Dupatta",
    "Brass Diya Lamp",
]


class CatalogService:
    """Service for AI-powered product cataloging."""

    def __init__(self):
        pass

    def classify_category(self, text: str) -> str:
        """Classify product category based on text description."""
        text_lower = text.lower()
        scores = {}

        for category, keywords in CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            scores[category] = score

        if max(scores.values()) > 0:
            return max(scores, key=scores.get)
        return "Handicrafts"  # Default

    def extract_keywords(self, text: str, max_keywords: int = 5) -> List[str]:
        """Extract relevant keywords from product description."""
        # Simple keyword extraction
        common_words = {"the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
                        "have", "has", "had", "do", "does", "did", "will", "would", "could",
                        "should", "may", "might", "can", "shall", "with", "and", "or", "but",
                        "in", "on", "at", "to", "for", "of", "by", "from", "as", "into",
                        "through", "during", "before", "after", "above", "below", "between",
                        "this", "that", "these", "those", "it", "its", "i", "we", "you",
                        "he", "she", "they", "me", "him", "her", "us", "them", "my", "our",
                        "your", "his", "their", "what", "which", "who", "when", "where", "how",
                        "all", "each", "every", "both", "few", "more", "most", "other", "some",
                        "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
                        "very", "just", "because", "if", "about", "up", "out", "also"}

        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        word_freq = {}
        for word in words:
            if word not in common_words:
                word_freq[word] = word_freq.get(word, 0) + 1

        # Sort by frequency and return top keywords
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [w[0] for w in sorted_words[:max_keywords]]

    async def generate_listing(self, raw_text: str, language: str = "en") -> dict:
        """
        Generate a complete product listing from raw description text.

        Uses OpenAI API if available, otherwise falls back to rule-based generation.
        """
        if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("sk-your"):
            return await self._generate_listing_ai(raw_text, language)
        else:
            return self._generate_listing_rule_based(raw_text, language)

    async def _generate_listing_ai(self, raw_text: str, language: str) -> dict:
        """Generate listing using OpenAI API."""
        try:
            system_prompt = """You are an expert product listing generator for Indian artisans and handicraft makers.
Given a raw product description, generate a professional e-commerce listing.
Return JSON with: name, description, category, keywords (list), suggested_price_range (min, max).
Be concise and professional. Focus on craft quality, materials, and cultural significance."""

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
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"Generate a product listing from this description:\n\n{raw_text}"},
                        ],
                        "response_format": {"type": "json_object"},
                        "max_tokens": 500,
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    import json
                    content = response.json()["choices"][0]["message"]["content"]
                    listing = json.loads(content)
                    listing["ai_generated"] = True
                    listing["language"] = language
                    return listing

        except Exception as e:
            pass

        # Fallback to rule-based
        return self._generate_listing_rule_based(raw_text, language)

    def _generate_listing_rule_based(self, raw_text: str, language: str) -> dict:
        """Generate listing using rule-based approach (no API needed)."""
        category = self.classify_category(raw_text)
        keywords = self.extract_keywords(raw_text)

        # Generate a clean name from the first meaningful phrase
        sentences = re.split(r'[.!?]', raw_text)
        first_sentence = sentences[0].strip() if sentences else raw_text[:50]
        name = first_sentence.title()
        if len(name) > 60:
            name = name[:57] + "..."

        # Clean up description
        description = raw_text.strip()
        if not description.endswith('.'):
            description += '.'

        # Estimate price range based on category and keywords
        base_prices = {
            "Textiles": 800,
            "Handicrafts": 600,
            "Jewellery": 1500,
            "Home Decor": 700,
        }
        base = base_prices.get(category, 700)

        return {
            "name": name,
            "description": description,
            "category": category,
            "keywords": keywords,
            "suggested_price_range": {
                "min": base - 200,
                "max": base + 500,
            },
            "languages": [language],
            "ai_generated": False,
            "demo_mode": True,
        }

    def generate_multilingual_listing(self, listing: dict, target_languages: List[str] = None) -> dict:
        """
        Generate multi-language versions of a listing.
        In production, this would use a translation API.
        """
        if target_languages is None:
            target_languages = ["en", "hi", "te"]

        translations = {"en": listing}

        # For demo, provide simple translations
        demo_translations = {
            "hi": {
                "name_hi": listing.get("name", ""),
                "description_hi": listing.get("description", ""),
            },
            "te": {
                "name_te": listing.get("name", ""),
                "description_te": listing.get("description", ""),
            },
        }

        for lang in target_languages:
            if lang in demo_translations:
                translations[lang] = demo_translations[lang]

        return {
            "listing": listing,
            "translations": translations,
            "available_languages": target_languages,
        }


# Singleton
catalog_service = CatalogService()
