"""
KarigarAI - Database Models & Setup
SQLite + SQLAlchemy ORM
"""

from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Text,
    Boolean, DateTime, JSON, ForeignKey, Enum as SAEnum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone
from typing import Optional
import enum
import os

# ---- Engine ----
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./karigarai.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite specific
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---- Enums ----
class ProductStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    delivered = "completed"
    cancelled = "cancelled"


# ---- Models ----
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=True)
    name_te = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    description_hi = Column(Text, nullable=True)
    description_te = Column(Text, nullable=True)
    price = Column(Float, nullable=False, default=0)
    original_price = Column(Float, nullable=True)
    category = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default="draft")
    emoji = Column(String(10), nullable=True)

    # Product details
    material = Column(String(100), nullable=True)
    craft_type = Column(String(100), nullable=True)
    keywords = Column(JSON, nullable=True)  # List of strings
    languages = Column(JSON, nullable=True)  # List of languages

    # Images
    original_image = Column(String(500), nullable=True)
    enhanced_image = Column(String(500), nullable=True)

    # Metadata
    featured = Column(Boolean, default=False)
    popularity = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    buyer_name = Column(String(255), nullable=False)
    buyer_address = Column(Text, nullable=True)
    quantity = Column(Integer, default=1)
    price = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product = relationship("Product", backref="orders")


class CatalogEntry(Base):
    __tablename__ = "catalog_entries"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    raw_text = Column(Text, nullable=True)
    detected_language = Column(String(20), nullable=True)
    generated_name = Column(String(255), nullable=True)
    generated_description = Column(Text, nullable=True)
    generated_keywords = Column(JSON, nullable=True)
    audio_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AIProcessingLog(Base):
    __tablename__ = "ai_processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    action = Column(String(50), nullable=False)  # "enhance_image", "generate_listing", "price"
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ---- Database Helpers ----
def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)


def seed_demo_data():
    """Seed the database with demo data if empty."""
    db = SessionLocal()
    try:
        if db.query(Product).count() > 0:
            return

        demo_products = [
            Product(
                name="Handwoven Silk Saree", name_hi="हाथ से बुनी सिल्क साड़ी",
                description="Beautifully handcrafted silk saree featuring a traditional zari border, created using traditional weaving techniques passed down through generations.",
                price=1299, original_price=1599, category="Textiles", status="published",
                emoji="🧶", material="Silk", craft_type="Handwoven",
                keywords=["silk", "handwoven", "zari", "saree", "traditional"],
                languages=["English", "Hindi"], featured=True, popularity=95
            ),
            Product(
                name="Bamboo Basket", name_hi="बांस की टोकरी",
                description="Eco-friendly bamboo basket, handcrafted by skilled artisans. Perfect for home storage, decoration, or as a gift.",
                price=799, category="Handicrafts", status="published",
                emoji="🧺", material="Bamboo", craft_type="Handcrafted",
                keywords=["bamboo", "basket", "eco-friendly", "handmade"],
                languages=["English"], featured=True, popularity=82
            ),
            Product(
                name="Terracotta Vase", name_hi="मिट्टी का फूलदान",
                description="Handmade terracotta vase with intricate traditional designs. Each piece is unique and tells a story.",
                price=599, category="Home Decor", status="draft",
                emoji="🏺", material="Terracotta", craft_type="Handmade",
                keywords=["terracotta", "vase", "handmade", "traditional"],
                languages=["English"], featured=False, popularity=71
            ),
            Product(
                name="Handmade Jute Bag", name_hi="हस्तनिर्मित जूट बैग",
                description="Sustainable jute bag with hand-painted traditional motifs. Strong, durable, and environmentally friendly.",
                price=449, category="Handicrafts", status="published",
                emoji="👜", material="Jute", craft_type="Hand-painted",
                keywords=["jute", "bag", "sustainable", "hand-painted"],
                languages=["English"], featured=False, popularity=68
            ),
            Product(
                name="Wooden Craft Box", name_hi="लकड़ी की शिल्प बॉक्स",
                description="Intricately carved wooden box using traditional techniques. Perfect for jewelry storage or as a decorative piece.",
                price=899, category="Handicrafts", status="published",
                emoji="📦", material="Wood", craft_type="Carved",
                keywords=["wooden", "carved", "box", "traditional"],
                languages=["English"], featured=True, popularity=77
            ),
            Product(
                name="Handcrafted Necklace", name_hi="हाथ से बना हार",
                description="Stunning handcrafted necklace with traditional silver work. A statement piece for any occasion.",
                price=1899, category="Jewellery", status="published",
                emoji="📿", material="Silver", craft_type="Handcrafted",
                keywords=["necklace", "silver", "handcrafted", "traditional"],
                languages=["English"], featured=True, popularity=88
            ),
            Product(
                name="Cotton Dupatta", name_hi="कपास की दुपट्टा",
                description="Lightweight cotton dupatta with hand-block printed patterns. Perfect for daily wear and special occasions.",
                price=699, category="Textiles", status="published",
                emoji="🧣", material="Cotton", craft_type="Block Printed",
                keywords=["cotton", "dupatta", "block print", "handmade"],
                languages=["English"], featured=False, popularity=65
            ),
            Product(
                name="Brass Decorative Lamp", name_hi="पीतल का सजावटी दीपक",
                description="Exquisite brass lamp with traditional Indian motifs. Creates a warm, inviting ambiance in any room.",
                price=1499, category="Home Decor", status="draft",
                emoji="🪔", material="Brass", craft_type="Handmade",
                keywords=["brass", "lamp", "decorative", "traditional"],
                languages=["English"], featured=True, popularity=84
            ),
        ]

        for p in demo_products:
            db.add(p)
        db.commit()

        # Seed demo orders
        demo_orders = [
            Order(order_id="ORD-1024", product_id=1, buyer_name="Priya Sharma",
                  buyer_address="Mumbai, Maharashtra", quantity=1, price=1299, status="pending"),
            Order(order_id="ORD-1023", product_id=6, buyer_name="Ananya Reddy",
                  buyer_address="Bangalore, Karnataka", quantity=2, price=3798, status="processing"),
            Order(order_id="ORD-1022", product_id=2, buyer_name="Rajesh Kumar",
                  buyer_address="Chennai, Tamil Nadu", quantity=3, price=2397, status="completed"),
            Order(order_id="ORD-1021", product_id=4, buyer_name="Meera Joshi",
                  buyer_address="Pune, Maharashtra", quantity=1, price=449, status="completed"),
            Order(order_id="ORD-1020", product_id=5, buyer_name="Vikram Singh",
                  buyer_address="Delhi, NCR", quantity=1, price=899, status="pending"),
        ]

        for o in demo_orders:
            db.add(o)
        db.commit()

        print("✅ Demo data seeded successfully")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
    finally:
        db.close()
