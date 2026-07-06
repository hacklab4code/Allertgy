"""Endpoint pubblici per i testi legali: app e web leggono sempre la stessa fonte."""
from fastapi import APIRouter, HTTPException

from ..legal import LEGAL_DOCUMENTS
from ..schemas import LegalDocOut

router = APIRouter(prefix="/legal", tags=["legal"])


@router.get("", response_model=list[LegalDocOut])
def list_legal_documents():
    return [
        LegalDocOut(doc=doc, title=title, version=version, content_markdown=content)
        for doc, (title, version, content) in LEGAL_DOCUMENTS.items()
    ]


@router.get("/{doc}", response_model=LegalDocOut)
def get_legal_document(doc: str):
    entry = LEGAL_DOCUMENTS.get(doc)
    if not entry:
        raise HTTPException(404, f"Documento legale sconosciuto. Disponibili: {', '.join(LEGAL_DOCUMENTS)}")
    title, version, content = entry
    return LegalDocOut(doc=doc, title=title, version=version, content_markdown=content)
