from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class OrderItemCreate(BaseModel):
    menu_item_id: str
    quantity: int = Field(..., ge=1)
    price: float


class OrderItemResponse(BaseModel):
    menu_item_id: str
    name: Optional[str] = "Unknown Item"
    quantity: int = 1
    price: float = 0


class OrderStatus(BaseModel):
    confirmed: bool = False
    preparing: bool = False
    rider_left: bool = False
    delivered: bool = False


class OrderTimestamps(BaseModel):
    created_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    preparing_at: Optional[datetime] = None
    rider_left_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None


class OrderCreate(BaseModel):
    restaurant_id: str
    items: List[OrderItemCreate]
    customer_name: str = Field(..., min_length=1, max_length=100)
    customer_phone: str = Field(..., min_length=5, max_length=20)
    customer_address: str = Field(..., min_length=1, max_length=500)


class OrderUpdateStatus(BaseModel):
    """Used by admin/rider to update order status."""
    confirmed: Optional[bool] = None
    preparing: Optional[bool] = None
    rider_left: Optional[bool] = None
    delivered: Optional[bool] = None


class OrderAssignRider(BaseModel):
    rider_id: str


class OrderResponse(BaseModel):
    id: str
    restaurant_id: str
    restaurant_name: Optional[str] = None
    items: List[OrderItemResponse]
    total_amount: float
    status: OrderStatus
    timestamps: OrderTimestamps
    rider_id: Optional[str] = None
    rider_name: Optional[str] = None
    rider_phone: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_address: str
