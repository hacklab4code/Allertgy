"""Estrazione allergeni da documenti medici (referti allergologici) via Gemini Vision.

Stesso pattern di menu_analyze.py: con GEMINI_API_KEY configurata usa Gemini,
altrimenti restituisce uno stub dimostrativo. In OGNI caso il risultato è solo
un suggerimento: nulla viene scritto sul profilo senza conferma esplicita
dell'utente (vedi routers/profile.py).
"""
from __future__ import annotations

from pydantic import BaseModel, Field

from ..config import settings

# I 14 allergeni del Reg. UE 1169/2011 di default se non forniti
STANDARD_ALLERGEN_CODES = [
    "glutine", "crostacei", "uova", "pesce", "arachidi", "soia", "latte",
    "frutta_a_guscio", "sedano", "senape", "sesamo", "solfiti", "lupini", "molluschi",
]

PROMPT_GEMINI_TEMPLATE = """Analizza questo referto medico o test diagnostico per allergie e intolleranze (ad es. ALEX/ALEX2, ISAC, RAST test IgE specifiche, Prick Test, Breath Test al lattosio, test genetici o sierologici per celiachia, favismo, ecc.).

L'obiettivo è estrarre qualsiasi allergia, intolleranza o sensibilità alimentare attiva del paziente e mapparla ESATTAMENTE sui codici degli allergeni supportati dal nostro sistema.

Ecco l'elenco dei codici validi del nostro sistema (usa SOLO questi codici esatti sulla sinistra):
{allergens_list}

REGOLE DI INTERPRETAZIONE E MAPPATURA PER TIPOLOGIA DI TEST:

1. TEST DI DIAGNOSTICA MOLECOLARE (ALEX, ALEX2, ISAC):
   - Mappa le positività delle IgE specifiche (livello >= 0.3 kUA/L o ISU, oppure indicato come Basso/Moderato/Alto/Altissimo) al rispettivo alimento.
   - Esempi di componenti molecolari alimentari comuni e relativa mappatura:
     * ARACHIDE (arachidi): Ara h 1, Ara h 2, Ara h 3, Ara h 6, Ara h 8, Ara h 9.
     * NOCCIOLA (nocciole): Cor a 1, Cor a 8, Cor a 9, Cor a 11, Cor a 14.
     * NOCE (noci): Jug r 1, Jug r 2, Jug r 3, Jug r 4.
     * PISTACCHIO (pistacchi): Pis v 1, Pis v 2, Pis v 3, Pis v 4.
     * ANACARDIO (anacardi): Ana o 1, Ana o 2, Ana o 3.
     * PESCA (pesca): Pru p 1, Pru p 3 (LTP), Pru p 4.
     * MELA (mela): Mal d 1, Mal d 3.
     * KIWI (kiwi): Act d 1, Act d 2, Act d 5, Act d 8.
     * SOIA (soia): Gly m 4, Gly m 5, Gly m 6, Gly m 8.
     * LATTE / LATTOSIO (latte o latticini specifici): Bos d 4 (alfa-lattoalbumina), Bos d 5 (beta-lattoglobulina), Bos d 8 (caseina), Bos d lattferrina.
     * UOVA (uova): Gal d 1 (ovomucoide), Gal d 2 (ovalbumina), Gal d 3 (conalbumina), Gal d 4 (lisozima).
     * GRANO / GLUTINE (glutine o cereali specifici): Tri a 14 (LTP), Tri a 19 (omega-5 gliadina), Tri a 21, Tri a gliadina, o altre proteine del frumento.
     * PESCE (pesce / merluzzo / ecc.): Gad c 1, Cyp c 1, Sco j 1.
     * CROSTACEI (crostacei / gamberi): Pen a 1 (tropomiosina), Pen m 1, Pen m 2.
     * MOLLUSCHI (molluschi): Tod p 1.
     * SESAMO (sesamo): Ses i 1, Ses i 2, Ses i 3.
     * SENAPE (senape): Sin a 1, Bra j 1.

2. RAST / IgE SPECIFICHE CLASSICHE:
   - Identifica i codici degli estratti o i nomi degli alimenti positivi (classe >= 1 o IgE >= 0.35 kUA/L).
   - Esempi: f1 (albume), f2 (latte), f3 (pesce/merluzzo), f4 (grano), f13 (arachide), f14 (soia), f17 (nocciola), f20 (mandorla), f24 (gambero), f31 (sesamo), f84 (kiwi), f95 (pesca). Mappali al corrispettivo alimento o categoria.

3. PRICK TEST (Test cutanei):
   - Mappa come positivo qualsiasi alimento con pomfo (wheal) >= 3mm o indicato con "+" (ad es. +, ++, +++, ++++).

4. CELIACHIA (Sierologia o Genetica):
   - Sierologia positiva: anticorpi anti-transglutaminasi (anti-tTG) IgA/IgG alti, anti-endomisio (EMA) positivi, o anti-gliadina deamidata (DGP). Mappa a "glutine" con confidenza 1.0.
   - Test genetico: se indica forte compatibilità o presenza degli aplotipi HLA-DQ2 e/o HLA-DQ8 associati a diagnosi/sospetto attivo, mappa a "glutine" (confidenza 0.8).

5. INTOLLERANZA AL LATTOSIO (Breath Test H2):
   - Breath test positivo per malassorbimento o intolleranza al lattosio (curva dell'idrogeno espirato con incremento >= 20 ppm rispetto al basale dopo assunzione di lattosio). Mappa a "latte" con confidenza 1.0.

6. FAVISMO (Deficit G6PD):
   - Carenza dell'enzima glucosio-6-fosfato deidrogenasi (G6PD) o menzione clinica di favismo. Mappa al codice "fave" con confidenza 1.0.

7. REGOLE GENERALI DI MAPPATURA:
   - Ignora allergeni inalanti (acari, pollini, epiteli di animali) o veleni d'insetti a meno che non siano legati a reattività crociata alimentare esplicitamente menzionata nel testo (ad es. sindrome LTP o sindrome orale allergica).
   - Sii specifico: se trovi "nocciola", usa "nocciole"; se trovi "gambero", usa "gamberi" o "crostacei". Cerca sempre la corrispondenza più stretta tra i codici abilitati nel nostro sistema.
   - Non includere allergeni con risultati negativi (IgE < 0.3 kUA/L, classe 0, o pomfo < 3mm).

Rispondi SOLO con JSON nel formato specificato: {{"allergeni":[{{"codice":"","confidenza":0.0}}]}}"""


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


