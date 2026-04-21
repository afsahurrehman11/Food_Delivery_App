from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MenuItemCreate(BaseModel):
    restaurant_id: str
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    price: float = Field(..., gt=0)
    category: str = Field(default="General", max_length=100)
    # image will be uploaded separately as a file


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None


class MenuItemResponse(BaseModel):
    id: str
    restaurant_id: str
    name: str
    description: Optional[str] = ""
    price: float
    category: str
    has_image: bool = False
    created_at: datetime
