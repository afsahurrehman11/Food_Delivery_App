import traceback
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models.rider import RiderCreate, RiderUpdate, RiderResponse
from app.services.rider_service import (
    create_rider,
    get_all_riders,
    get_rider_by_id,
    update_rider,
    delete_rider,
)
from app.utils.auth import require_admin

router = APIRouter(prefix="/riders", tags=["Riders"])


@router.get("/", response_model=List[RiderResponse])
async def list_riders(_admin: dict = Depends(require_admin)):
    """Admin: List all riders."""
    try:
        result = await get_all_riders()
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{rider_id}", response_model=RiderResponse)
async def get_rider(rider_id: str, _admin: dict = Depends(require_admin)):
    """Admin: Get a single rider."""
    try:
        rider = await get_rider_by_id(rider_id)
        if not rider:
            raise HTTPException(status_code=404, detail="Rider not found")
        return rider
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/", response_model=RiderResponse, status_code=status.HTTP_201_CREATED)
async def add_rider(data: RiderCreate, _admin: dict = Depends(require_admin)):
    """Admin: Create a new rider."""
    try:
        result = await create_rider(data.dict())
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{rider_id}", response_model=RiderResponse)
async def edit_rider(
    rider_id: str,
    data: RiderUpdate,
    _admin: dict = Depends(require_admin),
):
    """Admin: Update rider details."""
    try:
        rider = await get_rider_by_id(rider_id)
        if not rider:
            raise HTTPException(status_code=404, detail="Rider not found")
        result = await update_rider(rider_id, data.dict())
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{rider_id}")
async def remove_rider(rider_id: str, _admin: dict = Depends(require_admin)):
    """Admin: Delete a rider."""
    try:
        deleted = await delete_rider(rider_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Rider not found")
        return {"message": "Rider deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
