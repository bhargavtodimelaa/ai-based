"""
KarigarAI - Products Router

Endpoints:
- GET    /api/products          - List all products (with filtering/sorting)
- GET    /api/products/{id}     - Get single product
- POST   /api/products          - Create new product
- PUT    /api/products/{id}     - Update product
- DELETE /api/products/{id}     - Delete product
- POST   /api/products/{id}/publish - Publish product
- GET    /api/products/stats    - Get product statistics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from models.database import get_db, Product, ProductStatus

router = APIRouter(prefix="/api/products", tags=["products"])


# ---- Pydantic Schemas ----
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    name_hi: Optional[str] = None
    name_te: Optional[str] = None
    description: Optional[str] = None
    description_hi: Optional[str] = None
    description_te: Optional[str] = None
    price: float = Field(..., gt=0)
    original_price: Optional[float] = None
    category: str = Field(..., min_length=1)
    status: str = "draft"
    emoji: Optional[str] = None
    material: Optional[str] = None
    craft_type: Optional[str] = None
    keywords: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    original_image: Optional[str] = None
    enhanced_image: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    name_hi: Optional[str] = None
    name_te: Optional[str] = None
    description: Optional[str] = None
    description_hi: Optional[str] = None
    description_te: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    category: Optional[str] = None
    status: Optional[str] = None
    emoji: Optional[str] = None
    material: Optional[str] = None
    craft_type: Optional[str] = None
    keywords: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    original_image: Optional[str] = None
    enhanced_image: Optional[str] = None
    featured: Optional[bool] = None
    popularity: Optional[int] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    name_hi: Optional[str] = None
    name_te: Optional[str] = None
    description: Optional[str] = None
    description_hi: Optional[str] = None
    description_te: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    category: str
    status: str
    emoji: Optional[str] = None
    material: Optional[str] = None
    craft_type: Optional[str] = None
    keywords: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    original_image: Optional[str] = None
    enhanced_image: Optional[str] = None
    featured: bool = False
    popularity: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductStats(BaseModel):
    total_products: int
    published: int
    drafts: int
    total_revenue: float
    categories: dict


# ---- Endpoints ----
@router.get("/stats", response_model=ProductStats)
def get_product_stats(db: Session = Depends(get_db)):
    """Get product statistics."""
    total = db.query(Product).count()
    published = db.query(Product).filter(Product.status == "published").count()
    drafts = db.query(Product).filter(Product.status == "draft").count()

    # Revenue from published products (simplified)
    revenue = db.query(func.sum(Product.price)).filter(
        Product.status == "published"
    ).scalar() or 0

    # Category counts
    categories = {}
    for cat, count in db.query(Product.category, func.count(Product.id)).group_by(Product.category).all():
        categories[cat] = count

    return ProductStats(
        total_products=total,
        published=published,
        drafts=drafts,
        total_revenue=float(revenue),
        categories=categories,
    )


@router.get("", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "newest",
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all products with optional filtering and sorting."""
    query = db.query(Product)

    if category:
        query = query.filter(Product.category == category)
    if status:
        query = query.filter(Product.status == status)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Product.name.ilike(search_term) |
            Product.description.ilike(search_term) |
            Product.category.ilike(search_term)
        )

    # Sorting
    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "name":
        query = query.order_by(Product.name.asc())
    elif sort == "popularity":
        query = query.order_by(Product.popularity.desc())
    else:  # newest
        query = query.order_by(Product.created_at.desc())

    products = query.offset(offset).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    product = Product(**product_data.model_dump())
    product.created_at = datetime.now(timezone.utc)
    product.updated_at = datetime.now(timezone.utc)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, update_data: ProductUpdate, db: Session = Depends(get_db)):
    """Update an existing product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(product, key, value)

    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted", "id": product_id}


@router.post("/{product_id}/publish", response_model=ProductResponse)
def publish_product(product_id: int, db: Session = Depends(get_db)):
    """Publish a product (set status to 'published')."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.status = "published"
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return product


@router.post("/{product_id}/duplicate", response_model=ProductResponse, status_code=201)
def duplicate_product(product_id: int, db: Session = Depends(get_db)):
    """Create a copy of an existing product."""
    original = db.query(Product).filter(Product.id == product_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Product not found")

    duplicate_data = {
        "name": f"{original.name} (Copy)",
        "name_hi": original.name_hi,
        "name_te": original.name_te,
        "description": original.description,
        "description_hi": original.description_hi,
        "description_te": original.description_te,
        "price": original.price,
        "original_price": original.original_price,
        "category": original.category,
        "status": "draft",
        "emoji": original.emoji,
        "material": original.material,
        "craft_type": original.craft_type,
        "keywords": original.keywords,
        "languages": original.languages,
    }

    product = Product(**duplicate_data)
    product.created_at = datetime.now(timezone.utc)
    product.updated_at = datetime.now(timezone.utc)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
