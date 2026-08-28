"""
KarigarAI - Orders Router

Endpoints:
- GET    /api/orders              - List all orders (with filtering)
- GET    /api/orders/{id}         - Get single order with timeline
- POST   /api/orders              - Create new order
- PUT    /api/orders/{id}/status  - Update order status
- GET    /api/orders/stats        - Get order statistics
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from models.database import get_db, Order, Product

router = APIRouter(prefix="/api/orders", tags=["orders"])


# ---- Pydantic Schemas ----
class OrderCreate(BaseModel):
    product_id: int
    buyer_name: str = Field(..., min_length=1, max_length=255)
    buyer_address: Optional[str] = None
    quantity: int = Field(1, ge=1, le=100)
    price: float = Field(..., gt=0)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|processing|shipped|completed|cancelled)$")


class OrderTimeline(BaseModel):
    step: str
    date: Optional[str] = None
    completed: bool = False


class OrderResponse(BaseModel):
    id: int
    order_id: str
    product_id: int
    product_name: Optional[str] = None
    product_emoji: Optional[str] = None
    buyer_name: str
    buyer_address: Optional[str] = None
    quantity: int
    price: float
    status: str
    timeline: List[OrderTimeline] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderStats(BaseModel):
    total_orders: int
    pending: int
    processing: int
    completed: int
    total_revenue: float
    avg_order_value: float


# ---- Status to Timeline Mapping ----
STATUS_TIMELINE = {
    "pending": [
        {"step": "Order received", "completed": True},
        {"step": "Processing", "completed": False},
        {"step": "Shipped", "completed": False},
        {"step": "Delivered", "completed": False},
    ],
    "processing": [
        {"step": "Order received", "completed": True},
        {"step": "Processing", "completed": True},
        {"step": "Shipped", "completed": False},
        {"step": "Delivered", "completed": False},
    ],
    "shipped": [
        {"step": "Order received", "completed": True},
        {"step": "Processing", "completed": True},
        {"step": "Shipped", "completed": True},
        {"step": "Delivered", "completed": False},
    ],
    "completed": [
        {"step": "Order received", "completed": True},
        {"step": "Processing", "completed": True},
        {"step": "Shipped", "completed": True},
        {"step": "Delivered", "completed": True},
    ],
    "cancelled": [
        {"step": "Order received", "completed": True},
        {"step": "Cancelled", "completed": True},
    ],
}


def _build_order_response(order: Order) -> dict:
    """Build order response with product details and timeline."""
    timeline_data = STATUS_TIMELINE.get(order.status, STATUS_TIMELINE["pending"])

    # Add dates to timeline
    if order.status in ["processing", "shipped", "completed"]:
        timeline_data[1]["date"] = order.created_at.strftime("%b %d, %Y") if order.created_at else ""
    if order.status in ["shipped", "completed"]:
        timeline_data[2]["date"] = order.updated_at.strftime("%b %d, %Y") if order.updated_at else ""
    if order.status == "completed":
        timeline_data[3]["date"] = order.updated_at.strftime("%b %d, %Y") if order.updated_at else ""

    return {
        "id": order.id,
        "order_id": order.order_id,
        "product_id": order.product_id,
        "product_name": order.product.name if order.product else "Unknown",
        "product_emoji": order.product.emoji if order.product else "📦",
        "buyer_name": order.buyer_name,
        "buyer_address": order.buyer_address,
        "quantity": order.quantity,
        "price": order.price,
        "status": order.status,
        "timeline": timeline_data,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


# ---- Endpoints ----
@router.get("/stats", response_model=OrderStats)
def get_order_stats(db: Session = Depends(get_db)):
    """Get order statistics."""
    total = db.query(Order).count()
    pending = db.query(Order).filter(Order.status == "pending").count()
    processing = db.query(Order).filter(Order.status == "processing").count()
    completed = db.query(Order).filter(Order.status == "completed").count()

    revenue = db.query(func.sum(Order.price)).filter(
        Order.status == "completed"
    ).scalar() or 0

    avg_value = db.query(func.avg(Order.price)).scalar() or 0

    return OrderStats(
        total_orders=total,
        pending=pending,
        processing=processing,
        completed=completed,
        total_revenue=float(revenue),
        avg_order_value=round(float(avg_value), 2),
    )


@router.get("", response_model=List[OrderResponse])
def list_orders(
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all orders with optional status filter."""
    query = db.query(Order).options(joinedload(Order.product))

    if status:
        query = query.filter(Order.status == status)

    query = query.order_by(Order.created_at.desc())
    orders = query.offset(offset).limit(limit).all()

    return [_build_order_response(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    """Get a single order by order_id (e.g., 'ORD-1024')."""
    order = db.query(Order).options(joinedload(Order.product)).filter(
        Order.order_id == order_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _build_order_response(order)


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    """Create a new order."""
    # Verify product exists
    product = db.query(Product).filter(Product.id == order_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Generate order ID
    count = db.query(Order).count()
    order_id = f"ORD-{1000 + count + 1}"

    order = Order(
        order_id=order_id,
        product_id=order_data.product_id,
        buyer_name=order_data.buyer_name,
        buyer_address=order_data.buyer_address,
        quantity=order_data.quantity,
        price=order_data.price,
        status="pending",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    db.add(order)
    db.commit()
    db.refresh(order)
    return _build_order_response(order)


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: str, update: OrderStatusUpdate, db: Session = Depends(get_db)):
    """Update order status (pending → processing → shipped → completed)."""
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = update.status
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return _build_order_response(order)
