import traceback
import logging
from fastapi import APIRouter, HTTPException, status, Depends, Query, Body, Request
from fastapi.responses import Response
from typing import List, Optional
from pydantic import BaseModel
from app.models.payment import PaymentCreate, PaymentUpdate, PaymentResponse

class ReceiptUploadRequest(BaseModel):
    order_id: str
    receipt_image: str  # base64 encoded
from app.services.payment_service import (
    create_payment,
    get_payments_by_restaurant,
    get_all_payments,
    update_payment,
    delete_payment,
)
from app.services.order_service import get_all_orders
from app.services.restaurant_service import get_restaurant_by_id
from app.utils.auth import require_admin, require_rider, require_admin_or_rider
from app.utils.pdf_generator import generate_invoice_pdf

router = APIRouter(prefix="/payments", tags=["Payments"])

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[PaymentResponse])
async def list_payments(_admin: dict = Depends(require_admin)):
    """Admin: Get all payments."""
    try:
        result = await get_all_payments()
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/restaurant/{restaurant_id}", response_model=List[PaymentResponse])
async def list_restaurant_payments(
    restaurant_id: str,
    _admin: dict = Depends(require_admin),
):
    """Admin: Get payments for a specific restaurant."""
    try:
        result = await get_payments_by_restaurant(restaurant_id)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def add_payment(data: PaymentCreate, _admin: dict = Depends(require_admin)):
    """Admin: Record a payment."""
    try:
        result = await create_payment(data.dict())
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{payment_id}", response_model=PaymentResponse)
async def edit_payment(
    payment_id: str,
    data: PaymentUpdate,
    _admin: dict = Depends(require_admin),
):
    """Admin: Update payment (e.g., amount paid)."""
    try:
        result = await update_payment(payment_id, data.dict())
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_record(
    payment_id: str,
    _admin: dict = Depends(require_admin),
):
    """Admin: Delete a payment record."""
    try:
        success = await delete_payment(payment_id)
        if not success:
            raise HTTPException(status_code=404, detail="Payment not found")
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/upload-receipt-from-order", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def upload_payment_receipt_from_order(
    body: ReceiptUploadRequest,
    request: Request,
    _current_user: dict = Depends(require_admin_or_rider),
):
    """
    Rider: Upload payment receipt which automatically creates a payment record.
    This is called when rider marks order as delivered and uploads receipt.
    """
    try:
        # DEV DEBUG: log decoded token payload and Authorization header for troubleshooting auth issues
        auth_header = request.headers.get('authorization')
        logger.debug(f"Authorization header: {auth_header}")
        logger.debug(f"Decoded token payload for upload endpoint: {_current_user}")
        # Get order details
        from app.services.order_service import get_order_by_id
        order = await get_order_by_id(body.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Get restaurant details to calculate commission
        restaurant = await get_restaurant_by_id(order.get("restaurant_id"))
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        # Calculate amounts
        total_amount = order.get("total_amount", 0)
        commission_rate = restaurant.get("commission_rate", 10.0)
        commission = total_amount * commission_rate / 100
        
        # Create payment record automatically with customer details
        payment_data = {
            "restaurant_id": order.get("restaurant_id"),
            "total_amount": total_amount,
            "commission": commission,
            "paid_amount": 0.0,  # Not yet paid
            "orders_included": [body.order_id],
            "receipt_image": body.receipt_image,  # base64 encoded from rider
            "customer_name": order.get("customer_name", ""),
            "customer_phone": order.get("customer_phone", ""),
            "customer_address": order.get("customer_address", ""),
            "restaurant_name": restaurant.get("name", ""),
        }
        
        result = await create_payment(payment_data)
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create payment record")


@router.get("/restaurant/{restaurant_id}/invoice")
async def generate_restaurant_invoice(
    restaurant_id: str,
    token: Optional[str] = Query(None),
):
    """Admin: Generate a PDF invoice for a restaurant."""
    try:
        if token:
            from app.utils.auth import decode_token
            payload = decode_token(token)
            if payload.get("role") != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin access required",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token required. Pass ?token=YOUR_TOKEN",
            )

        restaurant = await get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        orders = await get_all_orders(restaurant_id)
        commission_rate = restaurant.get("commission_rate", 10.0)
        total_amount = sum(o.get("total_amount", 0) for o in orders)
        commission = total_amount * commission_rate / 100
        net_amount = total_amount - commission

        payments = await get_payments_by_restaurant(restaurant_id)
        paid_amount = sum(p.get("paid_amount", 0) for p in payments)

        invoice_data = {
            "restaurant_name": restaurant["name"],
            "invoice_date": __import__("datetime").datetime.utcnow().strftime("%Y-%m-%d"),
            "total_amount": total_amount,
            "commission_rate": commission_rate,
            "commission": commission,
            "net_amount": net_amount,
            "paid_amount": paid_amount,
            "orders": [
                {
                    "order_id": o.get("id", ""),
                    "customer_name": o.get("customer_name", ""),
                    "items_summary": ", ".join(
                        f"{item.get('name') or item.get('menu_item_id', '')[:8]} x{item.get('quantity', 1)}"
                        for item in o.get("items", [])
                    ),
                    "total": o.get("total_amount", 0),
                    "date": str(o.get("timestamps", {}).get("created_at", "")),
                }
                for o in orders
            ],
        }

        pdf_bytes = generate_invoice_pdf(invoice_data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="invoice_{restaurant["name"]}.pdf"'
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
