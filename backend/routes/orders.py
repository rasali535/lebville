"""Order management endpoints."""
import uuid
import re
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from urllib.parse import quote

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
    if any(i.quantity < 1 or i.quantity > 50 for i in body.items):
        raise HTTPException(status_code=422, detail="Item quantities must be between 1 and 50")

    # Never trust prices supplied by the browser. Resolve current catalogue prices server-side.
    product_ids = [i.product_id for i in body.items]
    products = await db.products.find({"id": {"$in": product_ids}, "active": {"$ne": False}}, {"_id": 0}).to_list(200)
    by_id = {p["id"]: p for p in products}
    if len(by_id) != len(set(product_ids)):
        raise HTTPException(status_code=422, detail="One or more products are unavailable")
    resolved_items = []
    for item in body.items:
        product = by_id[item.product_id]
        resolved_items.append({
            "product_id": product["id"], "name": product["name"],
            "image": product.get("image", ""), "price": float(product["price"]),
            "quantity": item.quantity, "size": item.size,
        })
    subtotal = sum(i["price"] * i["quantity"] for i in resolved_items)
    shipping_cost = 0.0 if subtotal >= 1000 else 50.0
    total = subtotal + shipping_cost

    order = {
        "id": str(uuid.uuid4()),
        "order_number": f"LEB-{datetime.now(timezone.utc).strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        "user_id": user["id"],
        "user_email": user["email"],
        "items": resolved_items,
        "shipping": body.shipping.model_dump(),
        "subtotal": round(subtotal, 2),
        "shipping_cost": round(shipping_cost, 2),
        "total": round(total, 2),
        "currency": "BWP",
        "status": "pending_payment",
        "payment": {"provider": "dpo", "trans_token": None, "verified": False},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order)
    order.pop("_id", None)
    settings = await db.settings.find_one({"key": "storefront"}, {"_id": 0}) or {}
    number = re.sub(r"\D", "", settings.get("whatsapp_number", "+26773011600"))
    lines = "\n".join(f"• {i['name']} ({i.get('size') or 'Standard'}) ×{i['quantity']} — BWP {i['price'] * i['quantity']:.2f}" for i in resolved_items)
    message = (
        f"Hello Lebville, I have placed an order.\n\nOrder: {order['order_number']}\n"
        f"{lines}\n\nTotal: BWP {order['total']:.2f}\n"
        f"Customer: {body.shipping.full_name}\nPhone: {body.shipping.phone}\n"
        f"Delivery: {body.shipping.address_line}, {body.shipping.city}"
    )
    order["whatsapp_url"] = f"https://wa.me/{number}?text={quote(message)}"
    await db.orders.update_one({"id": order["id"]}, {"$set": {"whatsapp_url": order["whatsapp_url"]}})
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
