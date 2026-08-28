"""
KarigarAI - Speech Recognition Service

Handles:
- Audio file upload and processing
- Speech-to-text conversion
- Language detection (English, Hindi, Telugu)
- Voice-based product cataloging
"""

import os
import uuid
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Supported languages
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
}

# Simulated speech-to-text results for demo mode
DEMO_TRANSCRIPTIONS = [
    {
        "text": "Handmade silk saree with traditional zari border, created using traditional weaving techniques passed down through generations. The saree features intricate gold thread work along the border and pallu.",
        "language": "en",
        "confidence": 0.95,
    },
    {
        "text": "हाथ से बनी सिल्क साड़ी जिसमें पारंपरिक ज़री बॉर्डर है, पीढ़ियों से चली आ रही पारंपरिक बुनाई तकनीक से बनाई गई।",
        "language": "hi",
        "confidence": 0.92,
    },
    {
        "text": "చేతితో తయారుచేసిన పట్టు చీర, సాంప్రదాయ జరీ బోర్డర్‌తో, తరతరాలుగా వస్తున్న సాంప్రదాయ వెల్లడి సాంకేతికతతో తయారు చేయబడింది।",
        "language": "te",
        "confidence": 0.88,
    },
    {
        "text": "Eco-friendly bamboo basket, handcrafted by skilled artisans. Perfect for home storage, decoration, or as a gift. Made from locally sourced sustainable bamboo.",
        "language": "en",
        "confidence": 0.97,
    },
    {
        "text": "Handmade terracotta vase with intricate traditional designs. Each piece is unique and tells a story of ancient pottery traditions.",
        "language": "en",
        "confidence": 0.94,
    },
]


class SpeechService:
    """Service for speech recognition and voice-based cataloging."""

    def __init__(self):
        self.upload_dir = UPLOAD_DIR

    async def save_audio(self, file_content: bytes, filename: str) -> str:
        """Save uploaded audio file."""
        ext = Path(filename).suffix or ".webm"
        unique_name = f"audio_{uuid.uuid4().hex}{ext}"
        file_path = self.upload_dir / unique_name

        with open(file_path, "wb") as f:
            f.write(file_content)

        return str(file_path)

    async def transcribe(self, audio_path: str, language: Optional[str] = None) -> dict:
        """
        Transcribe audio to text.

        In production, this would use:
        - Google Cloud Speech-to-Text
        - OpenAI Whisper API
        - Azure Speech Services
        - AssemblyAI

        For demo, returns simulated transcription.
        """
        # In demo mode, return a random simulated transcription
        import random
        demo = random.choice(DEMO_TRANSCRIPTIONS)

        return {
            "text": demo["text"],
            "language": demo["language"],
            "language_name": SUPPORTED_LANGUAGES.get(demo["language"], "Unknown"),
            "confidence": demo["confidence"],
            "audio_path": audio_path,
            "processing_time_ms": 850,
            "demo_mode": True,
        }

    async def transcribe_with_openai_whisper(self, audio_path: str) -> dict:
        """
        Use OpenAI Whisper API for actual transcription.
        Requires OPENAI_API_KEY environment variable.
        """
        openai_key = os.getenv("OPENAI_API_KEY", "")
        if not openai_key or openai_key.startswith("sk-your"):
            return await self.transcribe(audio_path)

        try:
            import httpx

            async with httpx.AsyncClient() as client:
                with open(audio_path, "rb") as f:
                    response = await client.post(
                        "https://api.openai.com/v1/audio/transcriptions",
                        headers={"Authorization": f"Bearer {openai_key}"},
                        files={"file": (Path(audio_path).name, f, "audio/webm")},
                        data={"model": "whisper-1"},
                        timeout=30.0,
                    )

                if response.status_code == 200:
                    result = response.json()
                    return {
                        "text": result.get("text", ""),
                        "language": result.get("language", "en"),
                        "language_name": SUPPORTED_LANGUAGES.get(result.get("language", "en"), "Unknown"),
                        "confidence": 0.95,
                        "audio_path": audio_path,
                        "demo_mode": False,
                    }
                else:
                    return await self.transcribe(audio_path)

        except Exception:
            return await self.transcribe(audio_path)

    def get_supported_languages(self) -> dict:
        """Return list of supported languages."""
        return SUPPORTED_LANGUAGES

    def detect_language_hints(self, text: str) -> str:
        """Simple language detection based on character ranges."""
        # Check for Telugu script
        if any('\u0C00' <= c <= '\u0C7F' for c in text):
            return "te"
        # Check for Devanagari (Hindi)
        if any('\u0900' <= c <= '\u097F' for c in text):
            return "hi"
        # Default to English
        return "en"


# Singleton
speech_service = SpeechService()
