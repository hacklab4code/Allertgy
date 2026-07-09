"""Database migrations package."""
from .legacy import run_migrations

__all__ = ["run_migrations"]
