"""Multi-Database Cascading Barcode Resolver Service.

Orchestra la risoluzione dei codici a barre alimentari e cosmetici attraverso una cascata
a più livelli con auto-caching e analisi euristica approfondita degli ingredienti.
"""
from __future__ import annotations

import json
import logging
import re
import urllib.request
import urllib.error
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.orm import Session

from ..models import ProductLabelCache
from .product_label_cache import (
    barcode_candidates,
    canonical_barcode,
    get_cached_label,
    upsert_cached_label,
    cache_allergeni_contenuti,
    cache_allergeni_tracce,
)

logger = logging.getLogger(__name__)

# Dizionario esaustivo 14 allergeni UE + sinonimi scientifici, derivati e diciture commerciali
EU_ALLERGEN_SYNONYMS: Dict[str, List[str]] = {
    "glutine": [
        "glutine", "frumento", "grano", "orzo", "segale", "avena", "farro",
        "spelta", "kamut", "triticale", "malto", "malto d'orzo", "semola", "semolato",
        "crusca", "amido di frumento", "farina di grano", "farina di frumento",
        "couscous", "bulgur", "seitan", "wheat", "barley", "rye", "oat", "gluten",
    ],
    "crostacei": [
        "crostacei", "gamberi", "gamberetti", "scampi", "aragosta", "astice",
        "mazzancolle", "granchio", "canocchie", "krill", "crustacean", "shrimp", "prawn", "lobster",
    ],
    "uova": [
        "uova", "uovo", "albume", "tuorlo", "ovoalbumina", "lisozima",
        "e1105", "maionese", "egg", "eggs", "egg white", "egg yolk",
    ],
    "pesce": [
        "pesce", "pesci", "tonno", "salmone", "merluzzo", "acciughe", "alici",
        "baccalà", "stoccafisso", "orata", "spigola", "trota", "sgombro",
        "colla di pesce", "surimi", "olio di pesce", "fish", "salmon", "tuna", "anchovy",
    ],
    "arachidi": [
        "arachidi", "arachide", "olio di arachidi", "burro di arachidi",
        "spagnolette", "peanut", "peanuts", "peanut butter", "peanut oil",
    ],
    "soia": [
        "soia", "lecitina di soia", "proteine di soia", "tofu", "edamame",
        "miso", "tempeh", "shoyu", "tamari", "farina di soia", "olio di soia",
        "e322", "soy", "soya", "soy lecithin", "soybean",
    ],
    "latte": [
        "latte", "lattosio", "burro", "panna", "formaggio", "formaggi", "ricotta",
        "mozzarella", "parmigiano", "grana", "pecorino", "gorgonzola", "stracchino",
        "mascarpone", "siero di latte", "siero di latte in polvere", "siero demineralizzato",
        "caseina", "caseinato", "caseinati", "lattoglobulina", "lattoalbumina",
        "yogurt", "kefir", "milk", "butter", "cheese", "cream", "whey", "casein", "lactose",
    ],
    "frutta_a_guscio": [
        "frutta a guscio", "mandorle", "nocciole", "noci", "anacardi", "noci pecan",
        "noci del brasile", "pistacchi", "macadamia", "pinoli", "castagne",
        "pasta di mandorle", "pasta di nocciole", "farina di mandorle", "farina di nocciole",
        "prunus amygdalus", "almond", "hazelnut", "walnut", "cashew", "pistachio", "pecan", "nuts",
    ],
    "sedano": [
        "sedano", "estratto di sedano", "semi di sedano", "sale di sedano", "celery",
    ],
    "senape": [
        "senape", "semi di senape", "farina di senape", "olio di senape", "mustard",
    ],
    "sesamo": [
        "sesamo", "semi di sesamo", "olio di sesamo", "tahina", "tahin", "sesame", "sesame seeds",
    ],
    "solfiti": [
        "solfiti", "solfito", "anidride solforosa", "metabisolfito", "bisolfito",
        "e220", "e221", "e222", "e223", "e224", "e226", "e227", "e228",
        "sulfite", "sulfites", "sulphite", "sulphites", "sulphur dioxide",
    ],
    "lupini": [
        "lupini", "lupino", "farina di lupini", "farina di lupino", "proteine di lupino", "lupin",
    ],
    "molluschi": [
        "molluschi", "cozze", "vongole", "polpo", "seppia", "calamari", "calamaro",
        "totani", "ostriche", "capesante", "lumache", "mussel", "clam", "octopus", "squid", "mollusc", "mollusk",
    ],
}

