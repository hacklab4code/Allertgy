# AllerTgy — Design System

Documento di riferimento per identità visiva, UX e componenti della piattaforma AllerTgy.

**AllerTgy** è la piattaforma per mangiare fuori casa in sicurezza con allergie e intolleranze.

| Superficie | Target | Stack | Lingua brand |
|---|---|---|---|
| App mobile | Clienti (e area ristoratore in-app) | React Native + Expo | **Violet Precision** |
| Landing pubblica | Acquisizione clienti e ristoratori | `dashboard-web` (React + Vite) | **Violet Precision** |
| Dashboard web | Ristoratori (B2B operativo) | React + Vite + Tailwind | **Forest + Emerald** |

> `vetrina-frontend/` è legacy: non usarlo come fonte brand. La landing ufficiale è `dashboard-web/src/Landing.tsx`.

---

## 0. Architettura brand (due livelli)

| Livello | Palette | Dove |
|---|---|---|
| **Consumer** | Violet Precision — lavanda `#F6F2FC`, ink `#36255C`, soft `#D2C3F6` | App mobile + landing pubblica |
| **Ristoratore** | Forest + Emerald — fondo `#F7FAF8`, azione `#0F8A6A` | Dashboard B2B / area gestionale |

Il verde forest **non** è brand consumer: compete col semaforo. Sul consumer il verde/giallo/rosso esistono **solo** come verdetto.

**Loop hero da proteggere:** profilo allergie → ScanSphere (QR) → menù semaforo → decisione. Tutto il resto è secondario.

---

## 1. Visione e personalità

### Tesi visiva

**Violet Precision** — AllerTgy è uno **strumento di precisione al tavolo**: flat clinical, glass chrome, semaforo assoluto.

Il viola inquadra; il semaforo decide. Un solo oggetto vivo (ScanSphere) in un mondo altrimenti piatto.

Il prodotto **non** deve sembrare marshmallow app, fitness tracker, SaaS generica o gestionale pesante. Deve comunicare tre cose in pochi secondi:

1. Posso capire cosa mangiare
2. Il ristorante si prende responsabilità
3. Il dato è leggibile e verificabile

### Personalità del brand

| Attributo | Descrizione |
|---|---|
| Affidabile | Diretto, umano, senza fronzoli |
| Protettivo | Senza spaventare, mai allarmista |
| Preciso | Su allergeni, tracce, responsabilità e disclaimer — look da strumento, non da giocattolo |
| Premium | Eleganza quieta: bordi netti, zero gloss, gerarchia tipografica chiara |
| Italiano | Concreto, orientato al momento reale: sedersi, scansionare, scegliere, chiedere conferma allo staff |

**Parole chiave:** sicurezza, chiarezza, tavolo, profilo, allergeni, tracce, QR, registro, verifica.

**Da evitare nel copy:**
- Linguaggio troppo medico
- Tono pubblicitario o promesse assolute
- "Zero rischi", "mangia senza pensieri", "100% sicuro" (non legalmente corretto)

**Terminologia corretta:**
- ✅ "Idoneo per il tuo profilo" / "Idoneo secondo i dati dichiarati dal locale"
- ❌ "Sicuro" / "Sicuro al 100%"

---

## 2. Il Semaforo — elemento centrale del prodotto

Il semaforo è il cuore funzionale e visivo di AllerTgy. Confronta il profilo allergenico dell'utente con gli allergeni dichiarati per ogni piatto.

### Logica

| Stato | Colore | Significato | Azione utente |
|---|---|---|---|
| 🟢 Verde | `#34D399` | Nessun allergene del profilo tra i contenuti o tracce | Può ordinare, verificare con lo staff |
| 🟡 Giallo | `#FBBF24` | Allergene solo tra le **tracce** (contaminazione crociata) | Chiedere conferma al personale |
| 🔴 Rosso | `#F87171` | Allergene tra i **contenuti** del piatto | Evitare |

### Regole di design del semaforo

Ogni stato deve avere **colore + icona + label + spiegazione testuale**. Mai affidarsi solo al colore.

| Stato | Label UI | Microcopy |
|---|---|---|
| Verde | **Idoneo** | "Nessun allergene dichiarato tra quelli selezionati" |
| Giallo | **Attenzione** | "Possibili tracce: chiedi conferma al personale" |
| Rosso | **Non idoneo** | "Contiene allergeni del tuo profilo" |

