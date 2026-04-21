import traceback
from fastapi import APIRouter, HTTPException, status, Depends, Request, Form, File, UploadFile
from typing import List, Optional
from app.models.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse
from app.services.restaurant_service import (
    create_restaurant,
    get_all_restaurants,
    get_restaurant_by_id,
    update_restaurant,
    delete_restaurant,
)
from app.database import restaurants_collection
from app.utils.auth import require_admin

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/", response_model=List[RestaurantResponse])
async def list_restaurants():
    """Public: List all restaurants."""
    try:
        result = await get_all_restaurants()
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(restaurant_id: str):
    """Public: Get restaurant details."""
    try:
        restaurant = await get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        return restaurant
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
async def add_restaurant(
    request: Request,
    name: str = Form(...),
    address: str = Form(...),
    phone: Optional[str] = Form(""),
    commission_rate: Optional[float] = Form(10.0),
    delivery_pricing: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    _admin: dict = Depends(require_admin),
):
    """Admin: Create a new restaurant."""
    try:
        data = {
            "name": name.strip(),
            "address": address.strip(),
            "phone": phone.strip() if phone else "",
            "commission_rate": commission_rate or 10.0,
            "delivery_pricing": [],
        }
        if delivery_pricing:
            import json
            try:
                data["delivery_pricing"] = json.loads(delivery_pricing)
            except Exception:
                pass
        image_bytes = None
        if image and image.filename:
            image_bytes = await image.read()
        base_url = str(request.base_url).rstrip("/")
        result = await create_restaurant(data, base_url, image_bytes)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{restaurant_id}", response_model=RestaurantResponse)
async def edit_restaurant(
    restaurant_id: str,
    name: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    commission_rate: Optional[float] = Form(None),
    delivery_pricing: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    _admin: dict = Depends(require_admin),
):
    """Admin: Update a restaurant."""
    try:
        restaurant = await get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        data = {}
        if name is not None and name.strip():
            data["name"] = name.strip()
        if address is not None and address.strip():
            data["address"] = address.strip()
        if phone is not None and phone.strip():
            data["phone"] = phone.strip()
        if commission_rate is not None:
            data["commission_rate"] = commission_rate
        if delivery_pricing is not None and delivery_pricing.strip():
            import json
            try:
                data["delivery_pricing"] = json.loads(delivery_pricing)
            except json.JSONDecodeError as je:
                pass
        
        image_bytes = None
        if image and image.filename:
            image_bytes = await image.read()
        
        result = await update_restaurant(restaurant_id, data, image_bytes)
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{restaurant_id}")
async def remove_restaurant(
    restaurant_id: str,
    _admin: dict = Depends(require_admin),
):
    """Admin: Delete a restaurant."""
    try:
        deleted = await delete_restaurant(restaurant_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        return {"message": "Restaurant deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{restaurant_id}/image")
async def get_restaurant_image(restaurant_id: str):
    """Public: Get restaurant image."""
    try:
        from fastapi.responses import Response
        from app.utils.helpers import to_object_id
        
        # Get image directly from MongoDB (don't use get_restaurant_by_id which pops it)
        doc = await restaurants_collection.find_one({"_id": to_object_id(restaurant_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        image_data = doc.get("image")
        if not image_data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Convert BSON Binary to bytes if needed
        if hasattr(image_data, '__getstate__'):  # It's a Binary object
            image_bytes = bytes(image_data)
        else:
            image_bytes = image_data if isinstance(image_data, bytes) else bytes(image_data)
        
        # Detect actual image format from magic bytes
        # JFIF / JPEG both start with \xff\xd8
        if image_bytes[:4] == b'\x89PNG':
            media_type = "image/png"
        elif image_bytes[:2] == b'\xff\xd8':
            media_type = "image/jpeg"
        elif len(image_bytes) >= 12 and image_bytes[8:12] == b'WEBP':
            media_type = "image/webp"
        elif image_bytes[:4] == b'RIFF':
            media_type = "image/webp"
        elif image_bytes[:2] == b'BM':
            media_type = "image/bmp"
        elif image_bytes[:4] in (b'GIF8',):
            media_type = "image/gif"
        else:
            media_type = "image/jpeg"  # fallback for JFIF and others
        return Response(
            content=image_bytes,
            media_type=media_type,
            headers={
                "Cache-Control": "public, max-age=86400",
                "Content-Length": str(len(image_bytes)),
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

