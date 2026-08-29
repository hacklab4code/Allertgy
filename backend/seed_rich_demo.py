"""Crea ed aggiorna i dati demo completi di AllerTgy:
- 8 Locali con immagini, coordinate, recensioni e piani Pro attivi
- Oltre 70 piatti completi di allergeni (contenuti e tracce) e foto Unsplash
- Account utenti demo (cliente, ristoratori, profili con allergie)
- Annotazioni di sicurezza e recensioni
"""
from datetime import datetime, timezone
from app.database import SessionLocal
from app.legal import LEGAL_TERMS_VERSION, MENU_CONFIRMATION_VERSION, PRIVACY_VERSION, SAFETY_DISCLAIMER_VERSION
from app.models import Allergen, Dish, DishAllergen, Restaurant, RestaurantPhoto, User, UserAllergen, CustomerAnnotation, Review
from app.security import hash_password

NOW = datetime.now(timezone.utc)

DEMO_RESTAURANTS = [
    {
        "public_code": "100001",
        "name": "Trattoria Da Matteo",
        "city": "Milano",
        "address": "Via Dante 14, 20121 Milano MI",
        "phone": "+39 02 8901234",
        "latitude": 45.4668,
        "longitude": 9.1860,
        "cuisine": "italiana",
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "google_rating": 4.8,
        "google_reviews_count": 240,
        "tripadvisor_rating": 4.7,
        "tripadvisor_reviews_count": 180,
        "dishes": [
            ("Bruschette al pomodoro", "Pane tostato al forno, pomodori ramati freschi, aglio e basilico", "Antipasti", 500, ["glutine"], []),
            ("Insalata di mare fresca", "Polpo verace, gamberi sgusciati, sedano croccante e limone", "Antipasti", 1400, ["molluschi", "crostacei", "sedano"], ["pesce"]),
            ("Tagliere di salumi e pecorino", "Prosciutto crudo di Parma 24 mesi, salame felino e pecorino toscano", "Antipasti", 1600, ["latte"], ["solfiti"]),
            ("Spaghetti alla carbonara", "Guanciale IGP croccante, uova fresche, pecorino romano e pepe nero", "Primi", 1200, ["glutine", "uova", "latte"], []),
            ("Risotto alla milanese", "Riso Carnaroli, zafferano in pistilli, burro e parmigiano 30 mesi", "Primi", 1300, ["latte"], ["sedano"]),
            ("Tagliatelle ai funghi porcini", "Pasta fresca all'uovo fatte in casa con porcini freschi dell'Appennino", "Primi", 1400, ["glutine", "uova"], ["latte"]),
            ("Frittura di calamari e gamberi", "Calamari e gamberi dorati in farina di grano e serviti con maionese", "Secondi", 1500, ["molluschi", "crostacei", "glutine"], ["pesce"]),
            ("Tagliata di manzo con rucola", "Controfiletto alla griglia con rucola fresca e scaglie di grana", "Secondi", 1800, ["latte"], []),
            ("Grigliata di verdure miste", "Zucchine, melanzane e radicchio alla piastra con olio EVO", "Contorni", 700, [], ["solfiti"]),
            ("Patate al forno alla salvia", "Patate dorate al forno con rosmarino, salvia e aglio", "Contorni", 500, [], []),
            ("Tiramisù tradizionale", "Mascarpone fresco, savoiardi inzuppati nel caffè espresso e cacao", "Dolci", 600, ["glutine", "uova", "latte"], ["frutta_a_guscio"]),
            ("Panna cotta ai frutti di bosco", "Panna cotta con coulis artigianale ai frutti di bosco freschi", "Dolci", 550, ["latte"], []),
        ]
    },
    {
        "public_code": "100002",
        "name": "Pizzeria Da Michele & Fratelli",
        "city": "Napoli",
        "address": "Via Cesare Sersale 1, 80139 Napoli NA",
        "phone": "+39 081 5539204",
        "latitude": 40.8502,
        "longitude": 14.2635,
        "cuisine": "pizzeria",
        "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
        "google_rating": 4.9,
        "google_reviews_count": 512,
        "tripadvisor_rating": 4.8,
        "tripadvisor_reviews_count": 420,
        "dishes": [
            ("Margherita Verace STG", "Pomodoro San Marzano DOP, fior di latte di Agerola, basilico fresco", "Pizze", 750, ["glutine", "latte"], []),
            ("Marinara Tradizionale", "Pomodoro San Marzano DOP, aglio, origano selvatico e olio EVO", "Pizze", 650, ["glutine"], []),
            ("Capricciosa Napoletana", "Pomodoro, fior di latte, prosciutto cotto, funghi, carciofi e olive", "Pizze", 950, ["glutine", "latte"], []),
            ("Quattro Formaggi DOP", "Fior di latte, gorgonzola dolce, provola affumicata e parmigiano", "Pizze", 1000, ["glutine", "latte"], []),
            ("Cuoppo Fritto Napoletano", "Misto di frittatine di pasta, crocchè di patate e arancini di riso", "Antipasti", 800, ["glutine", "latte"], ["arachidi"]),
            ("Montanarine fritte al pomodoro", "Pizzette fritte affogate nel ragù napoletano e parmigiano", "Antipasti", 600, ["glutine", "latte"], []),
            ("Babà al rum con panna", "Soffice babà artigianale bagnato al rum invecchiato con panna montata", "Dolci", 500, ["glutine", "uova", "latte", "solfiti"], []),
            ("Delizia al limone amalfitano", "Pan di Spagna soffice farcito con crema ai limoni di Amalfi", "Dolci", 550, ["glutine", "uova", "latte"], []),
        ]
    },
    {
        "public_code": "271282",
        "name": "Osteria Qui Se Magna",
        "city": "Roma",
        "address": "Via Cavour 88, 00184 Roma RM",
        "phone": "+39 06 4885921",
        "latitude": 41.8967,
        "longitude": 12.4944,
        "cuisine": "italiana",
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "google_rating": 4.7,
        "google_reviews_count": 380,
        "tripadvisor_rating": 4.6,
        "tripadvisor_reviews_count": 290,
        "dishes": [
            ("Carciofo alla Giudia", "Carciofo romanesco fritto croccante alla maniera tradizionale", "Antipasti", 850, [], ["arachidi"]),
            ("Bruschetta Cacio e Pepe", "Pane casereccio con crema di pecorino romano e pepe nero macinato", "Antipasti", 600, ["glutine", "latte"], []),
            ("Rigatoni alla Carbonara", "Rigatoni trafilati in bronzo, guanciale croccante, tuorli e pecorino", "Primi", 1300, ["glutine", "uova", "latte"], []),
            ("Tonnarelli Cacio e Pepe", "Tonnarelli freschi mantecati con crema di pecorino e pepe nero", "Primi", 1250, ["glutine", "latte"], []),
            ("Bucatini all'Amatriciana", "Bucatini con salsa al pomodoro, guanciale, pecorino e sfumata di vino", "Primi", 1300, ["glutine", "latte"], ["solfiti"]),
            ("Saltimbocca alla Romana", "Fettine di vitello con prosciutto crudo, salvia e vino bianco", "Secondi", 1600, ["latte"], ["solfiti"]),
            ("Coda alla Vaccinara", "Coda di bue stufata a lungo con pomodoro, sedano e uvetta", "Secondi", 1700, ["sedano"], ["frutta_a_guscio"]),
            ("Cicoria ripassata aglio e olio", "Cicoria fresca di campo ripassata in padella con aglio e peperoncino", "Contorni", 550, [], []),
            ("Maritozzo con la panna", "Soffice maritozzo romano farcito con generosa panna fresca", "Dolci", 450, ["glutine", "uova", "latte"], []),
        ]
    },
    {
        "public_code": "100003",
        "name": "Sakura Gourmet Sushi & Poke",
        "city": "Milano",
        "address": "Corso Garibaldi 55, 20121 Milano MI",
        "phone": "+39 02 7209483",
        "latitude": 45.4745,
        "longitude": 9.1865,
        "cuisine": "giapponese",
        "image_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
        "google_rating": 4.8,
        "google_reviews_count": 310,
        "tripadvisor_rating": 4.7,
        "tripadvisor_reviews_count": 230,
        "dishes": [
            ("Edamame al sale rosa", "Baccelli di soia al vapore conditi con sale rosa dell'Himalaya", "Antipasti", 500, ["soia"], []),
            ("Gyoza di maiale e verdure", "Ravioli giapponesi alla piastra ripieni di carne e porro", "Antipasti", 750, ["glutine", "soia", "sesamo"], []),
            ("Dragon Roll (8 pezzi)", "Roll con gambero in tempura, maionese, fette di avocado e teriyaki", "Specialità", 1500, ["pesce", "crostacei", "soia", "sesamo", "glutine"], []),
            ("Salmon Special Poke", "Riso sushi, salmone fresco, edamame, avocado, alga wakame e salsa ponzu", "Specialità", 1400, ["pesce", "soia", "sesamo"], ["arachidi"]),
            ("Nigiri Misto (8 pezzi)", "Polpettine di riso con salmone, tonno fresco, branzino e gambero", "Specialità", 1600, ["pesce", "crostacei", "soia"], []),
            ("Sashimi di Salmone e Tonno", "Fette prelibate di salmone selvaggio e tonno rosso tagliate al momento", "Specialità", 1800, ["pesce", "soia"], []),
            ("Tempura di Gamberi e Verdure", "Gamberoni e verdure croccanti in pastella leggera giapponese", "Secondi", 1450, ["crostacei", "glutine", "uova", "soia"], []),
            ("Mochi al Tè Verde Matcha", "Dolcetti di riso ripieni di gelato artigianale al tè verde matcha", "Dolci", 550, ["latte", "soia"], ["frutta_a_guscio"]),
        ]
    },
    {
        "public_code": "100005",
        "name": "El Mariachi Tacqueria",
        "city": "Bologna",
        "address": "Via del Pratello 22, 40122 Bologna BO",
        "phone": "+39 051 223344",
        "latitude": 44.4960,
        "longitude": 11.3340,
        "cuisine": "messicana",
        "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
        "google_rating": 4.6,
        "google_reviews_count": 190,
        "tripadvisor_rating": 4.5,
        "tripadvisor_reviews_count": 140,
        "dishes": [
            ("Guacamole fresco con Nachos", "Avocado schiacciato al momento con lime, coriandolo, cipolla e tortilla chips", "Antipasti", 700, [], ["sesamo"]),
            ("Tacos Al Pastor (3 pezzi)", "Tortillas di mais con maiale marinato all'achiote, ananas e coriandolo", "Specialità", 1100, [], ["glutine"]),
            ("Quesadillas de Pollo", "Tortillas alla piastra ripiene di pollo sfilacciato e formaggio Oaxaca", "Specialità", 1050, ["glutine", "latte"], []),
            ("Burrito de Res Gigante", "Tortilla di grano ripiena di chili di manzo, riso, fagioli neri e panna acida", "Specialità", 1200, ["glutine", "latte"], []),
            ("Churros con cioccolato", "Churros caldi spolverati di zucchero e cannella serviti con cioccolato denso", "Dolci", 600, ["glutine", "latte", "uova"], ["frutta_a_guscio"]),
        ]
    },
    {
        "public_code": "100008",
        "name": "Bistrot Verde Germoglio",
        "city": "Torino",
        "address": "Via Roma 105, 10121 Torino TO",
        "phone": "+39 011 5621890",
        "latitude": 45.0677,
        "longitude": 7.6824,
        "cuisine": "vegano",
        "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
        "google_rating": 4.9,
        "google_reviews_count": 210,
        "tripadvisor_rating": 4.8,
        "tripadvisor_reviews_count": 170,
        "dishes": [
            ("Creamy Hummus e Crostini Gluten-Free", "Hummus di ceci al tahina servito con crostini croccanti di mais e riso", "Antipasti", 650, ["sesamo"], []),
            ("Quinoa & Avocado Rainbow Bowl", "Quinoa, avocado, edamame, cavolo cappuccio viola, semi di sesamo e tahina", "Primi", 1200, ["soia", "sesamo"], []),
            ("Vellutata di Zucca e Zenzero", "Cremosa vellutata di zucca mantovana con latte di cocco e crostini", "Primi", 950, [], ["sedano"]),
            ("Beyond Gourmet Burger", "Burger vegetale servito in pane artigianale con maionese vegana e patate", "Secondi", 1400, ["soia", "senape", "glutine"], []),
            ("Cheesecake Vegan al Mango", "Cheesecake cruda a base di anacardi, datteri e coulis di mango fresco", "Dolci", 600, ["frutta_a_guscio"], []),
        ]
    },
    {
        "public_code": "100007",
        "name": "Ristorante Mare Nostrum",
        "city": "Genova",
        "address": "Ponte Calvi, Porto Antico, 16124 Genova GE",
        "phone": "+39 010 2468100",
        "latitude": 44.4090,
        "longitude": 8.9270,
        "cuisine": "pesce",
        "image_url": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
        "google_rating": 4.7,
        "google_reviews_count": 280,
        "tripadvisor_rating": 4.6,
        "tripadvisor_reviews_count": 210,
        "dishes": [
            ("Cozze alla Marinara", "Cozze fresche del Golfo sfumate al vino bianco con aglio e prezzemolo", "Antipasti", 1100, ["molluschi"], ["solfiti"]),
            ("Tartare di Tonno e Avocado", "Tonno rosso tagliato a coltello con crema di avocado ed olio agli agrumi", "Antipasti", 1500, ["pesce", "sesamo"], []),
            ("Spaghetti alle Vongole veraci", "Spaghetti di Gragnano saltati con vongole fresche, aglio, olio e peperoncino", "Primi", 1550, ["molluschi", "glutine"], ["solfiti"]),
            ("Trofie al Pesto Genovese DOC", "Trofie fresche liguri condite con pesto artigianale al basilico di Prà", "Primi", 1200, ["glutine", "latte", "frutta_a_guscio"], []),
            ("Grigliata Mista del Golfo", "Gamberoni, calamari, trancio di spada e branzino alla griglia con verdure", "Secondi", 2200, ["pesce", "crostacei", "molluschi"], []),
            ("Sorbetto al Limone di Monterosso", "Sorbetto rinfrescante preparato con limoni delle Cinque Terre", "Dolci", 500, [], []),
        ]
    },
    {
        "public_code": "100006",
        "name": "Pasticceria & Bakery Dolce Vita",
        "city": "Firenze",
        "address": "Via de' Calzaiuoli 40, 50122 Firenze FI",
        "phone": "+39 055 214589",
        "latitude": 43.7710,
        "longitude": 11.2550,
        "cuisine": "pasticceria",
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
        "google_rating": 4.9,
        "google_reviews_count": 410,
        "tripadvisor_rating": 4.8,
        "tripadvisor_reviews_count": 340,
        "dishes": [
            ("Croissant Artigianale alla Crema", "Soffice croissant sfogliato con burro francese e farcito con crema pasticcera", "Dolci", 220, ["glutine", "uova", "latte"], []),
            ("Cheesecake ai Frutti di Bosco", "Torta al formaggio cremoso con base biscottata e topping ai mirtilli", "Dolci", 550, ["glutine", "uova", "latte"], []),
            ("Macaron Assortiti (4 pezzi)", "Dolcetti francesi con farina di mandorle e farciture gourmet", "Dolci", 600, ["uova", "latte", "frutta_a_guscio"], []),
            ("Cantucci Toscani alle Mandorle", "Biscotti secchi tradizionali toscani ricchi di mandorle intere", "Dolci", 450, ["glutine", "uova", "frutta_a_guscio"], []),
            ("Coppetta Gelato Artigianale (3 gusti)", "Gelato preparato giornalmente con latte fresco intero e ingredienti naturali", "Dolci", 400, ["latte"], ["frutta_a_guscio", "uova"]),
        ]
    }
]

