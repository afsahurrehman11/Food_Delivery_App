import traceback
from fastapi import APIRouter, HTTPException, status
from app.models.auth import AdminCreate, AdminLogin, TokenResponse
from app.models.rider import RiderLogin
from app.services.auth_service import create_admin, authenticate_admin
from app.services.rider_service import authenticate_rider
from app.utils.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/admin/register", response_model=TokenResponse)
async def register_admin(data: AdminCreate):
    """Register the admin account (one-time setup)."""
    try:
        admin = await create_admin(data.username, data.password)
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin already exists",
            )
        token = create_access_token({"sub": admin["id"], "role": "admin", "name": data.username})
        return TokenResponse(
            access_token=token, role="admin", user_id=admin["id"], name=data.username
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/admin/login", response_model=TokenResponse)
async def login_admin(data: AdminLogin):
    """Admin login."""
    try:
        admin = await authenticate_admin(data.username, data.password)
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        token = create_access_token({"sub": admin["id"], "role": "admin", "name": data.username})
        return TokenResponse(
            access_token=token, role="admin", user_id=admin["id"], name=data.username
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/rider/login", response_model=TokenResponse)
async def login_rider(data: RiderLogin):
    """Rider login."""
    try:
        rider = await authenticate_rider(data.phone, data.password)
        if not rider:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        token = create_access_token({"sub": rider["id"], "role": "rider", "name": rider["name"]})
        return TokenResponse(
            access_token=token, role="rider", user_id=rider["id"], name=rider["name"]
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
