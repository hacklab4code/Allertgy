"""Buffer in-memory per analytics menù — flush batch per ridurre commit DB."""
from __future__ import annotations

import threading
from collections import deque
from typing import Optional

from ..database import SessionLocal
from ..models import RestaurantAnalytics

_BUFFER: deque[tuple[int, Optional[str]]] = deque(maxlen=50000)
_LOCK = threading.Lock()
_FLUSH_INTERVAL_SEC = 30
_started = False


def enqueue_scan(restaurant_id: int, allergen_code: Optional[str] = None) -> None:
    with _LOCK:
        _BUFFER.append((restaurant_id, allergen_code))


def flush_buffer() -> int:
    with _LOCK:
        items = list(_BUFFER)
        _BUFFER.clear()
    if not items:
        return 0
    db = SessionLocal()
    try:
        for restaurant_id, allergen_code in items:
            db.add(RestaurantAnalytics(restaurant_id=restaurant_id, allergen_code=allergen_code))
        db.commit()
        return len(items)
    except Exception as e:
        db.rollback()
        print(f"❌ Analytics flush error: {e}")
        return 0
    finally:
        db.close()


def _flush_loop() -> None:
    while True:
        try:
            n = flush_buffer()
            if n:
                print(f"📊 Analytics flush: {n} eventi salvati")
        except Exception as e:
            print(f"❌ Analytics flush loop error: {e}")
        threading.Event().wait(_FLUSH_INTERVAL_SEC)


def start_analytics_flusher() -> None:
    global _started
    if _started:
        return
    _started = True
    threading.Thread(target=_flush_loop, daemon=True, name="analytics-flusher").start()
