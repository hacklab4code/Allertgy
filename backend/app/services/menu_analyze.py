"""Analisi AI del menù (Vision) tramite Gemini.

Estrae piatti e allergeni da foto/PDF/HTML. Priorità: fedeltà OCR, zero invenzioni.
Senza GEMINI_API_KEY o in caso di errore restituisce lista vuota (mai piatti demo).
"""
from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, Field

from ..config import settings
from ..schemas import AnalyzeOut, DishIn
from .gemini_model import GEMINI_MODEL, gemini_json_config

EU_ALLERGEN_CODES = [
    "glutine",
    "crostacei",
    "uova",
    "pesce",
    "arachidi",
    "soia",
    "latte",
    "frutta_a_guscio",
    "sedano",
    "senape",
    "sesamo",
    "solfiti",
    "lupini",
    "molluschi",
]

VALID_CATEGORIES = {
    "Antipasti",
    "Primi",
    "Secondi",
    "Contorni",
    "Pizze",
    "Panini e Burger",
    "Dolci e Dessert",
    "Bevande e Drink",
    "Altro",
}

CATEGORY_ALIASES = {
    "antipasto": "Antipasti",
    "antipasti": "Antipasti",
    "starter": "Antipasti",
    "starters": "Antipasti",
    "primo": "Primi",
    "primi": "Primi",
    "pasta": "Primi",
    "risotti": "Primi",
    "secondo": "Secondi",
    "secondi": "Secondi",
    "carne": "Secondi",
    "pesce": "Secondi",
    "contorno": "Contorni",
    "contorni": "Contorni",
    "pizza": "Pizze",
    "pizze": "Pizze",
    "panini": "Panini e Burger",
    "burger": "Panini e Burger",
    "hamburger": "Panini e Burger",
    "dolce": "Dolci e Dessert",
    "dolci": "Dolci e Dessert",
    "dessert": "Dolci e Dessert",
    "bevande": "Bevande e Drink",
    "drink": "Bevande e Drink",
    "drinks": "Bevande e Drink",
    "vini": "Bevande e Drink",
    "wine": "Bevande e Drink",
}

PROMPT_GEMINI = """Sei un OCR specializzato in menù di ristoranti (carta, lavagna, foto, screenshot).

OBIETTIVO
Trascrivi SOLO i piatti realmente visibili nell'immagine. Non inventare nulla.

REGOLE FERREE
1. Nome piatto: copia il testo come appare (correggi solo errori OCR evidenti, es. "Spaghettj" → "Spaghetti").
2. Descrizione: solo ingredienti/descrizione scritti sotto o accanto al piatto. Se assenti → stringa vuota.
3. Non aggiungere piatti tipici, menù standard o piatti "probabili". Se la foto è illeggibile → {"piatti":[]}.
4. Ignora: intestazioni di sezione usate come titolo (Antipasti, Primi…), coperto, orari, indirizzo, social, QR, note legali, numeri di pagina, simboli decorativi isolati.
5. Una riga = un piatto. Non unire due piatti. Non spezzare un piatto in due.
6. Prezzo: converti in centesimi interi. Esempi: €12 → 1200, 12,50 € → 1250, 9.00 → 900. Se assente → null.
7. Categoria: usa SOLO una di: Antipasti, Primi, Secondi, Contorni, Pizze, Panini e Burger, Dolci e Dessert, Bevande e Drink, Altro. Deduci dall'intestazione di sezione più vicina; se non chiara → Altro.
8. Allergeni (Reg. UE 1169/2011) — codici ESATTI:
   glutine, crostacei, uova, pesce, arachidi, soia, latte, frutta_a_guscio, sedano, senape, sesamo, solfiti, lupini, molluschi
   - allergeni_contenuti: solo se evidenti da nome/ingredienti/simboli allergene sul menù
   - allergeni_tracce: solo se scritto "può contenere", "tracce di", ecc.
   - In dubbio → lista vuota (meglio omettere che inventare)
9. Lingua: mantieni la lingua del menù. Non tradurre i nomi.
10. Ordine: dall'alto verso il basso, come nel menù.

Rispondi SOLO con JSON nel formato richiesto dallo schema."""

