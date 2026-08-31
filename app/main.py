"""FastAPI backend for the Orientbell RAG assistant.

Endpoints:
  GET  /                 -> demo storefront page with the embedded widget
  GET  /health           -> service + LLM status
  POST /api/chat         -> ask the assistant a question (RAG)
  GET  /api/products/{id}-> product detail (used when shortlisting)
  GET  /widget.js        -> the embeddable widget script
  GET  /demo             -> same as /

The widget can be embedded on any page of www.orientbell.com with a single
<script> tag pointing at /widget.js (see web/index.html for an example).
"""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from . import config
from .assistant import Assistant

app = FastAPI(
    title="Orientbell Tiles - RAG Assistant",
    description="A retrieval-augmented shopping assistant for orientbell.com tiles.",
    version="1.0.0",
)

# The widget is embedded on the website, so allow cross-origin calls.
# Lock `allow_origins` down to your real domains before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Single shared assistant (loads catalog + builds the index once at startup).
assistant = Assistant()

# Build id -> product lookup for the shortlist/detail endpoint.
_PRODUCT_INDEX: dict[str, dict[str, Any]] = {
    p["id"]: p for p in assistant.retriever.catalog.get("products", [])
}
_CATEGORY_INDEX: dict[str, dict[str, Any]] = {
    c["id"]: c for c in assistant.retriever.catalog.get("categories", [])
}


# ------------------------------------------------------------------ schemas
class ChatTurn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: list[ChatTurn] = Field(default_factory=list)


# ------------------------------------------------------------------ routes
@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "llm_enabled": config.llm_enabled(),
        "model": config.CLAUDE_MODEL if config.llm_enabled() else None,
        "products_indexed": len(_PRODUCT_INDEX),
        "categories_indexed": len(_CATEGORY_INDEX),
        "documents_indexed": len(assistant.retriever.documents),
    }


@app.post("/api/chat")
def chat(req: ChatRequest) -> JSONResponse:
    history = [t.model_dump() for t in req.history]
    result = assistant.answer(req.message, history=history)
    return JSONResponse(result)


@app.get("/api/products/{product_id}")
def get_product(product_id: str) -> dict[str, Any]:
    product = _PRODUCT_INDEX.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.get("/api/categories/{category_id}")
def get_category(category_id: str) -> dict[str, Any]:
    category = _CATEGORY_INDEX.get(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@app.get("/widget.js")
def widget_js() -> FileResponse:
    return FileResponse(config.WEB_DIR / "widget.js", media_type="application/javascript")


@app.get("/")
@app.get("/demo")
def demo() -> FileResponse:
    return FileResponse(config.WEB_DIR / "index.html", media_type="text/html")
