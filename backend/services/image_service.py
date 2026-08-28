"""
KarigarAI - Image Processing Service

Handles:
- Background removal (simulated + OpenAI Vision API)
- Image enhancement (lighting, quality)
- Image resizing for e-commerce
- Before/after comparison generation
"""

import os
import uuid
import asyncio
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime, timezone

try:
    from PIL import Image, ImageEnhance, ImageFilter, ImageOps
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

import httpx

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./outputs"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class ImageService:
    """Service for AI-powered image processing."""

    def __init__(self):
        self.upload_dir = UPLOAD_DIR
        self.output_dir = OUTPUT_DIR

    async def save_upload(self, file_content: bytes, filename: str) -> str:
        """Save uploaded file and return the path."""
        ext = Path(filename).suffix or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = self.upload_dir / unique_name

        with open(file_path, "wb") as f:
            f.write(file_content)

        return str(file_path)

    async def enhance_image(
        self,
        image_path: str,
        remove_bg: bool = True,
        improve_lighting: bool = True,
        enhance_quality: bool = True,
    ) -> dict:
        """
        Enhance an image with AI processing.

        Returns dict with:
            - original_path: str
            - enhanced_path: str
            - processing_time_ms: int
            - enhancements_applied: list[str]
        """
        start_time = datetime.now(timezone.utc)
        enhancements_applied = []

        if not HAS_PILLOW:
            # Fallback: return a mock result
            return {
                "original_path": image_path,
                "enhanced_path": image_path,
                "processing_time_ms": 150,
                "enhancements_applied": ["mock_processing"],
                "message": "Pillow not installed - using mock processing",
            }

        try:
            img = Image.open(image_path)

            # Step 1: Background removal (simulated with white bg replacement)
            if remove_bg:
                img = self._remove_background_simulated(img)
                enhancements_applied.append("background_removal")

            # Step 2: Improve lighting
            if improve_lighting:
                img = self._improve_lighting(img)
                enhancements_applied.append("lighting_improvement")

            # Step 3: Enhance quality
            if enhance_quality:
                img = self._enhance_quality(img)
                enhancements_applied.append("quality_enhancement")

            # Step 4: Resize for e-commerce (800x800)
            img = self._resize_for_ecommerce(img)
            enhancements_applied.append("ecommerce_resize")

            # Save enhanced image
            output_name = f"enhanced_{uuid.uuid4().hex}.jpg"
            output_path = self.output_dir / output_name
            img.save(output_path, "JPEG", quality=95)

            processing_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

            return {
                "original_path": image_path,
                "enhanced_path": str(output_path),
                "processing_time_ms": processing_time,
                "enhancements_applied": enhancements_applied,
                "width": img.width,
                "height": img.height,
            }

        except Exception as e:
            return {
                "original_path": image_path,
                "enhanced_path": image_path,
                "processing_time_ms": 0,
                "enhancements_applied": [],
                "error": str(e),
            }

    def _remove_background_simulated(self, img: Image.Image) -> Image.Image:
        """Simulated background removal - replaces near-white backgrounds."""
        img = img.convert("RGBA")
        data = img.getdata()

        new_data = []
        for item in data:
            # If pixel is near white, make it transparent
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)

        img.putdata(new_data)

        # Create white background
        background = Image.new("RGBA", img.size, (255, 255, 255, 255))
        background.paste(img, mask=img.split()[3])
        return background.convert("RGB")

    def _improve_lighting(self, img: Image.Image) -> Image.Image:
        """Improve image brightness and contrast."""
        # Increase brightness slightly
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(1.1)

        # Increase contrast slightly
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.15)

        return img

    def _enhance_quality(self, img: Image.Image) -> Image.Image:
        """Enhance overall image quality."""
        # Increase sharpness
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.3)

        # Increase color saturation slightly
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.1)

        # Apply slight denoise
        img = img.filter(ImageFilter.SMOOTH_MORE)

        return img

    def _resize_for_ecommerce(self, img: Image.Image, size: Tuple[int, int] = (800, 800)) -> Image.Image:
        """Resize image to standard e-commerce dimensions."""
        img.thumbnail(size, Image.Resampling.LANCZOS)

        # Create square canvas with white background
        canvas = Image.new("RGB", size, (255, 255, 255))
        offset = ((size[0] - img.width) // 2, (size[1] - img.height) // 2)
        canvas.paste(img, offset)

        return canvas

    async def analyze_image_with_ai(self, image_path: str) -> dict:
        """
        Use OpenAI Vision API to analyze a product image.
        Returns product suggestions, category, etc.
        """
        if not OPENAI_API_KEY or OPENAI_API_KEY.startswith("sk-your"):
            return {
                "suggestion": "AI analysis requires OpenAI API key",
                "category": "Handicrafts",
                "quality_score": 7,
                "improvements": ["Better lighting recommended", "Consider removing background"],
            }

        try:
            import base64
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode()

            ext = Path(image_path).suffix.lower().lstrip(".")
            mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")

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
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": "Analyze this product image. Return JSON with: category, quality_score (1-10), improvements (list of strings), suggested_name, suggested_price_range."},
                                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{image_data}"}},
                                ],
                            }
                        ],
                        "max_tokens": 500,
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
                else:
                    return {"error": f"API error: {response.status_code}"}

        except Exception as e:
            return {"error": str(e)}


# Singleton
image_service = ImageService()
