import motor.motor_asyncio
from app.config import MONGODB_URL, DATABASE_NAME

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
database = client[DATABASE_NAME]

# Collections
users_collection = database["users"]
restaurants_collection = database["restaurants"]
menu_items_collection = database["menu_items"]
orders_collection = database["orders"]
riders_collection = database["riders"]
payments_collection = database["payments"]
admins_collection = database["admins"]
