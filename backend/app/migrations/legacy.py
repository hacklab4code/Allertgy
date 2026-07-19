"""Migrazioni legacy idempotenti eseguite all'avvio.

Le nuove migrazioni vanno in alembic/versions/ (vedi backend/alembic/).
Questo modulo resta per compatibilità con DB esistenti.
"""
from ..database import SessionLocal


def run_migrations():
    """Esegue migrazioni automatiche leggere per il DB remoto dell'MVP."""
    from sqlalchemy import text
    db = SessionLocal()
    try:
        # Verifica ed eventualmente aggiunge image_url a dishes
        try:
            db.execute(text("SELECT image_url FROM dishes LIMIT 1"))
        except Exception:
            db.rollback()
            try:
                db.execute(text("ALTER TABLE dishes ADD COLUMN image_url VARCHAR(500) NULL"))
                db.commit()
                print("🚀 Database Migrazione: Aggiunta colonna image_url a 'dishes'")
            except Exception as e:
                print(f"❌ Errore migrazione dishes: {e}")
                db.rollback()

        # Verifica ed eventualmente aggiunge menu_group a dishes
        try:
            db.execute(text("SELECT menu_group FROM dishes LIMIT 1"))
        except Exception:
            db.rollback()
            try:
                db.execute(text("ALTER TABLE dishes ADD COLUMN menu_group VARCHAR(100) NULL DEFAULT 'Principale'"))
                db.commit()
                print("🚀 Database Migrazione: Aggiunta colonna menu_group a 'dishes'")
            except Exception as e:
                print(f"❌ Errore migrazione dishes (menu_group): {e}")
                db.rollback()

        # Verifica ed eventualmente aggiunge image_url a restaurants
        try:
            db.execute(text("SELECT image_url FROM restaurants LIMIT 1"))
        except Exception:
            db.rollback()
            try:
                db.execute(text("ALTER TABLE restaurants ADD COLUMN image_url VARCHAR(500) NULL"))
                db.commit()
                print("🚀 Database Migrazione: Aggiunta colonna image_url a 'restaurants'")
            except Exception as e:
                print(f"❌ Errore migrazione restaurants: {e}")
                db.rollback()

        # Verifica ed eventualmente aggiunge apple_health_connected a users
        try:
            db.execute(text("SELECT apple_health_connected FROM users LIMIT 1"))
        except Exception:
            db.rollback()
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN apple_health_connected TINYINT(1) DEFAULT 0"))
                db.commit()
                print("🚀 Database Migrazione: Aggiunta colonna apple_health_connected a 'users'")
            except Exception as e:
                print(f"❌ Errore migrazione users (apple_health_connected): {e}")
                db.rollback()

        # Verifica ed eventualmente aggiunge emergency_medicines a users
        try:
            db.execute(text("SELECT emergency_medicines FROM users LIMIT 1"))
        except Exception:
            db.rollback()
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN emergency_medicines VARCHAR(500) NULL"))
                db.commit()
                print("🚀 Database Migrazione: Aggiunta colonna emergency_medicines a 'users'")
            except Exception as e:
                print(f"❌ Errore migrazione users (emergency_medicines): {e}")
                db.rollback()

        # Verifica ed eventualmente aggiunge i campi legali e onboarding a users
        for col, col_type in [
            ("terms_accepted_at", "DATETIME NULL"),
            ("privacy_accepted_at", "DATETIME NULL"),
            ("health_data_consent_at", "DATETIME NULL"),
            ("legal_terms_version", "VARCHAR(40) NULL"),
            ("privacy_version", "VARCHAR(40) NULL"),
            ("safety_disclaimer_version", "VARCHAR(40) NULL"),
            ("onboarding_completed_at", "DATETIME NULL"),
            ("emergency_contact_name", "VARCHAR(255) NULL"),
            ("emergency_contact_phone", "VARCHAR(100) NULL"),
        ]:
            try:
                db.execute(text(f"SELECT {col} FROM users LIMIT 1"))
            except Exception:
                db.rollback()
                try:
                    db.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                    db.commit()
                    print(f"🚀 Database Migrazione: Aggiunta colonna {col} a 'users'")
                except Exception as e:
                    print(f"❌ Errore migrazione users ({col}): {e}")
                    db.rollback()

        # Verifica ed eventualmente crea la tabella user_documents
        try:
            db.execute(text("SELECT id FROM user_documents LIMIT 1"))
        except Exception:
            db.rollback()
            try:
                db.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_documents (
                      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                      user_id     INT UNSIGNED NOT NULL,
                      filename    VARCHAR(255) NOT NULL,
                      file_path   VARCHAR(500) NOT NULL,
                      status      VARCHAR(50) NOT NULL DEFAULT 'pending',
                      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """))
                db.commit()
                print("🚀 Database Migrazione: Creata tabella 'user_documents'")
            except Exception as e:
                print(f"❌ Errore migrazione user_documents: {e}")
                db.rollback()
        # Verifica ed eventualmente aggiunge address, phone, email_contact, opening_hours a restaurants
        for col, col_type in [
            ("address", "VARCHAR(500) NULL"),
            ("latitude", "DOUBLE NULL"),
            ("longitude", "DOUBLE NULL"),
            ("phone", "VARCHAR(50) NULL"),
            ("email_contact", "VARCHAR(255) NULL"),
            ("opening_hours", "VARCHAR(1000) NULL"),
            ("menu_version", "INT NOT NULL DEFAULT 0"),
            ("menu_legal_confirmed_at", "DATETIME NULL"),
            ("menu_legal_confirmed_by", "INT UNSIGNED NULL"),
            ("menu_legal_version", "VARCHAR(40) NULL"),
            ("business_plan", "VARCHAR(30) NOT NULL DEFAULT 'free'"),
            ("subscription_status", "VARCHAR(30) NOT NULL DEFAULT 'free'"),
            ("plan_price_cents", "INT NOT NULL DEFAULT 0"),
            ("is_verified", "TINYINT(1) NOT NULL DEFAULT 0"),
            ("featured_priority", "INT NOT NULL DEFAULT 0"),
            ("plan_started_at", "DATETIME NULL"),
            ("trial_ends_at", "DATETIME NULL"),
            ("billing_email", "VARCHAR(255) NULL"),
            ("vat_number", "VARCHAR(50) NULL"),
            ("sdi_code", "VARCHAR(20) NULL"),
            ("pec_email", "VARCHAR(255) NULL"),
            ("commercial_notes", "VARCHAR(1000) NULL"),
            ("allergen_manager", "VARCHAR(255) NULL"),
        ]:
            try:
                db.execute(text(f"SELECT {col} FROM restaurants LIMIT 1"))
            except Exception:
                db.rollback()
                try:
                    db.execute(text(f"ALTER TABLE restaurants ADD COLUMN {col} {col_type}"))
                    db.commit()
                    print(f"🚀 Database Migrazione: Aggiunta colonna {col} a 'restaurants'")
                except Exception as e:
                    print(f"❌ Errore migrazione restaurants ({col}): {e}")
                    db.rollback()

        # Verifica ed eventualmente crea la tabella di audit/versioni del menù
        try:
            db.execute(text("SELECT id FROM menu_audit_logs LIMIT 1"))
        except Exception:
            db.rollback()
            try:
                db.execute(text("""
                    CREATE TABLE IF NOT EXISTS menu_audit_logs (
                      id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                      restaurant_id  INT UNSIGNED NOT NULL,
                      owner_user_id  INT UNSIGNED NULL,
                      action         ENUM('menu_saved','menu_approved','restaurant_updated') NOT NULL,
                      menu_version   INT NOT NULL DEFAULT 0,
                      legal_version  VARCHAR(40) NULL,
                      snapshot_json  JSON NULL,
                      note           VARCHAR(500) NULL,
                      created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      INDEX idx_menu_audit_restaurant_created (restaurant_id, created_at),
                      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
                      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """))
                db.commit()
                print("🚀 Database Migrazione: Creata tabella 'menu_audit_logs'")
            except Exception as e:
                print(f"❌ Errore migrazione menu_audit_logs: {e}")
                db.rollback()

        # ---- Migrazione v5 (piano di lancio) ----
        _run_v5_migrations(db)
        _run_v6_migrations(db)
        _run_v7_migrations(db)
        _run_v8_migrations(db)
        _run_v9_migrations(db)
        _run_v10_migrations(db)
        _run_v11_migrations(db)
        _run_v12_migrations(db)
        _run_v13_migrations(db)
        _run_v14_migrations(db)
        _run_v15_migrations(db)
        _run_v16_migrations(db)
        _seed_allergens(db)
    finally:
        db.close()


def _add_column_if_missing(db, table: str, col: str, col_type: str) -> None:
    from sqlalchemy import text
    try:
        db.execute(text(f"SELECT {col} FROM {table} LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
            db.commit()
            print(f"🚀 Database Migrazione v5: Aggiunta colonna {col} a '{table}'")
        except Exception as e:
            print(f"❌ Errore migrazione {table} ({col}): {e}")
            db.rollback()


def _create_table_if_missing(db, name: str, ddl: str) -> None:
    from sqlalchemy import text
    try:
        db.execute(text(f"SELECT 1 FROM {name} LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text(ddl))
            db.commit()
            print(f"🚀 Database Migrazione v5: Creata tabella '{name}'")
        except Exception as e:
            print(f"❌ Errore migrazione {name}: {e}")
            db.rollback()


def _run_v5_migrations(db) -> None:
    """Replica database/schema_v5.sql: recupero password, foto, pagina pubblica,
    documenti medici + AI, recensioni, notifiche, Stripe."""
    _add_column_if_missing(db, "users", "photo_key", "VARCHAR(255) NULL")
    _add_column_if_missing(
        db, "user_allergens", "source",
        "ENUM('manual','document_ai') NOT NULL DEFAULT 'manual'",
    )
    _add_column_if_missing(
        db, "user_allergens", "intensity",
        "ENUM('lieve','moderata','grave') NOT NULL DEFAULT 'moderata'",
    )
    _add_column_if_missing(db, "user_allergens", "confirmed_at", "DATETIME NULL")
    _add_column_if_missing(db, "restaurants", "slug", "VARCHAR(160) NULL UNIQUE")
    _add_column_if_missing(db, "restaurants", "website", "VARCHAR(255) NULL")
    _add_column_if_missing(db, "restaurants", "description", "TEXT NULL")
    _add_column_if_missing(db, "restaurants", "stripe_customer_id", "VARCHAR(100) NULL")
    _add_column_if_missing(db, "restaurants", "stripe_subscription_id", "VARCHAR(100) NULL")
    _add_column_if_missing(db, "restaurants", "stripe_price_id", "VARCHAR(100) NULL")
    _add_column_if_missing(db, "reviews", "reported_count", "INT UNSIGNED NOT NULL DEFAULT 0")

    _create_table_if_missing(db, "password_reset_tokens", """
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id      INT UNSIGNED NOT NULL,
          token_hash   VARCHAR(255) NOT NULL,
          expires_at   DATETIME NOT NULL,
          used_at      DATETIME NULL,
          requested_ip VARCHAR(45),
          created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_prt_token_hash (token_hash),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "restaurant_photos", """
        CREATE TABLE IF NOT EXISTS restaurant_photos (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          restaurant_id INT UNSIGNED NOT NULL,
          storage_key   VARCHAR(255) NOT NULL,
          is_cover      TINYINT(1) NOT NULL DEFAULT 0,
          sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
          created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "medical_documents", """
        CREATE TABLE IF NOT EXISTS medical_documents (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id       INT UNSIGNED NOT NULL,
          storage_key   VARCHAR(255) NOT NULL,
          filename      VARCHAR(255) NOT NULL,
          mime_type     VARCHAR(100) NOT NULL,
          status        ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
          ai_consent_at DATETIME NULL,
          uploaded_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "allergen_extractions", """
        CREATE TABLE IF NOT EXISTS allergen_extractions (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          document_id   INT UNSIGNED NOT NULL,
          allergen_code VARCHAR(30) NOT NULL,
          confidence    DECIMAL(3,2),
          applied       TINYINT(1) NOT NULL DEFAULT 0,
          created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "document_access_log", """
        CREATE TABLE IF NOT EXISTS document_access_log (
          id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          document_id INT UNSIGNED NOT NULL,
          accessed_by INT UNSIGNED NOT NULL,
          accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "reviews", """
        CREATE TABLE IF NOT EXISTS reviews (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          restaurant_id INT UNSIGNED NOT NULL,
          user_id       INT UNSIGNED NOT NULL,
          rating        TINYINT UNSIGNED NOT NULL,
          comment       TEXT,
          is_hidden     TINYINT(1) NOT NULL DEFAULT 0,
          hidden_reason VARCHAR(255) NULL,
          reported_count INT UNSIGNED NOT NULL DEFAULT 0,
          created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_review_user_restaurant (restaurant_id, user_id),
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "review_replies", """
        CREATE TABLE IF NOT EXISTS review_replies (
          id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          review_id  INT UNSIGNED NOT NULL UNIQUE,
          reply      TEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "user_favorites", """
        CREATE TABLE IF NOT EXISTS user_favorites (
          user_id       INT UNSIGNED NOT NULL,
          restaurant_id INT UNSIGNED NOT NULL,
          created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, restaurant_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "device_tokens", """
        CREATE TABLE IF NOT EXISTS device_tokens (
          user_id    INT UNSIGNED NOT NULL,
          expo_token VARCHAR(255) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, expo_token),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "notifications", """
        CREATE TABLE IF NOT EXISTS notifications (
          id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id      INT UNSIGNED NOT NULL,
          type         VARCHAR(50) NOT NULL,
          payload_json JSON,
          read_at      DATETIME NULL,
          created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _create_table_if_missing(db, "invoices", """
        CREATE TABLE IF NOT EXISTS invoices (
          id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          restaurant_id     INT UNSIGNED NOT NULL,
          stripe_invoice_id VARCHAR(100) NOT NULL UNIQUE,
          amount_cents      INT NOT NULL,
          status            VARCHAR(30) NOT NULL,
          pdf_url           VARCHAR(500),
          created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # Backfill slug per i locali creati prima della v5
    try:
        from ..models import Restaurant
        from ..services.slugs import ensure_slug
        missing = db.query(Restaurant).filter(Restaurant.slug.is_(None)).all()
        for r in missing:
            ensure_slug(db, r)
        if missing:
            db.commit()
            print(f"🚀 Database Migrazione v5: Slug generati per {len(missing)} locali")
    except Exception as e:
        print(f"❌ Errore backfill slug: {e}")
        db.rollback()


def _run_v6_migrations(db) -> None:
    """Migrazione per recensioni esterne e recensioni app specifiche per allergie."""
    # Ristoranti: campi per Google e TripAdvisor
    _add_column_if_missing(db, "restaurants", "google_place_id", "VARCHAR(255) NULL")
    _add_column_if_missing(db, "restaurants", "google_rating", "FLOAT NULL")
    _add_column_if_missing(db, "restaurants", "google_reviews_count", "INT NULL")
    _add_column_if_missing(db, "restaurants", "tripadvisor_url", "VARCHAR(500) NULL")
    _add_column_if_missing(db, "restaurants", "tripadvisor_rating", "FLOAT NULL")
    _add_column_if_missing(db, "restaurants", "tripadvisor_reviews_count", "INT NULL")

    # Recensioni: campi per domande specifiche allergia
    _add_column_if_missing(db, "reviews", "rating_staff", "TINYINT UNSIGNED NULL")
    _add_column_if_missing(db, "reviews", "rating_menu", "TINYINT UNSIGNED NULL")
    _add_column_if_missing(db, "reviews", "rating_safety", "TINYINT UNSIGNED NULL")


def _run_v7_migrations(db) -> None:
    """Migrazione v7: Creazione tabella customer_annotations per warning e segnalazioni clienti."""
    _add_column_if_missing(db, "restaurants", "menu_url", "VARCHAR(500) NULL")
    _create_table_if_missing(db, "customer_annotations", """
        CREATE TABLE IF NOT EXISTS customer_annotations (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          restaurant_id INT UNSIGNED NOT NULL,
          user_id       INT UNSIGNED NOT NULL,
          allergen_id   TINYINT UNSIGNED NOT NULL,
          ingredient    VARCHAR(100) NULL,
          notes         TEXT NOT NULL,
          created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (allergen_id) REFERENCES allergens(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)


def _seed_allergens(db) -> None:
    """Aggiunge colonna category e popola/aggiorna l'elenco esteso degli allergeni."""
    from sqlalchemy import text
    from ..allergens_seed import ALLERGENS

    _add_column_if_missing(db, "allergens", "category", "VARCHAR(30) NOT NULL DEFAULT 'ue'")

    inserted = 0
    updated = 0
    for code, name_it, emoji, is_diet, sort_order, category in ALLERGENS:
        row = db.execute(
            text("SELECT id FROM allergens WHERE code = :code"),
            {"code": code},
        ).first()
        if row:
            db.execute(
                text("""
                    UPDATE allergens
                    SET name_it = :name_it, emoji = :emoji, is_diet = :is_diet,
                        sort_order = :sort_order, category = :category
                    WHERE code = :code
                """),
                {
                    "code": code,
                    "name_it": name_it,
                    "emoji": emoji,
                    "is_diet": is_diet,
                    "sort_order": sort_order,
                    "category": category,
                },
            )
            updated += 1
        else:
            db.execute(
                text("""
                    INSERT INTO allergens (code, name_it, emoji, is_diet, sort_order, category)
                    VALUES (:code, :name_it, :emoji, :is_diet, :sort_order, :category)
                """),
                {
                    "code": code,
                    "name_it": name_it,
                    "emoji": emoji,
                    "is_diet": is_diet,
                    "sort_order": sort_order,
                    "category": category,
                },
            )
            inserted += 1
    if inserted or updated:
        db.commit()
        print(f"🚀 Database: allergeni sincronizzati (+{inserted} nuovi, {updated} aggiornati)")


def _run_v8_migrations(db) -> None:
    """Migrazione v8: Multi-menù, traduzioni piatti e protocolli contaminazione crociata."""
    from sqlalchemy import text

    # 1. Tabella menus
    _create_table_if_missing(db, "menus", """
        CREATE TABLE IF NOT EXISTS menus (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          restaurant_id INT UNSIGNED NOT NULL,
          name          VARCHAR(100) NOT NULL,
          is_active     TINYINT(1) NOT NULL DEFAULT 1,
          sort_order    INT NOT NULL DEFAULT 0,
          created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # 2. Colonne in dishes
    _add_column_if_missing(db, "dishes", "menu_id", "INT UNSIGNED NULL")
    _add_column_if_missing(db, "dishes", "kitchen_protocol_confirmed", "TINYINT(1) NOT NULL DEFAULT 0")
    _add_column_if_missing(db, "dishes", "cross_contamination_checked_at", "DATETIME NULL")

    # Aggiunge foreign key constraint a dishes per menu_id
    try:
        db.execute(text("""
            ALTER TABLE dishes
            ADD CONSTRAINT fk_dishes_menu
            FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL;
        """))
        db.commit()
        print("🚀 Database Migrazione v8: Aggiunto vincolo fk_dishes_menu a 'dishes'")
    except Exception:
        db.rollback()

    # 3. Tabella dish_translations
    _create_table_if_missing(db, "dish_translations", """
        CREATE TABLE IF NOT EXISTS dish_translations (
          dish_id     INT UNSIGNED NOT NULL,
          lang        VARCHAR(10) NOT NULL,
          name        VARCHAR(150) NOT NULL,
          description TEXT NULL,
          PRIMARY KEY (dish_id, lang),
          FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # 4. Backfill menus e associazione piatti esistenti
    try:
        # Trova tutti i ristoranti
        restaurants = db.execute(text("SELECT id FROM restaurants")).all()
        for r in restaurants:
            r_id = r[0]
            # Verifica se il ristorante ha già almeno un menù
            has_menu = db.execute(
                text("SELECT id FROM menus WHERE restaurant_id = :r_id LIMIT 1"),
                {"r_id": r_id}
            ).first()
            
            if not has_menu:
                # Crea menù "Principale"
                db.execute(
                    text("INSERT INTO menus (restaurant_id, name, is_active, sort_order) VALUES (:r_id, 'Principale', 1, 0)"),
                    {"r_id": r_id}
                )
                db.commit()
                # Prendi l'ID del menù appena creato
                menu_id = db.execute(
                    text("SELECT id FROM menus WHERE restaurant_id = :r_id AND name = 'Principale' LIMIT 1"),
                    {"r_id": r_id}
                ).first()[0]
                
                # Associa tutti i piatti del ristorante a questo menù se menu_id è NULL
                db.execute(
                    text("UPDATE dishes SET menu_id = :menu_id WHERE restaurant_id = :r_id AND menu_id IS NULL"),
                    {"menu_id": menu_id, "r_id": r_id}
                )
                db.commit()
                print(f"🚀 Database Migrazione v8: Creato menù 'Principale' e associato piatti per locale {r_id}")
    except Exception as e:
        print(f"❌ Errore backfill menus: {e}")
        db.rollback()


def _run_v9_migrations(db) -> None:
    """Migrazione v9: Tabella restaurant_analytics per tracciamento visite e statistiche allergeni."""
    _create_table_if_missing(db, "restaurant_analytics", """
        CREATE TABLE IF NOT EXISTS restaurant_analytics (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          restaurant_id INT UNSIGNED NOT NULL,
          allergen_code VARCHAR(30) NULL,
          created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)


def _run_v10_migrations(db) -> None:
    """Migrazione v10: Gestione profili multipli per famiglie (user_profiles e profile_allergens)."""
    from sqlalchemy import text

    # 1. Tabella user_profiles
    _create_table_if_missing(db, "user_profiles", """
        CREATE TABLE IF NOT EXISTS user_profiles (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id       INT UNSIGNED NOT NULL,
          name          VARCHAR(100) NOT NULL,
          relationship  VARCHAR(50) NOT NULL DEFAULT 'altro',
          created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # 2. Tabella profile_allergens
    _create_table_if_missing(db, "profile_allergens", """
        CREATE TABLE IF NOT EXISTS profile_allergens (
          profile_id    INT UNSIGNED NOT NULL,
          allergen_id   TINYINT UNSIGNED NOT NULL,
          source        VARCHAR(30) NOT NULL DEFAULT 'manual',
          intensity     VARCHAR(30) NOT NULL DEFAULT 'moderata',
          PRIMARY KEY (profile_id, allergen_id),
          FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
          FOREIGN KEY (allergen_id) REFERENCES allergens(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # 3. Backfill per utenti esistenti
    try:
        users = db.execute(text("SELECT id, display_name, email FROM users WHERE role = 'customer'")).all()
        for u in users:
            u_id = u[0]
            display_name = u[1] or u[2].split("@")[0]
            has_profile = db.execute(
                text("SELECT id FROM user_profiles WHERE user_id = :u_id LIMIT 1"),
                {"u_id": u_id}
            ).first()

            if not has_profile:
                # Crea il profilo primario "Io"
                db.execute(
                    text("INSERT INTO user_profiles (user_id, name, relationship) VALUES (:u_id, :name, 'io')"),
                    {"u_id": u_id, "name": display_name}
                )
                db.commit()

                # Recupera l'ID del profilo inserito
                profile_id = db.execute(
                    text("SELECT id FROM user_profiles WHERE user_id = :u_id AND relationship = 'io' LIMIT 1"),
                    {"u_id": u_id}
                ).first()[0]

                # Copia record da user_allergens a profile_allergens
                user_allergens = db.execute(
                    text("SELECT allergen_id, source, intensity FROM user_allergens WHERE user_id = :u_id"),
                    {"u_id": u_id}
                ).all()

                for ua in user_allergens:
                    db.execute(
                        text("INSERT IGNORE INTO profile_allergens (profile_id, allergen_id, source, intensity) VALUES (:pid, :aid, :src, :int)"),
                        {"pid": profile_id, "aid": ua[0], "src": ua[1], "int": ua[2]}
                    )
                db.commit()
                print(f"🚀 Database Migrazione v10: Creato profilo 'Io' e migrati allergeni per utente {u_id}")
    except Exception as e:
        print(f"❌ Errore backfill profili: {e}")
        db.rollback()


def _run_v11_migrations(db) -> None:
    """Migrazione v11: condivisione profili allergie via token a tempo o permanenti."""
    _create_table_if_missing(db, "profile_shares", """
        CREATE TABLE IF NOT EXISTS profile_shares (
          id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          owner_user_id     INT UNSIGNED NOT NULL,
          source_profile_id INT UNSIGNED NULL,
          token             VARCHAR(80) NOT NULL UNIQUE,
          label             VARCHAR(120) NOT NULL,
          scope             VARCHAR(30) NOT NULL DEFAULT '24h',
          expires_at        DATETIME NULL,
          revoked_at        DATETIME NULL,
          created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_profile_shares_token (token),
          FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (source_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)


def _run_v12_migrations(db) -> None:
    """Migrazione v12: destinatario in-app per condivisione profilo allergie."""
    _add_column_if_missing(db, "profile_shares", "recipient_user_id", "INT UNSIGNED NULL")


def _run_v13_migrations(db) -> None:
    """Migrazione v13: codice invito clienti, piano cliente e referral commercianti."""
    from sqlalchemy import text

    _add_column_if_missing(db, "users", "invite_code", "VARCHAR(12) NULL UNIQUE")
    _add_column_if_missing(db, "users", "customer_plan", "VARCHAR(30) NOT NULL DEFAULT 'customer_free'")
    _add_column_if_missing(db, "users", "customer_subscription_status", "VARCHAR(30) NOT NULL DEFAULT 'free'")
    _add_column_if_missing(db, "users", "customer_plan_started_at", "DATETIME NULL")
    _add_column_if_missing(db, "restaurants", "referred_by_user_id", "INT UNSIGNED NULL")

    _create_table_if_missing(db, "merchant_referrals", """
        CREATE TABLE IF NOT EXISTS merchant_referrals (
          id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          referrer_user_id        INT UNSIGNED NOT NULL,
          referred_owner_user_id  INT UNSIGNED NOT NULL UNIQUE,
          restaurant_id           INT UNSIGNED NOT NULL,
          reward_granted_at       DATETIME NOT NULL,
          created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_merchant_referrals_referrer (referrer_user_id),
          FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (referred_owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Backfill codici invito per clienti esistenti
    try:
        from ..services.referrals import generate_invite_code

        rows = db.execute(
            text("SELECT id FROM users WHERE role = 'customer' AND (invite_code IS NULL OR invite_code = '')")
        ).all()
        for (user_id,) in rows:
            code = generate_invite_code(db)
            db.execute(
                text("UPDATE users SET invite_code = :code WHERE id = :uid"),
                {"code": code, "uid": user_id},
            )
        if rows:
            db.commit()
            print(f"🚀 Database Migrazione v13: generati {len(rows)} codici invito clienti")
    except Exception as e:
        print(f"❌ Errore backfill codici invito: {e}")
        db.rollback()


def _run_v14_migrations(db) -> None:
    """Migrazione v14: Stripe cliente, usage limits, indici performance."""
    from sqlalchemy import text

    _add_column_if_missing(db, "users", "customer_stripe_customer_id", "VARCHAR(100) NULL")
    _add_column_if_missing(db, "users", "customer_stripe_subscription_id", "VARCHAR(100) NULL")

    _create_table_if_missing(db, "customer_usage", """
        CREATE TABLE IF NOT EXISTS customer_usage (
          id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id     INT UNSIGNED NOT NULL,
          usage_type  VARCHAR(30) NOT NULL,
          created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_customer_usage_user_type_month (user_id, usage_type, created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    _create_table_if_missing(db, "visibility_boosts", """
        CREATE TABLE IF NOT EXISTS visibility_boosts (
          id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          restaurant_id           INT UNSIGNED NOT NULL,
          stripe_payment_intent_id VARCHAR(100) NULL UNIQUE,
          amount_cents            INT NOT NULL DEFAULT 990,
          duration_days           INT NOT NULL DEFAULT 30,
          activated_at            DATETIME NULL,
          expires_at              DATETIME NULL,
          created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    for ddl in (
        "CREATE INDEX idx_restaurant_analytics_rest_created ON restaurant_analytics (restaurant_id, created_at)",
        "CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at)",
        "CREATE INDEX idx_restaurants_active ON restaurants (is_active)",
    ):
        try:
            db.execute(text(ddl))
            db.commit()
        except Exception:
            db.rollback()


def _run_v15_migrations(db) -> None:
    """Migrazione v15: allinea colonna kinship su user_profiles (modello ORM)."""
    from sqlalchemy import text

    try:
        db.execute(text("SELECT kinship FROM user_profiles LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text("SELECT relationship FROM user_profiles LIMIT 1"))
            db.execute(
                text(
                    "ALTER TABLE user_profiles "
                    "CHANGE relationship kinship VARCHAR(50) NOT NULL DEFAULT 'altro'"
                )
            )
            db.commit()
            print("🚀 Database Migrazione v15: Rinominata colonna relationship → kinship")
        except Exception as e:
            print(f"❌ Errore migrazione v15 (kinship): {e}")
            db.rollback()


def _run_v16_migrations(db) -> None:
    """Migrazione v16: cache condivisa etichette prodotto (barcode → ingredienti AI)."""
    _create_table_if_missing(db, "product_label_cache", """
        CREATE TABLE IF NOT EXISTS product_label_cache (
          id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          barcode                 VARCHAR(20) NOT NULL,
          product_name            VARCHAR(255) NOT NULL DEFAULT '',
          brand                   VARCHAR(255) NOT NULL DEFAULT '',
          ingredients             TEXT NOT NULL,
          allergeni_contenuti_json TEXT NOT NULL DEFAULT '[]',
          allergeni_tracce_json   TEXT NOT NULL DEFAULT '[]',
          created_by_user_id      INT UNSIGNED NULL,
          created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_product_label_cache_barcode (barcode),
          FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

