"""Estrazione allergeni da documenti medici (referti allergologici) via Gemini Vision.

Stesso pattern di menu_analyze.py: con GEMINI_API_KEY configurata usa Gemini,
altrimenti restituisce uno stub dimostrativo. In OGNI caso il risultato è solo
un suggerimento: nulla viene scritto sul profilo senza conferma esplicita
dell'utente (vedi routers/profile.py).
"""
from __future__ import annotations

from pydantic import BaseModel, Field

from ..config import settings

# I 14 allergeni del Reg. UE 1169/2011 — codici identici al resto del progetto
STANDARD_ALLERGEN_CODES = [
    "glutine", "crostacei", "uova", "pesce", "arachidi", "soia", "latte",
    "frutta_a_guscio", "sedano", "senape", "sesamo", "solfiti", "lupini", "molluschi",
]

PROMPT_GEMINI = """Analizza questo documento medico (referto allergologico, prick test,
dosaggio IgE specifiche o simile) di un paziente italiano.
Identifica SOLO le allergie/intolleranze ALIMENTARI riconducibili ai 14 allergeni
del Reg. UE 1169/2011, usando ESATTAMENTE questi codici: glutine, crostacei, uova,
pesce, arachidi, soia, latte, frutta_a_guscio, sedano, senape, sesamo, solfiti,
lupini, molluschi.
Per ciascun allergene rilevato indica una confidenza da 0.0 a 1.0 basata su quanto
chiaramente il documento lo indica come positivo/presente. NON includere allergeni
negativi o solo testati. Se il documento non è un referto medico o non è leggibile,
restituisci una lista vuota.
Rispondi SOLO con JSON: {"allergeni":[{"codice":"","confidenza":0.0}]}"""


class ExtractedAllergen(BaseModel):
    codice: str
    confidenza: float = Field(ge=0.0, le=1.0)


class GeminiMedicalOutput(BaseModel):
    allergeni: list[ExtractedAllergen]


class MedicalExtractionResult(BaseModel):
    ai_stub: bool
    allergeni: list[ExtractedAllergen]
    note: str


STUB_RESULT = [
    ExtractedAllergen(codice="glutine", confidenza=0.9),
    ExtractedAllergen(codice="latte", confidenza=0.75),
]


def analyze_medical_document(data: bytes, mime_type: str) -> MedicalExtractionResult:
    if settings.gemini_api_key:
        return _analyze_with_gemini(data, mime_type)
    return MedicalExtractionResult(
        ai_stub=True,
        allergeni=STUB_RESULT,
        note=(
            "Analisi AI non ancora attiva (GEMINI_API_KEY assente). "
            "Risultato di esempio: verifica e conferma manualmente."
        ),
    )


def _analyze_with_gemini(data: bytes, mime_type: str) -> MedicalExtractionResult:
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return MedicalExtractionResult(
            ai_stub=True,
            allergeni=STUB_RESULT,
            note="Modulo 'google-genai' non installato. (Uso stub)",
        )

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(data=data, mime_type=mime_type),
                PROMPT_GEMINI,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiMedicalOutput,
            ),
        )
        result = response.parsed
        if result is None or not hasattr(result, "allergeni"):
            raise ValueError("Risposta da Gemini non strutturata correttamente")
        valid = [a for a in result.allergeni if a.codice in STANDARD_ALLERGEN_CODES]
        return MedicalExtractionResult(
            ai_stub=False,
            allergeni=valid,
            note="Analisi completata. Verifica i risultati e conferma quelli corretti.",
        )
    except Exception as e:
        return MedicalExtractionResult(
            ai_stub=True,
            allergeni=[],
            note=f"Analisi AI fallita: {e}. Inserisci le allergie manualmente.",
        )
