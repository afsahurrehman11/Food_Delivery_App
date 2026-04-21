from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RiderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=5, max_length=20)
    password: str = Field(..., min_length=4)


class RiderUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class RiderLogin(BaseModel):
    phone: str
    password: str


class RiderResponse(BaseModel):
    id: str
    name: str
    phone: str
    assigned_orders: List[str] = []
    created_at: datetime
