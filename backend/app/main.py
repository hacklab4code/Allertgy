import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from .config import settings
from .database import SessionLocal, run_migrations
from .routers import (
    admin,
    allergens,
    auth,
    billing,
    files,
    internal_admin,
    legal,
    profile,
    restaurants,
    reviews,
)

# Esegue le migrazioni automatiche per il DB
run_migrations()

app = FastAPI(
    title="AllerTgy API",
    version="0.5.0",
    description="Backend — app allergie per ristoranti",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# /static è SOLO per immagini pubbliche già pubblicate (foto menù/piatti).
# Foto profilo e documenti medici vivono nello storage privato (R2 o
# private_storage/) e sono serviti unicamente con URL firmati a scadenza.
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(allergens.router)
app.include_router(profile.router)
app.include_router(restaurants.router)
app.include_router(reviews.router)
app.include_router(admin.router)
app.include_router(internal_admin.router)
app.include_router(billing.router)
app.include_router(legal.router)
app.include_router(files.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/sitemap.xml", include_in_schema=False)
def sitemap():
    """Sitemap delle pagine pubbliche ristorante per i motori di ricerca."""
    from .models import Restaurant

    db = SessionLocal()
    try:
        rows = db.execute(
            select(Restaurant.slug, Restaurant.public_code).where(
                Restaurant.is_active == 1
            )
        ).all()
    finally:
        db.close()
    base = settings.public_web_url.rstrip("/")
    urls = "".join(
        f"<url><loc>{base}/r/{slug or code}</loc></url>" for slug, code in rows
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"<url><loc>{base}/</loc></url>{urls}</urlset>"
    )
    return Response(content=xml, media_type="application/xml")
