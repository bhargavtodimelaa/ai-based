"""
KarigarAI - Image Router

Endpoints:
- POST /api/images/upload         - Upload a product image
- POST /api/images/enhance        - AI-enhance an uploaded image
- POST /api/images/remove-bg      - Remove background
- POST /api/images/analyze        - AI analysis of product image
- GET  /api/images/{filename}     - Serve uploaded/enhanced images
"""

import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Query, Body
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Optional
from pydantic import BaseModel

from services.image_service import image_service

router = APIRouter(prefix="/api/images", tags=["images"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./outputs"))
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10")) * 1024 * 1024


# ---- Schemas ----
class EnhanceRequest(BaseModel):
    image_path: str
    remove_bg: bool = True
    improve_lighting: bool = True
    enhance_quality: bool = True


class EnhanceResponse(BaseModel):
    original_path: str
    enhanced_path: str
    processing_time_ms: int
    enhancements_applied: list
    width: Optional[int] = None
    height: Optional[int] = None
    message: Optional[str] = None
    error: Optional[str] = None


class UploadResponse(BaseModel):
    filename: str
    path: str
    size_bytes: int
    url: str


class AnalyzeResponse(BaseModel):
    analysis: dict


# ---- Endpoints ----
@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload a product image for processing."""

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Read and check size
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {MAX_UPLOAD_SIZE // (1024*1024)}MB"
        )

    # Save file
    path = await image_service.save_upload(content, file.filename)

    return UploadResponse(
        filename=Path(path).name,
        path=path,
        size_bytes=len(content),
        url=f"/api/images/{Path(path).name}",
    )


@router.post("/enhance", response_model=EnhanceResponse)
async def enhance_image(request: EnhanceRequest):
    """AI-enhance a product image."""

    if not os.path.exists(request.image_path):
        raise HTTPException(status_code=404, detail="Image not found")

    result = await image_service.enhance_image(
        image_path=request.image_path,
        remove_bg=request.remove_bg,
        improve_lighting=request.improve_lighting,
        enhance_quality=request.enhance_quality,
    )

    return EnhanceResponse(**result)


@router.post("/remove-bg", response_model=EnhanceResponse)
async def remove_background(image_path: str = Body(...)):
    """Remove background from an image (shortcut endpoint)."""

    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")

    result = await image_service.enhance_image(
        image_path=image_path,
        remove_bg=True,
        improve_lighting=False,
        enhance_quality=False,
    )

    return EnhanceResponse(**result)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(image_path: str = Body(...)):
    """AI analysis of a product image - suggests category, quality, improvements."""

    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")

    analysis = await image_service.analyze_image_with_ai(image_path)
    return AnalyzeResponse(analysis=analysis)


@router.get("/{filename}")
async def serve_image(filename: str):
    """Serve an uploaded or processed image."""

    # Check uploads directory
    upload_path = UPLOAD_DIR / filename
    if upload_path.exists():
        return FileResponse(str(upload_path))

    # Check outputs directory
    output_path = OUTPUT_DIR / filename
    if output_path.exists():
        return FileResponse(str(output_path))

    raise HTTPException(status_code=404, detail="Image not found")
