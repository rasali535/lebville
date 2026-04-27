"""Product browsing endpoints."""
from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional, List

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products(
    request: Request,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = Query(None, description="price_asc|price_desc|recent"),
    limit: int = 100,
):
    db = request.app.state.db
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    if tag:
        query["tag"] = tag
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    sort_spec = []
    if sort == "price_asc":
        sort_spec = [("price", 1)]
    elif sort == "price_desc":
        sort_spec = [("price", -1)]
    elif sort == "recent":
        sort_spec = [("created_at", -1)]

    cursor = db.products.find(query, {"_id": 0})
    if sort_spec:
        cursor = cursor.sort(sort_spec)
    items = await cursor.to_list(limit)
    return {"items": items, "count": len(items)}


@router.get("/categories")
async def list_categories(request: Request):
    db = request.app.state.db
    cats = await db.products.distinct("category")
    return {"categories": sorted(cats)}


@router.get("/{slug}")
async def get_product(slug: str, request: Request):
    db = request.app.state.db
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
