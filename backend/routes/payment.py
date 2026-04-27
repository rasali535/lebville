"""DPO Pay integration (sandbox/mock mode supported)."""
import os
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
import httpx

from auth import get_current_user

router = APIRouter(prefix="/payment", tags=["payment"])


def is_mock_mode() -> bool:
    return os.environ.get("DPO_MODE", "mock").lower() != "live"


class CreatePaymentIn(BaseModel):
    order_id: str


def build_create_token_xml(order: dict, frontend_url: str) -> str:
    company_token = os.environ.get("DPO_COMPANY_TOKEN", "")
    service_type = os.environ.get("DPO_SERVICE_TYPE", "3854")
    amount = f"{order['total']:.2f}"
    currency = order.get("currency", "BWP")
    redirect_url = f"{frontend_url}/payment/return?orderId={order['id']}"
    back_url = f"{frontend_url}/checkout?orderId={order['id']}"
    desc = f"Lebville Order {order['order_number']}"
    today = datetime.now(timezone.utc).strftime("%Y/%m/%d %H:%M")
    return f"""<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>{company_token}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>{amount}</PaymentAmount>
    <PaymentCurrency>{currency}</PaymentCurrency>
    <CompanyRef>{order['order_number']}</CompanyRef>
    <RedirectURL>{redirect_url}</RedirectURL>
    <BackURL>{back_url}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>5</PTL>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>{service_type}</ServiceType>
      <ServiceDescription>{desc}</ServiceDescription>
      <ServiceDate>{today}</ServiceDate>
    </Service>
  </Services>
</API3G>"""


def build_verify_token_xml(trans_token: str) -> str:
    company_token = os.environ.get("DPO_COMPANY_TOKEN", "")
    return f"""<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>{company_token}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>{trans_token}</TransactionToken>
</API3G>"""


@router.post("/create")
async def create_payment(body: CreatePaymentIn, request: Request, user: dict = Depends(get_current_user)):
    db = request.app.state.db
    order = await db.orders.find_one({"id": body.order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    if is_mock_mode():
        # Sandbox simulation: produce a mock token and a local redirect that auto-completes
        trans_token = f"MOCK-{uuid.uuid4().hex[:16].upper()}"
        await db.orders.update_one(
            {"id": order["id"]},
            {"$set": {"payment.trans_token": trans_token, "payment.mode": "mock"}},
        )
        # Return a redirect_url to our own /payment/return page (frontend will handle it)
        redirect_url = f"{frontend_url}/payment/return?orderId={order['id']}&TransactionToken={trans_token}&CCDapproval=mock"
        return {
            "ok": True,
            "mode": "mock",
            "trans_token": trans_token,
            "redirect_url": redirect_url,
            "message": "Sandbox/test mode — payment will auto-complete on return.",
        }

    # Live DPO flow
    payment_api = os.environ.get("DPO_API_URL", "https://secure.3gdirectpay.com/API/v6/")
    payment_url_base = os.environ.get("DPO_PAYMENT_URL", "https://secure.3gdirectpay.com/payv3.php")
    xml_body = build_create_token_xml(order, frontend_url)
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(payment_api, content=xml_body, headers={"Content-Type": "application/xml"})
        root = ET.fromstring(r.text)
        result = root.findtext("Result")
        if result != "000":
            raise HTTPException(status_code=502, detail=f"DPO error: {root.findtext('ResultExplanation')}")
        trans_token = root.findtext("TransToken")
        await db.orders.update_one(
            {"id": order["id"]},
            {"$set": {"payment.trans_token": trans_token, "payment.mode": "live"}},
        )
        redirect_url = f"{payment_url_base}?ID={trans_token}"
        return {"ok": True, "mode": "live", "trans_token": trans_token, "redirect_url": redirect_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Payment gateway unavailable: {str(e)}")


class VerifyIn(BaseModel):
    order_id: str
    trans_token: str


@router.post("/verify")
async def verify_payment(body: VerifyIn, request: Request, user: dict = Depends(get_current_user)):
    db = request.app.state.db
    order = await db.orders.find_one({"id": body.order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if is_mock_mode() or body.trans_token.startswith("MOCK-"):
        await db.orders.update_one(
            {"id": order["id"]},
            {"$set": {
                "status": "paid",
                "payment.verified": True,
                "payment.verified_at": datetime.now(timezone.utc).isoformat(),
                "payment.result_code": "000",
                "payment.result_explanation": "Sandbox payment confirmed",
            }},
        )
        updated = await db.orders.find_one({"id": order["id"]}, {"_id": 0})
        return {"ok": True, "status": "paid", "order": updated}

    # Live verify
    payment_api = os.environ.get("DPO_API_URL", "https://secure.3gdirectpay.com/API/v6/")
    xml_body = build_verify_token_xml(body.trans_token)
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(payment_api, content=xml_body, headers={"Content-Type": "application/xml"})
        root = ET.fromstring(r.text)
        result = root.findtext("Result")
        explanation = root.findtext("ResultExplanation")
        is_paid = result == "000"
        await db.orders.update_one(
            {"id": order["id"]},
            {"$set": {
                "status": "paid" if is_paid else "failed",
                "payment.verified": is_paid,
                "payment.verified_at": datetime.now(timezone.utc).isoformat(),
                "payment.result_code": result,
                "payment.result_explanation": explanation,
            }},
        )
        updated = await db.orders.find_one({"id": order["id"]}, {"_id": 0})
        return {"ok": is_paid, "status": updated["status"], "order": updated}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Verification failed: {str(e)}")
