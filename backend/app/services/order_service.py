import traceback
from datetime import datetime
from bson import ObjectId
from app.database import orders_collection, users_collection, riders_collection, restaurants_collection, menu_items_collection
from app.utils.helpers import serialize_doc, to_object_id


async def enrich_order_items_with_names(items: list) -> list:
    """Fetch menu item names and add them to order items."""
    enriched_items = []
    for item in items:
        menu_item_id = item.get("menu_item_id")
        if menu_item_id:
            try:
                menu_item = await menu_items_collection.find_one(
                    {"_id": to_object_id(menu_item_id)},
                    {"name": 1}
                )
                item_name = menu_item.get("name") if menu_item else "Unknown Item"
            except Exception as e:
                print(f"Error fetching menu item {menu_item_id}: {e}")
                item_name = "Unknown Item"
        else:
            item_name = "Unknown Item"
        
        enriched_items.append({
            "menu_item_id": item.get("menu_item_id"),
            "name": item_name,
            "quantity": item.get("quantity", 1),
            "price": item.get("price", 0)
        })
    return enriched_items


async def create_order(data: dict) -> dict:
    """Place a new order. Also upsert the customer record."""
    try:
        # Upsert customer
        customer = await users_collection.find_one({"phone": data["customer_phone"]})
        if customer:
            await users_collection.update_one(
                {"_id": customer["_id"]},
                {"$set": {"name": data["customer_name"], "address": data["customer_address"]}},
            )
            user_id = customer["_id"]
        else:
            result = await users_collection.insert_one({
                "name": data["customer_name"],
                "phone": data["customer_phone"],
                "address": data["customer_address"],
                "created_at": datetime.utcnow(),
            })
            user_id = result.inserted_id

        total = sum(item["price"] * item["quantity"] for item in data["items"])

        doc = {
            "restaurant_id": data["restaurant_id"],
            "user_id": str(user_id),
            "items": [
                {"menu_item_id": item["menu_item_id"], "quantity": item["quantity"], "price": item["price"]}
                for item in data["items"]
            ],
            "total_amount": total,
            "status": {"confirmed": False, "preparing": False, "rider_left": False},
            "timestamps": {"created_at": datetime.utcnow(), "confirmed_at": None, "preparing_at": None, "rider_left_at": None},
            "rider_id": None,
            "customer_name": data["customer_name"],
            "customer_phone": data["customer_phone"],
            "customer_address": data["customer_address"],
        }
        result = await orders_collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return serialize_doc(doc)
    except Exception as e:
        traceback.print_exc()
        raise


async def get_order_by_id(order_id: str) -> dict:
    """Get a single order with rider and restaurant info."""
    try:
        doc = await orders_collection.find_one({"_id": to_object_id(order_id)})
        if not doc:
            return None
        serialized = serialize_doc(doc)

        # Enrich items with menu item names
        if serialized.get("items"):
            serialized["items"] = await enrich_order_items_with_names(serialized["items"])

        rest = await restaurants_collection.find_one(
            {"_id": to_object_id(serialized["restaurant_id"])}, {"name": 1}
        )
        serialized["restaurant_name"] = rest["name"] if rest else None

        if serialized.get("rider_id"):
            rider = await riders_collection.find_one(
                {"_id": to_object_id(serialized["rider_id"])}, {"name": 1, "phone": 1}
            )
            if rider:
                serialized["rider_name"] = rider["name"]
                serialized["rider_phone"] = rider["phone"]
        return serialized
    except Exception as e:
        traceback.print_exc()
        raise


async def get_all_orders(restaurant_id: str = None) -> list:
    """Get all orders, optionally filtered by restaurant."""
    try:
        filter_msg = f" for restaurant {restaurant_id}" if restaurant_id else ""
        query = {}
        if restaurant_id:
            query["restaurant_id"] = restaurant_id
        orders = []
        cursor = orders_collection.find(query).sort("timestamps.created_at", -1)
        async for doc in cursor:
            serialized = serialize_doc(doc)
            
            # Enrich items with menu item names
            if serialized.get("items"):
                serialized["items"] = await enrich_order_items_with_names(serialized["items"])
            
            rest = await restaurants_collection.find_one(
                {"_id": to_object_id(serialized["restaurant_id"])}, {"name": 1}
            )
            serialized["restaurant_name"] = rest["name"] if rest else None
            orders.append(serialized)
        return orders
    except Exception as e:
        traceback.print_exc()
        raise


async def get_orders_by_rider(rider_id: str) -> list:
    """Get orders assigned to a specific rider."""
    try:
        orders = []
        cursor = orders_collection.find({"rider_id": rider_id}).sort("timestamps.created_at", -1)
        async for doc in cursor:
            serialized = serialize_doc(doc)
            
            # Enrich items with menu item names
            if serialized.get("items"):
                serialized["items"] = await enrich_order_items_with_names(serialized["items"])
            
            rest = await restaurants_collection.find_one(
                {"_id": to_object_id(serialized["restaurant_id"])}, {"name": 1}
            )
            serialized["restaurant_name"] = rest["name"] if rest else None
            orders.append(serialized)
        return orders
    except Exception as e:
        traceback.print_exc()
        raise


async def update_order_status(order_id: str, status_update: dict) -> dict:
    """Update the status of an order (confirmed, preparing, rider_left, delivered)."""
    try:
        update_set = {}
        now = datetime.utcnow()

        if status_update.get("confirmed") is True:
            update_set["status.confirmed"] = True
            update_set["timestamps.confirmed_at"] = now
        if status_update.get("preparing") is True:
            update_set["status.preparing"] = True
            update_set["timestamps.preparing_at"] = now
        if status_update.get("rider_left") is True:
            update_set["status.rider_left"] = True
            update_set["timestamps.rider_left_at"] = now
        if status_update.get("delivered") is True:
            update_set["status.delivered"] = True
            update_set["timestamps.delivered_at"] = now

        if update_set:
            await orders_collection.update_one(
                {"_id": to_object_id(order_id)},
                {"$set": update_set},
            )
        return await get_order_by_id(order_id)
    except Exception as e:
        traceback.print_exc()
        raise


async def assign_rider_to_order(order_id: str, rider_id: str) -> dict:
    """Assign a rider to an order."""
    try:
        await orders_collection.update_one(
            {"_id": to_object_id(order_id)},
            {"$set": {"rider_id": rider_id}},
        )
        await riders_collection.update_one(
            {"_id": to_object_id(rider_id)},
            {"$addToSet": {"assigned_orders": order_id}},
        )
        return await get_order_by_id(order_id)
    except Exception as e:
        traceback.print_exc()
        raise


async def delete_order(order_id: str) -> bool:
    """Delete an order."""
    try:
        result = await orders_collection.delete_one({"_id": to_object_id(order_id)})
        return result.deleted_count > 0
    except Exception as e:
        traceback.print_exc()
        raise
