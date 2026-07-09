"""Traduzione automatica dei piatti tramite Gemini."""
import json
from typing import Any
from google import genai
from google.genai import types
from pydantic import BaseModel
from ..config import settings

class TranslationItem(BaseModel):
    dish_id: int
    lang: str
    name: str
    description: str | None = None

class GeminiTranslationOutput(BaseModel):
    translations: list[TranslationItem]

PROMPT_TRANSLATION = """Traduci i piatti di questo menù dall'italiano in: inglese (en), spagnolo (es), tedesco (de), francese (fr).
Devi tradurre sia il nome_piatto (name) che la descrizione (description). Mantieni intatti i riferimenti culturali se intraducibili, ma rendili comprensibili.
Rispondi SOLO in formato JSON valido che rispetti lo schema richiesto:
{"translations": [{"dish_id": 123, "lang": "en", "name": "Translated Name", "description": "Translated Description"}]}"""

def translate_dishes(dishes_data: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Chiama Gemini per tradurre un elenco di piatti in en, es, de, fr.
    Riceve un elenco di dizionari con keys: id, name, description.
    Ritorna un elenco di dizionari con chiavi: dish_id, lang, name, description.
    """
    if not settings.gemini_api_key:
        print("⚠️ GEMINI_API_KEY assente, traduzione simulata (stub).")
        return _mock_translate(dishes_data)
        
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        
        # Prepariamo il payload testuale con i piatti
        input_data = {
            "dishes": [
                {"id": d["id"], "name": d["name"], "description": d.get("description")}
                for d in dishes_data
            ]
        }
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                f"Piatti da tradurre:\n\n{json.dumps(input_data, ensure_ascii=False)}\n\n",
                PROMPT_TRANSLATION
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiTranslationOutput,
            )
        )
        
        result = response.parsed
        if not result or not hasattr(result, "translations"):
            raise ValueError("Risposta da Gemini non strutturata correttamente")
            
        return [
            {
                "dish_id": item.dish_id,
                "lang": item.lang,
                "name": item.name,
                "description": item.description,
            }
            for item in result.translations
        ]
        
    except Exception as e:
        print(f"❌ Errore durante la chiamata di traduzione a Gemini: {e}")
        return _mock_translate(dishes_data)

def _mock_translate(dishes_data: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Fallback per la traduzione."""
    translations = []
    langs = ["en", "es", "de", "fr"]
    suffixes = {
        "en": " (EN)",
        "es": " (ES)",
        "de": " (DE)",
        "fr": " (FR)",
    }
    for d in dishes_data:
        for lang in langs:
            translations.append({
                "dish_id": d["id"],
                "lang": lang,
                "name": f"{d['name']}{suffixes[lang]}",
                "description": f"{d['description'] or ''}{suffixes[lang]}".strip() or None
            })
    return translations