**Regole:**
- Il rosso non deve essere solo "sbarrato": deve spiegare *perché* il piatto non è idoneo
- I colori semaforo sono riservati ai verdetti — non usarli come colore di brand
- Long-press su un piatto rosso/giallo mostra il dettaglio allergeni con intensità
- Pattern UI: **dot + pill label + why chip** (`TrafficDot`, `StatoVerdictPill`, `MatchChip`) — mai wash colorato sulla card intera

---

## 3. Palette colori

### 3.1 Consumer — Puffy Glass Plum (app + landing)

Fonte token: `app-mobile/design_guidelines.json` → `designTokens.ts` (`appColors`) → `theme.ts`.

- **Canvas** lavanda-ghiaccio tenue `#F4F0F9` a schermo intero
- **Superfici** Puffy White Ceramic `#FFFFFF` + bordo 1px `#E8E0F2` (ombra sferica soffusa prugna via `softShadow`)
- **Ink** Deep Plum `#1C0D30` per titoli, CTA e icone attive (rigoroso e ad alto contrasto)
- **Glass** Dark Violet Glass (`rgba(45, 18, 77, 0.78)`) su chrome (tab bar, orb header)
- **Verdetto** = dot / pillola 3D glossy semaforo + label — mai wash colorato sulla card intera

#### Colori brand

| Token | Hex | Uso |
|---|---|---|
| `brand` / `brandInk` / `ink` | `#1C0D30` | Azioni primarie, titoli, Deep Plum ink |
| `brandSecondary` / `brand200` | `#C5B2F0` | Soft fill, glass tint, accenti logo |
| `brand300` | `#A88DEB` | Accenti secondari |
| `surface` | `#F4F0F9` | Sfondo app / landing (Ice Lavender) |
| `surfaceSecondary` | `#FFFFFF` | Card Puffy Ceramic, pannelli |
| `surfaceTertiary` / `brand100` | `#ECE5F7` | Sezioni secondarie |
| `onSurface` | `#1C0D30` | Testo principale |
| `textSecondary` | `#675B7D` | Testo secondario |
| `textMuted` | `#9084A3` | Metadati, caption |
| `border` | `#E8E0F2` | Bordi puffy sottili |
| `borderStrong` | `#C5B2F0` | Bordi enfasi |

#### Colori semaforo (mobile / demo landing)

| Stato | Solid | Soft (bg) | On (testo) | Border |
|---|---|---|---|---|
| Verde | `#34D399` | `#D1FAE5` | `#065F46` | `#6EE7B7` |
| Giallo | `#FBBF24` | `#FEF3C7` | `#92400E` | `#FCD34D` |
| Rosso | `#F87171` | `#FEE2E2` | `#991B1B` | `#FCA5A5` |

#### Mood palette (atmosfera dinamica)

L'header e l'atmosfera dell'app cambiano colore in base al contesto (`experience/moodPalette.ts`):

- **Brand** (default): deep plum `#1C0D30` → viola `#42206B` → lavanda `#BEA7ED` → canvas `#F4F0F9`
- **Green/Yellow/Red**: gradiente semaforo quando l'utente naviga un menù o filtra per stato

### 3.2 Dashboard web — Forest + Emerald (solo B2B)

Fonte: `dashboard-web/src/index.css`

Usata **solo** nell’area ristoratore / gestionale. Non mescolare con la landing consumer.

| Token | Hex | Uso |
|---|---|---|
| Fondo app | `#F7FAF8` | Background generale |
| Superficie | `#FFFFFF` | Card, pannelli |
| Superficie secondaria | `#EEF5F1` | Sezioni alternate |
| Testo principale | `#10201B` | Body, titoli |
| Testo secondario | `#596B63` | Label, metadati |
| Bordi | `#DDE8E2` | Divider, input |
| Brand forest | `#0B5D4D` | Logo area B2B, link, accenti |
| Azione primaria | `#0F8A6A` | CTA dashboard |
| Mint soft | `#DDF8EA` | Highlight, badge |
| Blu verifica | `#2563EB` | Badge "Verificato" |
| Verde / giallo / rosso | stati operativi menù | Non confondere col brand consumer |

### 3.3 Landing pubblica

Fonte: `dashboard-web/src/Landing.tsx` + `dashboard-web/src/components/landing/`

