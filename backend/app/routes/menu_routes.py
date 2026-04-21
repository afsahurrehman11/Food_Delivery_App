import traceback
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.responses import Response
from typing import List, Optional
from app.models.menu_item import MenuItemResponse
from app.services.menu_service import (
    create_menu_item,
    get_menu_items_by_restaurant,
    get_menu_item_by_id,
    get_menu_item_image,
    update_menu_item,
    delete_menu_item,
)
from app.utils.auth import require_admin

router = APIRouter(prefix="/menu", tags=["Menu Items"])


@router.get("/restaurant/{restaurant_id}", response_model=List[MenuItemResponse])
async def list_menu_items(restaurant_id: str):
    """Public: Get all menu items for a restaurant."""
    try:
        result = await get_menu_items_by_restaurant(restaurant_id)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{item_id}", response_model=MenuItemResponse)
async def get_item(item_id: str):
    """Public: Get a single menu item."""
    try:
        item = await get_menu_item_by_id(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        return item
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{item_id}/image")
async def get_item_image(item_id: str):
    """Public: Get the image of a menu item."""
    try:
        image_bytes = await get_menu_item_image(item_id)
        if not image_bytes:
            raise HTTPException(status_code=404, detail="Image not found")
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


@router.post("/", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def add_menu_item(
    restaurant_id: str = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(""),
    price: float = Form(...),
    category: str = Form("General"),
    image: Optional[UploadFile] = File(None),
    _admin: dict = Depends(require_admin),
):
    """Admin: Create a menu item with optional image upload."""
    try:
        data = {
            "restaurant_id": restaurant_id,
            "name": name,
            "description": description,
            "price": price,
            "category": category,
        }
        image_bytes = None
        if image:
            image_bytes = await image.read()
        result = await create_menu_item(data, image_bytes)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{item_id}", response_model=MenuItemResponse)
async def edit_menu_item(
    item_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    _admin: dict = Depends(require_admin),
):
    """Admin: Update a menu item."""
    try:
        existing = await get_menu_item_by_id(item_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Menu item not found")
        data = {}
        if name is not None:
            data["name"] = name
        if description is not None:
            data["description"] = description
        if price is not None:
            data["price"] = price
        if category is not None:
            data["category"] = category
        image_bytes = None
        if image:
            image_bytes = await image.read()
        result = await update_menu_item(item_id, data, image_bytes)
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{item_id}")
async def remove_menu_item(
    item_id: str,
    _admin: dict = Depends(require_admin),
):
    """Admin: Delete a menu item."""
    try:
        deleted = await delete_menu_item(item_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Menu item not found")
        return {"message": "Menu item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
