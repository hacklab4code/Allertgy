# 📱 AllerTgy — Specifiche Complete UI/UX & Mappa Funzionale per Designer
### Guida Completa alle Sezioni, Flussi e Componenti per App Mobile (Cliente & Ristoratore)

> **Documento:** Master Functional & Design Specification  
> **Destinatario:** UI/UX Designer, Product Designer & Mobile App Team  
> **Applicazione:** AllerTgy Mobile (iOS & Android)  
> **Architettura Ruoli:**  
> 1. 👤 **Sezione Utente / Cliente** (Consumer Experience)  
> 2. 🏪 **Sezione Ristoratore / Owner** (B2B Management Experience)  
> **Ultimo Aggiornamento:** Agosto 2026  

---

## 📑 INDICE GENERALE

1. [🎯 Visione, Brand Architecture & Principi Guida](#1--visione-brand-architecture--principi-guida)
2. [🎨 Design System & Fondamenta Visive](#2--design-system--fondamenta-visive)
3. [🚦 La Regola d'Oro: Il Semaforo AllerTgy (Quad-Indicator)](#3--la-regola-doro-il-semaforo-allertgy-quad-indicator)
4. [👤 PARTE 1: SEZIONE UTENTE / CLIENTE (Tutte le Schermate & Funzioni)](#4--parte-1-sezione-utente--cliente)
   - 4.1 Onboarding, Registrazione & Consensi Sanitari GDPR
   - 4.2 Tab 1: Home Screen (Control Center & Scudo Sicurezza)
   - 4.3 Tab 2: Locali (Discovery, Ricerca & Mappa Interattiva)
   - 4.4 Tab 3: ScanSphere (Hub di Scansione Multifunzione)
   - 4.5 Tab 4: Preferiti (Locali & Prodotti Spesa)
   - 4.6 Tab 5: Account, Gestione Allergie & Salute
   - 4.7 Flusso Core Menù Digitale Ristorante & Dettaglio Piatto
   - 4.8 Moduli Specialistici (Passaporto Multilingua, SOS Emergenza, AI Referti, Diario Reazioni, Lockscreen ICE, ecc.)
5. [🏪 PARTE 2: SEZIONE RISTORATORE / OWNER (Tutte le Schermate & Funzioni)](#5--parte-2-sezione-ristoratore--owner)
   - 5.1 Onboarding, Registrazione Attività & Vincoli Legali
   - 5.2 Dashboard Ristoratore Mobile (Overview & Quick Actions)
   - 5.3 Gestione Menù Digitale & Matrice Allergeni
   - 5.4 AI Menu Scanner & Traduzione Automatica Multilingua
   - 5.5 Gestione Scheda Locale, Orari & Galleria Foto
   - 5.6 Generazione QR Code & Kit Tavoli
   - 5.7 Notifiche Push ai Clienti Follower (Pro Marketing)
   - 5.8 Gestione Recensioni di Sicurezza & Risposte
   - 5.9 Statistiche, Ricerche Allergeni & Analytics
   - 5.10 Registro Allergeni Ufficiale in PDF (Normativa HACCP/UE)
   - 5.11 Piani, Abbonamenti & Customer Portal Stripe
6. [🧩 Componenti UI Chiave da Progettare in Figma](#6--componenti-ui-chiave-da-progettare-in-figma)
7. [📐 Linee Guida per Responsive, Accessibilità & Dark Mode](#7--linee-guida-per-responsive-accessibilit--dark-mode)

---

## 1. 🎯 Visione, Brand Architecture & Principi Guida

### La Missione di AllerTgy
AllerTgy è l'ecosistema digitale di riferimento per consentire a chiunque soffra di **allergie, intolleranze alimentari, celiachia o restrizioni dietetiche** di mangiare fuori casa e fare la spesa in **totale serenità, sicurezza e trasparenza**.

### La Psicologia dell'Utente al Ristorante
L'utente con allergie gravi vive il momento dell'ordinazione con **ansia, paura di contaminazioni invisibili e imbarazzo sociale** nel dover interrogare ripetutamente il personale di sala.
* **Non vuole:** interfacce caotiche, testi microscopici, pubblicità invadenti, animazioni lente o verdetti ambigui.
* **Vuole:** **chiarezza assoluta in meno di 3 secondi**, contrasto netto leggibile anche nella penombra del ristorante, gerarchia visiva infallibile e la sicurezza psicologica di uno strumento di precisione.

### Il Principio Guida: *Calm Clinical Clarity*
* **Equilibrio visivo:** La fusione tra uno **strumento medico di precisione** e l'eleganza calorosa dell'ospitalità culinaria italiana.
* **Tono di voce e copy rigoroso:**
  * ✅ *Da usare:* "Idoneo per il tuo profilo", "Possibili tracce dichiarate", "Contiene allergeni del profilo".
  * ❌ *Vietato tassativamente:* "Sicuro al 100%", "Zero rischi", "Mangia senza pensieri" (promesse legalmente e clinicamente inaccettabili).

---

## 2. 🎨 Design System & Fondamenta Visive

AllerTgy adotta una distinzione cromatica e di identità visiva netta tra l'ambiente **Consumer (Cliente)** e l'ambiente **B2B (Ristoratore)**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ARCHITETTURA BRAND ALLERTGY                      │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ AMBIENTE                 │ MOOD & IDENTITÀ CROMATICA                        │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 👤 App Mobile Cliente    │ 🟣 VIOLET PRECISION (Cosmic, Ice Lavender, Glass)│
│ 🏪 App Mobile Ristoratore│ 🟢 FOREST & EMERALD (Slate, Emerald B2B, Pro)    │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

### 2.1 Palette Colori

#### 👤 Palette Consumer (Cliente) — *Cosmic Royal Blue & Vanilla (Glassmorphism)*
* **Canvas Background (Light):** `#F8FAFC` (Slate Ice rinfrescante) / `#E0EEFE` (Cosmic Sky soft glow)
* **Canvas Background (Dark):** `#0F172A` (Cosmic Dark canvas)
* **Superficie Primaria:** `#FFFFFF` (Card ceramiche pulite con ombra morbida)
* **Cosmic Glass Card:** `background-color: rgba(23, 37, 84, 0.82); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.15);`
* **Vanilla Glass Card:** `background-color: rgba(241, 254, 200, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(0, 0, 0, 0.05);`
* **Brand Primario Flat (Standard UI & Bottoni):** `#23212C` / Hover `#191820` (Cosmic: RGB 35, 33, 44 | CMYK 20, 25, 0, 83)
* **Brand Premium Gradient (*Chef Pass* & VIP):** `linear-gradient(135deg, #121118 0%, #23212C 50%, #353344 100%)`
* **Brand Secondario Accento (Soft/Light):** `#F1FEC8` (Vanilla Glow: RGB 241, 254, 200 | CMYK 5, 0, 21, 0)
* **Bordo Brand:** `#E2F4A6` / Bordo Strong `#23212C`
* **Testo Principale (Ink):** `#23212C` (Cosmic Ink, Contrasto > 10:1)
* **Testo Secondario:** `#475569` (Slate Neutral)
* **Testo Subdued:** `#94A3B8` (Didascalie e placeholder)
* **Bordi e Divisori Neutri:** `#E2E8F0` / `#EDE8F5`

#### 🏪 Palette B2B (Ristoratore) — *Forest & Emerald*
* **Canvas Background:** `#F8FAFC` (Slate Ice) / `#0A1118` (Dark B2B)
* **Brand Primario Ristoratore:** `#059669` / `#10B981` (Emerald Trust)
* **Brand Secondario:** `#0F172A` (Slate Dark)
* **Card & Container:** `#FFFFFF` con accenti e badge smeraldo.

### 2.2 Tipografia Ufficiale
* **Titoli & Display (Hero, H1, H2, Numeri grandi):** **`Sora`** (Pesi: 700 Bold, 800 ExtraBold). Look geometrico, moderno, altamente riconoscibile.
* **Corpo del Testo, Form, Metadati:** **`Nunito`** o **`SF Pro Text`** (Pesi: 500 Medium, 600 SemiBold, 700 Bold). Morbido, umano, ultra-leggibile su schermi OLED.

### 2.3 Raggi di Curvatura (Border Radius)
* `Radius SM (10px)`: Chip allergeni, badge, capsule contatori.
* `Radius MD (16px)`: Card piatti (`DishCard`), card ristoranti, campi input.
* `Radius LG (24px)`: Bottom Sheet, Modali, Widget principali.
* `Radius Full (999px)`: Pillole filtri, Traffic Badges, Avatar, Pulsante SOS.

---

## 3. 🚦 La Regola d'Oro: Il Semaforo AllerTgy (Quad-Indicator)

Il Semaforo è il cuore funzionale e visivo del prodotto. La sua comprensione immediata è un fattore critico di sicurezza per la salute dell'utente.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                IL SEMAFORO ALLERTGY                                    │
├──────────────┬──────────────────┬──────────────┬───────────────────────────────────────┤
│ STATO        │ COLORE TOKEN     │ VERDETTO UI  │ SIGNIFICATO CLINICO / OPERATIVO       │
├──────────────┼──────────────────┼──────────────┼───────────────────────────────────────┤
│ 🟢 SAFE      │ Solid `#10B981`  │ IDONEO       │ Nessun allergene né tracce dichiarate │
│              │ Soft `#ECFDF5`   │              │ compatibili con il profilo attivo     │
├──────────────┼──────────────────┼──────────────┼───────────────────────────────────────┤
│ 🟡 ATTENZIONE│ Solid `#F59E0B`  │ ATTENZIONE   │ Possibili tracce o contaminazione     │
│              │ Soft `#FFFBEB`   │              │ crociata dichiarata dal locale        │
├──────────────┼──────────────────┼──────────────┼───────────────────────────────────────┤
│ 🔴 RISCHIO   │ Solid `#EF4444`  │ NON IDONEO   │ Contiene allergeni o ingredienti      │
│              │ Soft `#FEF2F2`   │              │ esplicitamente esclusi dal profilo    │
└──────────────┴──────────────────┴──────────────┴───────────────────────────────────────┘
```

### Regole Invalicabili per il Designer:
1. **Regola del Quad-Indicator (Accessibilità & Daltonismo):**  
   Non basarsi **MAI solo sul colore**. Ogni elemento di valutazione deve mostrare simultaneamente:
   - **Colore:** Verde, Giallo o Rosso.
   - **Icona di stato:** Checkmark rotondo (`🟢`), Triangolo di attenzione (`🟡`), Ottagono con croce (`🔴`).
   - **Label testuale:** "Idoneo", "Attenzione", "Non idoneo".
   - **Why Chip (Motivazione esplicita):** Badge contestuale che specifica l'allergene (es. `[🔴 Contiene: Glutine, Latte]` o `[🟡 Tracce: Frutta a guscio]`).
2. **Nessun Wash totale:** Non colorare l'intero sfondo della card del piatto di rosso o verde. La card rimane ceramica bianca per non affaticare la vista, mentre il verdetto è chiaramente evidenziato dal badge e dal traffic border.
3. **Riserva del Verde:** Nell'app cliente, **il verde non è il colore del brand**. Il verde è riservato unicamente al verdetto positivo "Idoneo".

---

## 4. 👤 PARTE 1: SEZIONE UTENTE / CLIENTE

Di seguito tutte le schermate, sezioni e sottofunzioni dell'app mobile lato Cliente.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STRUTTURA NAVIGAZIONE UTENTE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [AUTENTICAZIONE & ONBOARDING]                                              │
│   ├── 1. Welcome & Value Proposition                                        │
│   ├── 2. Login / Recupero Password                                          │
│   ├── 3. Registrazione & Consensi GDPR Sanitari (Art. 9)                    │
│   └── 4. Onboarding Guidato Configurazione Allergie & Preferenze            │
│                                                                             │
│  [FLOATING GLASS TAB BAR (5 TAB)]                                           │
│   ├── 🏠 TAB 1: HOME (Control Center, Scudo Sicurezza & Ristoranti Vicini)  │
│   ├── 📍 TAB 2: LOCALI (Discovery, Filtri Avanzati & Mappa Interattiva)     │
│   ├── 🔮 TAB 3: SCANSPHERE (Scanner QR, Codice 6 Cifre, Barcode, OCR Menù)  │
│   ├── ❤️ TAB 4: PREFERITI (Ristoranti Salvati & Prodotti Spesa)             │
│   └── 👤 TAB 5: ACCOUNT & SALUTE (Profilo, Sottoprofili, Allergy Card, SOS) │
│                                                                             │
│  [SCHERMATE DETTAGLIO & FLOW SPECIALI]                                      │
│   ├── 🍽️ VISTA MENÙ DIGITALE RISTORANTE (Compatibility Ring & Sticky Filter)│
│   ├── 🔍 DETTAGLIO PIATTO & DOMANDE CAMERIERE                               │
│   ├── 🪪 PASSAPORTO ALLERGIE MULTILINGUA (Allergy Card Schermo Intero)      │
│   ├── 🚨 HUB SOS EMERGENZA (Chiamata 112, Epipen, Contatto Fidato)          │
│   ├── 📄 DOSSIER MEDICO & REFERTI AI (Upload PDF/Foto + Gemini OCR)         │
│   ├── 📔 DIARIO REAZIONI ALLERGICHE                                         │
│   ├── 🧬 GUIDA ALLERGIE CROCIATE                                            │
│   ├── 🔒 GENERATORE LOCKSCREEN ICE                                          │
│   ├── 🔗 CONDIVISIONE PROFILO FAMIGLIA (Link/QR Sicuro)                     │
│   └── ⭐ SCRITTURA RECENSIONE DI SICUREZZA                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.1 Onboarding, Registrazione & Consensi Sanitari GDPR

1. **Welcome Screen:**
   - Visual di impatto con illustrazione del concetto "Mangia fuori senza ansia".
   - Presentazione del semaforo e dello scanner intelligente.
   - Pulsanti: "Inizia Subito (Crea Profilo)" e "Ho già un account (Accedi)".
   - Accesso rapido "Esplora come ospite" (permette scansioni QR senza obbligo di login immediato).
2. **Registrazione:**
   - Campi: Nome, Cognome, Email, Password (con indicatore di forza password in tempo reale).
   - **Formule di Consenso Obbligatorie (GDPR Art. 9):**
     - Checkbox 1: Accettazione Termini di Servizio e Informativa Privacy.
     - Checkbox 2: **Consenso Esplicito al Trattamento dei Dati Sanitari e Allergologici**.
     - Checkbox 3: **Presa visione del Disclaimer di Sicurezza** (l'app è uno strumento di supporto informativo, non sostituisce il parere medico o la comunicazione verbale al ristoratore).
3. **Login & Recupero Password:**
   - Login con credenziali (Email/Password) o Social/Apple Sign-In.
   - Flusso "Password dimenticata" con invio email e schermata inserimento token di sicurezza + nuova password.
4. **Onboarding Setup Allergie (Step-by-step):**
   - **Step 1: I 14 Allergeni Principali UE:** Griglia interattiva con icone/illustrazioni (Glutine, Crostacei, Uova, Pesce, Arachidi, Soia, Latte/Lattosio, Frutta a guscio, Sedano, Senape, Sesamo, Anidride Solforosa/Solfiti, Lupini, Molluschi).
   - **Step 2: Intensità per singolo allergene:** Possibilità di impostare per ciascun allergene il livello (*Lieve*, *Moderata*, *Grave/Anafilassi*).
   - **Step 3: Ingredienti Esclusi Personalizzati:** Input con tag dinamici per ingredienti non convenzionali (es. aglio, cipolla, funghi, pomodoro, lievito, fragole).
   - **Step 4: Regimi Alimentari Speciali:** Toggle per Celiachia certificata AIC, Dieta Vegana, Vegetariana, Kosher, Halal, Senza Lattosio.

---

### 4.2 Tab 1: Home Screen (Control Center & Scudo Sicurezza)

La schermata principale accoglie l'utente con tutti gli strumenti vitali a portata di pollice.

* **Top Header Integrato (Safe Area):**
  - **Profile Switcher Pill:** Bottone a capsula che mostra l'avatar e il nome del profilo attivo (es. `👤 Io` oppure `👦 Figlio (Matteo)`). Con un tap apre il *ProfileContextSheet* per cambiare istantaneamente profilo senza uscire dalla schermata.
  - **Language Selector:** Mini bandierina della lingua selezionata (IT, EN, ES, DE, FR) per traduzioni istantanee.
  - **Campanella Notifiche:** Con badge numerico rosso per aggiornamenti menù dai preferiti e risposte dei ristoratori.
  - **SOS Button:** Pulsante rosso brillante con icona salvavita che apre istantaneamente la schermata di emergenza.
* **Universal Search Bar:**
  - Barra di ricerca unificata per: Nome ristorante, Città, oppure **Codice Tavolo a 6 cifre** (es. `492-811`).
* **Active Profile Shield Card (Scudo di Protezione):**
  - Card prominente con indicazione del profilo attivo, numero di allergeni monitorati e chip orizzontali a scorrimento (es. `🔴 Glutine (Grave)`, `🔴 Arachidi (Anafilassi)`, `🟡 Lattosio`).
  - Tasto rapido "Modifica" per aggiungere o togliere allergeni in 2 tap.
* **Quick Actions Hub (Griglia 4 Card Iconiche):**
  - 📷 **Scansiona QR Ristorante:** Attiva la fotocamera per aprire il menù.
  - 🛒 **Scansiona Spesa Barcode:** Apre lo scanner per codici EAN supermercato.
  - 🪪 **Passaporto Multilingua:** Mostra la card tradotta allo chef.
  - 📔 **Diario Reazioni:** Registra un sintomo o pasto sospetto.
* **Sezione "Ristoranti Vicini Compatibili":**
  - Carosello orizzontale di card ristorante con geolocalizzazione attiva.
  - Badge dinamico di compatibilità calcolato in tempo reale (es. `92% Compatibile 🟢`).
* **Widget di Sicurezza & Tips:**
  - Pillole informative sulle contaminazioni crociate stagionali o consigli utili per la ristorazione.

---

### 4.3 Tab 2: Locali (Discovery, Ricerca & Mappa)

* **Switch Vista:** Toggle segmentato superiore per passare tra vista **Elenco Schede** e vista **Mappa Interattiva**.
* **Barra Filtri Rapidi & Filter Sheet:**
  - Filtro *100% Compatibile* (mostra solo locali con oltre il 90% di piatti verdi).
  - Filtro *Verificato AllerTgy* (locali con protocollo HACCP controllato).
  - Categoria culinaria (Pizzeria, Tradizionale, Giapponese, Senza Glutine, Bistrot, Pasticceria).
  - Raggio di distanza (Slider 1 km - 50 km).
  - Ordinamento: *Più vicini*, *Più compatibili*, *Miglior punteggio sicurezza*.
* **Scheda Ristorante (RestaurantCard):**
  - Immagine di copertina ad alta risoluzione con gradiente inferiore.
  - Badge di compatibilità semaforico in evidenza (es. `85% compatibile`).
  - Nome locale, categoria e distanza in km / metri.
  - Badge "Verificato AllerTgy" con spunta di certificazione.
  - Valutazione media di sicurezza (stelle 1-5 basate sull'attenzione agli allergeni).
  - Tasto rapido "Salva nei Preferiti" (cuore).
* **Mappa Interattiva:**
  - Pin personalizzati con colore semaforico in base alla percentuale di compatibilità con il profilo dell'utente.
  - Bottom card a scomparsa con anteprima del locale selezionato sul pin.

---

### 4.4 Tab 3: ScanSphere (Hub di Scansione Multifunzione)

Il pulsante centrale della Tab Bar apre il modulo fotocamera avanzato con 4 modalità selezionabili tramite slider inferiore:

```
┌─────────────────────────────────────────────────────────────┐
│                 INTERFACCIA SCANSPHERE HERO                 │
├─────────────────────────────────────────────────────────────┤
│  [Torcia ON/OFF]                       [Chiudi / Annulla]   │
│                                                             │
│                    ┌──────────────────┐                     │
│                    │ ┌              ┐ │                     │
│                    │   [Laser Anim.]  │ │                     │
│                    │                  │ │                     │
│                    │ └              ┘ │                     │
│                    └──────────────────┘                     │
│               Inquadra il QR code del tavolo                │
│                                                             │
│      [ O Inserisci codice numerico a 6 cifre manualmente ]   │
│                                                             │
│  ─────────── SELECTOR MODALITÀ DI SCANSIONE ──────────────  │
│  [ QR Locale ]  [ Codice 6 Cifre ]  [ Barcode ]  [ Menù AI ]│
└─────────────────────────────────────────────────────────────┘
```

1. **Modalità 1: QR Code Ristorante:** Inquadra il QR del tavolo e reindirizza istantaneamente alla schermata Menù Digitale del locale con il semaforo calcolato.
2. **Modalità 2: Inserimento Codice a 6 Cifre:** Tastierino numerico debossed per digitare il codice quando la fotocamera non mette a fuoco o c'è poca luce.
3. **Modalità 3: Barcode Spesa Supermercato:**
   - Scansiona codici a barre (EAN-13, EAN-8, UPC) dei prodotti alimentari.
   - Interroga l'archivio Open Food Facts.
   - Mostra un bottom sheet con il verdetto semaforico sul prodotto, evidenziando in rosso gli ingredienti critici trovati nell'etichetta.
4. **Modalità 4: Scanner Menù Cartaceo OCR / AI:**
   - Permette di scattare una foto al menù cartaceo di qualsiasi ristorante non ancora registrato su AllerTgy.
   - L'AI (Gemini Vision) analizza il testo dei piatti e applica il semaforo sui piatti estratti.

---

### 4.5 Tab 4: Preferiti (Locali & Prodotti)

* **Tab Switcher Segmentato:** `[ Locali Salvati ]` | `[ Prodotti Spesa ]`
* **Locali Salvati:**
  - Elenco dei ristoranti preferiti con foto, distanza e note personali.
  - **Alert Menù Aggiornato:** Badge luminoso se il ristoratore ha modificato ingredienti o aggiunto piatti dall'ultima visita dell'utente.
* **Prodotti Spesa Preferiti:**
  - Lista degli articoli di consumo abituale (es. biscotti senza glutine, latte vegetale, pasta di riso) con il rispettivo semaforo salvato per acquisti veloci al supermercato.

---

### 4.6 Tab 5: Account, Gestione Allergie & Salute

Hub centrale per tutte le impostazioni personali, cliniche e di configurazione.

* **Sezione Profilo Personale:** Foto avatar, nome, email, data iscrizione.
* **Gestione Allergie & Intolleranze:** Schermata completa per modificare il catalogo allergeni, intensità e ingredienti esclusi.
* **Sottoprofili Famiglia (Multi-Profile):**
  - Creazione di profili multipli (es. *Figlio 1*, *Figlio 2*, *Partner*, *Genitore*).
  - Assegnazione avatar, nome, grado di parentela e set di allergie completamente indipendente.
* **Badge e Sezione Upgrade "AllerTgy Plus":** Vantaggi premium (sottoprofili illimitati, traduzioni offline, analisi referti senza limiti).
* **Sezione Documenti Medici & Referti AI:** Accesso al dossier clinico.
* **Impostazioni Lingua & Notifiche Push:** Preferenze notifiche (nuovi menù, promozioni, risposte recensioni).
* **Area Legale & Privacy GDPR:**
  - Visualizzazione e revoca consensi.
  - Esportazione di tutti i dati personali in formato JSON (Diritto alla portabilità GDPR).
  - Cancellazione definitiva account (Diritto all'oblio).

---

### 4.7 Flusso Core: Menù Digitale Ristorante & Dettaglio Piatto

Questa è l'esperienza più importante dell'intera applicazione. Quando l'utente siede al tavolo, consulta questo menù per decidere cosa mangiare.

```
┌─────────────────────────────────────────────────────────────┐
│                 VISTA MENÙ DIGITALE RISTORANTE              │
├─────────────────────────────────────────────────────────────┤
│ [< Indietro]   [Nome Ristorante]   [Condividi] [❤️ Preferiti]│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎯 COMPATIBILITÀ GLOBALE: 78% IDONEO                    │ │
│ │ 👤 Profilo: Matteo (Bambino)  •  3 Allergeni attivi     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ──── STICKY FILTER BAR SEMAFORO ─────────────────────────── │
│ [ Tutti (28) ] [ 🟢 Idonei (18) ] [ 🟡 Tracce (6) ] [ 🔴 (4) ]│
│                                                             │
│ ▼ PRIMI PIATTI (8)                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Risotto ai Funghi Porcini                       € 14,00 │ │
│ │ Riso Carnaroli, funghi porcini, brodo vegetale          │ │
│ │ [🟢 IDONEO PER IL TUO PROFILO]                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tagliatelle al Ragù Tradizionale                € 12,50 │ │
│ │ Pasta all'uovo, carne bovina, pomodoro, sedano          │ │
│ │ [🔴 NON IDONEO]  [🔴 Contiene: Glutine, Uova, Sedano]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Filetto di Spigola in Crosta di Patate          € 18,00 │ │
│ │ Spigola fresca, patate, aromi naturali                  │ │
│ │ [🟡 ATTENZIONE]  [🟡 Possibili tracce: Molluschi]       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Componenti di Dettaglio del Menù:
1. **Header Locale (VenueHero):**
   - Nome ristorante, indirizzo, telefono, badge "Verificato AllerTgy".
   - Data dell'ultimo controllo cucina / conferma protocollo allergeni da parte dello chef.
   - Nome del Referente Allergeni responsabile.
2. **Compatibility Ring (Score Globale):**
   - Cerchio percentuale animato che riassume l'idoneità del menù per il profilo attivo (es. `78% di piatti compatibili`).
3. **Sticky Filter Bar:**
   - Barra filtri ancorata in alto durante lo scroll con pillole contatore interattive:
     - `[ Tutti (28) ]`
     - `[ 🟢 Idonei (18) ]` (Filtra solo piatti privi di allergeni e tracce)
     - `[ 🟡 Attenzione (6) ]` (Filtra piatti con possibili tracce)
     - `[ 🔴 Non Idonei (4) ]` (Filtra piatti contenenti allergeni)
4. **DishCard (Card Piatto):**
   - Nome piatto (Bold, font Sora) + Prezzo chiaro.
   - Descrizione degli ingredienti.
   - Badge Semaforo Quad-Indicator.
   - Why Chips evidenziati (es. `🔴 Contiene: Latte`).
   - Badge accessori: `🌱 Vegano`, `🌾 Senza Glutine AIC`.
5. **Modale Dettaglio Piatto & Domande da fare al Cameriere:**
   - Con un tap sulla DishCard si apre la scheda di sicurezza completa:
     - Lista completa ingredienti e varianti possibili in cucina.
     - **Box "Chiedi al Cameriere":** Suggerimento di frasi precompilate di sicurezza da comunicare al personale (es. *"Potete verificare se la padella utilizzata per la spigola è separata da quella dei crostacei?"*).
     - Annotazioni e recensioni di altri clienti allergici sullo stesso piatto.

---

### 4.8 Moduli Specialistici dell'App Cliente

#### A. 🪪 Passaporto Allergie Multilingua (Allergy Card)
* Card digitale visivamente simile ad Apple Wallet / carta d'identità medica.
* Traduzione istantanea certificata in **5 lingue** (Italiano, Inglese, Spagnolo, Tedesco, Francese).
* Modalità **Schermo Intero ad Alta Luminosità**: Con un tap, lo schermo va alla massima luminosità per essere mostrato direttamente al cameriere o allo chef in cucina, recitando frasi chiare nella lingua del paese in cui si trova l'utente.

#### B. 🚨 Hub SOS Emergenza
* Accessibile da qualunque punto dell'app con il pulsante rosso nell'header.
* **Tasto Rapido Chiamata 112 (Numero Unico Europeo di Emergenza).**
* **Contatto di Emergenza Fidato:** Chiamata immediata a un familiare registrato (es. "Chiama Mamma", "Chiama Partner").
* **Checklist Farmaci Salvavita & Anafilassi:** Istruzioni visive step-by-step su come utilizzare l'autoiniettore di adrenalina (EpiPen/FastJekt) o assumere l'antistaminico.
* Riepilogo clinico rapido per i soccorritori.

#### C. 📄 Dossier Medico & Referti AI (Gemini Medical OCR)
* Caricamento di referti allergologici tramite PDF, foto o fotocamera.
* Elaborazione tramite intelligenza artificiale (Gemini AI): estrae automaticamente gli allergeni rilevati con percentuale di confidenza.
* **Human-in-the-loop obbligatorio:** L'utente visualizza la tabella degli allergeni estratti e deve confermare manualmente con un toggle prima che vengano scritti nel profilo.
* Registro accessi e cancellazione sicura secondo GDPR Art. 9.

#### D. 📔 Diario Reazioni Allergiche
* Registrazione rapida di eventi avversi o sintomi (gonfiore, orticaria, reflusso, anafilassi).
* Associazione del pasto consumato, del locale o dell'ingrediente sospetto.
* Esportazione del diario in PDF per il proprio allergologo o medico curante.

#### E. 🔒 Generatore Lockscreen ICE (In Case of Emergency)
* Strumento che crea uno sfondo per la schermata di blocco dello smartphone con la lista delle proprie allergie gravi, gruppo sanguigno e numero di emergenza, leggibile dai soccorritori senza sbloccare il telefono.

#### F. 🔗 Condivisione Profilo Famiglia (Shared Profile)
* Generazione di un link sicuro temporaneo o QR code per condividere la scheda allergica del figlio con nonni, babysitter, insegnanti o animatori di feste di compleanno.

---

## 5. 🏪 PARTE 2: SEZIONE RISTORATORE / OWNER

L'ambiente Ristoratore è dedicato ai proprietari di locali, chef e responsabili HACCP per gestire il proprio locale, aggiornare il menù digitale, proteggersi da rischi legali e attirare clienti fidelizzati.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STRUTTURA NAVIGAZIONE RISTORATORE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [AUTENTICAZIONE & ACCESSO B2B]                                             │
│   ├── Login Ristoratore / Registrazione Attività                            │
│   └── Accettazione Responsabilità Dichiarazioni HACCP                       │
│                                                                             │
│  [DASHBOARD GESTIONALE MOBILE (5 SEZIONI CHIAVE)]                           │
│   ├── 📊 1. PANORAMICA (Metriche Visite, Scansioni QR, Top Allergeni)       │
│   ├── 🍽️ 2. GESTIONE MENÙ & MATRICE ALLERGENI (Piatti, Tracce, Versioning) │
│   ├── 🤖 3. AI MENU SCANNER (Import Menù da Foto + Traduzione 4 Lingue)     │
│   ├── 🏢 4. SCHEDA LOCALE & GALLERIA (Orari, Indirizzo, Referente, Foto)    │
│   ├── 🖨️ 5. QR CODE TAVOLI & REGISTRO ALLERGENI PDF (HACCP Ufficiale)        │
│   ├── 📣 6. MARKETING & NOTIFICHE PUSH (Messaggi ai Clienti Follower)       │
│   ├── ⭐ 7. GESTIONE RECENSIONI DI SICUREZZA & RISPOSTE                      │
│   └── 💳 8. ABBONAMENTO & PIANI (Stripe Customer Portal & Fatture)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.1 Onboarding, Registrazione Attività & Vincoli Legali

1. **Registrazione Ristoratore:**
   - Dati aziendali: Ragione Sociale, Nome Locale, Partita IVA, Codice SDI, PEC, Indirizzo e Città.
   - Referente Allergeni: Nome e cognome del responsabile della sicurezza alimentare / chef.
2. **Accettazione Vincolo Legale & Protocollo Cucina:**
   - Dichiarazione formale di veridicità delle informazioni inserite sugli allergeni presenti e sulle procedure di prevenzione della contaminazione crociata (Regolamento UE 1169/2011).

---

### 5.2 Dashboard Ristoratore Mobile (Panoramica)

La schermata Home del ristoratore fornisce il controllo completo del ristorante in un colpo d'occhio.

* **Header Stato Locale:**
  - Badge stato: `🟢 Aperto` / `🔴 Chiuso`.
  - Badge Piano Attivo: `AllerTgy Free`, `AllerTgy Base`, `AllerTgy Pro`, `Locale Verificato`.
* **Metriche Card in Evidenza:**
  - **Visualizzazioni Menù Oggi / Questo Mese.**
  - **Scansioni QR Code Tavolo.**
  - **Follower Totali:** Numero di clienti che hanno salvato il locale nei preferiti.
  - **Score di Sicurezza Medio:** Voto basato sulle recensioni dei clienti.
* **Quick Action Buttons:**
  - ➕ **Aggiungi Piatto Rapido**
  - 📸 **Scansiona Menù Cartaceo con AI**
  - 🖨️ **Stampa QR Code & Registro PDF**
  - 📣 **Invia Notifica ai Follower**

---

### 5.3 Gestione Menù Digitale & Matrice Allergeni

Il ristoratore può creare, modificare e organizzare il menù con la massima flessibilità e rigore.

```
┌─────────────────────────────────────────────────────────────┐
│             EDITOR PIATTO & MATRICE ALLERGENI (OWNER)       │
├─────────────────────────────────────────────────────────────┤
│ Nome Piatto: [ Gnocchi alla Sorrentina                    ] │
│ Categoria:   [ Primi Piatti ▼ ]           Prezzo: [ € 11.00]│
│ Descrizione: [ Gnocchi di patate, salsa di pomodoro,       ]│
│              [ mozzarella fior di latte, basilico fresco.  ]│
│                                                             │
│ ── SELEZIONA ALLERGENI PRESENTI (14 UE) ─────────────────── │
│ [🔴 CONTIENE (Primario)]      [🟡 POSSIBILI TRACCE (Contam.)]│
│                                                             │
│ 🔴 Glutine       (Selezionato)                              │
│ 🔴 Latte/Lattosio (Selezionato)                              │
│ 🟡 Frutta a guscio (Tracce dichiarate)                      │
│ ⚪ Uova (Nessuno)     ⚪ Pesce (Nessuno)    ⚪ Soia (Nessuno)│
│ ... (tutti i 14 allergeni con selettore Contiene/Tracce/No) │
│                                                             │
│ ── CARATTERISTICHE SPECIALI ─────────────────────────────── │
│ [x] Vegetariano   [ ] Vegano   [ ] Senza Glutine AIC        │
│                                                             │
│ [x] Protocollo contaminazione crociata controllato in cucina│
│                                                             │
│ [ ANNULLA ]                           [ SALVA MODIFICHE ]   │
└─────────────────────────────────────────────────────────────┘
```

#### Funzionalità di Gestione Menù:
* **Menù Multipli:** Gestione simultanea di più carte (es. *Menù Pranzo Lavoro*, *Menù Cena*, *Menù Weekend*, *Menù Bambini*, *Carta dei Dolci*).
* **Organizzazione Categorie:** Ordinamento categorie tramite drag & drop.
* **Matrice Allergeni per Piatto:** Per ciascun piatto, il ristoratore assegna in modo intuitivo lo stato per ciascuno dei 14 allergeni UE:
  - `Contiene` (Ingrediente presente nella ricetta).
  - `Tracce` (Possibile contaminazione crociata da lavorazione o stoccaggio).
  - `Assente` (Nessuna presenza).
* **Versioning & Audit Log:** Ogni salvataggio incrementa la versione del menù (es. v2.1) e registra la data e l'autore della modifica per scopi legali e assicurativi.

---

### 5.4 AI Menu Scanner & Traduzione Automatica Multilingua

1. **Import Menù da Foto (AI OCR):**
   - Il ristoratore scatta 1 o più foto al menù cartaceo o carica un PDF.
   - L'AI analizza i testi, isola i piatti, i prezzi e deduce automaticamente gli allergeni probabili.
   - Schermata di revisione prima della pubblicazione.
2. **Traduzione Automatica in 4 Lingue (AI):**
   - Con un click, il menù viene tradotto in **Inglese, Spagnolo, Tedesco e Francese**.
   - Gli allergeni vengono mappati nei rispettivi standard internazionali.

---

### 5.5 Gestione Scheda Locale, Orari & Galleria Foto

* **Dati Generali:** Nome locale, descrizione gastronomica, indirizzo con pin su mappa GPS, telefono, email, sito web.
* **Orari di Apertura:** Configurazione per singoli giorni della settimana con doppi turni (pranzo/cena).
* **Galleria Fotografica:** Caricamento foto del locale e dei piatti (con limiti in base al piano sottoscritto).
* **Referente Allergeni & Staff:** Dati del responsabile da mostrare ai clienti.

---

### 5.6 Generazione QR Code & Kit Tavoli

* **Generatore QR Tavolo Personalizzato:** Genera il codice QR ad alta risoluzione con logo AllerTgy e nome del locale.
* **Codice Numerico a 6 Cifre:** Mostra il codice univoco del ristorante per i clienti che preferiscono digitare.
* **Kit di Stampa:** Template pronti in formato PDF per stampare:
  - Adesivi da tavolo.
  - Cavalieri segnatavolo.
  - Cartellina d'ingresso per consultazione rapida.

---

### 5.7 Notifiche Push ai Clienti Follower (Pro Marketing)

* Funzionalità disponibile per i piani Pro / Verificato.
* Mostra il contatore esatto dei clienti che hanno il ristorante nei Preferiti.
* Modulo di invio notifica push istantanea:
  - Titolo e messaggio (es. *"Abbiamo inaugurato il nostro nuovo menù primaverile 100% senza glutine e senza lattosio! Ti aspettiamo questo weekend"*).
  - Possibilità di inserire sconti o inviti ad eventi enogastronomici dedicati.

---

### 5.8 Gestione Recensioni di Sicurezza & Risposte

* Feed delle recensioni lasciate dai clienti su **3 parametri chiave**:
  1. *Attenzione e preparazione del personale di sala.*
  2. *Chiarezza e affidabilità del menù allergeni.*
  3. *Sicurezza percepita ed esperienza complessiva.*
* **Funzione Risposta Pubblica:** Il ristoratore può rispondere alle recensioni direttamente dall'app per ringraziare o chiarire eventuali dubbi.
* Segnalazione di recensioni inappropriate al team di moderazione interno.

---

### 5.9 Statistiche, Ricerche Allergeni & Analytics

* **Grafico Trend Visite:** Andamento giornaliero, settimanale e mensile delle consultazioni del menù.
* **Classifica "Top Allergeni dei Tuoi Clienti":** Grafico a barre che mostra quali allergie e intolleranze cercano maggiormente i clienti che scansionano il tuo menù (es. 42% Lattosio, 31% Glutine, 15% Frutta a guscio, 8% Nichel/Pomodoro). Questo dato è fondamentale per aiutare lo chef a ottimizzare le proposte di cucina!
* **Piatto Più Visualizzato & Più Apprezzato.**

---

### 5.10 Registro Allergeni Ufficiale in PDF (Normativa HACCP/UE)

* Con un solo tap, l'app genera e compila il **Registro Allergeni Ufficiale** pronto per la stampa in formato A4 orizzontale.
* Conforme a tutte le prescrizioni del Regolamento UE 1169/2011 e alle linee guida ministeriali HACCP.
* Include: Ragione Sociale, Data di validazione, Firma del referente, Matrice completa piatti per allergeni e tracce.

---

### 5.11 Piani, Abbonamenti & Customer Portal Stripe

* **Schermata Piani Disponibili:**
  - *Free Trial (30 giorni completi).*
  - *Piano Base:* Menù digitale illimitato, QR tavolo, Registro PDF.
  - *Piano Pro Notifiche:* Include traduzioni AI in 4 lingue e invio notifiche push ai follower.
  - *Locale Verificato AllerTgy:* Certificazione, priorità nei risultati di ricerca (Boost) e badge oro.
* **Gestione Stripe:** Accesso diretto al Customer Portal per fatture, cambio carta di credito o upgrade del piano.

---

## 6. 🧩 Componenti UI Chiave da Progettare in Figma

Il designer dovrà realizzare i seguenti componenti atomici e molecolari nel Design System di Figma:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MASTER COMPONENT KIT FIGMA                        │
├─────────────────────────┬───────────────────────────────────────────────────┤
│ COMPONENTE FIGMA        │ VARIANTI E STATI RICHIESTI                        │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 1. DishCard             │ • 3 Stati Semaforo (Safe, Warn, Risk)             │
│                         │ • 2 Formati: Compatta (List) ed Estesa con Foto   │
│                         │ • Stati: Default, Pressed, Disabled               │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 2. Semaforo Badge       │ • Solid Pill, Outline Pill, Minimal Dot           │
│ (Quad-Indicator)        │ • Icona + Label + Why Chip integrato              │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 3. Floating Glass Bar   │ • 5 Icone Tab con stato Inattivo / Attivo Glow    │
│                         │ • ScanSphere Centrale (Normal, Breathing, Pressed)│
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 4. Profile Switcher Pill│ • Avatar + Nome profilo + Chevron                 │
│                         │ • Stati: Singolo utente, Profilo bambino attivo   │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 5. Allergy Chip         │ • 14 Allergeni UE con icone vettoriali            │
│                         │ • 3 Livelli Intensità (Lieve, Moderata, Grave)    │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 6. Compatibility Ring   │ • Score percentuale circolare animato (0% - 100%) │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 7. Sticky Filter Bar    │ • Capsule filtri orizzontali con badge contatori  │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 8. Allergy Card (Wallet)│ • Modalità Card Wallet elegante (5 lingue)        │
│                         │ • Modalità Schermo Intero ad alta leggibilità     │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 9. SOS Floating Button  │ • Pulsante salvavita rapido per header            │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 10. Owner Allergen Grid │ • Selettore matrice 3 stati (Contiene/Tracce/No)  │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 7. 📐 Linee Guida per Responsive, Accessibilità & Dark Mode

### 7.1 Accessibilità (WCAG 2.1 Livello AAA)
* **Rapporto di Contrasto:** Tutti i testi primari devono avere un contrasto minimo di **7:1** rispetto allo sfondo; i badge semaforici devono superare **4.5:1**.
* **Supporto Screen Reader (VoiceOver / TalkBack):** Ogni icona e badge semaforico deve avere accessibility label chiare (es. *"Piatto idoneo per il profilo di Matteo, non contiene glutine né uova"*).
* **Target di Tocco (Touch Target Size):** Tutti i pulsanti, chip e toggle devono avere un'area minima cliccabile di **48x48 px**.

### 7.2 Dark Mode Elegante (*Deep Plum & Slate*)
* Nella versione scura per l'app cliente, evitare il nero assoluto (`#000000`) e preferire un sofisticato prugna scuro profondo (`#0F0618` canvas, `#1B1226` card).
* I colori del semaforo in Dark Mode devono adottare tonalità leggermente desaturate per evitare bagliori fastidiosi alla vista al buio.

### 7.3 Consegna Asset & Hand-off
* **Struttura Pagine Figma:**
  1. `01. Cover & Changelog`
  2. `02. Design System Tokens (Colori, Tipografia, Spacing, Icone)`
  3. `03. Componenti Base & Molecole (DishCard, Badges, Header, TabBar)`
  4. `04. Flusso Cliente — Onboarding & Auth`
  5. `05. Flusso Cliente — Home, Discovery & Mappa`
  6. `06. Flusso Cliente — ScanSphere & Spesa Barcode`
  7. `07. Flusso Cliente — Menù Digitale & Dettaglio Piatto (Core)`
  8. `08. Flusso Cliente — Passaporto, SOS & Salute`
  9. `09. Flusso Ristoratore — Dashboard, Menù & Matrice Allergeni`
  10. `10. Flusso Ristoratore — QR Tavolo, PDF HACCP & Statistiche`
  11. `11. Responsive & Dark Mode Specs`

---

> **Fine del Documento di Specifiche UI/UX AllerTgy.**  
> Questo documento costituisce il riferimento ufficiale per il team di Product Design e Development. Per qualunque dubbio architetturale o di flusso, fare riferimento alla codebase React Native / Expo presente nel repository.
