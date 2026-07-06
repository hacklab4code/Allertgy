import time
from fastapi import Request, HTTPException, status
from collections import defaultdict

# Dizionario in memoria: IP -> lista di timestamp delle richieste
_request_history = defaultdict(list)

def rate_limiter(requests_limit: int = 5, window_seconds: int = 60):
    """FastAPI Dependency per limitare il numero di richieste per indirizzo IP."""
    def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Pulisci i record più vecchi della finestra temporale corrente
        _request_history[client_ip] = [
            t for t in _request_history[client_ip] if now - t < window_seconds
        ]
        
        # Verifica se è stato superato il limite
        if len(_request_history[client_ip]) >= requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Troppe richieste. Per favore riprova più tardi."
            )
            
        # Aggiunge il timestamp della richiesta corrente
        _request_history[client_ip].append(now)
        
    return dependency
