"""Serve i file dello storage privato locale SOLO con firma HMAC a scadenza.

Usato unicamente quando Cloudflare R2 non è configurato (fallback locale).
A differenza di /static, qui nessun file è raggiungibile senza una firma
valida generata dal backend (vedi services/storage.py).
"""
from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..services import storage

router = APIRouter(prefix="/files", tags=["files"])

_MEDIA_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
}


@router.get("/{key:path}")
def get_private_file(key: str, exp: int, sig: str):
    if not storage.verify_local_signature(key, exp, sig):
        raise HTTPException(403, "Link scaduto o non valido")
    try:
        path = storage._safe_local_path(key)
    except ValueError:
        raise HTTPException(400, "Chiave non valida")
    if not os.path.isfile(path):
        raise HTTPException(404, "File non trovato")
    ext = os.path.splitext(path)[1].lower()
    return FileResponse(path, media_type=_MEDIA_TYPES.get(ext, "application/octet-stream"))
