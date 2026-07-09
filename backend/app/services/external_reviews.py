from __future__ import annotations
from datetime import datetime, timedelta
import random

def get_external_reviews(restaurant_name: str, google_place_id: str | None, tripadvisor_url: str | None) -> list[dict]:
    """
    Ritorna recensioni esterne simulate (Google e TripAdvisor) per il ristorante.
    Se i link esterni non sono configurati, ritorna una lista vuota per quella sorgente.
    """
    reviews = []
    now = datetime.utcnow()

    # Google Reviews
    if google_place_id and google_place_id.strip():
        google_templates = [
            ("Luca Bianchi", 5, "Locale fantastico! Cibo eccezionale presso {name}, servizio impeccabile e atmosfera calda. Torneremo sicuramente!"),
            ("Giulia Rossi", 4, "Servizio rapido e piatti preparati con cura da {name}. Rapporto qualità prezzo corretto."),
            ("Marco Verdi", 4, "Ottima esperienza complessiva. Personale gentile e ingredienti freschi. Consigliato!"),
            ("Elisa Esposito", 5, "Esperienza fantastica. Il cibo è squisito, l'accoglienza è da 10 e lode. Ci rivedremo presto."),
        ]
        # Ne prendiamo 2-3 a caso stabili (usiamo un seed basato sul nome per stabilità)
        random.seed(restaurant_name + "_google")
        selected = random.sample(google_templates, min(len(google_templates), 3))
        for i, (author, rating, text) in enumerate(selected):
            reviews.append({
                "source": "google",
                "author_name": author,
                "rating": rating,
                "comment": text.format(name=restaurant_name),
                "created_at": now - timedelta(days=i * 4 + 2)
            })

    # TripAdvisor Reviews
    if tripadvisor_url and tripadvisor_url.strip():
        ta_templates = [
            ("ViaggiatoreMilano", 5, "Una piacevole scoperta! {name} offre piatti della tradizione squisiti e porzioni abbondanti. Staff molto sorridente."),
            ("Gourmet88", 4, "Ottima cena. La qualità delle materie prime si sente tutta. I dolci fatti in casa sono superbi!"),
            ("Sara V.", 5, "Location caratteristica, personale attento alle richieste e piatti davvero saporiti. Prezzi nella media."),
            ("Nicola Romano", 4, "Cibo ottimo e servizio veloce. Abbiamo mangiato benissimo, consigliato sia per coppie che per famiglie."),
        ]
        random.seed(restaurant_name + "_tripadvisor")
        selected = random.sample(ta_templates, min(len(ta_templates), 3))
        for i, (author, rating, text) in enumerate(selected):
            reviews.append({
                "source": "tripadvisor",
                "author_name": author,
                "rating": rating,
                "comment": text.format(name=restaurant_name),
                "created_at": now - timedelta(days=i * 5 + 3)
            })

    # Ordina per data decrescente
    reviews.sort(key=lambda r: r["created_at"], reverse=True)
    return reviews
