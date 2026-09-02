# 📋 AllerTgy — Master Design Brief & Guida di Riprogettazione UI/UX

> **Destinatario:** Lead UI/UX Designer & Product Designer  
> **Progetto:** AllerTgy (App Mobile iOS & Android + Design System)  
> **Obiettivo:** Elevare la qualità visiva, la raffinatezza grafica, la fluidità UX e la coerenza del Design System dell'app AllerTgy a standard Apple Design Award / world-class.

---

## 1. 🎯 Visione di Prodotto & Missione

### Cos'è AllerTgy?
**AllerTgy** è l'assistente digitale per mangiare fuori casa in totale serenità con **allergie, intolleranze e restrizioni alimentari**.  
L'app permette agli utenti di:
1. Configurare il proprio profilo allergenico (14 allergeni UE + ingredienti personalizzati + intensità).
2. Gestire sottoprofili familiari (es. figli o partner).
3. Sedersi al ristorante e **scansionare il QR code del tavolo** (o inserire un codice numerico a 6 cifre).
4. Visualizzare istantaneamente il **menù filtrato con il motore "Semaforo"**, scoprendo quali piatti sono idonei, quali contengono tracce e quali sono da evitare.
5. Mostrare un **Passaporto Allergie multilingua** allo staff (in 5 lingue: Italiano, Inglese, Spagnolo, Tedesco, Francese).
6. Scansionare codici a barre al supermercato per la spesa sicura.
7. Caricare referti medici con estrazione automatica degli allergeni tramite AI.

---

### La Psicologia dell'Utente al Tavolo
L'utente con allergie gravi vive il momento del ristorante con un misto di **ansia, imbarazzo sociale e paura di contaminazioni**.
* **Non vuole:** un'app confusa, con testo microscopico, mille banner pubblicitari, colori urlati o animazioni lente.
* **Vuole:** **chiarezza assoluta in 3 secondi**, contrasto netto, font leggibili anche con poca luce nel locale, certezza di aver controllato tutto e una grafica rassicurante e professionale.

### Il Principio Guida: *Calm Clinical Clarity*
* **Look & Feel:** Uno **strumento di precisione al tavolo** con l'eleganza dell'ospitalità italiana.
* **Né una clinica asettica, né un'app di giochi:** Non deve sembrare un gestionale ospedaliero cupo, ma nemmeno una "marshmallow app" infantile o un social network.
* **Tono del Copy:** Diretto, protettivo, sobrio e legalmente rigoroso.
  * ✅ *Usare:* "Idoneo per il tuo profilo", "Possibili tracce dichiarate", "Contiene allergeni selezionati".
  * ❌ *Vietato:* "Sicuro al 100%", "Zero rischi", "Mangia senza pensieri" (legalmente inaccettabile).

---

## 2. 🚦 La Regola d'Oro: Il Semaforo AllerTgy

