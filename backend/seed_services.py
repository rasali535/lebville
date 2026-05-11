import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

# Load env
load_dotenv(Path(__file__).parent / ".env")

# Import products from products_data
import sys
sys.path.append(str(Path(__file__).parent))
from products_data import PRODUCTS

async def seed():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    
    if not mongo_url or not db_name:
        print("Error: MONGO_URL or DB_NAME not set in .env")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Optional: Clear existing products to ensure clean category mapping
    # await db.products.delete_many({})
    # print("Cleared existing products.")

    count_added = 0
    count_updated = 0
    
    for p in PRODUCTS:
        # Check if exists by slug
        existing = await db.products.find_one({"slug": p["slug"]})
        if existing:
            # Update category to match new classification (e.g. cosmetics)
            if existing.get("category") != p["category"]:
                await db.products.update_one(
                    {"slug": p["slug"]},
                    {"$set": {"category": p["category"]}}
                )
                count_updated += 1
            continue
            
        doc = {
            "id": str(uuid.uuid4()),
            **p,
            "created_at": now
        }
        await db.products.insert_one(doc)
        count_added += 1
    
    print(f"Seed complete. Added {count_added} new products, updated {count_updated} categories.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
