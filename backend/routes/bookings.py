"""Public booking enquiries and WhatsApp hand-off."""
import re
import uuid
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/bookings", tags=["bookings"])


def whatsapp_number(value: str) -> str:
    return re.sub(r"\D", "", value or "")


class BookingCreate(BaseModel):
    service_id: str = Field(min_length=1, max_length=100)
    service_name: str = Field(min_length=1, max_length=160)
    customer_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    email: Optional[EmailStr] = None
    preferred_date: str = Field(min_length=8, max_length=20)
    preferred_time: str = Field(min_length=3, max_length=20)
    guests: int = Field(default=1, ge=1, le=30)
    notes: Optional[str] = Field(default=None, max_length=1000)


@router.post("")
async def create_booking(body: BookingCreate, request: Request):
    db = request.app.state.db
    now = datetime.now(timezone.utc).isoformat()
    booking = {
        "id": str(uuid.uuid4()),
        "booking_number": f"LBK-{datetime.now(timezone.utc).strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}",
        **body.model_dump(mode="json"),
        "status": "new",
        "created_at": now,
        "updated_at": now,
    }
    await db.bookings.insert_one(booking)
    booking.pop("_id", None)

    settings = await db.settings.find_one({"key": "storefront"}, {"_id": 0}) or {}
    number = whatsapp_number(settings.get("whatsapp_number", "+26773011600"))
    message = (
        f"Hello Lebville, I would like to request a booking.\n\n"
        f"Booking: {booking['booking_number']}\nService: {body.service_name}\n"
        f"Name: {body.customer_name}\nPhone: {body.phone}\n"
        f"Preferred date: {body.preferred_date}\nPreferred time: {body.preferred_time}\n"
        f"Guests: {body.guests}\nNotes: {body.notes or 'None'}"
    )
    booking["whatsapp_url"] = f"https://wa.me/{number}?text={quote(message)}"
    await db.bookings.update_one({"id": booking["id"]}, {"$set": {"whatsapp_url": booking["whatsapp_url"]}})
    return booking
