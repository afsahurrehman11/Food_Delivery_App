import traceback
from fastapi import APIRouter, HTTPException, Depends
from app.services.order_service import get_all_orders
from app.services.restaurant_service import get_all_restaurants
from app.services.payment_service import get_all_payments
from app.utils.auth import require_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(_admin: dict = Depends(require_admin)):
    """Admin: Get dashboard overview stats."""
    try:
        restaurants = await get_all_restaurants()
        orders = await get_all_orders()
        payments = await get_all_payments()

        total_orders = len(orders)
        total_revenue = sum(o.get("total_amount", 0) for o in orders)
        total_paid = sum(p.get("paid_amount", 0) for p in payments)
        total_commission = sum(p.get("commission", 0) for p in payments)
        total_net = total_revenue - total_commission
        pending_payments = total_net - total_paid

        restaurant_stats = []
        for r in restaurants:
            r_orders = [o for o in orders if o.get("restaurant_id") == r["id"]]
            r_revenue = sum(o.get("total_amount", 0) for o in r_orders)
            r_commission_rate = r.get("commission_rate", 0)
            r_commission = r_revenue * r_commission_rate / 100
            r_net = r_revenue - r_commission
            r_payments = [p for p in payments if p.get("restaurant_id") == r["id"]]
            r_paid = sum(p.get("paid_amount", 0) for p in r_payments)
            restaurant_stats.append({
                "id": r["id"],
                "name": r["name"],
                "total_orders": len(r_orders),
                "total_revenue": r_revenue,
                "commission_rate": r_commission_rate,
                "commission": r_commission,
                "net_amount": r_net,
                "paid": r_paid,
                "pending": r_net - r_paid,
            })

        return {
            "total_restaurants": len(restaurants),
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "total_commission": total_commission,
            "total_paid": total_paid,
            "pending_payments": pending_payments,
            "restaurants": restaurant_stats,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