- Stessa lingua dell’app: **Violet Precision**
- CTA flat violet (`#36255C`), secondarie bianco + bordo `#E6DFF5`
- Logo: `Aller` ink + `Tgy` in `#B9A6E8`
- Semaforo demo: badge verde/giallo/rosso solo sui verdetti

---

## 4. Tipografia

### App mobile

| Display / Titoli | Sora | 700–800 | 24–28px |
| Body | Nunito | 500 | 14–14.5px |
| Label operative | Sora | 800 | 11px, letter-spacing 0.6 |
| Caption | Nunito | 600 | 12px |

Scala: `sm` 12 · `base` 14 · `lg` 16 · `xl` 20 · `2xl` 24

Nota: Sora viene utilizzato per i titoli operativi per preferire precisione, densità e peso, evitando display giganti.

### Dashboard web / landing

- Landing: heading espressivo + body leggibile (allineati al consumer violet)
- Dashboard B2B: sistema / Inter — densità alta, niente display giocoso

### Regole tipografiche

- Evitare headline enormi nelle aree operative
- La landing può avere scala grande; l'app deve essere densa e leggibile
- Non usare letter-spacing negativo

---

## 5. Spaziatura, forme e ombre

### Spaziatura

| Token | Mobile | Dashboard |
|---|---|---|
| `xs` | 4px | 4px |
| `sm` | 8px | 8px |
| `md` | 16px | 16px |
| `lg` | 24px | 24px |
| `xl` | 32px | 32px |
| `2xl` | 48px | — |
| `3xl` | 64px | — |

Padding schermo mobile: **16–20px** orizzontale.
Dashboard: griglia 12 colonne, contenuto max **1120–1280px**.

### Border radius (Violet Precision)

| Token | Valore | Uso |
|---|---|---|
| `sm` | 10px | Input, bottoni secondari |
| `md` | 14px | Card standard (DishCard, RestaurantCard) |
| `lg` / `xl` | 16px | Overlay / sheet / grandi blocchi |
| `bar` | 22px | Tab bar floating |
| `pill` | 999px | Chip filtri, badge |

Regola: curvatura visibile ma non giocattolosa. Evitare radius 32+ sulle liste.

### Ombre e superfici

Token shadow (JSON → `tokenShadow`): `softOpacity` 0.04 · `softRadius` 8 · `softOffsetY` 2.

- **Mobile (flat)**: ombra quasi assente via `softShadow()` — priorità al bordo `#E6DFF5`
- **Press**: opacity ~0.88 — mai scale squash 0.91
- **Dashboard B2B**: ombre minime; preferire bordo + superficie diversa
- **Glass chrome**: blur 40 (iOS) / 80 (Android), fill bianco ~55%, tint lavanda soft

### Regole layout

- Evitare card dentro card
- Preferire sezioni, liste e caroselli orizzontali a mosaici decorativi
- Target touch minimo: **44px**
- Contrasto minimo: **WCAG AA**
- Altezza input mobile: min **48px**; dashboard: **40–44px**

---

## 6. Componenti

### Naming ufficiale (mobile)

| Nome | Ruolo | File |
|---|---|---|
| `SurfaceCard` | Card contenuto flat bordered | `ui/SurfaceCard.tsx` |
| `SurfaceButton` | CTA flat violet / soft / danger | `ui/SurfaceButton.tsx` |
| `GlassCard` | Alias storico → wrappa `SurfaceCard` (non è glass) | `ui/GlassCard.tsx` |
| `GlassTabBar` | Tab bar liquid glass + ScanSphere | `ui/GlassTabBar.tsx` |
| `surfaceRaised` / `surfaceTokens` | Helper superficie flat | `ui/surfaceTokens.tsx` |
| `softShadow` | Ombra minima | `theme.ts` |
| `appColors` | Palette TS | `designTokens.ts` |

**Non reintrodurre** nomi `Puffy*`, `marshmallow*`, `puffyShadow`, `puffyColors`.

### 6.1 Bottoni

| Variante | Mobile (Violet Precision) | Dashboard B2B |
|---|---|---|
| Primario | `SurfaceButton` flat `#36255C`, testo bianco, press opacity | Fondo `#0F8A6A`, testo bianco |
| Secondario / soft | Fondo bianco, bordo `#E6DFF5`, testo brand | Fondo bianco, bordo `#DDE8E2`, testo `#0B5D4D` |
| Distruttivo | Rosso sobrio | `#DC2626` |
| CTA scansione | ScanSphere — unico oggetto vivo | — |