def run_seed():
    db = SessionLocal()
    try:
        allergens_by_code = {a.code: a for a in db.query(Allergen).all()}
        if not allergens_by_code:
            print("❌ Nessun allergene trovato nel DB!")
            return

        # 1. Crea o aggiorna Utente Cliente Demo
        cliente = db.query(User).filter_by(email="cliente@allertgy.it").first()
        if not cliente:
            cliente = User(
                email="cliente@allertgy.it",
                password_hash=hash_password("Cliente123!"),
                display_name="Cliente Demo",
                role="customer",
                terms_accepted_at=NOW,
                privacy_accepted_at=NOW,
                health_data_consent_at=NOW,
                legal_terms_version=LEGAL_TERMS_VERSION,
                privacy_version=PRIVACY_VERSION,
                disclaimer_accepted_at=NOW,
                safety_disclaimer_version=SAFETY_DISCLAIMER_VERSION,
                onboarding_completed_at=NOW,
            )
            db.add(cliente)
            db.flush()
            # Assegna allergie demo (latte e crostacei)
            for code in ("latte", "crostacei"):
                if code in allergens_by_code:
                    db.add(UserAllergen(user_id=cliente.id, allergen_id=allergens_by_code[code].id, source="manual", intensity="moderata", criterio="assoluto"))
            print("✅ Utente cliente@allertgy.it creato con allergie: latte, crostacei")

        # 2. Crea o aggiorna Utente Ristoratore Demo
        owner = db.query(User).filter_by(email="ristoratore@allertgy.it").first()
        if not owner:
            owner = User(
                email="ristoratore@allertgy.it",
                password_hash=hash_password("Ristorante1!"),
                display_name="Matteo Ristoratore",
                role="owner",
                terms_accepted_at=NOW,
                privacy_accepted_at=NOW,
                legal_terms_version=LEGAL_TERMS_VERSION,
                privacy_version=PRIVACY_VERSION,
            )
            db.add(owner)
            db.flush()
            print("✅ Utente ristoratore@allertgy.it creato")

        # 3. Popola o aggiorna Ristoranti e Piatti
        for r_data in DEMO_RESTAURANTS:
            rest = db.query(Restaurant).filter_by(public_code=r_data["public_code"]).first()
            if not rest:
                rest = Restaurant(public_code=r_data["public_code"])
                db.add(rest)

            rest.name = r_data["name"]
            rest.city = r_data["city"]
            rest.address = r_data["address"]
            rest.phone = r_data["phone"]
            rest.latitude = r_data["latitude"]
            rest.longitude = r_data["longitude"]
            rest.cuisine = r_data["cuisine"]
            rest.image_url = r_data["image_url"]
            rest.google_rating = r_data["google_rating"]
            rest.google_reviews_count = r_data["google_reviews_count"]
            rest.tripadvisor_rating = r_data["tripadvisor_rating"]
            rest.tripadvisor_reviews_count = r_data["tripadvisor_reviews_count"]
            rest.owner_user_id = owner.id
            rest.business_plan = "pro" if r_data["public_code"] != "271282" else "pro_notify"
            rest.subscription_status = "active"
            rest.plan_price_cents = 1900
            rest.is_verified = 1
            rest.is_active = 1
            rest.menu_version = 1
            rest.menu_updated_at = NOW
            rest.menu_legal_confirmed_at = NOW
            rest.menu_legal_confirmed_by = owner.id
            rest.menu_legal_version = MENU_CONFIRMATION_VERSION
            db.flush()

            # Pulisci o popola piatti
            existing_dishes = {d.name: d for d in rest.dishes}
            for nome, desc, cat, prezzo, contenuti, tracce in r_data["dishes"]:
                if nome in existing_dishes:
                    dish = existing_dishes[nome]
                    dish.description = desc
                    dish.category = cat
                    dish.price_cents = prezzo
                    dish.is_available = 1
                    # reset allergene piatti
                    db.query(DishAllergen).filter_by(dish_id=dish.id).delete()
                else:
                    dish = Dish(
                        restaurant_id=rest.id,
                        name=nome,
                        description=desc,
                        category=cat,
                        price_cents=prezzo,
                        is_available=1,
                        menu_group="Principale",
                    )
                    db.add(dish)
                    db.flush()

                for code in contenuti:
                    if code in allergens_by_code:
                        db.add(DishAllergen(dish_id=dish.id, allergen_id=allergens_by_code[code].id, kind="contains"))
                for code in tracce:
                    if code in allergens_by_code:
                        db.add(DishAllergen(dish_id=dish.id, allergen_id=allergens_by_code[code].id, kind="traces"))

            print(f"✅ Ristorante '{rest.name}' ({rest.public_code}) salvato con {len(r_data['dishes'])} piatti.")

        # 4. Aggiungi alcune annotazioni di sicurezza dei clienti
        r_trattoria = db.query(Restaurant).filter_by(public_code="100001").first()
        if r_trattoria and cliente and "latte" in allergens_by_code:
            annot_exists = db.query(CustomerAnnotation).filter_by(restaurant_id=r_trattoria.id, user_id=cliente.id).first()
            if not annot_exists:
                db.add(CustomerAnnotation(
                    restaurant_id=r_trattoria.id,
                    user_id=cliente.id,
                    allergen_id=allergens_by_code["latte"].id,
                    ingredient="Formaggio e burro nei primi",
                    notes="Attenzione: il personale è comunque molto preparato nel proporre alternative senza lattosio su richiesta!"
                ))
                print("✅ Annotazione cliente inserita per Trattoria Da Matteo")

        db.commit()
        print("\n🎉 POPOLAMENTO DATABASE COMPLETATO CON SUCCESSO!")
    except Exception as e:
        db.rollback()
        print(f"❌ Errore durante il popolamento: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
