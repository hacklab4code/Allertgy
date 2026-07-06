"""Notifiche push via Expo Push API + registro notifiche a DB.

L'invio è best-effort in un thread separato: un errore di rete non deve mai
far fallire la richiesta HTTP che l'ha generato.
"""
from __future__ import annotations

import json
import threading
import urllib.request

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import DeviceToken, Notification

EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send"


def _post_expo(messages: list[dict]) -> None:
    if not messages:
        return
    req = urllib.request.Request(
        EXPO_PUSH_ENDPOINT,
        data=json.dumps(messages).encode(),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp.read()
        print(f"📲 Push inviate: {len(messages)}")
    except Exception as e:
        print(f"❌ Invio push fallito: {e}")


def notify_users(
    db: Session,
    user_ids: list[int],
    notif_type: str,
    title: str,
    body: str,
    payload: dict | None = None,
) -> None:
    """Salva la notifica a DB per ogni utente e invia push ai dispositivi registrati."""
    if not user_ids:
        return
    payload_json = json.dumps(payload or {}, ensure_ascii=False)
    for uid in user_ids:
        db.add(Notification(user_id=uid, type=notif_type, payload_json=payload_json))

    tokens = db.scalars(
        select(DeviceToken.expo_token).where(DeviceToken.user_id.in_(user_ids))
    ).all()
    messages = [
        {"to": t, "title": title, "body": body, "data": payload or {}}
        for t in tokens
    ]
    if messages:
        threading.Thread(target=_post_expo, args=(messages,), daemon=True).start()