Stato press (mobile): opacity ~0.88 — mai scale 0.91.

### 6.2 Input

- Altezza minima mobile: 48px
- Stato focus: bordo brand
- Messaggi errore: testo chiaro, non solo bordo rosso
- Componente mobile: `DebossedInput` (da riallineare a flat bordered)

### 6.3 Card

| Tipo | Uso | Stile |
|---|---|---|
| `SurfaceCard` / `GlassCard` | Contenuto interattivo | Bianco `#FFFFFF`, bordo 1px `#E6DFF5`, radius 16, ombra ≈0 |
| Glass chrome | Solo tab bar / orb header | Frost + blur su lavanda |
| `DishCard` | Piatto nel menù | Foto, nome ink, prezzo; **verdict dot** + label + why |
| `RestaurantCard` | Lista / carosello | Foto edge crop, nome, distanza; bordo flat |

### 6.4 Badge

| Categoria | Valori | Colore |
|---|---|---|
| Piano ristoratore | Gratis, Base, Pro | Neutro / emerald / blu |
| Stato abbonamento | Attivo, Prova, Pagamento KO, Omaggio | Verde / giallo / rosso / grigio |
| Menù | Pubblicato, Da verificare, Non pubblicato | Verde / giallo / grigio |
| Verifica locale | Verificato | Blu `#2563EB` (non verde semaforo) |
| Semaforo | Idoneo, Attenzione, Non idoneo | Verde / giallo / rosso |

### 6.5 Semaforo UI

Componenti: `Traffic.tsx`, `StatoVerdictPill`, `MatchChip`, `ScanSphere`

- Pattern **dot + label + perché** (se non verde)
- Mai colorare tutta la DishCard col wash semaforo
- ScanSphere: 72px, colori semaforo, breathe sottile 1.0→1.04 (~2200ms) — unico ritmo organico
- Filtri sticky: chip flat — attivo = fill solido semaforo; inattivo = bordo `#E6DFF5`

### 6.6 Navigazione

**App cliente (`GlassTabBar`):**
- Home · Ristoranti · **[Scansiona]** · Preferiti · Profilo
- Tab bar liquid glass su canvas lavanda
- Azione centrale: ScanSphere → `/scanner` (unico oggetto vivo)

**App ristoratore (tab bar):**
- Attività · Menù · QR · Profilo

**Dashboard web (sidebar):**
- Panoramica · Menù · Impostazioni · Piano · QR

---

## 7. Schermate e flussi UX

### 7.1 Onboarding cliente (max 3 slide)

1. Benvenuto — "Mangia fuori in sicurezza"
2. Profilo allergie — selezione dal catalogo UE + preferenze
3. Pronto — "Scansiona il QR del ristorante"

Copy breve, senza troppi emoji. Consenso Termini, Privacy e dati sanitari obbligatorio.

### 7.2 Home cliente

```
┌─────────────────────────────┐
│  Ciao, [Nome]        🔔 SOS │
│  Profilo: [Switcher]        │
├─────────────────────────────┤
│  Banner profilo allergie    │
├─────────────────────────────┤
│  [ Cerca / codice 6 cifre ] │
├─────────────────────────────┤
│  Vicino a te (top 3)        │
│  [RestaurantCard] × 3       │
└─────────────────────────────┘
```

Regole:
- La scansione QR vive **solo** nella tab bar (ScanSphere) — non duplicarla in Home
- Un solo campo: cerca nome/città/piatto **oppure** codice a 6 cifre
- Switcher profilo (io / famiglia) dall’header Home
- SOS e bandiere lingua nell’header floating
- Home = orientamento (vicini) — **niente feed recensioni, niente CTA scan inline**

### 7.3 Menù ristorante

```
┌─────────────────────────────┐
│  ← [Nome Ristorante]        │
│  Compatibilità: 72% 🟢      │
├─────────────────────────────┤
│ [Tutti] [🟢12] [🟡3] [🔴5] │  ← filtri sticky
├─────────────────────────────┤
│  ▼ Idonei (12)              │
│  [DishCard] …               │
│  ▼ Con attenzione (3)       │
│  [DishCard]                 │
│  ▼ Non idonei (5)           │
│  [DishCard]                 │
├─────────────────────────────┤
│  Annotazioni / recensioni   │  ← qui, non in Home
└─────────────────────────────┘
```

