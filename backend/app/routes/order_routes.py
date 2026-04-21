import traceback
from fastapi import APIRouter, HTTPException, status, Depends, Response
from typing import List, Optional
from app.models.order import (
    OrderCreate,
    OrderUpdateStatus,
    OrderAssignRider,
    OrderResponse,
)
from app.services.order_service import (
    create_order,
    get_order_by_id,
    get_all_orders,
    get_orders_by_rider,
    update_order_status,
    assign_rider_to_order,
    delete_order,
)
from app.utils.auth import require_admin, require_admin_or_rider

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(data: OrderCreate):
    """Public (Customer): Place a new order."""
    try:
        order = await create_order(data.dict())
        return order
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    restaurant_id: Optional[str] = None,
    _admin: dict = Depends(require_admin),
):
    """Admin: List all orders, optionally filtered by restaurant."""
    try:
        result = await get_all_orders(restaurant_id)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/rider/{rider_id}", response_model=List[OrderResponse])
async def list_rider_orders(
    rider_id: str,
    _user: dict = Depends(require_admin_or_rider),
):
    """Admin/Rider: Get orders assigned to a rider."""
    try:
        result = await get_orders_by_rider(rider_id)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str):
    """Public: Get order details (for tracking)."""
    try:
        order = await get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{order_id}/status", response_model=OrderResponse)
async def change_order_status(
    order_id: str,
    data: OrderUpdateStatus,
    _user: dict = Depends(require_admin_or_rider),
):
    """Admin/Rider: Update order status."""
    try:
        order = await get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        result = await update_order_status(order_id, data.dict(exclude_none=True))
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{order_id}/assign-rider", response_model=OrderResponse)
async def assign_rider(
    order_id: str,
    data: OrderAssignRider,
    _admin: dict = Depends(require_admin),
):
    """Admin: Assign a rider to an order."""
    try:
        order = await get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        result = await assign_rider_to_order(order_id, data.rider_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_order(order_id: str, _admin: dict = Depends(require_admin)):
    """Admin: Delete an order."""
    try:
        success = await delete_order(order_id)
        if not success:
            raise HTTPException(status_code=404, detail="Order not found")
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
