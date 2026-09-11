"""Role-protected catalogue, promotions, media, booking and order management."""
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from pydantic import BaseModel, EmailStr, Field

from auth import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])
media_router = APIRouter(prefix="/media", tags=["media"])
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
ORDER_STATUSES = {"pending_payment", "paid", "processing", "ready", "completed", "cancelled"}
BOOKING_STATUSES = {"new", "confirmed", "completed", "cancelled"}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or uuid.uuid4().hex[:8]


def valid_image_signature(content: bytes, content_type: str) -> bool:
    signatures = {
        "image/jpeg": lambda b: b.startswith(b"\xff\xd8\xff"),
        "image/png": lambda b: b.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/gif": lambda b: b.startswith((b"GIF87a", b"GIF89a")),
        "image/webp": lambda b: len(b) >= 12 and b[:4] == b"RIFF" and b[8:12] == b"WEBP",
    }
    return signatures.get(content_type, lambda _: False)(content)


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: Optional[str] = Field(default=None, max_length=180)
    description: str = Field(default="", max_length=4000)
    price: float = Field(ge=0)
    compare_at_price: Optional[float] = Field(default=None, ge=0)
    category: str = Field(min_length=2, max_length=80)
    tag: Optional[str] = Field(default=None, max_length=60)
    image: str = Field(default="", max_length=2000)
    images: List[str] = Field(default_factory=list, max_length=12)
    sizes: List[str] = Field(default_factory=list, max_length=40)
    stock: int = Field(default=0, ge=0)
    active: bool = True
    featured: bool = False


class SpecialIn(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    description: str = Field(default="", max_length=2000)
    image: str = Field(default="", max_length=2000)
    product_ids: List[str] = Field(default_factory=list, max_length=100)
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    active: bool = True


class StatusIn(BaseModel):
    status: str


class BookingIn(BaseModel):
    service_id: str = Field(min_length=1, max_length=100)
    service_name: str = Field(min_length=1, max_length=160)
    customer_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    email: Optional[EmailStr] = None
    preferred_date: str = Field(min_length=8, max_length=20)
    preferred_time: str = Field(min_length=3, max_length=20)
    guests: int = Field(default=1, ge=1, le=30)
    notes: Optional[str] = Field(default=None, max_length=1000)
    status: str


class SettingsIn(BaseModel):
    whatsapp_number: str = Field(min_length=7, max_length=30)


@router.get("/summary")
async def summary(request: Request, _=Depends(require_admin)):
    db = request.app.state.db
    products = await db.products.count_documents({})
    active_specials = await db.specials.count_documents({"active": True})
    new_bookings = await db.bookings.count_documents({"status": "new"})
    open_orders = await db.orders.count_documents({"status": {"$nin": ["completed", "cancelled"]}})
    return {"products": products, "active_specials": active_specials, "new_bookings": new_bookings, "open_orders": open_orders}


@router.get("/products")
async def admin_products(request: Request, _=Depends(require_admin)):
    items = await request.app.state.db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"items": items}


@router.post("/products")
async def create_product(body: ProductIn, request: Request, admin=Depends(require_admin)):
    db = request.app.state.db
    doc = body.model_dump()
    doc["slug"] = slugify(doc.get("slug") or doc["name"])
    if await db.products.find_one({"slug": doc["slug"]}):
        raise HTTPException(409, "A product with this URL slug already exists")
    doc.update({"id": str(uuid.uuid4()), "created_at": now_iso(), "updated_at": now_iso()})
    await db.products.insert_one(doc)
    await _audit(db, admin, "product.created", doc["id"], doc["name"])
    doc.pop("_id", None)
    return doc


