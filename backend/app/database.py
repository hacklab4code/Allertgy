from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

# URL.create gestisce i caratteri speciali della password (/, $)
url = URL.create(
    "mysql+pymysql",
    username=settings.db_user,
    password=settings.db_password,
    host=settings.db_host,
    port=settings.db_port,
    database=settings.db_name,
    query={"charset": "utf8mb4"},
)

engine = create_engine(url, pool_pre_ping=True, pool_recycle=280)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
        from .models import Restaurant
        from .services.slugs import ensure_slug
        missing = db.query(Restaurant).filter(Restaurant.slug.is_(None)).all()
        for r in missing:
            ensure_slug(db, r)
        if missing:
            db.commit()
            print(f"🚀 Database Migrazione v5: Slug generati per {len(missing)} locali")
    except Exception as e:
        print(f"❌ Errore backfill slug: {e}")
        db.rollback()
