import traceback
import base64
from datetime import datetime
from bson import ObjectId, Binary
from app.database import menu_items_collection
from app.utils.helpers import serialize_doc, to_object_id, optimize_image


async def create_menu_item(data: dict, image_bytes: bytes = None) -> dict:
    """Create a new menu item, optionally with an image."""
    try:
        doc = {
            "restaurant_id": data["restaurant_id"],
            "name": data["name"],
            "description": data.get("description", ""),
            "price": data["price"],
            "category": data.get("category", "General"),
            "created_at": datetime.utcnow(),
        }
        if image_bytes:
            # Preserve original quality — only resize if excessively large
            optimized_image = optimize_image(image_bytes)
            doc["image"] = Binary(optimized_image)
        result = await menu_items_collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        has_image = "image" in doc
        doc.pop("image", None)
        serialized = serialize_doc(doc)
        serialized["has_image"] = has_image
        return serialized
    except Exception as e:
        traceback.print_exc()
        raise


async def get_menu_items_by_restaurant(restaurant_id: str) -> list:
    """Get all menu items for a restaurant."""
    try:
        items = []
        cursor = menu_items_collection.find(
            {"restaurant_id": restaurant_id},
            {"image": 0},
        )
        async for doc in cursor:
            serialized = serialize_doc(doc)
            serialized["has_image"] = False
            items.append(serialized)

        ids = [to_object_id(item["id"]) for item in items]
        if ids:
            cursor2 = menu_items_collection.find(
                {"_id": {"$in": ids}, "image": {"$exists": True}},
                {"_id": 1},
            )
            image_ids = set()
            async for doc in cursor2:
                image_ids.add(str(doc["_id"]))
            for item in items:
                if item["id"] in image_ids:
                    item["has_image"] = True

        return items
    except Exception as e:
        traceback.print_exc()
        raise


async def get_menu_item_by_id(item_id: str) -> dict:
    """Get a single menu item (without image blob)."""
    try:
        doc = await menu_items_collection.find_one(
            {"_id": to_object_id(item_id)}, {"image": 0}
        )
        if not doc:
            return None
        serialized = serialize_doc(doc)
        img_doc = await menu_items_collection.find_one(
            {"_id": to_object_id(item_id), "image": {"$exists": True}}, {"_id": 1}
        )
        serialized["has_image"] = img_doc is not None
        return serialized
    except Exception as e:
        traceback.print_exc()
        raise


async def get_menu_item_image(item_id: str) -> bytes:
    """Get the image bytes for a menu item."""
    try:
        doc = await menu_items_collection.find_one(
            {"_id": to_object_id(item_id)}, {"image": 1}
        )
        if doc and "image" in doc:
            return bytes(doc["image"])
        return None
    except Exception as e:
        traceback.print_exc()
        raise


async def update_menu_item(item_id: str, data: dict, image_bytes: bytes = None) -> dict:
    """Update a menu item."""
    try:
        update_fields = {k: v for k, v in data.items() if v is not None}
        if image_bytes:
            # Preserve original quality — only resize if excessively large
            optimized_image = optimize_image(image_bytes)
            update_fields["image"] = Binary(optimized_image)
        if not update_fields:
            return await get_menu_item_by_id(item_id)
        await menu_items_collection.update_one(
            {"_id": to_object_id(item_id)},
            {"$set": update_fields},
        )
        return await get_menu_item_by_id(item_id)
    except Exception as e:
        traceback.print_exc()
        raise


async def delete_menu_item(item_id: str) -> bool:
    """Delete a menu item."""
    try:
        result = await menu_items_collection.delete_one({"_id": to_object_id(item_id)})
        return result.deleted_count > 0
    except Exception as e:
        traceback.print_exc()
        raise