PROMPT_GEMINI_TEXT = """Sei un estrattore di menù da testo/HTML di ristoranti.

OBIETTIVO
Estrai SOLO i piatti presenti nel contenuto fornito. Non inventare nulla.

REGOLE FERREE
1. Ignora navigazione, footer, cookie, script, CSS, meta tag, link sociali, orari, indirizzo.
2. Nome piatto fedele al testo. Descrizione solo se presente. Altrimenti stringa vuota.
3. Se non ci sono piatti chiari → {"piatti":[]}.
4. Prezzo in centesimi: €12 → 1200, 12,50 → 1250. Se assente → null.
5. Categoria solo tra: Antipasti, Primi, Secondi, Contorni, Pizze, Panini e Burger, Dolci e Dessert, Bevande e Drink, Altro.
6. Allergeni con codici ESATTI:
   glutine, crostacei, uova, pesce, arachidi, soia, latte, frutta_a_guscio, sedano, senape, sesamo, solfiti, lupini, molluschi
   - contenuti solo se evidenti; tracce solo se dichiarate; in dubbio → []
7. Non tradurre i nomi. Ordine come nel documento.

Rispondi SOLO con JSON nel formato richiesto dallo schema."""


class GeminiDishOut(BaseModel):
    nome_piatto: str = ""
    descrizione: str = ""
    categoria: str = "Altro"
    prezzo_cents: Optional[int] = None
    allergeni_contenuti: list[str] = Field(default_factory=list)
    allergeni_tracce: list[str] = Field(default_factory=list)


class GeminiMenuOutput(BaseModel):
    piatti: list[GeminiDishOut] = Field(default_factory=list)


SECTION_HEADERS = {
    "antipasti",
    "primi",
    "secondi",
    "contorni",
    "pizze",
    "pizza",
    "panini",
    "burger",
    "dolci",
    "dessert",
    "bevande",
    "drinks",
    "vini",
    "wine list",
    "menu",
    "menù",
    "carta",
}


def _normalize_category(raw: str | None) -> str:
    if not raw:
        return "Altro"
    text = raw.strip()
    if text in VALID_CATEGORIES:
        return text
    key = text.lower()
    if key in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[key]
    for alias, canon in CATEGORY_ALIASES.items():
        if alias in key:
            return canon
    return "Altro"


def _sanitize_allergens(codes: list[str] | None) -> list[str]:
    valid = set(EU_ALLERGEN_CODES)
    out: list[str] = []
    seen: set[str] = set()
    for code in codes or []:
        c = (code or "").strip().lower().replace(" ", "_").replace("-", "_")
        # alias comuni
        if c in {"fruttaaguscio", "frutta_guscio", "noci", "nuts"}:
            c = "frutta_a_guscio"
        if c in {"solfiti_solforosa", "anidride_solforosa", "so2"}:
            c = "solfiti"
        if c in valid and c not in seen:
            seen.add(c)
            out.append(c)
    return out


def _normalize_price(cents: int | None) -> int | None:
    if cents is None:
        return None
    try:
        value = int(cents)
    except (TypeError, ValueError):
        return None
    if value < 0:
        return None
    # Modello a volte restituisce euro interi (es. 12 invece di 1200)
    if 0 < value < 100:
        value *= 100
    # Prezzo assurdo (> €500) → scarta
    if value > 50000:
        return None
    return value


def _is_section_header(name: str) -> bool:
    cleaned = re.sub(r"[^\w\sàèéìòù]", "", name, flags=re.IGNORECASE).strip().lower()
    return cleaned in SECTION_HEADERS or len(cleaned) <= 2


def _normalize_piatti(raw_piatti: list[GeminiDishOut] | list[DishIn]) -> list[DishIn]:
    cleaned: list[DishIn] = []
    seen_names: set[str] = set()

    for p in raw_piatti or []:
        nome = (getattr(p, "nome_piatto", None) or "").strip()
        nome = re.sub(r"\s+", " ", nome)
        if not nome or _is_section_header(nome):
            continue

        key = nome.casefold()
        if key in seen_names:
            continue
        seen_names.add(key)

        contenuti = _sanitize_allergens(getattr(p, "allergeni_contenuti", None))
        tracce = [
            c
            for c in _sanitize_allergens(getattr(p, "allergeni_tracce", None))
            if c not in contenuti
        ]
        descrizione = (getattr(p, "descrizione", None) or "").strip() or None
        cleaned.append(
            DishIn(
                nome_piatto=nome[:200],
                descrizione=(descrizione[:800] if descrizione else None),
                categoria=_normalize_category(getattr(p, "categoria", None)),
                prezzo_cents=_normalize_price(getattr(p, "prezzo_cents", None)),
                allergeni_contenuti=contenuti,
                allergeni_tracce=tracce,
            )
        )

    return cleaned


