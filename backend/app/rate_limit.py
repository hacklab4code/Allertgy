import time
from fastapi import Request, HTTPException, status
from collections import defaultdict

# Dizionario in memoria: (endpoint, IP) -> lista di timestamp delle richieste.
# La chiave include l'endpoint: ogni rotta ha il suo contatore indipendente.
_request_history = defaultdict(list)

def rate_limiter(requests_limit: int = 5, window_seconds: int = 60):
    """FastAPI Dependency per limitare il numero di richieste per endpoint+IP."""
    def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        key = (request.url.path, client_ip)
        now = time.time()

        # Pulisci i record più vecchi della finestra temporale corrente
        _request_history[key] = [
            t for t in _request_history[key] if now - t < window_seconds
        ]

        # Verifica se è stato superato il limite
        if len(_request_history[key]) >= requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Troppe richieste. Per favore riprova più tardi."
            )

        # Aggiunge il timestamp della richiesta corrente
        _request_history[key].append(now)

    return dependency
