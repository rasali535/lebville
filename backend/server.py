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
import certifi
from pymongo.uri_parser import parse_uri

from auth import router as auth_router, seed_admin
from routes.products import router as products_router
from routes.orders import router as orders_router
from routes.payment import router as payment_router
from routes.chat import router as chat_router
from routes.bookings import router as bookings_router
from routes.admin import router as admin_router, media_router
from products_data import get_seed_products

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ----- Environment & DB Configuration -----
is_render = bool(os.environ.get("RENDER") or os.environ.get("RENDER_SERVICE_ID") or os.environ.get("RENDER_INSTANCE_ID"))
env_name = os.environ.get("ENVIRONMENT", os.environ.get("ENV", "production" if is_render else "development")).strip().lower()
is_production = is_render or env_name in ("production", "prod", "live")

mongo_url = os.environ.get("MONGO_URL", "").strip()
use_mock_flag = os.environ.get("USE_MOCK_DB", "").strip().lower() in ("true", "1") or mongo_url.lower() == "mock" or os.environ.get("TESTING", "").strip().lower() in ("true", "1")

if is_production:
    if use_mock_flag:
        logger.critical("Mock database configuration was requested in a production environment.")
        raise RuntimeError("CRITICAL: Mock database is strictly prohibited in production / Render environment.")
    if not mongo_url:
        logger.critical("MONGO_URL environment variable is missing in production.")
        raise RuntimeError("CRITICAL: MONGO_URL environment variable is required in production.")

use_mock = (not is_production) and (use_mock_flag or not mongo_url)

app = FastAPI(title="Lebville Boutique API", version="1.0.0")

if use_mock:
    logger.info("Using in-memory Mock database for local development / testing.")
    from mongomock_motor import AsyncMongoMockClient
    db_client = AsyncMongoMockClient()
else:
    try:
        parse_uri(mongo_url)
    except Exception as e:
        logger.error(f"Invalid MONGO_URL connection string syntax: {type(e).__name__}")
        if is_production:
            raise RuntimeError(f"Invalid MONGO_URL connection string syntax: {type(e).__name__}") from None

    client_options = {
        "serverSelectionTimeoutMS": 10000,
        "connectTimeoutMS": 10000,
        "socketTimeoutMS": 20000,
    }
    ca_file = certifi.where()
    if ca_file and os.path.exists(ca_file):
        client_options["tlsCAFile"] = ca_file

    db_client = AsyncIOMotorClient(mongo_url, **client_options)

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
async def health(request: Request):
    db_conn = getattr(request.app.state, "db", None)
    db_connected = False
    if db_conn is not None:
        try:
            await db_conn.command("ping")
            db_connected = True
        except Exception:
            db_connected = False

    if is_production and not db_connected:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "service": "Lebville Boutique API",
                "version": "1.0.0",
            },
        )

    return {
        "status": "healthy" if db_connected or use_mock else "degraded",
        "database": "connected" if db_connected else ("mock" if use_mock else "disconnected"),
        "service": "Lebville Boutique API",
        "version": "1.0.0",
    }


@app.get("/health")
async def app_health(request: Request):
    return await health(request)


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


# ----- Startup & Shutdown -----
@app.on_event("startup")
async def startup():
    global db, db_client

    if not use_mock:
        try:
            await db.command("ping")
            logger.info("Successfully connected to MongoDB database.")
        except Exception as e:
            err_type = type(e).__name__
            if is_production:
                logger.critical(f"FATAL: Production MongoDB connection failed ({err_type}). Startup aborted.")
                raise RuntimeError(f"Production database connection failed: {err_type}. Startup aborted.") from None
            else:
                logger.warning(f"MongoDB connection failed ({err_type}). Falling back to in-memory Mock DB for local preview.")
                from mongomock_motor import AsyncMongoMockClient
                db_client = AsyncMongoMockClient()
                db = db_client[os.environ.get("DB_NAME", "lebville")]
                app.state.db = db

    # Indexes
    await db.users.create_index("email", unique=True)
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

