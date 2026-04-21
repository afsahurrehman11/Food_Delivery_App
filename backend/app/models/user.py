from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for creating a customer (no login required)."""
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=5, max_length=20)
    address: str = Field(..., min_length=1, max_length=500)


class UserResponse(BaseModel):
    """Schema returned when a customer record is fetched."""
    id: str
    name: str
    phone: str
    address: str
    created_at: datetime
