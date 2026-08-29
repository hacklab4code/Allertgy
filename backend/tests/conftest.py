"""
Configurazione pytest per AllerTgy.
Usa SQLite in-memory per non toccare il database di produzione.
Tutte le tabelle vengono create all'avvio e droppate alla fine.
"""
import os
import sys
from pathlib import Path
from unittest.mock import patch

# Assicura che il backend sia nel PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "3306")
os.environ.setdefault("DB_NAME", ":memory:")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("JWT_SECRET", "test-secret-che-non-deve-mai-essere-usato-in-produzione")
os.environ.setdefault("CORS_ORIGINS", "*")
os.environ.setdefault("INTERNAL_ADMIN_KEY", "test-admin-key")
os.environ.setdefault("APP_ENV", "development")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

# Override del settings PRIMA di importare qualsiasi cosa dal backend
from app.config import settings as _settings

_settings.db_host = "localhost"
_settings.db_port = 3306
_settings.db_name = ":memory:"
_settings.db_user = "test"
_settings.db_password = "test"
_settings.jwt_secret = "test-secret-che-non-deve-mai-essere-usato-in-produzione"
_settings.cors_origins = "*"
_settings.internal_admin_key = "test-admin-key"
_settings.stripe_secret_key = ""
_settings.stripe_webhook_secret = ""
_settings.resend_api_key = ""
_settings.app_env = "development"

# Disabilita run_migrations PRIMA di importare app.main (che la chiama all'avvio)
import app.database as db_module
original_run_migrations = db_module.run_migrations
db_module.run_migrations = lambda: None

# Ora possiamo importare app.main senza che run_migrations parta con MySQL
from app.database import Base, get_db
from app.main import app
from app.rate_limit import reset_rate_limit

# Crea engine SQLite e sostituisce quello globale in app.database
sqlite_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
)


@event.listens_for(sqlite_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Crea tutte le tabelle dal modello ORM nel DB SQLite
Base.metadata.create_all(bind=sqlite_engine)

# Sostituisce l'engine e SessionLocal nel modulo database con SQLite
db_module.engine = sqlite_engine
db_module.SessionLocal = sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False)


@pytest.fixture
def db_session():
    """Crea una sessione DB isolata per ogni test con rollback."""
    connection = sqlite_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(autouse=True)
def _reset_rate_limit():
    """Evita 429 tra test consecutivi sullo stesso endpoint."""
    reset_rate_limit()
    yield
    reset_rate_limit()


@pytest.fixture
def client(db_session):
    """Test client FastAPI con override della dipendenza get_db."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()