@router.put("/products/{product_id}")
async def update_product(product_id: str, body: ProductIn, request: Request, admin=Depends(require_admin)):
    db = request.app.state.db
    doc = body.model_dump()
    doc["slug"] = slugify(doc.get("slug") or doc["name"])
    duplicate = await db.products.find_one({"slug": doc["slug"], "id": {"$ne": product_id}})
    if duplicate:
        raise HTTPException(409, "A product with this URL slug already exists")
    doc["updated_at"] = now_iso()
    result = await db.products.update_one({"id": product_id}, {"$set": doc})
    if not result.matched_count:
        raise HTTPException(404, "Product not found")
    await _audit(db, admin, "product.updated", product_id, doc["name"])
    return await db.products.find_one({"id": product_id}, {"_id": 0})


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request, admin=Depends(require_admin)):
    db = request.app.state.db
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Product not found")
    await db.products.delete_one({"id": product_id})
    await _audit(db, admin, "product.deleted", product_id, product.get("name"))
    return {"ok": True}


@router.get("/specials")
async def admin_specials(request: Request, _=Depends(require_admin)):
    items = await request.app.state.db.specials.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"items": items}


@router.post("/specials")
async def create_special(body: SpecialIn, request: Request, admin=Depends(require_admin)):
    db = request.app.state.db
    doc = {"id": str(uuid.uuid4()), **body.model_dump(), "created_at": now_iso(), "updated_at": now_iso()}
    await db.specials.insert_one(doc)
    await _audit(db, admin, "special.created", doc["id"], doc["title"])
    doc.pop("_id", None)
    return doc


@router.put("/specials/{special_id}")
async def update_special(special_id: str, body: SpecialIn, request: Request, admin=Depends(require_admin)):
    db = request.app.state.db
    data = {**body.model_dump(), "updated_at": now_iso()}
    result = await db.specials.update_one({"id": special_id}, {"$set": data})
    if not result.matched_count:
        raise HTTPException(404, "Special not found")
    await _audit(db, admin, "special.updated", special_id, body.title)
    return await db.specials.find_one({"id": special_id}, {"_id": 0})


@router.delete("/specials/{special_id}")
async def delete_special(special_id: str, request: Request, admin=Depends(require_admin)):
    db = request.app.state.db
    result = await db.specials.delete_one({"id": special_id})
    if not result.deleted_count:
        raise HTTPException(404, "Special not found")
    await _audit(db, admin, "special.deleted", special_id)
    return {"ok": True}


@router.get("/orders")
async def all_orders(request: Request, _=Depends(require_admin)):
    items = await request.app.state.db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"items": items}


@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: StatusIn, request: Request, admin=Depends(require_admin)):
    if body.status not in ORDER_STATUSES:
        raise HTTPException(422, "Invalid order status")
    db = request.app.state.db
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": body.status, "updated_at": now_iso()}})
    if not result.matched_count:
        raise HTTPException(404, "Order not found")
    await _audit(db, admin, "order.status", order_id, body.status)
    return await db.orders.find_one({"id": order_id}, {"_id": 0})


@router.get("/bookings")
async def all_bookings(request: Request, _=Depends(require_admin)):
    items = await request.app.state.db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"items": items}


@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, body: StatusIn, request: Request, admin=Depends(require_admin)):
    if body.status not in BOOKING_STATUSES:
        raise HTTPException(422, "Invalid booking status")
    db = request.app.state.db
    result = await db.bookings.update_one({"id": booking_id}, {"$set": {"status": body.status, "updated_at": now_iso()}})
    if not result.matched_count:
        raise HTTPException(404, "Booking not found")
    await _audit(db, admin, "booking.status", booking_id, body.status)
    return await db.bookings.find_one({"id": booking_id}, {"_id": 0})


@router.put("/bookings/{booking_id}")
async def update_booking(booking_id: str, body: BookingIn, request: Request, admin=Depends(require_admin)):
    if body.status not in BOOKING_STATUSES:
        raise HTTPException(422, "Invalid booking status")
    db = request.app.state.db
    data = {**body.model_dump(), "updated_at": now_iso()}
    result = await db.bookings.update_one({"id": booking_id}, {"$set": data})
    if not result.matched_count:
        raise HTTPException(404, "Booking not found")
    await _audit(db, admin, "booking.updated", booking_id, body.customer_name)
    return await db.bookings.find_one({"id": booking_id}, {"_id": 0})


