from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PaymentCreate(BaseModel):
    restaurant_id: str
    total_amount: float
    commission: float
    paid_amount: float = 0.0
    orders_included: List[str] = []
    receipt_image: Optional[str] = None  # base64 encoded image


class PaymentUpdate(BaseModel):
    paid_amount: Optional[float] = None
    receipt_image: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    restaurant_id: str
    restaurant_name: Optional[str] = None
    total_amount: float
    commission: float
    paid_amount: float
    payment_date: datetime
    orders_included: List[str] = []
    receipt_image: Optional[str] = None  # base64 encoded image
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
