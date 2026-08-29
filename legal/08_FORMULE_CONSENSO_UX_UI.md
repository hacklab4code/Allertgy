# Formule di Consenso e Micro-Copy UX/UI — AllerTgy
*Guida per sviluppatori frontend e designer per i componenti di consenso e checkbox*

---

### 1. 📱 Registrazione Utente / Cliente (App Mobile & Web)

#### Checkbox 1: Termini e Privacy (Obbligatoria per creare l'account)
```text
[X] Ho letto e accetto i Termini di Servizio e l'Informativa Privacy. (Obbligatorio)
```
*Link attivi:*
- `Termini di Servizio` ➔ apre `/termini` o modal `terms`
- `Informativa Privacy` ➔ apre `/privacy` o modal `privacy`

---

#### Checkbox 2: Consenso Dati Sanitari Art. 9 GDPR (Obbligatoria per abilitare il semaforo)
```text
[X] CONSENSO DATI SANITARI (Art. 9 GDPR): Acconsento esplicitamente al trattamento dei dati relativi alle mie allergie e intolleranze alimentari al solo fine di calcolare la compatibilità dei piatti con il Semaforo AllerTgy. (Obbligatorio)
```

---

#### Checkbox 3: Notifiche e Marketing (Facoltativa)
```text
[ ] Desidero ricevere notifiche push su nuovi ristoranti con piatti compatibili con le mie allergie nella mia zona. (Facoltativo)
```

---

### 2. 🤖 Modal Analisi AI Referto Medico / Documento Sanitario (App Mobile)

Da visualizzare prima dell'invio del file alle API di intelligenza artificiale per l'estrazione ottica:

```text
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Analisi Documento tramite Intelligenza Artificiale       │
│                                                             │
│ "Acconsento all'elaborazione temporanea di questa           │
│ immagine/documento tramite AI al solo scopo di individuare  │
│ gli allergeni da suggerire nel mio profilo.                 │
│                                                             │
│ Ho compreso che il risultato è un suggerimento automatico   │
│ e che dovrò verificare e confermare manualmente i dati      │
│ prima del salvataggio definitivo."                          │
│                                                             │
│  [ Accetta e Avvia Scansione ]         [ Annulla ]         │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. 👨‍🍳 Pubblicazione Menù Ristoratore (Dashboard Web)

Da visualizzare nel passaggio finale prima di pubblicare il menù e attivare il QR Code:

```text
┌─────────────────────────────────────────────────────────────┐
│ 🖨️ Conferma e Pubblicazione Menù                            │
│                                                             │
│ [X] Confermo sotto la mia responsabilità che le             │
│     informazioni sugli allergeni inserite per ciascun       │
│     piatto sono verificate con la cucina e conformi         │
│     al Regolamento UE 1169/2011.                            │
│                                                             │
│     [ 🚀 Pubblica Menù e Attiva QR ]                       │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. 🔴 Banner Avviso Sicurezza su Scheda Menù (App Mobile & Web)

Presente in calce o in testata alla vista menù per ogni locale:

```text
ℹ️ Disclaimer Sicurezza: Gli allergeni sono dichiarati dal ristoratore. 
Il semaforo verde non garantisce il rischio zero. Comunica sempre le tue 
allergie al personale di sala prima di ordinare. In caso di emergenza chiama il 112.
```
