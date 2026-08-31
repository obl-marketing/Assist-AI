"""Lightweight RAG retriever for the Orientbell tile catalog.

This is a dependency-free BM25 retriever with domain-aware boosts (colour,
room/application and finish matches). It indexes three kinds of documents:

  * products    - individual tiles a shopper can shortlist
  * categories  - category / collection pages to explore
  * knowledge   - terminology, room guidance and brand context (RAG grounding)

It runs entirely offline, so intent understanding and product/category
suggestions work even without an Anthropic API key. The Claude layer
(app/assistant.py) sits on top to phrase natural answers.
"""
from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass, field
from typing import Any

from .config import CATALOG_PATH, KNOWLEDGE_PATH

# A small stopword list keeps common words from dominating the score.
_STOPWORDS = {
    "a", "an", "the", "is", "are", "for", "to", "of", "in", "on", "and", "or",
    "with", "my", "our", "i", "we", "which", "what", "that", "this", "you",
    "me", "can", "do", "does", "please", "want", "need", "looking", "show",
    "some", "any", "good", "best", "suitable", "tile", "tiles", "have",
}

# Synonyms expand a query so "washroom" hits "bathroom", etc.
_SYNONYMS = {
    "washroom": ["bathroom", "toilet"],
    "toilet": ["bathroom", "washroom"],
    "restroom": ["bathroom"],
    "backsplash": ["kitchen", "wall"],
    "hall": ["living", "living room"],
    "drawing": ["living", "living room"],
    "lounge": ["living", "living room"],
    "veranda": ["balcony", "outdoor"],
    "verandah": ["balcony", "outdoor"],
    "porch": ["outdoor"],
    "driveway": ["parking", "outdoor"],
    "nonslip": ["anti-skid", "antiskid"],
    "non-slip": ["anti-skid", "antiskid"],
    "antiskid": ["anti-skid"],
    "slip": ["anti-skid", "antiskid"],
    "wooden": ["wood"],
    "marbles": ["marble"],
    "cheap": ["budget"],
    "affordable": ["budget"],
    "luxury": ["premium"],
    "expensive": ["premium"],
    "washbasin": ["bathroom"],
}

# Colour vocabulary used for a light attribute boost.
_COLOR_WORDS = {
    "pink", "blush", "rose", "mauve", "white", "cream", "beige", "grey",
    "gray", "black", "charcoal", "slate", "brown", "oak", "honey", "blue",
    "aqua", "green", "terracotta", "rust", "sand", "graphite",
}

_ROOM_WORDS = {
    "bathroom", "washroom", "toilet", "kitchen", "living", "bedroom",
    "balcony", "terrace", "parking", "outdoor", "hall", "driveway",
}

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    tokens = _TOKEN_RE.findall(text.lower())
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 1]


def _expand_query(tokens: list[str]) -> list[str]:
    expanded = list(tokens)
    for tok in tokens:
        expanded.extend(_SYNONYMS.get(tok, []))
    # Re-tokenize multi-word synonyms (e.g. "living room").
    flat: list[str] = []
    for tok in expanded:
        flat.extend(_TOKEN_RE.findall(tok))
    return flat


@dataclass
class Document:
    """A single retrievable unit."""

    doc_id: str
    doc_type: str  # "product" | "category" | "knowledge"
    title: str
    text: str
    tokens: list[str]
    payload: dict[str, Any]  # original record, for building responses
    colors: set[str] = field(default_factory=set)
    rooms: set[str] = field(default_factory=set)


@dataclass
class RetrievalResult:
    document: Document
    score: float


