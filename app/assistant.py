"""Conversational assistant that grounds Claude in retrieved catalog context.

Flow (Retrieval-Augmented Generation):
  1. Retrieve relevant products, category pages and knowledge for the query.
  2. Build a compact, grounded context block from those retrieved records.
  3. Ask Claude to (a) answer naturally and (b) return structured suggestions
     (products/categories to explore, next-step actions) chosen ONLY from the
     retrieved candidates.
  4. Validate Claude's chosen IDs against the candidates so URLs are always
     real and nothing is hallucinated.

If no ANTHROPIC_API_KEY is configured, `answer()` falls back to a fully
offline, template-based response built straight from retrieval.
"""
from __future__ import annotations

import json
from typing import Any

from pydantic import BaseModel, Field

from . import config
from .retriever import Retriever, RetrievalResult

SYSTEM_PROMPT = """You are the Orientbell Tiles shopping assistant on www.orientbell.com.

Your job: understand what the shopper wants (room, colour, look, budget, and \
practical needs like slip-safety or stain-resistance), then help them discover \
the right tiles and move forward in their journey - exploring category pages and \
shortlisting products to compare later.

STRICT GROUNDING RULES:
- Only recommend products and categories that appear in the CONTEXT provided to \
you. Never invent product names, IDs, prices, or URLs.
- Reference products and categories by their exact `id` from the CONTEXT. The \
system fills in the real URLs from those IDs.
- If the context does not contain a good match, say so honestly and suggest the \
closest relevant category to browse, or ask one clarifying question.

STYLE:
- Warm, concise, and helpful - like a knowledgeable showroom advisor.
- Use tile terminology from the CONTEXT correctly (GVT, vitrified, anti-skid, \
finishes) but explain simply.
- Encourage a next step: shortlist a tile, explore a category, or refine by \
colour / size / budget.
- Keep the spoken reply to 2-4 short sentences; put specifics in the structured \
suggestions."""


# ----------------------------------------------------------------- schemas
class ProductSuggestion(BaseModel):
    id: str = Field(description="Exact product id from CONTEXT")
    reason: str = Field(description="One short line on why it fits the shopper")


class CategorySuggestion(BaseModel):
    id: str = Field(description="Exact category id from CONTEXT")
    reason: str = Field(description="One short line on why to explore it")


class NextAction(BaseModel):
    type: str = Field(description="One of: shortlist_product, explore_category, refine")
    label: str = Field(description="Button label shown to the shopper")
    target_id: str = Field(default="", description="Product/category id this action refers to, if any")


class AssistantAnswer(BaseModel):
    reply: str = Field(description="Natural-language answer, 2-4 short sentences")
    products: list[ProductSuggestion] = Field(default_factory=list)
    categories: list[CategorySuggestion] = Field(default_factory=list)
    actions: list[NextAction] = Field(default_factory=list)
    follow_up_questions: list[str] = Field(default_factory=list)


