"""
SQLAlchemy Order and OrderItem Models
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(50), primary_key=True, index=True)
    user_name = Column(String(150), nullable=False)
    user_email = Column(String(255), nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="Pending", nullable=False)
    delivery_address = Column(String(500), nullable=False)
    payment_method = Column(String(100), default="Cash on Delivery (COD)", nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    image_url = Column(String(500), nullable=True)

    order = relationship("Order", back_populates="items")
