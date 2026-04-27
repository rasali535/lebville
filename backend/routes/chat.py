"""AI Customer Support Chatbot using Claude Sonnet 4.5 via Emergent LLM Key."""
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """You are Lebi, the warm and knowledgeable AI concierge for Lebville Boutique & Spa — a luxury fashion, beauty and wellness destination based in Gaborone, Botswana. The brand voice is "where elegance meets exclusivity": empowering, refined, gracious, never pushy.

You help customers:
- Discover products (clothing, NORA cosmetics, skincare, accessories)
- Answer sizing, styling, fabric, ingredient questions
- Explain orders, shipping (Botswana-wide, BWP currency), returns
- Recommend looks for occasions
- Share spa & boutique info: located in Gaborone, contact +267 73 011 600, info@lebvilleboutique.com

Tone: short, elegant sentences. Use line breaks for readability. If asked something off-topic, gently redirect. Never make up product specifics — if unsure, suggest the customer browse the Shop page or contact us on WhatsApp +267 73 011 600.

Currency is always BWP (Botswana Pula). Standard delivery is free over BWP 1,000.
"""


class ChatMessageIn(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=2000)


@router.post("/message")
async def chat_message(body: ChatMessageIn, request: Request):
    db = request.app.state.db
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Chat service not configured")

    session_id = body.session_id or str(uuid.uuid4())

    # Build a context-aware system prompt with current product highlights
    products = await db.products.find({}, {"_id": 0, "name": 1, "price": 1, "category": 1, "tag": 1}).to_list(40)
    product_summary = "\n".join(
        f"- {p['name']} (BWP {p['price']:.2f}) — {p['category']}{' • ' + p['tag'] if p.get('tag') else ''}"
        for p in products[:25]
    )
    full_system = f"{SYSTEM_PROMPT}\n\nCurrent featured catalog (subset):\n{product_summary}"

    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=full_system,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        # Persist user message
        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": "user",
            "content": body.message,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        reply = await chat.send_message(UserMessage(text=body.message))
        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": "assistant",
            "content": reply,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"session_id": session_id, "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Chat unavailable: {str(e)}")


@router.get("/history/{session_id}")
async def chat_history(session_id: str, request: Request):
    db = request.app.state.db
    msgs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return {"messages": msgs}