# Tag ufficiali Open Food Facts / Open Beauty Facts
OFF_TAG_MAP: Dict[str, str] = {
    "en:gluten": "glutine",
    "en:wheat": "glutine",
    "en:rye": "glutine",
    "en:barley": "glutine",
    "en:oats": "glutine",
    "en:spelt": "glutine",
    "en:crustaceans": "crostacei",
    "en:eggs": "uova",
    "en:fish": "pesce",
    "en:peanuts": "arachidi",
    "en:soybeans": "soia",
    "en:milk": "latte",
    "en:lactose": "latte",
    "en:nuts": "frutta_a_guscio",
    "en:almond": "frutta_a_guscio",
    "en:hazelnut": "frutta_a_guscio",
    "en:walnut": "frutta_a_guscio",
    "en:cashew": "frutta_a_guscio",
    "en:pecan": "frutta_a_guscio",
    "en:brazil-nut": "frutta_a_guscio",
    "en:pistachio": "frutta_a_guscio",
    "en:macadamia": "frutta_a_guscio",
    "en:celery": "sedano",
    "en:mustard": "senape",
    "en:sesame-seeds": "sesamo",
    "en:sulphur-dioxide-and-sulphites": "solfiti",
    "en:lupin": "lupini",
    "en:molluscs": "molluschi",
}

# Pattern regex per frasi di tracce / contaminazione crociata
TRACES_PATTERNS = [
    re.compile(r"(?:può\s+contenere\s+(?:eventuali\s+)?tracce\s+di|può\s+contenere|tracce\s+di|prodotto\s+in\s+uno?\s+stabilimento\s+che\s+(?:lavora|utilizza|tratta|trasforma))[:\s]+([^.;\n]+)", re.IGNORECASE),
    re.compile(r"(?:may\s+contain\s+(?:traces\s+of)?|traces\s+of|produced\s+in\s+a\s+facility\s+that\s+(?:processes|handles))[:\s]+([^.;\n]+)", re.IGNORECASE),
    re.compile(r"(?:peut\s+contenir\s+(?:des\s+)?traces\s+de|fabriqué\s+dans\s+un\s+atelier\s+qui\s+utilise)[:\s]+([^.;\n]+)", re.IGNORECASE),
]


def extract_allergens_from_text(text: str) -> Tuple[Set[str], Set[str]]:
    """Estrae allergeni contenuti e tracce tramite analisi euristica del testo ingredienti."""
    contenuti: Set[str] = set()
    tracce: Set[str] = set()
    if not text or not text.strip():
        return contenuti, tracce

    lower_text = text.lower()

    # 1. Trova le sezioni di tracce
    traces_text_accum = ""
    main_text = lower_text
    for pattern in TRACES_PATTERNS:
        matches = pattern.finditer(lower_text)
        for match in matches:
            trace_phrase = match.group(1) or ""
            traces_text_accum += " " + trace_phrase
            # Rimuoviamo la frase tracce dal testo principale per evitare falsi contenuti
            main_text = main_text.replace(match.group(0), " ")

    # 2. Analizza tracce
    if traces_text_accum:
        for code, synonyms in EU_ALLERGEN_SYNONYMS.items():
            for syn in synonyms:
                # Word boundary match per evitare falsi positivi
                if re.search(r"\b" + re.escape(syn) + r"\b", traces_text_accum):
                    tracce.add(code)
                    break

    # 3. Analizza contenuti nel testo principale
    for code, synonyms in EU_ALLERGEN_SYNONYMS.items():
        for syn in synonyms:
            if re.search(r"\b" + re.escape(syn) + r"\b", main_text):
                contenuti.add(code)
                break

    # Se un allergene è sicuramente contenuto, non lo consideriamo solo traccia
    tracce = tracce - contenuti
    return contenuti, tracce