- Riepilogo conteggi verde/giallo/rosso in alto
- Sezioni collassabili per stato
- Mood atmosfera cambia colore in base al filtro attivo
- Disclaimer sempre raggiungibile

### 7.4 Profilo / Account

Sezioni:
- Allergie e preferenze (modifica)
- Sottoprofili famiglia (Plus)
- Lingua (5 lingue: IT, EN, ES, DE, FR)
- Emergenza (farmaci, contatto, Apple Salute)
- Documenti medici (upload + AI)
- Notifiche
- Disclaimer e testi legali
- Cancellazione account (GDPR)

### 7.5 Spesa (scanner barcode)

Secondario rispetto al loop hero (QR ristorante).

- Scansione EAN-13/8, UPC
- Semaforo prodotto via Open Food Facts
- Evidenziazione ingredienti critici
- Cronologia e preferiti (locale)
- Torcia per scansione al buio

### 7.6 Dashboard ristoratore (Forest)

**Panoramica:** stato pubblicazione, piano, KPI  
**Editor menù:** allergeni assente · contiene · tracce + conferma legale  
**QR e stampa:** anteprima, PDF registro A4, table card

### 7.7 Landing pubblica (Violet)

```
┌─────────────────────────────────────────┐
│  Logo violet   Area Clienti · Dashboard │
├─────────────────────────────────────────┤
│  AllerTgy (hero brand)                  │
│  Cosa posso mangiare qui?               │
│  [Prova come cliente] [Ristoratori]     │
│  [Demo semaforo interattivo]            │
├─────────────────────────────────────────┤
│  Il Semaforo · Clienti · Ristoratori    │
│  Prezzi · Footer + disclaimer           │
└─────────────────────────────────────────┘
```

Tono: fiducia, non paura. Stessa palette dell’app. Visual al tavolo, non card SaaS generica.

### 7.8 Admin interno

- Header scuro sobrio, densità alta
- KPI in riga; tabella locali come elemento principale
- Colori solo per stato, piano, rischio e azione

---

## 8. Icone e immagini

| Contesto | Stile |
|---|---|
| Mobile chrome | Icone lineari geometriche (stroke 1.5–2, round caps) — stile Lucide |
| Mobile allergeni | Glyph a tratto singolo in cerchio soft lavanda — **no emoji** |
| Semaforo | Colore solido + icona line + label testo (mai solo emoji) |
| Dashboard B2B | Icone lineari professionali, no emoji |
| Landing | lucide-react |

**Foto piatti:** reali dove possibile; placeholder intelligenti per categoria. Le immagini aiutano a riconoscere il piatto ma non devono sovrastare lo stato allergeni.

---

## 9. Motion e interazioni

| Contesto | Comportamento |
|---|---|
| Landing | Ingresso leggero headline + visual, nessuna animazione invasiva |
| Mobile — filtri menù | Transizioni rapide, chip fill solido al tap |
| Mobile — ScanSphere | Breathe sottile 1.0→1.04, ~2200ms — unico oggetto organico |
| Mobile — bottoni / card | Press opacity ~0.88, no scale squash |
| Mobile — caroselli | Scorrimento orizzontale — densità leggera |
| Dashboard B2B | Hover/focus chiari, salvataggio con stato "in corso" |
| Glass | Blur nativo iOS/Android, fallback CSS su web |

---

## 10. Materiali stampati

### QR Table Card

```
┌──────────────────────┐
│     [Logo AllerTgy]  │
│                      │
│  Scansiona per        │
│  leggere il menu      │
│  allergeni del locale │
│                      │
│     [QR CODE]        │
│                      │
│  Codice: 100001      │
│                      │
│  Comunica sempre le   │
│  tue allergie al      │
│  personale.           │
└──────────────────────┘
```

- Alto contrasto, stampabile B/N
- Border netto, radius ~24px

### Registro allergeni PDF

- Nome locale, data, versione menù
- Tabella: piatto · categoria · allergeni contenuti · possibili tracce
- Referente allergeni, nota legale finale
- Formato A4 orizzontale

---

## 11. Accessibilità

- Contrasto minimo **WCAG AA** su tutti i testi
- Target touch **≥ 44px**
- Stati semaforo: colore + icona + label + testo motivazione
- Non affidare informazioni critiche solo al colore
- Supporto screen reader: label esplicite su badge e filtri
- Input con messaggi errore testuali

---

## 12. Multilingua

5 lingue: IT · EN · ES · DE · FR

