"""
KarigarAI - Catalog Router

Endpoints:
- POST /api/catalog/transcribe      - Transcribe audio to text
- POST /api/catalog/generate        - Generate product listing from text
- POST /api/catalog/transcribe-and-generate - Full pipeline: audio → text → listing
- GET  /api/catalog/languages       - Get supported languages
- POST /api/catalog/classify        - Classify product category from text
"""

import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List
from pydantic import BaseModel

from services.speech_service import speech_service
from services.catalog_service import catalog_service

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


# ---- Schemas ----
class TranscribeResponse(BaseModel):
    text: str
    language: str
    language_name: str
    confidence: float
    audio_path: Optional[str] = None
    processing_time_ms: Optional[int] = None
    demo_mode: bool = True


class GenerateRequest(BaseModel):
    text: str
    language: str = "en"


class ListingResponse(BaseModel):
    name: str
    description: str
    category: str
    keywords: List[str]
    suggested_price_range: dict
    languages: List[str]
    ai_generated: bool = False
    demo_mode: bool = False


class FullPipelineResponse(BaseModel):
    transcription: TranscribeResponse
    listing: ListingResponse
    multilingual: Optional[dict] = None


class ClassifyResponse(BaseModel):
    category: str
    keywords: List[str]
    confidence: float


class LanguagesResponse(BaseModel):
    languages: dict


# ---- Endpoints ----
@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    """Transcribe audio to text using speech recognition."""

    # Validate audio file
    allowed_types = {
        "audio/webm", "audio/mp3", "audio/mpeg", "audio/wav",
        "audio/ogg", "audio/flac", "audio/m4a", "audio/aac",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid audio type. Allowed: {', '.join(allowed_types)}"
        )

    # Save audio file
    content = await file.read()
    audio_path = await speech_service.save_audio(content, file.filename)

    # Transcribe
    result = await speech_service.transcribe(audio_path, language)

    return TranscribeResponse(**result)


@router.post("/generate", response_model=ListingResponse)
async def generate_listing(request: GenerateRequest):
    """Generate a product listing from text description."""

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    listing = await catalog_service.generate_listing(
        raw_text=request.text,
        language=request.language,
    )

    return ListingResponse(**listing)


@router.post("/transcribe-and-generate", response_model=FullPipelineResponse)
async def transcribe_and_generate(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    generate_multilingual: bool = Form(False),
):
    """Full pipeline: upload audio → transcribe → generate listing."""

    # Transcribe
    content = await file.read()
    audio_path = await speech_service.save_audio(content, file.filename)
    transcription = await speech_service.transcribe(audio_path, language)

    # Generate listing from transcribed text
    listing = await catalog_service.generate_listing(
        raw_text=transcription["text"],
        language=transcription["language"],
    )

    # Optionally generate multilingual versions
    multilingual = None
    if generate_multilingual:
        multilingual = catalog_service.generate_multilingual_listing(listing)

    return FullPipelineResponse(
        transcription=TranscribeResponse(**transcription),
        listing=ListingResponse(**listing),
        multilingual=multilingual,
    )


@router.get("/languages", response_model=LanguagesResponse)
def get_supported_languages():
    """Get list of supported languages for voice cataloging."""
    return LanguagesResponse(languages=speech_service.get_supported_languages())


@router.post("/classify", response_model=ClassifyResponse)
def classify_text(text: str = Form(...)):
    """Classify product category from text description."""

    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    category = catalog_service.classify_category(text)
    keywords = catalog_service.extract_keywords(text)

    return ClassifyResponse(
        category=category,
        keywords=keywords,
        confidence=0.85,
    )
