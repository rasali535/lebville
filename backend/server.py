from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from auth import router as auth_router, seed_admin
from routes.products import router as products_router
from routes.orders import router as orders_router
from routes.payment import router as payment_router
from routes.chat import router as chat_router
from routes.bookings import router as bookings_router
from routes.admin import router as admin_router, media_router
from products_data import get_seed_products

# ----- App + DB -----
app = FastAPI(title="Lebville Boutique API", version="1.0.0")

mongo_url = os.environ.get("MONGO_URL", "mock")
use_mock = mongo_url.lower() == "mock" or os.environ.get("USE_MOCK_DB", "").lower() in ("true", "1")

if use_mock:
    from mongomock_motor import AsyncMongoMockClient
    db_client = AsyncMongoMockClient()
else:
    db_client = AsyncIOMotorClient(mongo_url)

db = db_client[os.environ.get("DB_NAME", "lebville")]
app.state.db = db

# ----- CORS -----
frontend_url = os.environ.get("FRONTEND_URL", "")
frontend_host = os.environ.get("FRONTEND_HOST", "")
if not frontend_url and frontend_host:
    frontend_url = f"https://{frontend_host}"
allowed = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
if frontend_url and frontend_url not in allowed:
    allowed.append(frontend_url)
allowed.append("http://localhost:3000")
allowed = list({o for o in allowed if o and o != "*"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed if allowed else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def verify_browser_origin(request: Request, call_next):
    """Block cross-site browser mutations while retaining non-browser API clients."""
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")
        if origin and origin not in allowed:
            return JSONResponse(status_code=403, content={"detail": "Origin not allowed"})
    return await call_next(request)

# ----- Router -----
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "Lebville Boutique API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(orders_router)
api_router.include_router(payment_router)
api_router.include_router(chat_router)
api_router.include_router(bookings_router)
api_router.include_router(admin_router)
api_router.include_router(media_router)


@api_router.get("/storefront")
async def storefront(request: Request):
    now = datetime.now(timezone.utc).isoformat()
    specials = await request.app.state.db.specials.find({
        "active": True,
        "$and": [
            {"$or": [{"starts_at": None}, {"starts_at": ""}, {"starts_at": {"$lte": now}}]},
            {"$or": [{"ends_at": None}, {"ends_at": ""}, {"ends_at": {"$gte": now}}]},
        ],
    }, {"_id": 0}).sort("created_at", -1).to_list(20)
    settings = await request.app.state.db.settings.find_one({"key": "storefront"}, {"_id": 0}) or {"whatsapp_number": "+26773011600"}
    return {"specials": specials, "whatsapp_number": settings.get("whatsapp_number", "+26773011600")}
app.include_router(api_router)


# ----- Startup -----
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    global db, db_client
    try:
        # Test connection / create indexes
        await db.users.create_index("email", unique=True)
    except Exception as e:
        logger.warning(f"MongoDB connection/auth failed ({e}). Falling back to in-memory Mock DB for local preview.")
        from mongomock_motor import AsyncMongoMockClient
        db_client = AsyncMongoMockClient()
        db = db_client[os.environ.get("DB_NAME", "lebville")]
        app.state.db = db
        await db.users.create_index("email", unique=True)

    # Indexes
    await db.users.create_index("id", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("category")
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("user_id")
    await db.login_attempts.create_index("identifier")
    await db.chat_messages.create_index("session_id")
    await db.bookings.create_index("id", unique=True)
    await db.bookings.create_index("status")
    await db.specials.create_index("id", unique=True)
    await db.audit_log.create_index("created_at")

    # Seed admin
    await seed_admin(db)

    # Seed products if empty
    count = await db.products.count_documents({})
    if count == 0:
        seed = get_seed_products()
        await db.products.insert_many(seed)
        logger.info(f"Seeded {len(seed)} products.")
    else:
        # Add newly introduced catalogue items without overwriting admin edits.
        added = 0
        for product in get_seed_products():
            result = await db.products.update_one(
                {"slug": product["slug"]},
                {"$setOnInsert": product},
                upsert=True,
            )
            added += int(result.upserted_id is not None)
        if added:
            logger.info(f"Added {added} new catalogue items.")


@app.on_event("shutdown")
async def shutdown():
    db_client.close()