class Assistant:
    def __init__(self, retriever: Retriever | None = None):
        self.retriever = retriever or Retriever.from_files()
        self._client = None
        if config.llm_enabled():
            import anthropic

            self._client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    # ------------------------------------------------------------- context
    def _build_context(self, bundle: dict[str, list[RetrievalResult]]) -> str:
        def product_line(r: RetrievalResult) -> dict[str, Any]:
            p = r.document.payload
            return {
                "id": p["id"],
                "name": p["name"],
                "color": p.get("color", []),
                "finish": p.get("finish"),
                "material": p.get("material"),
                "size": p.get("size"),
                "applications": p.get("applications", []),
                "features": p.get("features", []),
                "price_band": p.get("price_band"),
                "price_per_sqft_inr": p.get("price_per_sqft"),
                "description": p.get("description"),
            }

        def category_line(r: RetrievalResult) -> dict[str, Any]:
            c = r.document.payload
            return {
                "id": c["id"],
                "name": c["name"],
                "rooms": c.get("rooms", []),
                "description": c.get("description"),
            }

        def knowledge_line(r: RetrievalResult) -> dict[str, Any]:
            k = r.document.payload
            return {
                "title": r.document.title,
                "text": k.get("definition") or k.get("text"),
            }

        context = {
            "products": [product_line(r) for r in bundle["products"]],
            "categories": [category_line(r) for r in bundle["categories"]],
            "knowledge": [knowledge_line(r) for r in bundle["knowledge"]],
        }
        return json.dumps(context, ensure_ascii=False, indent=2)

    def _candidate_maps(
        self, bundle: dict[str, list[RetrievalResult]]
    ) -> tuple[dict[str, dict], dict[str, dict]]:
        products = {r.document.payload["id"]: r.document.payload for r in bundle["products"]}
        categories = {r.document.payload["id"]: r.document.payload for r in bundle["categories"]}
        return products, categories

    # -------------------------------------------------------------- answer
    def answer(self, query: str, history: list[dict[str, str]] | None = None) -> dict[str, Any]:
        bundle = self.retriever.retrieve_context(
            query,
            k_products=config.TOP_K_PRODUCTS,
            k_categories=config.TOP_K_CATEGORIES,
            k_knowledge=config.TOP_K_KNOWLEDGE,
        )
        product_map, category_map = self._candidate_maps(bundle)

        if self._client is None:
            return self._fallback_answer(query, bundle, product_map, category_map)

        try:
            return self._llm_answer(query, bundle, product_map, category_map, history or [])
        except Exception as exc:  # noqa: BLE001 - degrade gracefully, never 500 the widget
            result = self._fallback_answer(query, bundle, product_map, category_map)
            result["degraded"] = True
            result["error"] = f"{type(exc).__name__}: {exc}"
            return result

    def _llm_answer(
        self,
        query: str,
        bundle: dict[str, list[RetrievalResult]],
        product_map: dict[str, dict],
        category_map: dict[str, dict],
        history: list[dict[str, str]],
    ) -> dict[str, Any]:
        context = self._build_context(bundle)
        messages: list[dict[str, Any]] = []
        for turn in history[-6:]:  # keep recent context small
            role = "assistant" if turn.get("role") == "assistant" else "user"
            messages.append({"role": role, "content": turn.get("content", "")})
        messages.append(
            {
                "role": "user",
                "content": f"CONTEXT (retrieved catalog + knowledge):\n{context}\n\n"
                f"Shopper says: {query}",
            }
        )

        response = self._client.messages.parse(
            model=config.CLAUDE_MODEL,
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            messages=messages,
            output_format=AssistantAnswer,
        )
        parsed: AssistantAnswer = response.parsed_output

        return self._assemble(
            reply=parsed.reply,
            product_ids=[(p.id, p.reason) for p in parsed.products],
            category_ids=[(c.id, c.reason) for c in parsed.categories],
            raw_actions=[a.model_dump() for a in parsed.actions],
            follow_ups=parsed.follow_up_questions,
            product_map=product_map,
            category_map=category_map,
            source="claude",
        )

    # ------------------------------------------------------------ fallback
    def _fallback_answer(
        self,
        query: str,
        bundle: dict[str, list[RetrievalResult]],
        product_map: dict[str, dict],
        category_map: dict[str, dict],
    ) -> dict[str, Any]:
        products = [(r.document.payload["id"], r.document.payload.get("description", "")) for r in bundle["products"][:4]]
        categories = [(r.document.payload["id"], r.document.payload.get("description", "")) for r in bundle["categories"][:3]]

        if products or categories:
            top_names = [product_map[pid]["name"] for pid, _ in products[:2] if pid in product_map]
            names_str = " and ".join(top_names) if top_names else "a few good options"
            reply = (
                f"Here are some tiles that match “{query}” - {names_str}. "
                "Tap a tile to shortlist it, or explore the related category pages to see the full range."
            )
        else:
            reply = (
                "I couldn't find an exact match in our catalogue. Try telling me the room "
                "(bathroom, kitchen, living room), a colour, or a look (marble, wood, glossy) "
                "and I'll pull up options."
            )

        follow_ups = [
            "What room is this for?",
            "Any colour or finish in mind?",
            "Should it be anti-skid / easy to clean?",
        ]
        return self._assemble(
            reply=reply,
            product_ids=products,
            category_ids=categories,
            raw_actions=[],
            follow_ups=follow_ups,
            product_map=product_map,
            category_map=category_map,
            source="retrieval",
        )

    # ------------------------------------------------------------ assemble
    def _assemble(
        self,
        reply: str,
        product_ids: list[tuple[str, str]],
        category_ids: list[tuple[str, str]],
        raw_actions: list[dict[str, Any]],
        follow_ups: list[str],
        product_map: dict[str, dict],
        category_map: dict[str, dict],
        source: str,
    ) -> dict[str, Any]:
        """Validate IDs against candidates and attach real URLs/metadata."""
        products = []
        seen = set()
        for pid, reason in product_ids:
            if pid in product_map and pid not in seen:
                seen.add(pid)
                p = product_map[pid]
                products.append(
                    {
                        "id": pid,
                        "name": p["name"],
                        "url": p["url"],
                        "color": p.get("color", []),
                        "finish": p.get("finish"),
                        "size": p.get("size"),
                        "price_per_sqft_inr": p.get("price_per_sqft"),
                        "applications": p.get("applications", []),
                        "reason": reason or p.get("description", ""),
                    }
                )

        categories = []
        seen_c = set()
        for cid, reason in category_ids:
            if cid in category_map and cid not in seen_c:
                seen_c.add(cid)
                c = category_map[cid]
                categories.append(
                    {
                        "id": cid,
                        "name": c["name"],
                        "url": c["url"],
                        "reason": reason or c.get("description", ""),
                    }
                )

        # Build default actions if the model didn't supply usable ones.
        actions: list[dict[str, Any]] = []
        for a in raw_actions:
            tid = a.get("target_id", "")
            if a.get("type") == "shortlist_product" and tid not in product_map:
                continue
            if a.get("type") == "explore_category" and tid not in category_map:
                continue
            actions.append(a)
        if not actions:
            for p in products[:2]:
                actions.append(
                    {"type": "shortlist_product", "label": f"Shortlist {p['name']}", "target_id": p["id"]}
                )
            for c in categories[:2]:
                actions.append(
                    {"type": "explore_category", "label": f"Explore {c['name']}", "target_id": c["id"]}
                )

        return {
            "reply": reply,
            "products": products,
            "categories": categories,
            "actions": actions,
            "follow_up_questions": follow_ups[:3],
            "source": source,
        }