@router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, request: Request, admin=Depends(require_admin)):
    db = request.app.state.db
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(404, "Booking not found")
    await db.bookings.delete_one({"id": booking_id})
    await _audit(db, admin, "booking.deleted", booking_id, booking.get("booking_number"))
    return {"ok": True}


@router.post("/media")
async def upload_media(request: Request, file: UploadFile = File(...), admin=Depends(require_admin)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(415, "Only JPEG, PNG, WebP and GIF images are allowed")
    content = await file.read(MAX_IMAGE_BYTES + 1)
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Image must be 5 MB or smaller")
    if not content:
        raise HTTPException(400, "Image is empty")
    if not valid_image_signature(content, file.content_type):
        raise HTTPException(415, "The uploaded file content is not a valid image")
    bucket = AsyncIOMotorGridFSBucket(request.app.state.db, bucket_name="media")
    file_id = await bucket.upload_from_stream(file.filename or "image", content, metadata={"content_type": file.content_type, "uploaded_by": admin["id"], "created_at": now_iso()})
    media_id = str(file_id)
    await _audit(request.app.state.db, admin, "media.uploaded", media_id, file.filename)
    return {"id": media_id, "url": f"/api/media/{media_id}", "filename": file.filename}


@router.delete("/media/{media_id}")
async def delete_media(media_id: str, request: Request, admin=Depends(require_admin)):
    try:
        oid = ObjectId(media_id)
    except Exception:
        raise HTTPException(404, "Image not found")
    bucket = AsyncIOMotorGridFSBucket(request.app.state.db, bucket_name="media")
    try:
        await bucket.delete(oid)
    except Exception:
        raise HTTPException(404, "Image not found")
    await _audit(request.app.state.db, admin, "media.deleted", media_id)
    return {"ok": True}


@media_router.get("/{media_id}")
async def get_media(media_id: str, request: Request):
    try:
        stream = await AsyncIOMotorGridFSBucket(request.app.state.db, bucket_name="media").open_download_stream(ObjectId(media_id))
    except Exception:
        raise HTTPException(404, "Image not found")
    content_type = (stream.metadata or {}).get("content_type", "application/octet-stream")

    async def chunks():
        while True:
            chunk = await stream.readchunk()
            if not chunk:
                break
            yield chunk

    return StreamingResponse(chunks(), media_type=content_type, headers={"Cache-Control": "public, max-age=31536000, immutable"})


@router.get("/settings")
async def admin_settings(request: Request, _=Depends(require_admin)):
    return await _settings(request.app.state.db)


@router.put("/settings")
async def update_settings(body: SettingsIn, request: Request, admin=Depends(require_admin)):
    db = request.app.state.db
    if len(re.sub(r"\D", "", body.whatsapp_number)) < 7:
        raise HTTPException(422, "Enter a valid WhatsApp number including country code")
    data = {"key": "storefront", **body.model_dump(), "updated_at": now_iso()}
    await db.settings.update_one({"key": "storefront"}, {"$set": data}, upsert=True)
    await _audit(db, admin, "settings.updated", "storefront")
    return data


async def _settings(db):
    return await db.settings.find_one({"key": "storefront"}, {"_id": 0}) or {
        "key": "storefront", "whatsapp_number": "+26773011600",
    }


async def _audit(db, admin, action: str, target_id: str, detail: Optional[str] = None):
    await db.audit_log.insert_one({"id": str(uuid.uuid4()), "admin_id": admin["id"], "admin_email": admin["email"], "action": action, "target_id": target_id, "detail": detail, "created_at": now_iso()})
