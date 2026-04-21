import traceback
from datetime import datetime
from app.database import riders_collection
from app.utils.helpers import serialize_doc, to_object_id
from app.utils.auth import hash_password, verify_password


async def create_rider(data: dict) -> dict:
    """Create a new rider account."""
    try:
        doc = {
            "name": data["name"],
            "phone": data["phone"],
            "password": hash_password(data["password"]),
            "assigned_orders": [],
            "created_at": datetime.utcnow(),
        }
        result = await riders_collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        doc.pop("password")
        return serialize_doc(doc)
    except Exception as e:
        traceback.print_exc()
        raise


async def get_all_riders() -> list:
    """Get all riders."""
    try:
        riders = []
        cursor = riders_collection.find({}, {"password": 0})
        async for doc in cursor:
            try:
                riders.append(serialize_doc(doc))
            except Exception:
                traceback.print_exc()
        return riders
    except Exception as e:
        traceback.print_exc()
        raise


async def get_rider_by_id(rider_id: str) -> dict:
    """Get a single rider by ID."""
    try:
        doc = await riders_collection.find_one(
            {"_id": to_object_id(rider_id)}, {"password": 0}
        )
        if not doc:
            return None
        return serialize_doc(doc)
    except Exception as e:
        traceback.print_exc()
        raise


async def authenticate_rider(phone: str, password: str) -> dict:
    """Authenticate a rider by phone and password."""
    try:
        doc = await riders_collection.find_one({"phone": phone})
        if not doc:
            return None
        if not verify_password(password, doc["password"]):
            return None
        doc.pop("password")
        return serialize_doc(doc)
    except Exception as e:
        traceback.print_exc()
        raise


async def update_rider(rider_id: str, data: dict) -> dict:
    """Update rider details."""
    try:
        update_fields = {k: v for k, v in data.items() if v is not None}
        if "password" in update_fields:
            update_fields["password"] = hash_password(update_fields["password"])
        if not update_fields:
            return await get_rider_by_id(rider_id)
        await riders_collection.update_one(
            {"_id": to_object_id(rider_id)},
            {"$set": update_fields},
        )
        return await get_rider_by_id(rider_id)
    except Exception as e:
        traceback.print_exc()
        raise


async def delete_rider(rider_id: str) -> bool:
    """Delete a rider."""
    try:
        result = await riders_collection.delete_one({"_id": to_object_id(rider_id)})
        return result.deleted_count > 0
    except Exception as e:
        traceback.print_exc()
        raise
