"""Email transazionali via Resend (https://resend.com).

Se RESEND_API_KEY non è configurata, l'email viene stampata nel log del server:
lo sviluppo locale funziona comunque e nessun invio va perso silenziosamente.
L'invio avviene in un thread separato per non bloccare la richiesta HTTP.
"""
from __future__ import annotations

import json
import threading
import urllib.request

from ..config import settings

RESEND_ENDPOINT = "https://api.resend.com/emails"


def _send_via_resend(to: str, subject: str, html: str) -> None:
    payload = json.dumps({
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    }).encode()
    req = urllib.request.Request(
        RESEND_ENDPOINT,
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp.read()
        print(f"📧 Email inviata a {to}: {subject}")
    except Exception as e:
        print(f"❌ Invio email a {to} fallito: {e}")


def send_email(to: str, subject: str, html: str) -> None:
    if not settings.resend_api_key:
        print(f"📧 [DEV — RESEND_API_KEY assente] Email per {to}\nOggetto: {subject}\n{html}\n")
        return
    threading.Thread(
        target=_send_via_resend, args=(to, subject, html), daemon=True
    ).start()


def _layout(title: str, body_html: str) -> str:
    return f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#166534">🥗 AllerTgy</h2>
      <h3>{title}</h3>
      {body_html}
      <p style="color:#64748b;font-size:12px;margin-top:32px">
        Ricevi questa email perché esiste un account AllerTgy associato a questo indirizzo.
        Se non sei stato tu, puoi ignorarla.
      </p>
    </div>
    """


def send_password_reset(to: str, reset_url: str) -> None:
    send_email(
        to,
        "Reimposta la tua password AllerTgy",
        _layout(
            "Reimposta la password",
            f"""
            <p>Abbiamo ricevuto una richiesta di reimpostazione password.</p>
            <p><a href="{reset_url}" style="background:#166534;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Scegli una nuova password</a></p>
            <p>Il link scade tra <strong>30 minuti</strong> e può essere usato una sola volta.</p>
            """,
        ),
    )


def send_payment_confirmation(to: str, plan_name: str, amount_cents: int, pdf_url: str | None) -> None:
    amount = f"€{amount_cents / 100:.2f}".replace(".", ",")
    invoice_link = (
        f'<p><a href="{pdf_url}">Scarica la fattura (PDF)</a></p>' if pdf_url else ""
    )
    send_email(
        to,
        f"Pagamento confermato — piano {plan_name}",
        _layout(
            "Pagamento confermato",
            f"<p>Il pagamento di <strong>{amount}</strong> per il piano <strong>{plan_name}</strong> è andato a buon fine.</p>{invoice_link}",
        ),
    )


def send_payment_failed(to: str, plan_name: str) -> None:
    send_email(
        to,
        "Pagamento non riuscito — AllerTgy",
        _layout(
            "Pagamento non riuscito",
            f"""
            <p>L'addebito per il piano <strong>{plan_name}</strong> non è andato a buon fine.</p>
            <p>Aggiorna il metodo di pagamento dal Portale clienti nella dashboard, altrimenti
            dopo il periodo di grazia il locale tornerà al piano Gratis.</p>
            """,
        ),
    )
