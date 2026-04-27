"""Order management endpoints."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional

from auth import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderItemIn(BaseModel):
    product_id: str
    name: str
    image: str
    price: float
    quantity: int
    size: Optional[str] = None


class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    email: str
    address_line: str
    city: str
    country: str = "Botswana"
    notes: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    shipping: ShippingAddress


@router.post("")
async def create_order(body: OrderCreate, request: Request, user: dict = Depends(get_current_user)):
    db = request.app.state.db
    if not body.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    subtotal = sum(i.price * i.quantity for i in body.items)
    shipping_cost = 0.0 if subtotal >= 1000 else 50.0
    total = subtotal + shipping_cost

    order = {
        "id": str(uuid.uuid4()),
        "order_number": f"LEB-{datetime.now(timezone.utc).strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        "user_id": user["id"],
        "user_email": user["email"],
        "items": [i.model_dump() for i in body.items],
        "shipping": body.shipping.model_dump(),
        "subtotal": round(subtotal, 2),
        "shipping_cost": round(shipping_cost, 2),
        "total": round(total, 2),
        "currency": "BWP",
        "status": "pending_payment",
        "payment": {"provider": "dpo", "trans_token": None, "verified": False},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order)
    order.pop("_id", None)
    return order


@router.get("")
async def list_my_orders(request: Request, user: dict = Depends(get_current_user)):
    db = request.app.state.db
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"items": orders}


@router.get("/{order_id}")
async def get_order(order_id: str, request: Request, user: dict = Depends(get_current_user)):
    db = request.app.state.db
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
