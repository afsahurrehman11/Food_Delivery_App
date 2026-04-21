"""
Database index setup for performance optimization
Run once during deployment: python -m app.setup_indices
"""
import asyncio
from app.database import (
    users_collection,
    restaurants_collection,
    menu_items_collection,
    orders_collection,
    riders_collection,
    payments_collection,
    admins_collection,
)


async def setup_indices():
    """Create all database indices for faster queries."""
    try:
        # Users indices
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("phone")
        
        # Restaurants indices
        await restaurants_collection.create_index("name")
        await restaurants_collection.create_index("phone")
        
        # Menu items indices
        await menu_items_collection.create_index("restaurant_id")
        await menu_items_collection.create_index("category")
        await menu_items_collection.create_index([("restaurant_id", 1), ("category", 1)])
        
        # Orders indices
        await orders_collection.create_index("customer_id")
        await orders_collection.create_index("restaurant_id")
        await orders_collection.create_index("rider_id")
        await orders_collection.create_index("created_at")
        await orders_collection.create_index([("customer_id", 1), ("created_at", -1)])
        await orders_collection.create_index([("restaurant_id", 1), ("created_at", -1)])
        
        # Riders indices
        await riders_collection.create_index("phone", unique=True)
        await riders_collection.create_index("name")
        
        # Payments indices
        await payments_collection.create_index("restaurant_id")
        await payments_collection.create_index("order_id")
        await payments_collection.create_index([("created_at", -1)])
        
        # Admins indices
        await admins_collection.create_index("username", unique=True)
        
        return True
    except Exception as e:
        return False


if __name__ == "__main__":
    result = asyncio.run(setup_indices())
    exit(0 if result else 1)
