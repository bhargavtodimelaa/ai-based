"""
KarigarAI - Image Router (v3 - fixed)

Uses Pydantic models for ALL request bodies to avoid 422 errors.
"""

import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Optional
from pydantic import BaseModel

from services.image_service import image_service

router = APIRouter(prefix="/api/images", tags=["images"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./outputs"))
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10")) * 1024 * 1024


# ---- Request/Response Models ----
class EnhanceRequest(BaseModel):
    image_path: str
    remove_bg: bool = True
    improve_lighting: bool = True
    enhance_quality: bool = True


class AnalyzeRequest(BaseModel):
    image_path: str


class UploadResponse(BaseModel):
    filename: str
    path: str
    url: str
    size_bytes: int
    width: int = 0
    height: int = 0


class EnhanceResponse(BaseModel):
    original_url: str
    enhanced_url: str
    processing_time_ms: int
    enhancements_applied: list
    width: Optional[int] = None
    height: Optional[int] = None
    error: Optional[str] = None


class AnalyzeResponse(BaseModel):
    width: int = 0
    height: int = 0
    megapixels: float = 0
    aspect_ratio: str = ""
    quality_score: int = 0
    brightness: dict = {}
    contrast: dict = {}
    sharpness: dict = {}
    colors: dict = {}
    edges: dict = {}
    background: dict = {}
    suggested_category: str = ""
    improvements: list = []
    is_ecommerce_ready: bool = False


# ---- Endpoints ----

@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload a product image. Returns the URL to access it."""
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
    if file.content_type not in allowed:
        raise HTTPException(400, f"Invalid type. Allowed: {', '.join(allowed)}")

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(413, f"Too large. Max {MAX_UPLOAD_SIZE // (1024*1024)}MB")

    result = await image_service.save_upload(content, file.filename)

    return UploadResponse(
        filename=result["filename"],
        path=result["path"],
        url=result["url"],
        size_bytes=result["size_bytes"],
        width=result["width"],
        height=result["height"],
    )


@router.post("/enhance", response_model=EnhanceResponse)
async def enhance_image(request: EnhanceRequest):
    """Enhance an image. Returns before/after URLs."""
    if not os.path.exists(request.image_path):
        raise HTTPException(404, "Image not found on disk")

    result = await image_service.enhance_image(
        image_path=request.image_path,
        remove_bg=request.remove_bg,
        improve_lighting=request.improve_lighting,
        enhance_quality=request.enhance_quality,
    )
    return EnhanceResponse(**result)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(request: AnalyzeRequest):
    """ML analysis of a product image. Returns quality scores, colors, suggestions."""
    if not os.path.exists(request.image_path):
        raise HTTPException(404, "Image not found on disk")

    result = image_service.analyze_image(request.image_path)
    return AnalyzeResponse(**result)


@router.get("/{filename}")
async def serve_image(filename: str):
    """Serve any uploaded or processed image by filename."""
    upload_path = UPLOAD_DIR / filename
    if upload_path.exists():
        return FileResponse(str(upload_path))

    output_path = OUTPUT_DIR / filename
    if output_path.exists():
        return FileResponse(str(output_path))

    raise HTTPException(404, "Image not found")
