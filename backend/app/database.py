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
    finally:
        db.close()
