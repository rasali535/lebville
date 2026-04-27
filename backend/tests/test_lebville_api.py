"""Comprehensive backend API test suite for Lebville Boutique."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://sleek-shop-44.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def new_user_creds():
    ts = int(time.time())
    return {
        "email": f"test_{ts}_{uuid.uuid4().hex[:6]}@example.com",
        "password": "Test@2026",
        "name": "Test User",
    }


@pytest.fixture(scope="session")
def authed_session(session, new_user_creds):
    r = session.post(f"{API}/auth/register", json=new_user_creds)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    return session


# ---------- Health ----------
class TestHealth:
    def test_health(self, session):
        r = session.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"


# ---------- Products ----------
class TestProducts:
    def test_list_products(self, session):
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        # Response may be list or dict with items
        items = data if isinstance(data, list) else data.get("items") or data.get("products") or []
        assert len(items) >= 20, f"expected >=20 products, got {len(items)}"
        sample = items[0]
        for key in ("category", "price"):
            assert key in sample, f"missing key {key} in product"
        # image field (may be image or images)
        assert "image" in sample or "images" in sample

    def test_filter_clothing(self, session):
        r = session.get(f"{API}/products", params={"category": "clothing"})
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("items") or []
        assert len(items) > 0
        for p in items:
            assert p.get("category", "").lower() == "clothing"

    def test_sort_price_asc(self, session):
        r = session.get(f"{API}/products", params={"sort": "price_asc"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("items") or []
        prices = [p["price"] for p in items]
        assert prices == sorted(prices)

    def test_sort_price_desc(self, session):
        r = session.get(f"{API}/products", params={"sort": "price_desc"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("items") or []
        prices = [p["price"] for p in items]
        assert prices == sorted(prices, reverse=True)

    def test_search_nora(self, session):
        r = session.get(f"{API}/products", params={"search": "NORA"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("items") or []
        assert len(items) > 0
        # At least one product name/brand/desc should contain 'nora'
        assert any(
            "nora" in (p.get("name", "") + p.get("brand", "") + p.get("description", "")).lower()
            for p in items
        )

    def test_product_detail(self, session):
        # Pick a product slug from list
        r = session.get(f"{API}/products")
        items = r.json() if isinstance(r.json(), list) else r.json().get("items") or []
        slug = None
        for p in items:
            if "nora" in p.get("name", "").lower() or "nora" in p.get("slug", "").lower():
                slug = p["slug"]
                break
        if not slug:
            slug = items[0]["slug"]
        r2 = session.get(f"{API}/products/{slug}")
        assert r2.status_code == 200, f"{r2.status_code}: {r2.text}"
        prod = r2.json()
        assert prod["slug"] == slug

    def test_categories(self, session):
        r = session.get(f"{API}/products/categories")
        assert r.status_code == 200
        data = r.json()
        cats = data if isinstance(data, list) else data.get("categories") or []
        assert len(cats) > 0


# ---------- Auth ----------
class TestAuth:
    def test_register_login_me_logout(self, new_user_creds):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        # Register (using a fresh user for this isolated test)
        creds = {
            "email": f"test_{int(time.time())}_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Test@2026",
            "name": "Iso User",
        }
        r = s.post(f"{API}/auth/register", json=creds)
        assert r.status_code in (200, 201), r.text
        user = r.json()
        assert user["email"] == creds["email"]
        assert "id" in user
        # Cookies set
        assert "access_token" in s.cookies or any(c.name == "access_token" for c in s.cookies)

        # /me
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == creds["email"]

        # Logout
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200

        # New session login
        s2 = requests.Session()
        s2.headers.update({"Content-Type": "application/json"})
        r = s2.post(f"{API}/auth/login", json={"email": creds["email"], "password": creds["password"]})
        assert r.status_code == 200, r.text
        assert any(c.name == "access_token" for c in s2.cookies)

    def test_brute_force_lockout(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        email = f"bruteforce_{int(time.time())}_{uuid.uuid4().hex[:6]}@example.com"
        # Register user first
        r = s.post(f"{API}/auth/register", json={"email": email, "password": "Right@2026", "name": "B F"})
        assert r.status_code in (200, 201)
        # 5 failed attempts
        s2 = requests.Session()
        s2.headers.update({"Content-Type": "application/json"})
        got_429 = False
        for i in range(7):
            r = s2.post(f"{API}/auth/login", json={"email": email, "password": "Wrong@2026"})
            if r.status_code == 429:
                got_429 = True
                break
            assert r.status_code == 401
        assert got_429, "Expected 429 lockout after repeated failures"


# ---------- Orders ----------
class TestOrders:
    def _get_products(self, session):
        r = session.get(f"{API}/products")
        items = r.json() if isinstance(r.json(), list) else r.json().get("items") or []
        return items

    def test_create_order_auth_required(self, session):
        # Use bare session (no auth)
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{API}/orders", json={"items": [], "shipping": {}})
        assert r.status_code in (401, 403)

    def _item(self, p, qty=1):
        return {
            "product_id": p.get("id", p.get("slug")),
            "slug": p["slug"],
            "name": p["name"],
            "price": p["price"],
            "quantity": qty,
            "image": p.get("image") or (p.get("images") or [""])[0],
        }

    def _ship(self):
        return {
            "full_name": "Test User",
            "phone": "+26771234567",
            "email": "t@t.com",
            "address_line": "Plot 123",
            "city": "Gaborone",
            "country": "Botswana",
        }

    def test_create_order_free_shipping(self, authed_session):
        products = self._get_products(authed_session)
        # pick product and quantity to exceed BWP 1000
        p = max(products, key=lambda x: x["price"])
        qty = max(1, int(1100 // p["price"]) + 1)
        payload = {"items": [self._item(p, qty)], "shipping": self._ship()}
        r = authed_session.post(f"{API}/orders", json=payload)
        assert r.status_code in (200, 201), r.text
        order = r.json()
        assert "order_number" in order
        assert order.get("status") == "pending_payment"
        assert order.get("currency") == "BWP"
        assert order.get("shipping_cost", -1) == 0

    def test_create_order_paid_shipping(self, authed_session):
        products = self._get_products(authed_session)
        # pick a lower priced product so subtotal < 1000
        p = min(products, key=lambda x: x["price"])
        payload = {"items": [self._item(p, 1)], "shipping": self._ship()}
        r = authed_session.post(f"{API}/orders", json=payload)
        assert r.status_code in (200, 201), r.text
        order = r.json()
        if p["price"] < 1000:
            assert order.get("shipping_cost") == 50, f"expected 50, got {order.get('shipping_cost')}"

    def test_list_orders(self, authed_session):
        r = authed_session.get(f"{API}/orders")
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("items") or []
        assert len(items) >= 1


# ---------- Payment ----------
class TestPayment:
    @pytest.fixture
    def order_id(self, authed_session):
        # Create an order
        r = authed_session.get(f"{API}/products")
        items = r.json() if isinstance(r.json(), list) else r.json().get("items") or []
        p = items[0]
        payload = {
            "items": [{
                "product_id": p.get("id", p.get("slug")),
                "slug": p["slug"],
                "name": p["name"],
                "price": p["price"],
                "quantity": 1,
                "image": p.get("image") or (p.get("images") or [""])[0],
            }],
            "shipping": {
                "full_name": "Pay User", "phone": "+26771234567", "email": "t@t.com",
                "address_line": "Plot 1", "city": "Gaborone", "country": "Botswana",
            },
        }
        r = authed_session.post(f"{API}/orders", json=payload)
        assert r.status_code in (200, 201), r.text
        return r.json()["id"], r.json().get("order_number")

    def test_payment_create_mock(self, authed_session, order_id):
        oid, _ = order_id
        r = authed_session.post(f"{API}/payment/create", json={"order_id": oid})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "redirect_url" in data
        assert "MOCK-" in data["redirect_url"] or "MOCK-" in str(data)

    def test_payment_verify_mock(self, authed_session, order_id):
        oid, _ = order_id
        r = authed_session.post(f"{API}/payment/create", json={"order_id": oid})
        assert r.status_code == 200
        redirect = r.json()["redirect_url"]
        # Extract MOCK token
        import urllib.parse as up
        parsed = up.urlparse(redirect)
        qs = up.parse_qs(parsed.query)
        token = qs.get("TransactionToken", [None])[0] or qs.get("transToken", [None])[0]
        assert token and token.startswith("MOCK-"), f"token={token}"
        r2 = authed_session.post(f"{API}/payment/verify", json={"order_id": oid, "trans_token": token})
        assert r2.status_code == 200, r2.text
        # Verify order status updated
        r3 = authed_session.get(f"{API}/orders")
        orders = r3.json() if isinstance(r3.json(), list) else r3.json().get("items") or []
        match = next((o for o in orders if o["id"] == oid), None)
        assert match and match.get("status") == "paid", f"order status={match.get('status') if match else 'not found'}"


# ---------- Chat ----------
class TestChat:
    def test_chat_message_and_history(self, authed_session):
        r = authed_session.post(f"{API}/chat/message", json={"message": "Hello, what makeup do you have?"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "reply" in data or "message" in data
        assert "session_id" in data
        sid = data["session_id"]
        # History
        r2 = authed_session.get(f"{API}/chat/history/{sid}")
        assert r2.status_code == 200
        hist = r2.json()
        msgs = hist if isinstance(hist, list) else hist.get("messages") or []
        assert len(msgs) >= 1
