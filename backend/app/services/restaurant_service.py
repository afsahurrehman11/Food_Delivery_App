import traceback
from datetime import datetime
from bson import ObjectId, Binary
from app.database import restaurants_collection
from app.utils.helpers import serialize_doc, to_object_id, optimize_image
from app.utils.qr_generator import generate_qr_code, qr_bytes_to_base64


async def create_restaurant(data: dict, base_url: str = "", image_bytes: bytes = None) -> dict:
    """Create a new restaurant and generate its QR code."""
    try:
        # Prevent duplicate restaurant names (case-insensitive)
        existing = await restaurants_collection.find_one(
            {"name": {"$regex": f"^{data['name'].strip()}$", "$options": "i"}}
        )
        if existing:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"Restaurant '{data['name']}' already exists.")

        doc = {
            "name": data["name"],
            "address": data["address"],
            "phone": data.get("phone", ""),
            "commission_rate": data.get("commission_rate", 10.0),
            "delivery_pricing": [dp.dict() if hasattr(dp, "dict") else dp for dp in data.get("delivery_pricing", [])],
            "created_at": datetime.utcnow(),
        }
        if image_bytes:
            # Preserve original quality — only resize if excessively large
            optimized_image = optimize_image(image_bytes)
            doc["image"] = Binary(optimized_image)
        result = await restaurants_collection.insert_one(doc)
        restaurant_id = str(result.inserted_id)
        qr_data = f"{base_url}/restaurant/{restaurant_id}/menu"
        qr_bytes = generate_qr_code(qr_data)
        await restaurants_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": {"qr_code": Binary(qr_bytes)}},
        )
        doc["_id"] = result.inserted_id
        doc["qr_code"] = qr_bytes_to_base64(qr_bytes)
        doc.pop("image", None)
        serialized = serialize_doc(doc)
        serialized["has_image"] = bool(image_bytes)
        return serialized
    except Exception as e:
        traceback.print_exc()
        raise


async def get_all_restaurants() -> list:
    """Retrieve all restaurants."""
    try:
        restaurants = []
        cursor = restaurants_collection.find({})
        async for doc in cursor:
            qr = doc.pop("qr_code", None)
            image = doc.pop("image", None)
            serialized = serialize_doc(doc)
            if qr:
                serialized["qr_code"] = qr_bytes_to_base64(bytes(qr))
            else:
                serialized["qr_code"] = None
            serialized["has_image"] = bool(image)
            restaurants.append(serialized)
        return restaurants
    except Exception as e:
        traceback.print_exc()
        raise


async def get_restaurant_by_id(restaurant_id: str) -> dict:
    """Find a single restaurant by ID."""
    try:
        doc = await restaurants_collection.find_one({"_id": to_object_id(restaurant_id)})
        if not doc:
            return None
        qr = doc.pop("qr_code", None)
        image = doc.pop("image", None)
        serialized = serialize_doc(doc)
        if qr:
            serialized["qr_code"] = qr_bytes_to_base64(bytes(qr))
        else:
            serialized["qr_code"] = None
        serialized["has_image"] = bool(image)
        return serialized
    except Exception as e:
        traceback.print_exc()
        raise


async def update_restaurant(restaurant_id: str, data: dict, image_bytes: bytes = None) -> dict:
    """Update restaurant details."""
    try:
        update_fields = {k: v for k, v in data.items() if v is not None}
        if image_bytes:
            # Preserve original quality — only resize if excessively large
            optimized_image = optimize_image(image_bytes)
            update_fields["image"] = Binary(optimized_image)
        if "delivery_pricing" in update_fields and update_fields["delivery_pricing"] is not None:
            update_fields["delivery_pricing"] = [
                dp.dict() if hasattr(dp, "dict") else dp
                for dp in update_fields["delivery_pricing"]
            ]
        if not update_fields:
            return await get_restaurant_by_id(restaurant_id)
        await restaurants_collection.update_one(
            {"_id": to_object_id(restaurant_id)},
            {"$set": update_fields},
        )
        return await get_restaurant_by_id(restaurant_id)
    except Exception as e:
        traceback.print_exc()
        raise


async def delete_restaurant(restaurant_id: str) -> bool:
    """Delete a restaurant."""
    try:
        result = await restaurants_collection.delete_one({"_id": to_object_id(restaurant_id)})
        return result.deleted_count > 0
    except Exception as e:
        traceback.print_exc()
        raise