Il **Semaforo** è il cuore funzionale e visivo del prodotto. La sua leggibilità è una questione di **sicurezza primaria**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        IL SEMAFORO ALLERTGY                            │
├─────────┬──────────────┬──────────────────┬────────────────────────────┤
│ STATO   │ COLORE       │ VERDETTO UI      │ SIGNIFICATO                │
├─────────┼──────────────┼──────────────────┼────────────────────────────┤
│ 🟢 SAFE │ Emerald/Mint │ IDONEO           │ Nessun allergene né tracce │
│ 🟡 WARN │ Amber/Gold   │ ATTENZIONE       │ Possibili tracce / contam. │
│ 🔴 RISK │ Coral/Ruby   │ NON IDONEO       │ Contiene allergeni profilo │
└─────────┴──────────────┴──────────────────┴────────────────────────────┘
```

### Regole di Design Invalicabili per il Semaforo:
1. **Regola del Quad-Indicator (Accessibilità & Daltonismo):**  
   Non affidarsi **mai** al solo colore. Ogni stato deve avere contemporaneamente:
   * Colore distinto (Verde / Giallo / Rosso).
   * Icona vettoriale di stato (Checkmark / Alert triangolo / Crocetta ottagonale).
   * Label testuale chiara (*Idoneo* / *Attenzione* / *Non idoneo*).
   * **Why Chip / Motivazione esplicita:** Sotto al piatto rosso/giallo deve comparire il chip con l'allergene specifico rilevato (es. `[🔴 Contiene: Glutine, Crostacei]` o `[🟡 Tracce: Frutta a guscio]`).
2. **Niente Wash a tutta card:**  
   Non colorare l'intero sfondo della card del piatto di rosso o verde. La card resta pulita (fondo bianco/ceramica), mentre il verdetto vive su badge pill, traffic dot e chip motivazionali.
3. **Riserva del Verde:**  
   Nel consumer (app cliente), **il verde non è il colore del brand**. Il verde è riservato **esclusivamente al verdetto "Idoneo"** per non creare confusione decisionale nell'utente.

---

## 3. 🎨 Design System: Token & Fondamenta Visive

AllerTgy adotta una differenziazione netta tra l'ambiente **Consumer (Cliente)** e l'ambiente **B2B (Ristoratore)**.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            ARCHITETTURA BRAND                            │
├──────────────────────────┬───────────────────────────────────────────────┤
│ SUPERFICIE               │ PALETTE & MOOD                                │
├──────────────────────────┼───────────────────────────────────────────────┤
│ 📱 App Mobile Cliente    │ 🟣 VIOLET PRECISION (Lavanda, Plum Ink, Glass)│
│ 🌐 Landing Page Pubblica │ 🟣 VIOLET PRECISION (Lavanda, Plum Ink, Glass)│
│ 💻 Dashboard Ristoratore │ 🟢 FOREST & EMERALD (B2B Gestionale, Verde)   │
└──────────────────────────┴───────────────────────────────────────────────┘
```

---

### 3.1 Palette Consumer — *Cosmic & Vanilla*

| Ruolo Token | Nome Token | Codice Hex | Utilizzo UI |
|---|---|---|---|
| **Canvas Background** | `surface` | `#F8FAFC` | Sfondo a schermo intero |
| **Superficie Primaria** | `surfaceSecondary` | `#FFFFFF` | Card bianche ceramiche, sheet e modali |
| **Superficie Subdued** | `surfaceTertiary` | `#F1FEC8` / `#FAFDF0` | Sezioni secondarie, capsule inattive, sfondi chip |
| **Testo Principale / Ink** | `onSurface` / `cosmic` | `#23212C` | Titoli, testo primario, icone attive ad alto contrasto (Cosmic: RGB 35, 33, 44) |
| **Testo Secondario** | `textSecondary` | `#475569` / `#64748B` | Sottotitoli, descrizioni, label di supporto |
| **Testo Muted** | `textMuted` | `#94A3B8` / `#9CA3AF` | Timestamp, metadati, placeholder |
| **Brand Primario (Cosmic)** | `brandPrimary` / `cosmic` | `#23212C` | Bottoni CTA primari, badge istituzionali, dock tab bar |
| **Brand Soft / Accent (Vanilla)** | `brandSecondary` / `vanilla` | `#F1FEC8` | Glow soffusi, tint di selezione, accenti luminosi (Vanilla: RGB 241, 254, 200) |
| **Bordo Standard** | `border` | `#E2E8F0` | Bordo sottile 1px per definire card e input |
| **Bordo Enfasi** | `borderStrong` | `#23212C` | Bordo elementi selezionati / in focus |

