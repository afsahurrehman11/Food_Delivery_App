import traceback
from datetime import datetime
from app.database import payments_collection, restaurants_collection
from app.utils.helpers import serialize_doc, to_object_id


async def create_payment(data: dict) -> dict:
    """Record a payment for a restaurant."""
    try:
        doc = {
            "restaurant_id": data["restaurant_id"],
            "total_amount": data["total_amount"],
            "commission": data["commission"],
            "paid_amount": data.get("paid_amount", 0.0),
            "payment_date": datetime.utcnow(),
            "orders_included": data.get("orders_included", []),
            "receipt_image": data.get("receipt_image", None),
            "customer_name": data.get("customer_name", ""),
            "customer_phone": data.get("customer_phone", ""),
            "customer_address": data.get("customer_address", ""),
        }
        result = await payments_collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        serialized = serialize_doc(doc)

        rest = await restaurants_collection.find_one(
            {"_id": to_object_id(data["restaurant_id"])}, {"name": 1}
        )
        serialized["restaurant_name"] = rest["name"] if rest else None
        return serialized
    except Exception as e:
        traceback.print_exc()
        raise


async def get_payments_by_restaurant(restaurant_id: str) -> list:
    """Get all payments for a restaurant."""
    try:
        payments = []
        cursor = payments_collection.find({"restaurant_id": restaurant_id}).sort("payment_date", -1)
        async for doc in cursor:
            serialized = serialize_doc(doc)
            rest = await restaurants_collection.find_one(
                {"_id": to_object_id(restaurant_id)}, {"name": 1}
            )
            serialized["restaurant_name"] = rest["name"] if rest else None
            payments.append(serialized)
        return payments
    except Exception as e:
        traceback.print_exc()
        raise


async def get_all_payments() -> list:
    """Get all payments."""
    try:
        payments = []
        cursor = payments_collection.find({}).sort("payment_date", -1)
        async for doc in cursor:
            serialized = serialize_doc(doc)
            rest = await restaurants_collection.find_one(
                {"_id": to_object_id(serialized["restaurant_id"])}, {"name": 1}
            )
            serialized["restaurant_name"] = rest["name"] if rest else None
            payments.append(serialized)
        return payments
    except Exception as e:
        traceback.print_exc()
        raise


async def update_payment(payment_id: str, data: dict) -> dict:
    """Update payment (e.g., paid_amount)."""
    try:
        update_fields = {k: v for k, v in data.items() if v is not None}
        if not update_fields:
            doc = await payments_collection.find_one({"_id": to_object_id(payment_id)})
            if not doc:
                return None
            serialized = serialize_doc(doc)
        else:
            await payments_collection.update_one(
                {"_id": to_object_id(payment_id)},
                {"$set": update_fields},
            )
            doc = await payments_collection.find_one({"_id": to_object_id(payment_id)})
            if not doc:
                return None
            serialized = serialize_doc(doc)

        rest = await restaurants_collection.find_one(
            {"_id": to_object_id(serialized["restaurant_id"])}, {"name": 1}
        )
        serialized["restaurant_name"] = rest["name"] if rest else None
        return serialized
    except Exception as e:
        traceback.print_exc()
        raise


async def delete_payment(payment_id: str) -> bool:
    """Delete a payment record."""
    try:
        result = await payments_collection.delete_one({"_id": to_object_id(payment_id)})
        return result.deleted_count > 0
    except Exception as e:
        traceback.print_exc()
        raise
