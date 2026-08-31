"""Offline smoke test for the retriever + assistant fallback.

Runs WITHOUT an API key: it exercises retrieval and the templated fallback so
you can verify intent understanding and product/category matching end to end.

    python -m scripts.smoke_test
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.assistant import Assistant  # noqa: E402

QUERIES = [
    "pink tiles for my bathroom",
    "which tiles are suitable for kitchen floor?",
    "marble look tiles for the living room",
    "anti-skid tiles for balcony",
    "what is a GVT tile?",
    "something warm and cosy for a bedroom",
]


def main() -> int:
    assistant = Assistant()
    print(f"Indexed {len(assistant.retriever.documents)} documents.\n")

    failures = 0
    for q in QUERIES:
        result = assistant.answer(q)
        n_products = len(result["products"])
        n_categories = len(result["categories"])
        print(f"Q: {q}")
        print(f"   source={result['source']}  products={n_products}  categories={n_categories}")
        for p in result["products"][:3]:
            print(f"     • {p['name']}  ({', '.join(p.get('color', []))})  {p['url']}")
        for c in result["categories"][:2]:
            print(f"     → {c['name']}  {c['url']}")
        print()

        # Basic assertions: shopping intents should surface at least one product
        # or category; the glossary question should surface knowledge-backed text.
        if "gvt" in q.lower():
            if "gvt" not in result["reply"].lower() and n_products == 0 and n_categories == 0:
                print("   [WARN] expected some GVT-related grounding")
        elif n_products == 0 and n_categories == 0:
            print("   [FAIL] expected at least one product or category match")
            failures += 1

    # Colour-intent check: pink query should return a pink product first.
    pink = assistant.answer("pink tiles")
    if pink["products"] and "pink" in [c.lower() for c in pink["products"][0].get("color", [])]:
        print("[OK] colour intent: top result for 'pink tiles' is pink.")
    else:
        print("[FAIL] colour intent: top result for 'pink tiles' is not pink.")
        failures += 1

    print(f"\n{'PASSED' if failures == 0 else 'FAILED'} - {failures} failure(s).")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