#### Token Semaforo (Verdetti):
* **🟢 Verde (Idoneo):** Solid `#10B981` (`#34D399`) · Soft `#ECFDF5` (`#D1FAE5`) · Text `#065F46` · Border `#6EE7B7`
* **🟡 Giallo (Attenzione/Tracce):** Solid `#F59E0B` (`#FBBF24`) · Soft `#FFFBEB` (`#FEF3C7`) · Text `#92400E` · Border `#FCD34D`
* **🔴 Rosso (Non Idoneo):** Solid `#EF4444` (`#F87171`) · Soft `#FEF2F2` (`#FEE2E2`) · Text `#991B1B` · Border `#FCA5A5`

---

### 3.2 Tipografia

* **Font Titoli & Display:** **`Sora`** (Pesi: 700 Bold, 800 ExtraBold). Look geometrico, moderno, solido, con eccellente leggibilità a pesi alti.
* **Font Corpo & Metadati:** **`Nunito`** o **`SF Pro Text`** (Pesi: 500 Medium, 600 SemiBold, 700 Bold). Morbido, umano, chiaro e privo di affaticamento visivo.

#### Scala Tipografica Consigliata:
* `Display Large`: 28–32px · Bold / ExtraBold · Line-height 1.15 (Hero screen, Benvenuto).
* `Title 1`: 22–24px · Bold · Line-height 1.25 (Nomi ristoranti, sezioni principali).
* `Title 2`: 18–20px · Bold · Line-height 1.3 (Nomi piatti, titoli modali).
* `Headline / BodyBold`: 15–16px · SemiBold/Bold · Line-height 1.4 (Pillole, nomi ingredienti).
* `Body`: 14–15px · Medium · Line-height 1.45 (Descrizioni piatti, testi guida).
* `Caption / Micro`: 11–12px · SemiBold/Bold · Line-height 1.3 · Letter-spacing +0.5px (Label operative, categorie, allergeni pill).

---

### 3.3 Forme, Raggi di Curvatura & Ombre

* **Raggi di Curvatura (Border Radius):**
  * `Radius SM (10px)`: Chip piccoli, badge numerici, campi input compatti.
  * `Radius MD (14px - 16px)`: Card standard (`DishCard`, `RestaurantCard`), bottoni primari.
  * `Radius LG (20px - 24px)`: Bottom sheets, modali, contenitori di sezione in Home.
  * `Radius Floating Bar (28px - 32px)`: Floating Glass Tab Bar.
  * `Radius Full (999px)`: Tag filtri, capsule semaforo, avatar.
* **Ombre (Soft Sferiche):**  
  Preferire bordi netti da 1px (`#E6DFF5`) a ombre pesanti. Dove necessarie, usare ombre soffuse viola-prugna: `shadowColor: "#36255C"`, `opacity: 0.05-0.08`, `radius: 12-16`, `offsetY: 4`.

---

### 3.4 Glassmorphism & Elementi "Vivi"
* **Liquid Glass Chrome:** Utilizzato per la **Floating Tab Bar** e l'header contestuale. Vetro satinato con blur nativo (`blurIntensity: 40` iOS), tint biancastro al 60% e bordo superiore leggermente illuminato.
* **ScanSphere:** L'iconico pulsante centrale della Tab Bar. Un globo 3D-like / gradiente a 3 toni semaforo con una pulsazione organica sottile (*breathe* 1.0 → 1.05 su 2200ms) che invita alla scansione del QR.

---

