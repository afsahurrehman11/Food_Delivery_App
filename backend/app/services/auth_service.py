import traceback
from datetime import datetime
from app.database import admins_collection
from app.utils.helpers import serialize_doc
from app.utils.auth import hash_password, verify_password


async def create_admin(username: str, password: str) -> dict:
    """Create an admin account. There should be only one."""
    try:
        existing = await admins_collection.find_one({"username": username})
        if existing:
            return None
        doc = {
            "username": username,
            "password": hash_password(password),
            "created_at": datetime.utcnow(),
        }
        result = await admins_collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        doc.pop("password")
        return serialize_doc(doc)
    except Exception as e:
        traceback.print_exc()
        raise


async def authenticate_admin(username: str, password: str) -> dict:
    """Authenticate admin by username and password."""
    try:
        doc = await admins_collection.find_one({"username": username})
        if not doc:
            return None
        if not verify_password(password, doc["password"]):
            return None
        doc.pop("password")
        return serialize_doc(doc)
    except Exception as e:
        traceback.print_exc()
        raise
