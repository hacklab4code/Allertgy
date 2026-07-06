"""Analisi AI del menù (Vision) tramite Gemini 2.0.

In presenza di GEMINI_API_KEY nel file .env e del pacchetto google-genai installato,
effettua una chiamata di analisi visiva reale. In caso contrario, restituisce
lo stub dimostrativo predefinito in sicurezza.
"""
from ..config import settings
from ..schemas import AnalyzeOut, DishIn

PROMPT_GEMINI = """Analizza la foto di questo menù di ristorante italiano.
Per ogni piatto identifica gli allergeni tra i 14 previsti dal Reg. UE 1169/2011,
usando ESATTAMENTE questi codici: glutine, crostacei, uova, pesce, arachidi, soia,
latte, frutta_a_guscio, sedano, senape, sesamo, solfiti, lupini, molluschi.
Distingui tra allergeni sicuramente contenuti negli ingredienti e possibili tracce.
Rispondi SOLO con JSON: {"piatti":[{"nome_piatto":"","descrizione":"","categoria":"","prezzo_cents":0,"allergeni_contenuti":[],"allergeni_tracce":[]}]}"""

STUB_PIATTI = [
    DishIn(nome_piatto="Bruschette al pomodoro", categoria="Antipasti",
           prezzo_cents=500, allergeni_contenuti=["glutine"]),
    DishIn(nome_piatto="Tagliatelle al ragù", categoria="Primi",
           prezzo_cents=1100,
           allergeni_contenuti=["glutine", "uova", "sedano"],
           allergeni_tracce=["latte"]),
    DishIn(nome_piatto="Frittura di calamari", categoria="Secondi",
           prezzo_cents=1500,
           allergeni_contenuti=["molluschi", "glutine"],
           allergeni_tracce=["crostacei", "pesce"]),
    DishIn(nome_piatto="Sorbetto al limone", categoria="Dolci",
           prezzo_cents=450, allergeni_contenuti=[],
           allergeni_tracce=["latte"]),
]


from pydantic import BaseModel

class GeminiMenuOutput(BaseModel):
    piatti: list[DishIn]


def analyze_menu_image(
    image_bytes: bytes,
    filename: str,
    mime_type: str = "image/jpeg",
) -> AnalyzeOut:
    if settings.gemini_api_key:
        return _analyze_with_gemini(image_bytes, mime_type)

    return AnalyzeOut(
        ai_stub=True,
        note=(
            "Analisi AI non ancora attiva (GEMINI_API_KEY assente). "
            "Questo è un risultato di esempio: correggi i piatti e salva."
        ),
        piatti=STUB_PIATTI,
    )


def _analyze_with_gemini(image_bytes: bytes, mime_type: str) -> AnalyzeOut:
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return AnalyzeOut(
            ai_stub=True,
            note="Modulo 'google-genai' non installato nell'ambiente virtuale del backend. (Uso stub)",
            piatti=STUB_PIATTI
        )

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        
        # Effettua la chiamata multimodale usando gemini-2.0-flash con output strutturato
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type,
                ),
                PROMPT_GEMINI
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiMenuOutput,
            )
        )
        
        result = response.parsed
        if not result or not hasattr(result, "piatti"):
            raise ValueError("Risposta da Gemini non strutturata correttamente")
            
        return AnalyzeOut(
            ai_stub=False,
            note="Analisi completata con successo tramite Gemini Vision!",
            piatti=result.piatti
        )
    except Exception as e:
        return AnalyzeOut(
            ai_stub=True,
            note=f"Chiamata a Gemini Vision fallita: {e}. (Uso stub)",
            piatti=STUB_PIATTI
        )