## 4. 📱 Mappa Completa dell'Applicazione & Architettura UX

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ARCHITETTURA APP ALLERTGY                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [0. ONBOARDING & SETUP]                                                    │
│   ├── Welcome Screen & Value Proposition                                    │
│   ├── Selezione 14 Allergeni UE + Intensità (Lieve / Moderata / Grave)      │
│   ├── Preferenze Alimentari (Veg, Senza Glutine, Senza Lattosio)            │
│   └── Consensi GDPR (Dati sanitari Art. 9 + Disclaimer Sicurezza)           │
│                                                                             │
│  [BARRA DI NAVIGAZIONE A 5 TAB (FLOATING GLASS)]                            │
│   ├── 🏠 TAB 1: HOME                                                        │
│   │    ├── Header: Switcher Profilo (Io / Figlio) + Flag Lingua + SOS Button│
│   │    ├── Search Bar Unificata (Cerca Ristorante, Città o Codice a 6 cifre)│
│   │    ├── Widget Profilo Attivo & Riepilogo Allergeni Rapido               │
│   │    ├── Carosello Ristoranti Vicini con % di Compatibilità               │
│   │    └── Card Quick Actions & Consigli di Sicurezza                       │
│   │                                                                         │
│   ├── 📍 TAB 2: LOCALI (DISCOVERY & MAPPA)                                  │
│   │    ├── Switch Vista: Lista Schede / Mappa Interattiva                   │
│   │    ├── Filtri: Raggio Km, Categoria, Locale Verificato, 100% Compatibile│
│   │    └── Scheda Ristorante (Foto, Distanza, Badge Verificato, Rating)     │
│   │                                                                         │
│   ├── 🔮 TAB 3: SCANSPHERE (CENTRO HERO)                                    │
│   │    ├── Scanner Fotocamera QR Ristorante                                 │
│   │    ├── Inserimento Codice Manuale a 6 Cifre                             │
│   │    ├── Modalità OCR AI: Scansione Menù Cartaceo                         │
│   │    └── Modalità Spesa: Scansione Barcode (EAN/UPC) via Open Food Facts  │
│   │                                                                         │
│   ├── ❤️ TAB 4: PREFERITI                                                   │
│   │    ├── Locali Salvati con Notifica Menù Aggiornato                      │
│   │    └── Prodotti Supermercato Preferiti                                  │
│   │                                                                         │
│   └── 👤 TAB 5: ACCOUNT & SALUTE                                            │
│        ├── Gestione Allergie & Ingredienti Esclusi                          │
│        ├── Sottoprofili Famiglia (Plus)                                     │
│        ├── 🪪 Passaporto Allergie Multilingua (Allergy Card)                │
│        ├── 🚨 Modalità Emergenza & SOS (Contatti, Farmaci, Epipen)          │
│        ├── 📄 Referti Medici AI (Upload PDF/Foto + Estrazione Gemini)       │
│        ├── 🌐 Selettore Lingua (IT, EN, ES, DE, FR)                         │
│        └── 💎 Upgrade AllerTgy Plus (Sottoprofili illimitati)               │
│                                                                             │
│  [SCHERMATE CHIAVE CONTESTUALI]                                             │
│   ├── 🍽️ VISTA MENÙ DIGITALE RISTORANTE (Il cuore dell'esperienza)          │
│   │    ├── Header Ristorante con Score di Compatibilità Globale (es. 78% 🟢)│
│   │    ├── Sticky Filter Bar Semaforo: [Tutti] [🟢 Idonei] [🟡 Attenz.] [🔴]│
│   │    ├── Accordion Categorie: Antipasti, Primi, Secondi, Dolci            │
│   │    ├── DishCard con Verdetto, Prezzo, Ingredienti, Tracce e Badge       │
│   │    └── Modale Dettaglio Piatto & Domande da fare al cameriere           │
│   │                                                                         │
│   └── ⭐ SCRITTURA RECENSIONE DI SICUREZZA                                  │
│        └── Valutazione 3 assi: Personale attento, Menù chiaro, Sicurezza    │
└─────────────────────────────────────────────────────────────────────────────┘
---

### 4.5 📊 Stato Attuale di Sviluppo & Componenti Realizzati

Per aiutare il designer a comprendere cosa è già stato implementato e funzionante nel prototipo React Native / Expo:

| Schermata / Modulo | Dettagli di Implementazione Attuale |
|---|---|
| **Design System — Violet Precision** | Palette completa con supporto Light/Dark mode (canvas `#F6F2FC` / `#0F0618`), font Sora + Nunito registrati, token spacing/radius/ombre soffuse, semaforo quad-indicator (colore + icona + label + Why Chip). |
| **Navigazione — Floating Glass Tab Bar** | Barra in `.ultraThinMaterial` / Glass con bordo luminoso e ombra soft, **ScanSphere** centrale con gradiente tricolore e breathing organico, 5 tab (`Home`, `Locali`, `Scan`, `Preferiti`, `Profilo`). |
| **Onboarding** | 3 pagine: welcome con illustrazione semaforo, selezione 14 allergeni UE con intensità (*Lieve / Moderata / Grave*), preferenze alimentari + consensi legali GDPR. |
| **Home Screen** | Switcher profilo (pill), search bar unificata, widget profilo attivo, quick actions, carosello ristoranti vicini, safety tips card. |
| **Locali (Discovery)** | Filtri (100% compatibile, verificato), toggle lista/mappa, pin colorati per compatibilità. |
| **Scanner** | 4 modalità (QR, Codice 6 cifre, Barcode spesa, Menù cartaceo OCR), viewfinder con corner brackets, laser animato, result sheet con statistiche. |
| **Menù Ristorante** | Header con Compatibility Ring, sticky filter bar con contatori `[Tutti(24)]` `[🟢(16)]` `[🟡(5)]` `[🔴(3)]`, accordion categorie, `DishCard` estesa. |
| **Dettaglio Piatto** | Verdetto, Why Chips, ingredienti, allergeni dichiarati, badge vegan/veg, prompt interattivo "Domanda al cameriere". |
| **Passaporto Allergie** | Card stile Apple Wallet su sfondo Deep Plum, 5 lingue (IT/EN/ES/DE/FR), modalità schermo intero ad alta luminosità. |
| **SOS Emergenza** | Pulsante salvavita rapido, contatto fidato, EpiPen/antistaminico checklist, chiamata 112 UE, lista allergeni attivi. |
| **Referti Medici AI** | Upload PDF/immagini, animazione analisi, revisione human-in-the-loop con punteggio confidenza e toggle conferma. |
| **Account & Impostazioni** | Profilo, allergeni con severity, menu sezioni, upgrade AllerTgy Plus. |
| **Dati Mock Realistici** | 5 ristoranti con menù completi (es. *Osteria del Portico*, *Sushi Zen*, *Pizzeria Bella Napoli*, *Bistro Verde*, *Trattoria da Luigi*), profilo adulto + bambino (*Matteo*) con allergeni differenti per test multi-profilo. |

---

## 5. 🔍 Diagnosi UX/UI: Punti Critici da Riprogettare (Il Tuo Compito)

Per portare AllerTgy al massimo livello qualitativo, chiediamo al designer di intervenire specificamente sulle seguenti 10 aree:

---

### 1. Header & Navigation Bar (Home & Schermate Principali)
* **Problema attuale:** L'header accumula troppi elementi slegati (Pulsante SOS, campanella notifiche, bandierine lingua, switcher sottoprofilo).
* **Cosa migliorare:**
  * Progettare una **Navigation Bar unificata e compatta** integrata con la Safe Area di iOS/Android.
  * Integrare lo **Switcher Profilo** (es. "👦 Matteo" vs "👤 Io") come una pillola elegante e accessibile con 1 tap.
  * Il pulsante **SOS** deve essere visibile e rassicurante (rosso sobrio/outline o icona salvavita), senza sembrare un allarme continuo.
  * Gestire il passaggio da header trasparente con gradiente a header satinato/solid allo scroll (*sticky dynamic header*).

---

### 2. DishCard (Card del Piatto nel Menù) — *Componente più critico*
* **Problema attuale:** Nelle schermate del menù, i piatti contengono molte informazioni (foto, nome, prezzo, descrizione, allergeni presenti, tracce, badge di compatibilità). Rischio di disordine visivo o card troppo alte.
* **Cosa migliorare:**
  * Ridisegnare la **`DishCard`** con gerarchia impeccabile:
    1. Nome piatto (Chiaro, peso bold) + Prezzo.
    2. Descrizione ingredienti (massimo 2 righe con ellissi o espandibile).
    3. **Pillola Verdetto Semaforo** (`Idoneo` / `Attenzione` / `Non idoneo`) posizionata in modo consistente (es. top-right o bottom-left).
    4. **Why Chips (Motivazione):** Se giallo o rosso, visualizzare tag compatti e leggibili con l'allergene incriminato (es. `🔴 Contiene: Lattosio`, `🟡 Tracce: Frutta a guscio`).
  * Fornire due varianti: **Card Estesa** (con miniatura foto 80x80) e **Card Compatta/List** (per consultazione veloce di menù da 80 piatti).
  * Stato di Long-press o Tap: apertura di un elegante Bottom Sheet con la scheda di sicurezza completa del piatto, gli ingredienti dettagliati e il prompt per chiedere chiarimenti al cameriere.

---

### 3. Sticky Filter Bar & Experience Menù
* **Problema attuale:** Quando l'utente scorre un menù lungo, perde il contesto di quanti piatti sicuri ci sono e deve poter filtrare all'istante.
* **Cosa migliorare:**
  * Progettare una **Barra Filtri Sticky** che si fissa sotto l'header durante lo scroll:
    * Contatori istantanei: `[Tutti (24)]` `[🟢 Idonei (16)]` `[🟡 Con Tracce (5)]` `[🔴 Non Idonei (3)]`.
    * Quando l'utente seleziona "🟢 Idonei", i piatti rossi e gialli vengono nascosti o compressi in modo morbido con micro-animazione.
  * **Header del Menù:** Card riassuntiva in cima con nome locale, indirizzo, badge "Locale Verificato con AllerTgy", e un anello di compatibilità circolare (*Match Score*, es. `85% compatibile`).

---

### 4. Experience di Scansione & ScanSphere (Tab Centrale)
* **Problema attuale:** La schermata di scansione deve gestire 4 modalità diverse (QR Ristorante, Codice 6 cifre, Barcode spesa, Menù cartaceo OCR) senza confondere l'utente.
* **Cosa migliorare:**
  * Riprogettare il mirino della fotocamera: ultra-pulito, con angoli arrotondati, animazione di scansione laser discreta, pulsante torcia rapido.
  * Switcher modalità intuitivo in stile fotocamera iOS (es. `[ QR Locale ]` · `[ Codice ]` · `[ Barcode Spesa ]` · `[ Menù Cartaceo ]`).
  * Stato di successo: **Transizione fluida** con bottom sheet di caricamento rapido ("*Confronto con il tuo profilo in corso...*") prima dell'apertura del menù.

---

### 5. Passaporto Allergie Digitale (Allergy Card / Emergency Pass)
* **Problema attuale:** L'utente ha bisogno di mostrare al cameriere o allo chef una schermata inequivocabile con le proprie allergie, spesso all'estero in una lingua diversa.
* **Cosa migliorare:**
  * Creare una **Tessera Digitale Passaporto Allergie** (stile Apple Wallet / Medical ID card):
    * Scheda orizzontale o verticale con sfondo Deep Plum e dettagli olografici/glass.
    * Nome utente, foto/avatar, lista chiara degli allergeni con icone e livello di gravità (*Grave / Anafilassi*, *Moderata*, *Lieve*).
    * Selettore rapido lingua: bandierine per commutare istantaneamente il testo in Inglese, Spagnolo, Tedesco o Francese da porgere al cameriere.
    * Tasto rapido "Mostra a schermo intero ad alta luminosità" per agevolare la lettura del personale.

---

### 6. Sottoprofili & Gestione Famiglia (Modalità Multi-Profilo)
* **Problema attuale:** Molti utenti sono genitori di bambini con allergie multiple e devono poter passare dal profilo proprio a quello del figlio al volo.
* **Cosa migliorare:**
  * Riprogettare il **Profile Switcher**:
    * Avatar a bolla con badge nome e numero di allergie attive.
    * Indicatore visivo marcato quando è attivo un sottoprofilo (es. bordo colorato o banner discreto "Stai visualizzando il menù per: Matteo 👦").
    * Flusso di creazione sottoprofilo: wizard semplice a step (Nome, Relazione, Allergie, Note mediche).

---

### 7. Scanner Referti Medici con AI
* **Problema attuale:** L'utente carica una foto o PDF di un test allergologico e l'AI estrae gli allergeni. L'utente deve poter validare e correggere i dati estratti con fiducia.
* **Cosa migliorare:**
  * Schermata di caricamento e analisi AI: animazione di scansione elegante con stato di avanzamento ("*Lettura referto...*", "*Individuazione IgE / Prick test...*").
  * Schermata di **Verifica Umana Obbligatoria (Human-in-the-loop)**:
    * Lista degli allergeni trovati dall'AI con punteggio di confidenza (es. *Arachidi - Confidenza 98%*).
    * Toggle chiaro per confermare o scartare ogni allergene prima del salvataggio definitivo nel profilo.

---

### 8. Set di Icone Vettoriali Personalizzate per i 14 Allergeni UE
* **Problema attuale:** L'uso delle emoji standard dei sistemi operativi risulta eterogeneo, infantile e non sempre univoco (es. 🌾 per glutine, 🥛 per latte, 🥜 per arachidi).
* **Cosa migliorare:**
  * Disegnare o selezionare un **Set Vettoriale Unificato di 14 Icone Allergeni UE** con stile coerente:
    1. Glutine / Cereali
    2. Crostacei
    3. Uova
    4. Pesce
    5. Arachidi
    6. Soia
    7. Latte / Lattosio
    8. Frutta a guscio
    9. Sedano
    10. Senape
    11. Sesamo
    12. Anidride solforosa e solfiti
    13. Lupini
    14. Molluschi
  * Specifiche icone: Tratto lineare 1.5–2.0px, terminali arrotondati, racchiuse in cerchi soft lavanda (`#EDE6FA`), scalabili da 16px a 48px.

---

### 9. Empty States, Loading Skeletons & Micro-Interazioni
* **Cosa migliorare:**
  * **Loading Skeletons:** Progettare shimmer skeletons coordinati per `DishCard`, `RestaurantCard` e Header (niente spinner generici al centro dello schermo).
  * **Empty States illustrati / compatti:**
    * *Nessun locale nelle vicinanze* (illustrazione rassicurante + bottone "Cerca per città o codice").
    * *Nessun allergene configurato* (invito guidato a completare il profilo).
    * *Nessun preferito salvato* (spiegazione del valore di salvare i locali per ricevere notifiche di cambio menù).
    * *Nessun piatto idoneo nel menù* (avviso chiaro con suggerimento di parlare con lo chef per varianti su misura).

---

### 10. Modalità Scura (Dark Mode Specification)
* **Cosa migliorare:**
  * Fornire i token e i mockup della **Dark Mode**:
    * Canvas Scura: Deep Plum Notte (`#0F0618` / `#160B24`).
    * Superfici Card: `#1D122E` con bordo sottile `rgba(210, 195, 246, 0.15)`.
    * Testo Primario: `#F6F2FC`, Testo Secondario: `#A89CBD`.
    * Semaforo in Dark Mode: Tonalità leggermente più luminose con contrasto calibrato per non abbagliare al buio.

---

## 6. 📦 Deliverable Richiesti al Designer

Il designer dovrà fornire un file **Figma completo e organizzato**, strutturato come segue:

### 1. File Figma Master & Design System
* **🎨 Style Guide & Tokens:**
  * Palette cromatica (Color Styles / Variables) con versioni Light e Dark.
  * Scala Tipografica (Text Styles con Sora e Nunito).
  * Griglie, Spaziature (Tokens 4, 8, 12, 16, 24, 32, 48px) e Raggi di curvatura.
  * Elevation & Shadow tokens.
* **🧩 Component Library (Figma Auto-Layout & Component Variants):**
  * `Buttons`: Primary, Secondary, Ghost, Danger, SOS, Icon Buttons (con stati Default, Hover, Pressed, Disabled, Loading).
  * `Badges & Chips`: Semaforo Pills (Verde, Giallo, Rosso), Why Chips, Filter Tags.
  * `Cards`: `DishCard` (Expanded & List), `RestaurantCard`, `AllergyCard` (Passaporto), `TipCard`.
  * `Inputs`: Search field, 6-digit PIN code input, text fields con messaggi di errore e validazione.
  * `Navigation`: Master Curved Notch Tab Bar (profilo sagomato con conca centrale, pulsante FAB (+) galleggiante e active dot indicator), Top Navigation Bar, Profile Switcher.
  * `Feedback`: Modali, Bottom Sheets, Toast/Banner notifiche, Skeletons.

### 2. Mockup Schermate (High-Fidelity)
* Flusso Onboarding (3 schermate).
* Home Screen (Stato normale + Stato con sottoprofilo attivo).
* Locali / Discovery (Vista lista + Vista mappa).
* Schermata Menù Locale (Stato "Tutti", Stato filtro "🟢 Idonei", Dettaglio Piatto).
* Scanner Screen (Viewfinder QR, Switcher modalità, Risultato scansione).
* Passaporto Allergie a schermo intero (con cambio lingua attivo).
* Schermata Emergenza SOS (Contatti, farmaci, tessera sanitaria).
* Referti Medici AI (Upload + Revisione estrazione allergeni).
* Profilo & Gestione Sottoprofili Famiglia.
* Schermata Upgrade AllerTgy Plus.

### 3. Prototipo Interattivo
* Prototipo cliccabile del **Golden Flow**:
  * *Apertura App → Scansione QR Ristorante → Visualizzazione Menù Filtrato → Filtro Semaforo Verde → Tap su Dettaglio Piatto → Apertura Passaporto Allergie*.

### 4. Asset Export
* Set 14 Icone Allergeni UE in formato SVG vettoriale ottimizzato.
* Icona App ufficiale (1024x1024px con safe zone per iOS e Android).
* 4-5 Mockup promozionali per App Store e Google Play (formato 1290x2796px).

---

## 7. ⚖️ Vincoli Tecnici, Legali & di Accessibilità

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CHECKLIST DI CONFORMITÀ                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✅ Touch Targets: Minimo 44 × 44 pt per ogni elemento interattivo          │
│  ✅ Contrasto Colori: Standard WCAG 2.1 Livello AA (minimo 4.5:1)           │
│  ✅ Daltonismo / Accessibilità: Mai colore senza testo/icona affiancata     │
│  ✅ Safe Area: Rispetto tassativo dei margini Dynamic Island & Home Bar iOS │
│  ✅ Font: Esclusivamente font gratuiti per uso commerciale (Google Fonts)    │
│  ✅ Stack Tecnico: React Native / Expo (supporta BlurView, Reanimated 3)    │
│  ✅ Copy Legale: Presenza obbligatoria di disclaimer su ogni vista menù     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. 💬 Domande o Chiarimenti per il Designer?

Se hai dubbi su flussi specifici, logiche di backend o casi limite dell'app (es. utenti senza connessione internet al tavolo, menù multilingua dinamici, ristoranti con menù stagionali), fai riferimento a:
* `design.md`: Documento di specifiche storiche.
* `app-mobile/design_guidelines.json`: Fonte dati JSON dei token attuali.
* `FUNZIONI_APP.md`: Elenco dettagliato di tutte le 100+ feature implementate.

---
*Documento redatto per il team di Design AllerTgy — Versione 2.0*
