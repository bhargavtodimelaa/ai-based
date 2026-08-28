"""
KarigarAI - Backend API (Full-Stack)

FastAPI application that serves:
- REST API for products, orders, images, catalog, pricing
- Static frontend files (HTML, CSS, JS)
- Single-port deployment on Render
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure we can import from the backend directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.database import init_db, seed_demo_data


# ---- App Settings ----
class Settings(BaseSettings):
    app_name: str = os.getenv("APP_NAME", "KarigarAI")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    class Config:
        env_file = ".env"


settings = Settings()

# Frontend directory (one level up from backend/)
FRONTEND_DIR = Path(__file__).parent.parent / "karigar-ai"


# ---- Lifespan (startup/shutdown) ----
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    print(f"🏺 Starting {settings.app_name} v{settings.app_version}...")
    init_db()
    seed_demo_data()

    # Ensure directories exist
    Path("uploads").mkdir(exist_ok=True)
    Path("outputs").mkdir(exist_ok=True)

    # Check if frontend exists
    if FRONTEND_DIR.exists():
        print(f"📂 Frontend found at: {FRONTEND_DIR}")
    else:
        print(f"⚠️  Frontend directory not found at: {FRONTEND_DIR}")

    print(f"✅ {settings.app_name} is ready!")
    print(f"📡 API docs: http://localhost:{settings.port}/docs")
    print(f"🌐 Frontend: http://localhost:{settings.port}/")

    yield

    print(f"👋 Shutting down {settings.app_name}...")


# ---- Create App ----
app = FastAPI(
    title=f"{settings.app_name} API",
    description="AI-powered business manager for artisans.",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---- CORS (allow all origins in production) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Request Logging Middleware ----
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests in debug mode."""
    response = await call_next(request)
    if settings.debug and not request.url.path.startswith("/static") and not request.url.path.startswith("/css") and not request.url.path.startswith("/js"):
        print(f"  {request.method} {request.url.path} → {response.status_code}")
    return response


# ---- Include API Routers ----
from routers.products import router as products_router
from routers.orders import router as orders_router
from routers.image import router as image_router
from routers.catalog import router as catalog_router
from routers.pricing import router as pricing_router

app.include_router(products_router)
app.include_router(orders_router)
app.include_router(image_router)
app.include_router(catalog_router)
app.include_router(pricing_router)


# ---- API Info Endpoint ----
@app.get("/api")
async def api_info():
    """API information and available endpoints."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "products": "/api/products",
            "orders": "/api/orders",
            "images": "/api/images",
            "catalog": "/api/catalog",
            "pricing": "/api/pricing",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "version": settings.app_version}


# ---- Serve Frontend Static Files ----
# Mount CSS, JS, and assets directories
if FRONTEND_DIR.exists():
    css_dir = FRONTEND_DIR / "css"
    js_dir = FRONTEND_DIR / "js"
    assets_dir = FRONTEND_DIR / "assets"

    if css_dir.exists():
        app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")
    if js_dir.exists():
        app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


# ---- Catch-all: Serve index.html for frontend routes ----
@app.get("/")
@app.get("/app")
@app.get("/dashboard")
@app.get("/products")
@app.get("/marketplace")
@app.get("/orders")
@app.get("/profile")
async def serve_frontend():
    """Serve the KarigarAI frontend for all non-API routes."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return JSONResponse({
        "error": "Frontend not found",
        "message": "The frontend files are not available. Check that karigar-ai/ directory exists.",
        "api_docs": "/docs",
    }, status_code=404)


# ---- Run Server ----
if __name__ == "__main__":
    import uvicorn

    print(f"\n🏺 KarigarAI Backend")
    print(f"   Server: http://{settings.host}:{settings.port}")
    print(f"   Docs:   http://localhost:{settings.port}/docs")
    print(f"   Front:  http://localhost:{settings.port}/\n")

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
