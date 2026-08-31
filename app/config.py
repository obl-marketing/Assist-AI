"""Central configuration for the Orientbell RAG assistant.

Values are read from environment variables so nothing sensitive is hardcoded.
Copy .env.example to .env and fill in your ANTHROPIC_API_KEY to enable the
conversational (LLM) layer. Without a key the assistant still works in
retrieval-only mode.
"""
from __future__ import annotations

import os
from pathlib import Path

# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
WEB_DIR = BASE_DIR / "web"
CATALOG_PATH = DATA_DIR / "catalog.json"
KNOWLEDGE_PATH = DATA_DIR / "knowledge.json"

# Anthropic / Claude configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
# Default to the current flagship; override with CLAUDE_MODEL if needed.
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-5").strip()

# Retrieval tuning
TOP_K_PRODUCTS = int(os.getenv("TOP_K_PRODUCTS", "5"))
TOP_K_CATEGORIES = int(os.getenv("TOP_K_CATEGORIES", "3"))
TOP_K_KNOWLEDGE = int(os.getenv("TOP_K_KNOWLEDGE", "3"))

SITE_URL = "https://www.orientbell.com"


def llm_enabled() -> bool:
    """Whether the conversational Claude layer is available."""
    return bool(ANTHROPIC_API_KEY)
