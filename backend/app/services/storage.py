"""Storage privato per foto profilo, galleria locali e documenti medici.

Due modalità:
- **Cloudflare R2** (S3-compatible) se le variabili R2_* sono configurate:
  bucket privato + URL presigned a scadenza.
- **Fallback locale** altrimenti: file in `backend/private_storage/` (MAI sotto
  `/static`) serviti da `GET /files/{key}` solo con firma HMAC a scadenza.

In entrambi i casi nessun file privato è mai raggiungibile con un URL permanente.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import time
from urllib.parse import quote

from ..config import settings

LOCAL_STORAGE_DIR = os.path.abspath("private_storage")


def _r2_client():
    import boto3  # import pigro: richiesto solo se R2 è configurato

    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )


def _safe_local_path(key: str) -> str:
    path = os.path.abspath(os.path.join(LOCAL_STORAGE_DIR, key))
    if not path.startswith(LOCAL_STORAGE_DIR + os.sep):
        raise ValueError("Chiave storage non valida")
    return path


def put_bytes(key: str, data: bytes, content_type: str) -> None:
    if settings.r2_configured:
        _r2_client().put_object(
            Bucket=settings.r2_bucket, Key=key, Body=data, ContentType=content_type
        )
        return
    path = _safe_local_path(key)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)


def get_bytes(key: str) -> bytes:
    if settings.r2_configured:
        obj = _r2_client().get_object(Bucket=settings.r2_bucket, Key=key)
        return obj["Body"].read()
    with open(_safe_local_path(key), "rb") as f:
        return f.read()


def delete(key: str) -> None:
    """Cancellazione reale dell'oggetto (richiesta GDPR: mai solo soft-delete)."""
    if settings.r2_configured:
        _r2_client().delete_object(Bucket=settings.r2_bucket, Key=key)
        return
    try:
        os.remove(_safe_local_path(key))
    except FileNotFoundError:
        pass


def local_signature(key: str, expires_ts: int) -> str:
    msg = f"{key}:{expires_ts}".encode()
    return hmac.new(settings.jwt_secret.encode(), msg, hashlib.sha256).hexdigest()


def verify_local_signature(key: str, expires_ts: int, signature: str) -> bool:
    if expires_ts < int(time.time()):
        return False
    return hmac.compare_digest(local_signature(key, expires_ts), signature)


def signed_url(key: str, expires_seconds: int = 3600) -> str:
    """URL di lettura a scadenza. Documenti medici: usare scadenze brevi (300s)."""
    if settings.r2_configured:
        return _r2_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.r2_bucket, "Key": key},
            ExpiresIn=expires_seconds,
        )
    exp = int(time.time()) + expires_seconds
    sig = local_signature(key, exp)
    return f"{settings.public_api_url}/files/{quote(key)}?exp={exp}&sig={sig}"
