from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from auth import router as auth_router, seed_admin
from routes.products import router as products_router
from routes.orders import router as orders_router
from routes.payment import router as payment_router
from routes.chat import router as chat_router
from products_data import get_seed_products

# ----- App + DB -----
app = FastAPI(title="Lebville Boutique API", version="1.0.0")

mongo_url = os.environ["MONGO_URL"]
db_client = AsyncIOMotorClient(mongo_url)
db = db_client[os.environ["DB_NAME"]]
app.state.db = db

# ----- CORS -----
frontend_url = os.environ.get("FRONTEND_URL", "")
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
app.include_router(api_router)


# ----- Startup -----
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("category")
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("user_id")
    await db.login_attempts.create_index("identifier")
    await db.chat_messages.create_index("session_id")

    # Seed admin
    await seed_admin(db)

    # Seed products if empty
    count = await db.products.count_documents({})
    if count == 0:
        seed = get_seed_products()
        await db.products.insert_many(seed)
        logger.info(f"Seeded {len(seed)} products.")


@app.on_event("shutdown")
async def shutdown():
    db_client.close()
