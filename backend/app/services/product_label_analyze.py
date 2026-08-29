"""Analisi AI dell'etichetta ingredienti di un prodotto alimentare (Gemini Vision).

Usata quando il barcode non è presente su Open Food Facts. Solo utenti Plus Famiglia.
"""
from __future__ import annotations

from pydantic import BaseModel, Field

from ..config import settings
from .gemini_model import GEMINI_MODEL, gemini_json_config

EU_ALLERGEN_CODES = [
    "glutine", "crostacei", "uova", "pesce", "arachidi", "soia", "latte",
    "frutta_a_guscio", "sedano", "senape", "sesamo", "solfiti", "lupini", "molluschi",
]

PROMPT_GEMINI = """Analizza la foto dell'etichetta di un prodotto alimentare confezionato.
Leggi nome prodotto, marca e lista ingredienti (in qualsiasi lingua visibile).

Per gli allergeni usa ESATTAMENTE questi codici del Reg. UE 1169/2011:
glutine, crostacei, uova, pesce, arachidi, soia, latte, frutta_a_guscio, sedano, senape, sesamo, solfiti, lupini, molluschi.

Regole:
- allergeni_contenuti: allergeni sicuramente presenti negli ingredienti o evidenziati in grassetto/corsivo nella lista.
- allergeni_tracce: frasi tipo "può contenere tracce di", "prodotto in stabilimento che utilizza", "trace amounts of".
- ingredients: testo completo della lista ingredienti, il più fedele possibile.
- Se un campo non è leggibile, usa stringa vuota o liste vuote — non inventare.
- Non includere codici allergene duplicati.

Rispondi SOLO con JSON nel formato richiesto."""


class GeminiProductLabelOutput(BaseModel):
    product_name: str = ""
    brand: str = ""
    ingredients: str = ""
    allergeni_contenuti: list[str] = Field(default_factory=list)
    allergeni_tracce: list[str] = Field(default_factory=list)


class ProductLabelAnalyzeResult(BaseModel):
    ai_stub: bool
    product_name: str = ""
    brand: str = ""
    ingredients: str = ""
    allergeni_contenuti: list[str] = Field(default_factory=list)
    allergeni_tracce: list[str] = Field(default_factory=list)
    note: str = ""


def analyze_product_label(image_bytes: bytes, mime_type: str) -> ProductLabelAnalyzeResult:
    if settings.gemini_api_key:
        return _analyze_with_gemini(image_bytes, mime_type)
    return ProductLabelAnalyzeResult(
        ai_stub=True,
        note="Analisi AI non ancora attiva (GEMINI_API_KEY assente).",
    )


def _analyze_with_gemini(image_bytes: bytes, mime_type: str) -> ProductLabelAnalyzeResult:
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return ProductLabelAnalyzeResult(
            ai_stub=True,
            note="Modulo 'google-genai' non installato nel backend.",
        )

    valid = set(EU_ALLERGEN_CODES)
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                PROMPT_GEMINI,
            ],
            config=gemini_json_config(GeminiProductLabelOutput),
        )
        result = response.parsed
        if result is None or not hasattr(result, "ingredients"):
            raise ValueError("Risposta da Gemini non strutturata correttamente")

        if not (result.ingredients or result.product_name).strip():
            return ProductLabelAnalyzeResult(
                ai_stub=True,
                note="Non sono riuscito a leggere l'etichetta. Prova con una foto più nitida e ravvicinata.",
            )

        contenuti = [c for c in result.allergeni_contenuti if c in valid]
        tracce = [c for c in result.allergeni_tracce if c in valid]
        return ProductLabelAnalyzeResult(
            ai_stub=False,
            product_name=(result.product_name or "").strip() or "Prodotto sconosciuto",
            brand=(result.brand or "").strip() or "Marca non specificata",
            ingredients=(result.ingredients or "").strip() or "Lista ingredienti non disponibile",
            allergeni_contenuti=contenuti,
            allergeni_tracce=tracce,
            note=(
                "Analisi AI dell'etichetta. Verifica sempre l'etichetta fisica del prodotto "
                "prima di consumarlo."
            ),
        )
    except Exception as e:
        return ProductLabelAnalyzeResult(
            ai_stub=True,
            note=f"Analisi AI fallita: {e}. Riprova con una foto più chiara.",
        )
