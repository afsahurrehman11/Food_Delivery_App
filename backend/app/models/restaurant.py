from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DeliveryPricing(BaseModel):
    max_distance_km: float
    charge: float


class RestaurantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    address: str = Field(..., min_length=1, max_length=500)
    phone: Optional[str] = None
    commission_rate: float = Field(default=10.0, ge=0, le=100)
    delivery_pricing: List[DeliveryPricing] = []


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    commission_rate: Optional[float] = None
    delivery_pricing: Optional[List[DeliveryPricing]] = None


class RestaurantResponse(BaseModel):
    id: str
    name: str
    address: str
    phone: Optional[str] = None
    commission_rate: float
    delivery_pricing: List[DeliveryPricing]
    qr_code: Optional[str] = None  # base64 encoded QR code image
    has_image: bool = False
    created_at: datetime
