"""Costanti e helper condivisi per le chiamate Gemini API."""

from __future__ import annotations

from typing import Any

# gemini-2.5-flash non è più disponibile per le nuove API key (404 NOT_FOUND).
# Flash-Lite: economico e adatto a OCR/estrazione ad alto volume (~$0.25/$1.50 per 1M token).
GEMINI_MODEL = "gemini-3.1-flash-lite"

# Budget basso = meno latenza/costo su OCR. 0 non è accettato su alcuni modelli 3.x.
GEMINI_THINKING_BUDGET = 128


def gemini_json_config(response_schema: Any):
    """Config per output JSON strutturato (OCR/estrazione, latenza e costo ridotti)."""
    from google.genai import types

    return types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=response_schema,
        thinking_config=types.ThinkingConfig(
            thinking_budget=GEMINI_THINKING_BUDGET,
            include_thoughts=False,
        ),
    )