def analyze_medical_document(
    data: bytes, mime_type: str, valid_allergens: list[dict] | None = None
) -> MedicalExtractionResult:
    if settings.gemini_api_key:
        return _analyze_with_gemini(data, mime_type, valid_allergens)
    return MedicalExtractionResult(
        ai_stub=True,
        allergeni=STUB_RESULT,
        note=(
            "Analisi AI non ancora attiva (GEMINI_API_KEY assente). "
            "Risultato di esempio: verifica e conferma manualmente."
        ),
    )


def _analyze_with_gemini(
    data: bytes, mime_type: str, valid_allergens: list[dict] | None = None
) -> MedicalExtractionResult:
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return MedicalExtractionResult(
            ai_stub=True,
            allergeni=STUB_RESULT,
            note="Modulo 'google-genai' non installato. (Uso stub)",
        )

    # Prepara lista codici e nomi validi per il prompt
    if not valid_allergens:
        valid_allergens = [{"code": code, "name_it": code} for code in STANDARD_ALLERGEN_CODES]
    
    allergens_list_str = "\n".join(
        f"- {a['code']}: {a['name_it']}" for a in valid_allergens
    )
    prompt = PROMPT_GEMINI_TEMPLATE.format(allergens_list=allergens_list_str)
    valid_codes = {a["code"] for a in valid_allergens}

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=data, mime_type=mime_type),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiMedicalOutput,
            ),
        )
        result = response.parsed
        if result is None or not hasattr(result, "allergeni"):
            raise ValueError("Risposta da Gemini non strutturata correttamente")
        valid = [a for a in result.allergeni if a.codice in valid_codes]
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
