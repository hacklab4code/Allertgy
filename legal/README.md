# 📁 Documenti Legali e Privacy — AllerTgy

Questa cartella raccoglie tutti i testi legali, le informative sulla privacy (GDPR), i termini contrattuali, i disclaimer medici e le note sul copyright per la piattaforma **AllerTgy** (App Mobile iOS/Android, Dashboard Web Esercenti, API Backend e Sito Vetrina).

---

## 📑 Indice dei Documenti

| File | Documento | Destinatari / Utilizzo |
|---|---|---|
| [01_COPYRIGHT.md](file:///Users/m1bookpro/Desktop/allerTgy/legal/01_COPYRIGHT.md) | **Copyright & Proprietà Intellettuale** | Footer, App Store, crediti software e marchi |
| [02_PRIVACY_POLICY_GDPR.md](file:///Users/m1bookpro/Desktop/allerTgy/legal/02_PRIVACY_POLICY_GDPR.md) | **Informativa Privacy GDPR (Artt. 13-14)** | Trattamento dati sanitari (Art. 9), AI Vision, Sub-responsabili |
| [03_DISCLAIMER_MEDICO_SICUREZZA.md](file:///Users/m1bookpro/Desktop/allerTgy/legal/03_DISCLAIMER_MEDICO_SICUREZZA.md) | **Disclaimer Medico & Tutela della Salute** | Consultazione semaforo, emergenze 112, obbligo dialogo sala |
| [04_TERMINI_DI_SERVIZIO.md](file:///Users/m1bookpro/Desktop/allerTgy/legal/04_TERMINI_DI_SERVIZIO.md) | **Termini e Condizioni di Servizio (ToS)** | Condizioni generali per clienti e ristoratori |
| [05_CONDIZIONI_B2B_RISTORATORI.md](file:///Users/m1bookpro/Desktop/allerTgy/legal/05_CONDIZIONI_B2B_RISTORATORI.md) | **Condizioni Contrattuali B2B & Stripe** | Abbonamenti esercenti, fatturazione elettronica, recesso |
| [06_DICHIARAZIONE_RESPONSABILITA_RISTORATORE.md](file:///Users/m1bookpro/Desktop/allerTgy/legal/06_DICHIARAZIONE_RESPONSABILITA_RISTORATORE.md) | **Dichiarazione di Conformità HACCP/UE** | Cartello legale e conferma pubblicazione menù (Reg. 1169/2011) |
| [07_COOKIE_POLICY.md](file:///Users/m1bookpro/Desktop/allerTgy/legal/07_COOKIE_POLICY.md) | **Cookie Policy & Tracciamento** | Cookie tecnici, pagamenti Stripe, no profilazione commerciale |
| [08_FORMULE_CONSENSO_UX_UI.md](file:///Users/m1bookpro/Desktop/allerTgy/legal/08_FORMULE_CONSENSO_UX_UI.md) | **Formule di Consenso e Checkbox UI/UX** | Micro-copy per onboarding mobile, modal AI e form web |

---

## ⚙️ Integrazione nel Software
- **Backend API:** i testi sono caricati in [backend/app/legal.py](file:///Users/m1bookpro/Desktop/allerTgy/backend/app/legal.py) e serviti dall'endpoint pubblico `GET /legal/{doc}`.
- **Dashboard Web:** consultabili dinamicamente su `/termini`, `/privacy`, `/cookie`, `/sicurezza`.
- **App Mobile:** visualizzati all'onboarding e nella schermata delle impostazioni legali (`legal-docs.tsx`).
