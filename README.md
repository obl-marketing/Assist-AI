# Orientbell Tiles — RAG AI Assistant

A simple **Retrieval-Augmented Generation (RAG)** shopping assistant for
[orientbell.com](https://www.orientbell.com). A shopper can ask things like
*“pink tiles for my bathroom”* or *“which tiles are suitable for a kitchen
floor?”*, and the assistant understands the intent, grounds itself in
Orientbell's own catalogue + tile terminology, and:

- answers in natural language,
- suggests **relevant products** and **category pages** to explore (with real URLs),
- lets the shopper **shortlist / wishlist** tiles to compare later,
- proposes **next steps** to expand the journey (explore a collection, refine by colour/size/budget, book a store visit).

It ships as a **FastAPI** backend plus a **one-line embeddable chat widget** you
can drop onto any page of the website.

---

## How it works

```
Shopper question
      │
      ▼
┌─────────────────┐   BM25 + colour/room/finish boosts (pure Python, offline)
│   Retriever     │──────────────────────────────────────────────┐
│ app/retriever.py│  ranks products · categories · knowledge      │
└─────────────────┘                                               │
      │ retrieved context (grounding)                             │
      ▼                                                           │
┌─────────────────┐   Claude (structured output) phrases the      │
│   Assistant     │   answer + picks products/categories ONLY     │
│ app/assistant.py│   from the retrieved candidates               │
└─────────────────┘                                               │
      │ validated JSON (IDs → real URLs)                          │
      ▼                                                           │
┌─────────────────┐                                               │
│  FastAPI  /api  │◀──────────────────────────────────────────────┘
│   app/main.py   │   POST /api/chat
└─────────────────┘
      │
      ▼
  web/widget.js  (floating chat + product cards + shortlist)
```

**Two layers, so it always works:**

1. **Retrieval layer** (`app/retriever.py`) — a dependency-free BM25 index over
   the catalogue and knowledge base, with domain-aware boosts for colour
   (“pink”), room/application (“bathroom”, “kitchen”) and safety (“anti-skid”).
   Runs entirely offline — **no API key needed**.
2. **Conversational layer** (`app/assistant.py`) — Claude turns the retrieved
   context into a warm, grounded reply and structured suggestions. It may only
   reference products/categories from the retrieved set; the backend validates
   every ID so URLs are always real (no hallucinated products).

If `ANTHROPIC_API_KEY` is not set, the assistant automatically falls back to a
templated retrieval-only response — the widget still finds and shortlists tiles.

---

## Project layout

```
Assist-AI/
├── app/
│   ├── config.py        # env-driven config (API key, model, top-k)
│   ├── retriever.py     # BM25 RAG index over catalog + knowledge
│   ├── assistant.py     # Claude orchestration + structured output + fallback
│   └── main.py          # FastAPI app (chat, product, widget, demo)
├── data/
│   ├── catalog.json     # seed products + category pages (swap for a live feed)
│   └── knowledge.json   # tile terminology, room guidance, brand context
├── web/
│   ├── index.html       # demo storefront that embeds the widget
│   └── widget.js         # embeddable chat + shortlist widget
├── scripts/
│   └── smoke_test.py    # offline test of retrieval + fallback (no API key)
├── requirements.txt
└── .env.example
```

---

## Quick start

```bash
# 1. Install
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. (Optional) enable the Claude layer
cp .env.example .env
#   then edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Verify retrieval offline (no API key required)
python -m scripts.smoke_test

# 4. Run the server
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000** for the demo storefront, then click
**“🧱 Ask about tiles”** in the bottom-right and try:

- *“pink tiles for my bathroom”*
- *“anti-skid tiles for the kitchen floor”*
- *“marble-look tiles for the living room”*
- *“what is a GVT tile?”*

> The server reads `ANTHROPIC_API_KEY` from the environment / `.env`. Without
> it, `/health` reports `"llm_enabled": false` and replies come from the
> retrieval fallback.

---

## Embedding on the website

The widget is a single script tag. On any page of the site:

```html
<script src="https://YOUR-HOST/widget.js" data-api="https://YOUR-HOST" defer></script>
```

- `data-api` — base URL of this backend (omit if served from the same origin).
- The shortlist is stored in the visitor's `localStorage` (`obt_shortlist`), so
  it persists as they browse across pages.
- Restrict `CORSMiddleware`'s `allow_origins` in `app/main.py` to your real
  domains before going live.

---

## API

| Method | Path                     | Purpose                                   |
|--------|--------------------------|-------------------------------------------|
| GET    | `/`  · `/demo`           | Demo storefront with the embedded widget  |
| GET    | `/health`                | Service + LLM status                      |
| POST   | `/api/chat`              | Ask the assistant (RAG)                   |
| GET    | `/api/products/{id}`     | Product detail (used when shortlisting)   |
| GET    | `/api/categories/{id}`   | Category detail                           |
| GET    | `/widget.js`             | The embeddable widget script              |

**`POST /api/chat`**

```jsonc
// request
{ "message": "pink tiles for my bathroom", "history": [] }

// response
{
  "reply": "Blush pink works beautifully in a bathroom …",
  "products": [
    { "id": "OBT-PNK-3003", "name": "Dusty Pink Matt Anti-Skid Floor Tile",
      "url": "https://www.orientbell.com/tiles/…", "color": ["pink"],
      "finish": "matt", "size": "300x300 mm", "price_per_sqft_inr": 48,
      "reason": "Anti-skid, safe for wet bathroom floors" }
  ],
  "categories": [
    { "id": "cat-bathroom", "name": "Bathroom Tiles",
      "url": "https://www.orientbell.com/tiles/bathroom-tiles", "reason": "…" }
  ],
  "actions": [
    { "type": "shortlist_product", "label": "Shortlist …", "target_id": "OBT-PNK-3003" },
    { "type": "explore_category",  "label": "Explore Bathroom Tiles", "target_id": "cat-bathroom" }
  ],
  "follow_up_questions": ["Glossy or matt walls?", "What's your budget per sq.ft?"],
  "source": "claude"   // or "retrieval" when the LLM layer is off
}
```

---

## Using your real catalogue

The demo ships with a small, illustrative `data/catalog.json`. To use live data,
replace it with your product feed in the same shape (`categories[]` and
`products[]` with `id`, `name`, `url`, `color`, `finish`, `applications`,
`features`, `keywords`, …). The retriever rebuilds its index from those files on
startup — no other code changes needed. For a large catalogue (thousands of
SKUs), swap the in-memory BM25 index for a vector database; the `Retriever` /
`Assistant` split keeps that change isolated.

## Notes & next steps

- **Grounding:** the model can only surface products/categories present in the
  retrieved context, and the backend drops any ID that isn't a real candidate.
- **Model:** defaults to `claude-opus-5` (override with `CLAUDE_MODEL`).
- **Ideas to extend:** persist wishlists to a user account, add an image swatch
  field per product, wire “book a store visit” to a real lead form, or feed the
  live Orientbell product API into `data/catalog.json`.