def extract_dietary_flags(text: str, labels_tags: List[str] = [], analysis_tags: List[str] = []) -> List[str]:
    """Determina flag dietetici (vegano, vegetariano, senza_glutine, senza_lattosio)."""
    flags: Set[str] = set()
    all_tags = set(labels_tags + analysis_tags)

    if "en:vegan" in all_tags or "en:vegan-certified" in all_tags:
        flags.add("vegano")
        flags.add("vegetariano")
    elif "en:vegetarian" in all_tags:
        flags.add("vegetariano")

    if "en:gluten-free" in all_tags:
        flags.add("senza_glutine")
    if "en:lactose-free" in all_tags:
        flags.add("senza_lattosio")

    lower = (text or "").lower()
    if "senza glutine" in lower or "gluten free" in lower:
        flags.add("senza_glutine")
    if "senza lattosio" in lower or "lactose free" in lower or "delattosato" in lower:
        flags.add("senza_lattosio")
    if "vegano" in lower or "100% vegetale" in lower or "vegan" in lower:
        flags.add("vegano")
        flags.add("vegetariano")

    return list(flags)


def _http_get_json(url: str, timeout_sec: float = 3.5) -> Optional[Dict[str, Any]]:
    """Esegue una GET HTTP con User-Agent personalizzato e timeout rigido."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "AllerTgyApp/2.0 (safety-cascade; contact@allertgy.com)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                return data
    except Exception as e:
        logger.debug(f"HTTP GET {url} fallita: {e}")
    return None


def fetch_open_food_facts(barcode: str) -> Optional[Dict[str, Any]]:
    """Cerca su Open Food Facts (World & IT)."""
    candidates = barcode_candidates(barcode)
    for code in candidates:
        # 1. Prova endpoint IT (più veloce per prodotti italiani)
        data = _http_get_json(f"https://it.openfoodfacts.org/api/v2/product/{code}.json")
        if data and data.get("status") == 1 and data.get("product"):
            return data["product"]

        # 2. Prova endpoint World generale
        data = _http_get_json(f"https://world.openfoodfacts.org/api/v2/product/{code}.json")
        if data and data.get("status") == 1 and data.get("product"):
            return data["product"]
    return None


def fetch_open_beauty_facts(barcode: str) -> Optional[Dict[str, Any]]:
    """Cerca su Open Beauty Facts (per cosmetici, igiene, balsamo labbra, saponi)."""
    candidates = barcode_candidates(barcode)
    for code in candidates:
        data = _http_get_json(f"https://world.openbeautyfacts.org/api/v2/product/{code}.json")
        if data and data.get("status") == 1 and data.get("product"):
            return data["product"]
    return None


def fetch_upc_item_db(barcode: str) -> Optional[Dict[str, Any]]:
    """Fallback su UPCitemdb per prodotti commerciali non censiti su OFF."""
    digits = "".join(c for c in (barcode or "") if c.isdigit())
    if not digits or len(digits) < 8:
        return None
    data = _http_get_json(f"https://api.upcitemdb.com/prod/trial/lookup?upc={digits}", timeout_sec=2.5)
    if data and data.get("code") == "OK" and data.get("items"):
        item = data["items"][0]
        return {
            "product_name": item.get("title") or "Prodotto commerciale",
            "brands": item.get("brand") or "",
            "ingredients_text": item.get("description") or "",
            "image_url": item.get("images", [None])[0] if item.get("images") else None,
        }
    return None


class ResolvedProduct:
    def __init__(
        self,
        barcode: str,
        product_name: str,
        brand: str,
        ingredients: str,
        allergeni_contenuti: List[str],
        allergeni_tracce: List[str],
        dieta_flags: List[str],
        source: str,
        source_label: str,
        image_url: Optional[str] = None,
        confidence_score: float = 1.0,
        verification_count: int = 1,
        is_cosmetic: bool = False,
        last_verified_at: Optional[datetime] = None,
        note: Optional[str] = None,
    ):
        self.barcode = barcode
        self.product_name = product_name
        self.brand = brand
        self.ingredients = ingredients
        self.allergeni_contenuti = allergeni_contenuti
        self.allergeni_tracce = allergeni_tracce
        self.dieta_flags = dieta_flags
        self.source = source
        self.source_label = source_label
        self.image_url = image_url
        self.confidence_score = confidence_score
        self.verification_count = verification_count
        self.is_cosmetic = is_cosmetic
        self.last_verified_at = last_verified_at
        self.note = note


def resolve_barcode_cascade(db: Session, barcode: str) -> Optional[ResolvedProduct]:
    """Esegue la cascata a 5 livelli per identificare il prodotto ed estrarre allergeni e sicurezza."""
    code = canonical_barcode(barcode)
    if not code:
        return None

    # =========================================================================
    # LIVELLO 1: AllerTgy Cloud Database / Cache Verificata
    # =========================================================================
    cached = get_cached_label(db, code)
    if cached:
        contenuti = cache_allergeni_contenuti(cached)
        tracce = cache_allergeni_tracce(cached)
        flags = extract_dietary_flags(cached.ingredients)
        source_name = getattr(cached, "source", "allertgy_verified") or "allertgy_verified"

        source_labels = {
            "allertgy_verified": "Certificato AllerTgy",
            "ai_label": "Analisi Etichetta AI (Community)",
            "community_cache": "Archivio Community AllerTgy",
            "openfoodfacts": "Open Food Facts",
            "openbeautyfacts": "Open Beauty Facts (Cosmetico)",
            "upcitemdb": "Database Commerciale UPC",
        }
        source_label = source_labels.get(source_name, "Archivio AllerTgy")

        return ResolvedProduct(
            barcode=cached.barcode,
            product_name=cached.product_name or "Prodotto AllerTgy",
            brand=cached.brand or "",
            ingredients=cached.ingredients or "",
            allergeni_contenuti=contenuti,
            allergeni_tracce=tracce,
            dieta_flags=flags,
            source=source_name,
            source_label=source_label,
            image_url=getattr(cached, "image_url", None),
            confidence_score=getattr(cached, "confidence_score", 1.0) or 1.0,
            verification_count=getattr(cached, "verification_count", 1) or 1,
            is_cosmetic=source_name == "openbeautyfacts",
            last_verified_at=cached.last_verified_at or cached.updated_at or cached.created_at,
            note="Dato recuperato dall'archivio verificato AllerTgy.",
        )

    # =========================================================================
    # LIVELLO 2: Open Food Facts (Multi-Node IT + World)
    # =========================================================================
    off_data = fetch_open_food_facts(code)
    if off_data:
        p_name = (
            off_data.get("product_name_it")
            or off_data.get("product_name")
            or off_data.get("generic_name_it")
            or off_data.get("generic_name")
            or "Prodotto alimentare"
        )
        p_brand = off_data.get("brands") or "Marca non specificata"
        p_ing = (
            off_data.get("ingredients_text_it")
            or off_data.get("ingredients_text")
            or ""
        )
        p_image = off_data.get("image_front_url") or off_data.get("image_url")

        # Estrazione allergeni dai tag strutturati OFF
        contenuti_set: Set[str] = set()
        tracce_set: Set[str] = set()

        for tag in off_data.get("allergens_tags", []) or []:
            mapped = OFF_TAG_MAP.get(tag.lower())
            if mapped:
                contenuti_set.add(mapped)

        for tag in off_data.get("traces_tags", []) or []:
            mapped = OFF_TAG_MAP.get(tag.lower())
            if mapped:
                tracce_set.add(mapped)

        # Scansione euristica approfondita sul testo ingredienti
        if p_ing:
            text_cont, text_trac = extract_allergens_from_text(p_ing)
            contenuti_set.update(text_cont)
            tracce_set.update(text_trac)

        tracce_set = tracce_set - contenuti_set

        diet_flags = extract_dietary_flags(
            p_ing,
            labels_tags=off_data.get("labels_tags", []) or [],
            analysis_tags=off_data.get("ingredients_analysis_tags", []) or [],
        )

        # Auto-caching trasparente nel nostro database Cloud
        upsert_cached_label(
            db,
            barcode=code,
            product_name=p_name,
            brand=p_brand,
            ingredients=p_ing or "Lista ingredienti verificata su Open Food Facts",
            allergeni_contenuti=list(contenuti_set),
            allergeni_tracce=list(tracce_set),
            source="openfoodfacts",
            image_url=p_image,
            confidence_score=0.95,
        )
        db.commit()

        return ResolvedProduct(
            barcode=code,
            product_name=p_name,
            brand=p_brand,
            ingredients=p_ing or "Lista ingredienti non disponibile in formato testo.",
            allergeni_contenuti=list(contenuti_set),
            allergeni_tracce=list(tracce_set),
            dieta_flags=diet_flags,
            source="openfoodfacts",
            source_label="Open Food Facts",
            image_url=p_image,
            confidence_score=0.95,
            verification_count=1,
            is_cosmetic=False,
            last_verified_at=datetime.utcnow(),
            note="Dati sincronizzati da Open Food Facts con scansione euristica AllerTgy.",
        )

    # =========================================================================
    # LIVELLO 3: Open Beauty Facts (Cosmetici, Igiene, Allergie da contatto)
    # =========================================================================
    obf_data = fetch_open_beauty_facts(code)
    if obf_data:
        p_name = (
            obf_data.get("product_name_it")
            or obf_data.get("product_name")
            or "Cosmetico / Igiene Personale"
        )
        p_brand = obf_data.get("brands") or "Marca non specificata"
        p_ing = (
            obf_data.get("ingredients_text_it")
            or obf_data.get("ingredients_text")
            or ""
        )
        p_image = obf_data.get("image_front_url") or obf_data.get("image_url")

        contenuti_set, tracce_set = extract_allergens_from_text(p_ing) if p_ing else (set(), set())
        for tag in obf_data.get("allergens_tags", []) or []:
            mapped = OFF_TAG_MAP.get(tag.lower())
            if mapped:
                contenuti_set.add(mapped)

        upsert_cached_label(
            db,
            barcode=code,
            product_name=p_name,
            brand=p_brand,
            ingredients=p_ing or "Composizione INCI da Open Beauty Facts",
            allergeni_contenuti=list(contenuti_set),
            allergeni_tracce=list(tracce_set),
            source="openbeautyfacts",
            image_url=p_image,
            confidence_score=0.90,
        )
        db.commit()

        return ResolvedProduct(
            barcode=code,
            product_name=p_name,
            brand=p_brand,
            ingredients=p_ing or "Composizione INCI cosmetico.",
            allergeni_contenuti=list(contenuti_set),
            allergeni_tracce=list(tracce_set),
            dieta_flags=extract_dietary_flags(p_ing),
            source="openbeautyfacts",
            source_label="Open Beauty Facts (Cura Personale)",
            image_url=p_image,
            confidence_score=0.90,
            verification_count=1,
            is_cosmetic=True,
            last_verified_at=datetime.utcnow(),
            note="Prodotto cosmetico/igiene analizzato per allergeni da contatto e celiachia.",
        )

    # =========================================================================
    # LIVELLO 4: UPCitemdb Fallback (Commercial catalog)
    # =========================================================================
    upc_data = fetch_upc_item_db(code)
    if upc_data and upc_data.get("ingredients_text"):
        p_name = upc_data.get("product_name") or "Prodotto commerciale"
        p_brand = upc_data.get("brands") or ""
        p_ing = upc_data.get("ingredients_text") or ""
        p_image = upc_data.get("image_url")

        contenuti_set, tracce_set = extract_allergens_from_text(p_ing)
        diet_flags = extract_dietary_flags(p_ing)

        upsert_cached_label(
            db,
            barcode=code,
            product_name=p_name,
            brand=p_brand,
            ingredients=p_ing,
            allergeni_contenuti=list(contenuti_set),
            allergeni_tracce=list(tracce_set),
            source="upcitemdb",
            image_url=p_image,
            confidence_score=0.85,
        )
        db.commit()

        return ResolvedProduct(
            barcode=code,
            product_name=p_name,
            brand=p_brand,
            ingredients=p_ing,
            allergeni_contenuti=list(contenuti_set),
            allergeni_tracce=list(tracce_set),
            dieta_flags=diet_flags,
            source="upcitemdb",
            source_label="Catalogo Commerciale UPC",
            image_url=p_image,
            confidence_score=0.85,
            verification_count=1,
            is_cosmetic=False,
            last_verified_at=datetime.utcnow(),
            note="Dati da catalogo commerciale con estrazione euristica allergeni.",
        )

    # Nessun database contiene il codice a barre → Richiede cattura etichetta AI (Livello 5)
    return None
