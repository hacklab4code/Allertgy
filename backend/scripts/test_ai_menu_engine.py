"""Script di test e collaudo per il Motore AI AllerTgy (Estrazione Menù & Allergeni).

Verifica:
1. Normalizzazione allergeni UE (14 categorie ufficiali)
2. Generazione menù sintetico di prova per la validazione OCR
3. Esecuzione pipeline Vision AI (analyze_menu_image / analyze_menu_url)
"""
import os
import sys
from pathlib import Path

# Aggiungi root backend a sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.menu_analyze import (
    EU_ALLERGEN_CODES,
    _normalize_category,
    _sanitize_allergens,
    _normalize_price,
    analyze_menu_image,
)
from app.config import settings


def test_allergen_sanitization():
    print("🧪 1. Test Sanitizzazione e Mappatura Allergeni UE...")
    raw_inputs = [
        "Glutine",
        "FRUTTA_A_GUSCIO",
        "noci",
        "anidride_solforosa",
        "so2",
        "latte",
        "NonEsistente",
        "uova",
    ]
    cleaned = _sanitize_allergens(raw_inputs)
    expected = ["glutine", "frutta_a_guscio", "solfiti", "latte", "uova"]
    print(f"   Input grezzi: {raw_inputs}")
    print(f"   Risultato pulito: {cleaned}")
    assert set(cleaned) == set(expected), f"Mismatch allergeni: {cleaned} vs {expected}"
    print("   ✅ Test allergeni superato!\n")


def test_category_and_price_normalization():
    print("🧪 2. Test Normalizzazione Categorie e Prezzi...")
    assert _normalize_category("starters") == "Antipasti"
    assert _normalize_category("PIZZA") == "Pizze"
    assert _normalize_category("Risotti") == "Primi"
    assert _normalize_category("sconosciuto") == "Altro"

    assert _normalize_price(1250) == 1250
    assert _normalize_price(12) == 1200  # Euro interi convertiti in centesimi
    assert _normalize_price(60000) is None  # Prezzo assurdo scartato
    print("   ✅ Test categorie e prezzi superato!\n")


def generate_sample_menu_image() -> bytes:
    """Crea un'immagine di test con Pillow contenente un menù italiano con allergeni."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("⚠️ Pillow non installato, creo byte vuoti di fallback.")
        return b"PNG_FALLBACK"

    img = Image.new("RGB", (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    menu_text = [
        ("RISTORANTE DA MARIO - MENU ALLERGENI", 26, (0, 0, 0)),
        ("", 15, (0, 0, 0)),
        ("ANTIPASTI", 22, (180, 50, 50)),
        ("Saute di Cozze e Vongole - EUR 14,00", 18, (0, 0, 0)),
        ("Cozze fresche, vongole veraci, aglio, prezzemolo, vino bianco (solfiti, molluschi)", 13, (100, 100, 100)),
        ("", 15, (0, 0, 0)),
        ("PRIMI PIATTI", 22, (180, 50, 50)),
        ("Spaghetti alla Carbonara - EUR 12,50", 18, (0, 0, 0)),
        ("Spaghetti di grano duro, guanciale, tuorlo d'uovo, pecorino romano, pepe (glutine, uova, latte)", 13, (100, 100, 100)),
        ("", 15, (0, 0, 0)),
        ("SECONDI PIATTI", 22, (180, 50, 50)),
        ("Filetto di Spigola in Crosta di Mandorle - EUR 18,00", 18, (0, 0, 0)),
        ("Filetto di spigola fresco, crosta di mandorle e limone (pesce, frutta a guscio)", 13, (100, 100, 100)),
        ("", 15, (0, 0, 0)),
        ("DOLCI", 22, (180, 50, 50)),
        ("Tiramisu Tradizionale - EUR 6,00", 18, (0, 0, 0)),
        ("Savoiardi, mascarpone, uova fresche, caffe, cacao (glutine, uova, latte)", 13, (100, 100, 100)),
    ]

    y = 40
    for line, size, color in menu_text:
        draw.text((50, y), line, fill=color)
        y += size + 8

    import io
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def test_ai_pipeline():
    print("🧪 3. Test Pipeline AI Vision (analyze_menu_image)...")
    img_bytes = generate_sample_menu_image()
    
    print(f"   GEMINI_API_KEY presente: {'SI' if settings.gemini_api_key else 'NO (Esecuzione in modalita Fallback Graceful)'}")
    
    result = analyze_menu_image(img_bytes, filename="test_menu.jpg", mime_type="image/jpeg")

    print("   Risultato Analisi AI:")
    print(f"   - AI Stub / Fallback: {result.ai_stub}")
    print(f"   - Note: {result.note}")
    print(f"   - Piatti trovati: {len(result.piatti)}")
    
    for idx, dish in enumerate(result.piatti, 1):
        print(f"     [{idx}] {dish.nome_piatto} ({dish.categoria}) - €{(dish.prezzo_cents or 0)/100:.2f}")
        print(f"         Allergeni: {dish.allergeni_contenuti}")
        print(f"         Tracce: {dish.allergeni_tracce}")

    print("   ✅ Test Pipeline AI completato con successo!\n")


if __name__ == "__main__":
    print("==================================================")
    print("🚀 COLLAUDO MOTORE AI VISION ALLERTGY (OCR & ALLERGENI)")
    print("==================================================\n")
    test_allergen_sanitization()
    test_category_and_price_normalization()
    test_ai_pipeline()
    print("🎉 TUTTI I TEST DEL MOTORE AI SONO STATI SUPERATI CON SUCCESSO!")
