import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import run_migrations
from .routers import admin, allergens, auth, internal_admin, profile, restaurants

# Esegue le migrazioni automatiche per il DB
run_migrations()

app = FastAPI(
    title="AllerTgy API",
    version="0.1.0",
    description="Backend MVP — app allergie per ristoranti",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Assicura la presenza della cartella degli upload statici e monta l'endpoint statico
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(allergens.router)
app.include_router(profile.router)
app.include_router(restaurants.router)
app.include_router(admin.router)
app.include_router(internal_admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