- Bandiere nell'header per switch rapido
- Traduzione automatica menù via AI (Gemini)
- Traduzione allergeni nella lingua corrente
- Microcopy UI in `constants/translations.ts`

---

## 13. Piani commerciali (contesto design)

### Ristoratori

| Piano | Prezzo | Badge | Funzionalità visibili |
|---|---|---|---|
| Gratis | €0 | Grigio | Scheda mappa, 1 foto |
| Base | €9/mese | Emerald (B2B) | Semaforo, QR, PDF, menù digitale |
| Pro | €19/mese | Blu | + Push, AI illimitata, statistiche |

### Clienti

| Piano | Prezzo | Funzionalità |
|---|---|---|
| Gratis | €0 | Scan, 1 profilo |
| Plus Famiglia | €3,99/mese | Sottoprofili, spesa illimitata |

---

## 14. File di riferimento nel codice

| File | Contenuto |
|---|---|
| `design.md` | Questo documento (fonte narrativa) |
| `app-mobile/design_guidelines.json` | Fonte unica token mobile |
| `app-mobile/src/designTokens.ts` | Bridge JSON → `appColors`, `tokenShadow.soft*` |
| `app-mobile/src/theme.ts` | `colors`, `softShadow`, `verdictColor`, typography |
| `app-mobile/src/experience/moodPalette.ts` | Palette atmosfera dinamica |
| `app-mobile/src/engine/semaforo.ts` | Motore semaforo (logica pura) |
| `app-mobile/src/components/DishCard.tsx` | Card piatto + verdetto |
| `app-mobile/src/components/ui/SurfaceCard.tsx` | Card flat |
| `app-mobile/src/components/ui/SurfaceButton.tsx` | Bottoni flat |
| `app-mobile/src/components/ui/GlassTabBar.tsx` | Tab bar + ScanSphere |
| `app-mobile/src/components/ui/surfaceTokens.tsx` | `surfaceRaised` e helper |
| `app-mobile/app/(tabs)/home/index.tsx` | Home snella (cerca + vicini) |
| `dashboard-web/src/Landing.tsx` | Landing Violet Precision |
| `dashboard-web/src/components/landing/` | Sezioni landing |
| `dashboard-web/src/index.css` | Token dashboard B2B + CTA landing |

---

## 15. Do's e Don'ts

### ✅ Do

- Usare lavanda `#D2C3F6` per soft fill e glass tint (consumer)
- Usare violet `#36255C` per azioni e ink (consumer)
- Mantenere card bianche su canvas lavanda
- Riservare verde/giallo/rosso al semaforo
- Spiegare sempre *perché* un piatto è rosso o giallo
- Tenere lo scan solo in ScanSphere / tab bar
- Usare "Idoneo" invece di "Sicuro"
- Densità alta nella dashboard ristoratore (Forest)
- Disclaimer sobrio ma sempre raggiungibile
- Usare `Surface*` / `GlassTabBar` / `softShadow` nei nuovi file

### ❌ Don't

- Reintrodurre `Puffy*`, marshmallow gloss, press scale squash
- Inventare viola intermedi tra lavanda e violet
- Inondare lo schermo con gradienti violet scuri
- Usare verde/teal come brand **consumer** (compete col semaforo)
- Blur sui badge semaforo (devono restare solid)
- Card dentro card
- Feed sociale / recensioni in Home
- CTA “Scansiona” duplicata in Home
- Palette cream/green sulla landing consumer
- Promesse assolute ("100% sicuro")
- Opacizzare troppo i piatti rossi
- Ombre pesanti: preferire bordo + superficie

---

## 16. Evoluzione prevista

| Fase | Intervento |
|---|---|
| **Attuale (locked)** | Violet Precision: `Surface*` / `GlassTabBar` / `softShadow`; Home snella; landing violet; B2B forest separato |
| Prossima | Glyph set allergeni lineari; `DebossedInput` → flat bordered; opzionale rename `GlassCard` → alias esplicito |
| Store | App icon, screenshot, splash allineati a Violet Precision |
| Cleanup | Deprecare / non aggiornare `vetrina-frontend` come brand |
| i18n landing | Inglese per mercato EU |

---

*Ultimo aggiornamento: 20 luglio 2026*  
*Stile consumer: Violet Precision — allineato a `app-mobile/design_guidelines.json`*  
*Stile B2B: Forest + Emerald — `dashboard-web` area ristoratore*