def _fail(note: str) -> AnalyzeOut:
    return AnalyzeOut(ai_stub=True, note=note, piatti=[])


def analyze_menu_image(
    image_bytes: bytes,
    filename: str,
    mime_type: str = "image/jpeg",
) -> AnalyzeOut:
    if not settings.gemini_api_key:
        return _fail(
            "Analisi AI non attiva (GEMINI_API_KEY assente). "
            "Aggiungi la chiave nel backend e riprova, oppure inserisci i piatti a mano."
        )
    return _analyze_with_gemini(image_bytes, mime_type)


def _analyze_with_gemini(image_bytes: bytes, mime_type: str) -> AnalyzeOut:
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return _fail("Modulo 'google-genai' non installato nel backend. Installa le dipendenze e riprova.")

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                PROMPT_GEMINI,
            ],
            config=gemini_json_config(GeminiMenuOutput),
        )

        result = response.parsed
        if result is None or not hasattr(result, "piatti"):
            raise ValueError("Risposta da Gemini non strutturata correttamente")

        piatti = _normalize_piatti(result.piatti)
        if not piatti:
            return _fail(
                "Non sono riuscito a leggere piatti chiari in questa foto. "
                "Prova con luce migliore, foto a fuoco e tutto il menù inquadrato (senza ritagli)."
            )

        return AnalyzeOut(
            ai_stub=False,
            note=(
                f"Estratti {len(piatti)} piatti con Gemini Vision. "
                "Controlla nomi, prezzi e allergeni prima di pubblicare."
            ),
            piatti=piatti,
        )
    except Exception as e:
        return _fail(
            f"Analisi AI fallita: {e}. "
            "Riprova con una foto più nitida, oppure inserisci i piatti a mano."
        )


def analyze_menu_url(url: str) -> AnalyzeOut:
    if not settings.gemini_api_key:
        return _fail(
            "Analisi AI non attiva (GEMINI_API_KEY assente). "
            "Aggiungi la chiave nel backend e riprova."
        )

    import urllib.error
    import urllib.request

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
            },
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            content_type = (response.info().get_content_type() or "").lower()
            content_bytes = response.read()

        if content_type.startswith("image/"):
            return _analyze_with_gemini(content_bytes, content_type)
        if content_type == "application/pdf":
            return _analyze_with_gemini(content_bytes, content_type)

        text_content = content_bytes.decode("utf-8", errors="ignore")
        return _analyze_text_with_gemini(text_content)

    except Exception as e:
        return _fail(f"Impossibile analizzare il link ({e}). Controlla l'URL e riprova.")


def _analyze_text_with_gemini(text_content: str) -> AnalyzeOut:
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return _fail("Modulo 'google-genai' non installato nel backend.")

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        # Priorità al corpo pagina: togli boilerplate evidente e limita lunghezza
        truncated = re.sub(r"<script[\s\S]*?</script>", " ", text_content, flags=re.I)
        truncated = re.sub(r"<style[\s\S]*?</style>", " ", truncated, flags=re.I)
        truncated = re.sub(r"<[^>]+>", " ", truncated)
        truncated = re.sub(r"\s+", " ", truncated).strip()[:20000]

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                f"Contenuto del menu:\n\n{truncated}\n\n",
                PROMPT_GEMINI_TEXT,
            ],
            config=gemini_json_config(GeminiMenuOutput),
        )

        result = response.parsed
        if result is None or not hasattr(result, "piatti"):
            raise ValueError("Risposta da Gemini non strutturata correttamente")

        piatti = _normalize_piatti(result.piatti)
        if not piatti:
            return _fail(
                "Nessun piatto chiaro trovato in questo link. "
                "Prova con un URL diretto al menù o carica una foto."
            )

        return AnalyzeOut(
            ai_stub=False,
            note=(
                f"Estratti {len(piatti)} piatti dal link. "
                "Controlla nomi, prezzi e allergeni prima di pubblicare."
            ),
            piatti=piatti,
        )
    except Exception as e:
        return _fail(f"Analisi del testo fallita: {e}. Riprova o carica una foto del menù.")