class Retriever:
    """BM25 retriever with catalog-aware attribute boosts."""

    K1 = 1.5
    B = 0.75

    def __init__(self, catalog: dict[str, Any], knowledge: dict[str, Any]):
        self.catalog = catalog
        self.knowledge = knowledge
        self.documents: list[Document] = []
        self._build_documents()
        self._build_index()

    # ------------------------------------------------------------------ build
    @classmethod
    def from_files(cls) -> "Retriever":
        with open(CATALOG_PATH, encoding="utf-8") as f:
            catalog = json.load(f)
        with open(KNOWLEDGE_PATH, encoding="utf-8") as f:
            knowledge = json.load(f)
        return cls(catalog, knowledge)

    def _add(self, doc: Document) -> None:
        self.documents.append(doc)

    def _build_documents(self) -> None:
        # Products
        for p in self.catalog.get("products", []):
            searchable = " ".join(
                [
                    p.get("name", ""),
                    " ".join(p.get("color", [])),
                    p.get("finish", ""),
                    p.get("material", ""),
                    p.get("size", ""),
                    " ".join(p.get("applications", [])),
                    " ".join(p.get("features", [])),
                    p.get("price_band", ""),
                    p.get("description", ""),
                    " ".join(p.get("keywords", [])),
                ]
            )
            self._add(
                Document(
                    doc_id=p["id"],
                    doc_type="product",
                    title=p.get("name", ""),
                    text=searchable,
                    tokens=_tokenize(searchable),
                    payload=p,
                    colors={c.lower() for c in p.get("color", [])},
                    rooms={a.lower() for a in p.get("applications", [])},
                )
            )

        # Categories
        for c in self.catalog.get("categories", []):
            searchable = " ".join(
                [
                    c.get("name", ""),
                    " ".join(c.get("rooms", [])),
                    c.get("description", ""),
                    " ".join(c.get("keywords", [])),
                ]
            )
            self._add(
                Document(
                    doc_id=c["id"],
                    doc_type="category",
                    title=c.get("name", ""),
                    text=searchable,
                    tokens=_tokenize(searchable),
                    payload=c,
                    rooms={r.lower() for r in c.get("rooms", [])},
                )
            )

        # Knowledge: terminology, room guidance, brand context
        for t in self.knowledge.get("terminology", []):
            searchable = " ".join(
                [t.get("term", ""), t.get("definition", ""), " ".join(t.get("keywords", []))]
            )
            self._add(
                Document(
                    doc_id=t["id"],
                    doc_type="knowledge",
                    title=t.get("term", ""),
                    text=searchable,
                    tokens=_tokenize(searchable),
                    payload={**t, "kind": "terminology"},
                )
            )
        for g in self.knowledge.get("room_guidance", []):
            searchable = " ".join(
                [g.get("room", ""), g.get("text", ""), " ".join(g.get("keywords", []))]
            )
            self._add(
                Document(
                    doc_id=g["id"],
                    doc_type="knowledge",
                    title=f"Guidance: {g.get('room', '')}",
                    text=searchable,
                    tokens=_tokenize(searchable),
                    payload={**g, "kind": "room_guidance"},
                    rooms={g.get("room", "").lower()},
                )
            )
        for b in self.knowledge.get("brand_context", []):
            searchable = " ".join(
                [b.get("title", ""), b.get("text", ""), " ".join(b.get("keywords", []))]
            )
            self._add(
                Document(
                    doc_id=b["id"],
                    doc_type="knowledge",
                    title=b.get("title", ""),
                    text=searchable,
                    tokens=_tokenize(searchable),
                    payload={**b, "kind": "brand_context"},
                )
            )

    def _build_index(self) -> None:
        self.doc_freq: dict[str, int] = {}
        self.doc_len: dict[str, int] = {}
        self.term_freq: dict[str, dict[str, int]] = {}
        total_len = 0
        for doc in self.documents:
            self.doc_len[doc.doc_id] = len(doc.tokens)
            total_len += len(doc.tokens)
            tf: dict[str, int] = {}
            for tok in doc.tokens:
                tf[tok] = tf.get(tok, 0) + 1
            self.term_freq[doc.doc_id] = tf
            for tok in tf:
                self.doc_freq[tok] = self.doc_freq.get(tok, 0) + 1
        self.n_docs = len(self.documents)
        self.avg_doc_len = (total_len / self.n_docs) if self.n_docs else 0.0

    # ------------------------------------------------------------------ score
    def _bm25(self, doc: Document, query_tokens: list[str]) -> float:
        score = 0.0
        tf = self.term_freq[doc.doc_id]
        dl = self.doc_len[doc.doc_id] or 1
        for tok in query_tokens:
            if tok not in tf:
                continue
            n_qi = self.doc_freq.get(tok, 0)
            idf = math.log(1 + (self.n_docs - n_qi + 0.5) / (n_qi + 0.5))
            freq = tf[tok]
            denom = freq + self.K1 * (1 - self.B + self.B * dl / (self.avg_doc_len or 1))
            score += idf * (freq * (self.K1 + 1)) / denom
        return score

    def _attribute_boost(self, doc: Document, query_tokens: set[str]) -> float:
        boost = 0.0
        # Colour match is a strong intent signal ("pink tiles").
        if doc.colors and (query_tokens & doc.colors):
            boost += 3.0
        # Room / application match ("bathroom", "kitchen").
        query_rooms = query_tokens & _ROOM_WORDS
        if doc.rooms and query_rooms:
            if query_rooms & doc.rooms:
                boost += 3.0
            # partial: "living" should match "living room"
            elif any(any(qr in r for r in doc.rooms) for qr in query_rooms):
                boost += 2.0
        # Anti-skid / safety intent.
        if {"anti", "skid", "antiskid", "slip", "grip", "safe"} & query_tokens:
            if "anti-skid" in doc.text or "anti skid" in doc.text:
                boost += 1.5
        return boost

    def search(
        self, query: str, doc_type: str | None = None, top_k: int = 5
    ) -> list[RetrievalResult]:
        base_tokens = _tokenize(query)
        query_tokens = _expand_query(base_tokens)
        token_set = set(query_tokens)
        results: list[RetrievalResult] = []
        for doc in self.documents:
            if doc_type and doc.doc_type != doc_type:
                continue
            score = self._bm25(doc, query_tokens)
            score += self._attribute_boost(doc, token_set)
            if score > 0:
                results.append(RetrievalResult(document=doc, score=score))
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:top_k]

    def retrieve_context(
        self,
        query: str,
        k_products: int = 5,
        k_categories: int = 3,
        k_knowledge: int = 3,
    ) -> dict[str, list[RetrievalResult]]:
        """Retrieve a mixed context bundle for a single user query."""
        return {
            "products": self.search(query, "product", k_products),
            "categories": self.search(query, "category", k_categories),
            "knowledge": self.search(query, "knowledge", k_knowledge),
        }
