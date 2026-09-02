# AllerTgy — Specifiche di Stile (Design System)
> **Versione:** 2.0 (Cosmic Glass & Vanilla Clarity)  
> **Target:** App Mobile (iOS / Android) & Vetrina  
> **File sorgente di riferimento:** `app-mobile/design_guidelines.json`, `app-mobile/src/theme.ts`, `app-mobile/src/designTokens.ts`, `app-mobile/src/components/ui/`

---

## 1. Filosofia Visiva & Identità Brand

AllerTgy è uno **strumento di precisione clinica e serenità al tavolo**:
- **Cosmic Glass (`#23212C`)**: Toni scuri eleganti, moderni e rassicuranti usati per elementi di controllo primari, dock bar e gradienti premium.
- **Vanilla Glow (`#F1FEC8`)**: Tonalità vaniglia/lime chiarissima, usata come accento luminoso e distintivo del brand (mai verde semaforo).
- **Semaforo Clinico Puro**: Verde (`#10B981`), Giallo (`#F59E0B`), Rosso (`#EF4444`) riservati **esclusivamente** ai verdetti di sicurezza alimentare.
- **Glassmorphism Rigoroso**: Superfici semi-trasparenti con `backdropFilter: blur(5px)` / `expo-blur (intensity 60-80)`, bordi sottili e riflessi discreti.
- **Iconografia Unificata Outline**: Solo icone lineari sottili (`Ionicons *-outline`).

---

## 2. Palette Colori & Token Cromatici

### 2.1 Colori Brand & Superfici Fondamentali

| Token | Valore HEX / RGBA | Ruolo / Utilizzo |
|---|---|---|
| `brand` / `cosmic` | `#23212C` | Colore primario brand, pulsanti principali, header bar, dock |
| `brandHover` / `dark` | `#191820` | Stato premuto/hover pulsanti scuri |
| `brandDarker` | `#121118` | Inizio gradiente cosmico profondo / Obsidian |
| `vanilla` / `brand200` | `#F1FEC8` | Accento primario luminoso, badge profilo, highlight vaniglia |
| `brandTertiary` | `#F7FEE7` | Superfici chiarissime tinte vaniglia |
| `brand50` | `#FCFFF2` | Sfondi chip selezionate, box risposte AI |
| `surface` (Canvas Light) | `#F8FAFC` | Sfondo generale dell'applicazione (Light Mode) |
| `surfaceSecondary` | `#FFFFFF` | Sfondo card, popup, fogli modali |
| `surfaceTertiary` | `#F1F5F9` | Sfondi campi input, track slider, debossed wells |
| `surfaceInverse` | `#23212C` | Sfondo elementi invertiti / Dark mode container |

### 2.2 Colori Tipografia & Contrasto

| Token | Light Mode | Dark Mode | Descrizione |
|---|---|---|---|
| `onSurface` / `ink` | `#0F172A` / `#23212C` | `#FFFFFF` | Testo principale, titoli ad alto contrasto |
| `onSurfaceMuted` / `textSecondary` | `#64748B` / `#475569` | `#CBD5E1` | Sottotitoli, descrizioni secondarie, label |
| `textMuted` | `#94A3B8` | `#94A3B8` | Didascalie disabilitate, placeholder |
| `onBrand` | `#FFFFFF` | `#FFFFFF` | Testo su pulsanti Cosmic `#23212C` |
| `onBrandSecondary` | `#23212C` | `#23212C` | Testo su pill Vanilla `#F1FEC8` |
| `eyebrow` (titoli sezioni) | `#64748B` | `#F1FEC8` | Testo uppercase compatto (11px) |

### 2.3 Semaforo Assoluto (Sicurezza Alimentare)

> [!IMPORTANT]
> I colori verde/giallo/rosso **non devono mai** essere usati per scopi decorativi o brand. Sono l'arbitro visivo della sicurezza alimentare del cliente.

| Stato | Solid (Icona/Pill) | Soft (Sfondo) | Border (Bordo) | Text (Testo) | Significato |
|---|---|---|---|---|---|
| 🟢 **Idoneo / Safe** | `#10B981` | `#ECFDF5` | `#A7F3D0` (`#6EE7B7`) | `#065F46` | Nessun allergene rilevato |
| 🟡 **Attenzione / Warning** | `#F59E0B` | `#FFFBEB` | `#FCD34D` | `#92400E` | Tracce / Rischio contaminazione / Dati parziali |
| 🔴 **Non Idoneo / Danger** | `#EF4444` | `#FEF2F2` | `#FCA5A5` | `#991B1B` | Contiene allergeni bloccanti |
| ⚪ **Neutro / Non verificato** | `#64748B` | `#F1F5F9` | `#CBD5E1` | `#334155` | Informazione assente o non dichiarata |

### 2.4 Token Glassmorphism & Trasparenze

```ts
// Cosmic Glass (Dock Capsule, Overlay scuri)
export const COSMIC_GLASS = {
  background: 'rgba(35, 33, 44, 0.82)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderHighlight: 'rgba(241, 254, 200, 0.35)',
  borderRadius: 16, // o 30 per la Dock Capsule
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
  blurIntensity: 60,
};

// Vanilla Glass (Pill attive, highlight luminosi)
export const VANILLA_GLASS = {
  background: 'rgba(241, 254, 200, 0.60)',
  border: '1px solid rgba(255, 255, 255, 0.40)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.10)',
  blurIntensity: 60,
};
```

---

## 3. Tipografia & Gerarchia Testi

La tipografia di AllerTgy unisce **autorevolezza moderna** e **leggibilità immediata**:
- **Display Font**: `Fredoka` (`Fredoka-Bold`, `Fredoka-SemiBold`, `Fredoka-Medium`) per titoli, numeri grandi, label e metriche.
- **Body Font**: `Nunito` (`Nunito-Bold`, `Nunito-SemiBold`, `Nunito-Regular`) per testi correnti, paragrafi, liste e note legali.

### Tabella Scale Tipografiche (`AppText`)

| Variante | Font Family | Size | Line Height | Weight / Tracking | Utilizzo Tipico |
|---|---|---|---|---|---|
| `metric` | `Fredoka-Bold` | **34px** | 38px | 800 / -0.8 | Percentuali compatibilità, numeri hero |
| `hero` | `Fredoka-Bold` | **28px** | 34px | 800 / -0.7 | Titoli principali onboarding, hero home |
| `h1` | `Fredoka-Bold` | **26px** | 30px | 800 / -0.7 | Titoli di pagina, schermata scanner |
| `h2` | `Fredoka-SemiBold` | **20px** | 25px | 800 / -0.3 | Titoli di sezioni ampie, modali |
| `title` | `Fredoka-SemiBold` | **17px** | 22px | 700 / -0.2 | Intestazioni di card, voci impostazioni |
| `subtitle` | `Nunito-SemiBold` | **14px** | 20px | 600 / 0 | Sottotitoli descrittivi |
| `body` | `Nunito-Regular` | **15px** | 22px | 500 / 0 | Testo descrittivo standard, paragrafi |
| `bodyBold` | `Nunito-Bold` | **15px** | 21px | 700 / 0 | Testo enfatizzato, allergeni importanti |
| `label` | `Fredoka-Medium` | **13px** | 17px | 600 / 0.2 | Etichette chip, badge piccoli, tab |
| `caption` | `Nunito-SemiBold` | **12px** | 16px | 600 / 0.2 | Note a piè pagina, timestamp, metadati |
| `eyebrow` | `Nunito-Bold` | **11px** | 14px | 700 / **+1.4 (UPPERCASE)** | Intestazioni mini di sezione (`Section`) |

---

## 4. Bordi, Raggi (Border Radius) & Tratti

### 4.1 Raggi di Curvatura (`radius`)

| Token | Valore | Applicazione nel Design System |
|---|---|---|
| `radius.sm` | **10px** | Icon wells, campi input compatti, badge secondari |
| `radius.md` | **14px** | Card standard (`SurfaceCard`), bottoni compatti, filtri |
| `radius.lg` | **18px** | Card ampie, modali, schede di dettaglio locale |
| `radius.xl` | **22px** | Grandi contenitori evidenziati, hero box semaforo |
| `dock / capsule` | **30px** | Dock bar inferiore (`GlassTabBar`), floating capsules |
| `radius.pill` | **999px** | Pulsanti principali (`PuffyButton`), pill badge, chip |

### 4.2 Spessori & Colori dei Bordi

- **Tratto Sottile Standard (`1px`)**:
  - Light mode: `#E2E8F0` (oppure `rgba(15, 23, 42, 0.08)`)
  - Dark mode: `rgba(255, 255, 255, 0.14)`
- **Tratto Medio / Vetro (`1.2px - 1.5px`)**:
  - Bordo dock capsule: `rgba(255, 255, 255, 0.22)`
  - Bordo badge semaforo: `1.5px` con colore specifico del verdetto (`#A7F3D0` / `#FCD34D` / `#FCA5A5`)
- **Tratto Marcato (`2px`)**:
  - Pulsanti primari: `borderColor: #191820`
  - Stato selezionato / Focus: `#23212C` (o Vanilla `#F1FEC8`)
- **Tratto Chip Allergeni (`2.5px`)**:
  - Evidenziazione della gravità dell'allergia selezionata (Grave: `#E5484D`, Moderata: `#F97316`, Lieve: `#EAB308`, Dieta: `#10B981`)

---

## 5. Ombreggiature (Shadows) & Profondità

AllerTgy impiega ombre **soffuse e tinteggiate** (mai nere opache piatte):

```ts
// Ombra Puffy / Soft Card
export const cardShadow = {
  shadowColor: '#23212C',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 2,
};

// Ombra Dock Bar / Capsule Fluttuante
export const dockCapsuleShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.35,
  shadowRadius: 20,
  elevation: 14,
};

// Glow Semaforo (per il verdetto attivo)
export const verdictGlow = (color: string) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.30,
  shadowRadius: 8,
  elevation: 4,
});
```

---

## 6. Spaziature & Griglia (`spacing`)

| Token | Valore | Utilizzo |
|---|---|---|
| `spacing.xs` | **4px** | Micro-gap tra icona e testo, padding badge |
| `spacing.sm` | **8px** | Gap interno righe, padding orizzontale compatto |
| `spacing.md` | **16px** | Margine standard tra elementi, padding card |
| `spacing.lg` | **24px** | Margine tra sezioni, padding orizzontale schermo (`SCREEN_PADDING_H`) |
| `spacing.xl` | **32px** | Spazio tra macro blocchi |
| `spacing.2xl` | **48px** | Spazio superiore schermate hero |
| `TAB_BAR_CLEARANCE` | **110px** | Padding inferiore necessario in tutti gli scroll per non coprire i contenuti con la Dock bar |

---

## 7. Regole Iconografia

```
┌─────────────────────────────────────────────────────────────┐
│  REGOLE DESIGN SYSTEM ICONOGRAFIA                           │
├─────────────────────────────────────────────────────────────┤
│  ✓ ESCLUSIVAMENTE stile Outline (Ionicons *-outline,       │
│    chevron-*, close, add).                                  │
│  ✓ Tratto uniforme e sottile (stroke 1.5 - 2px).           │
│  ✗ NESSUN mix con icone piene (solid/filled), 3D o sticker. │
│  ✓ Emoji di sistema per allergeni e categorie alimentari.    │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Mappatura Componenti Chiave

| Componente | File Sorgente | Stile / Proprietà Salienti |
|---|---|---|
| `<AppText />` | `src/components/ui/AppText.tsx` | Supporta 10 varianti tipografiche, switch automatico dark mode |
| `<PuffyButton />` | `src/components/ui/PuffyButton.tsx` | Pulsante pill (`radius.pill`), haptic feedback, animazione spring al press |
| `<SurfaceCard />` | `src/components/ui/SurfaceCard.tsx` | Card bianca elegante, bordo `#E2E8F0`, zero distorsione cromatica |
| `<SettingsRow />` | `src/components/ui/SettingsRow.tsx` | Riga impostazioni con icon well quadrata (`radius.sm`), titolo e chevron |
| `<SemaforoBadge />` | `src/components/ui/SemaforoBadge.tsx` | 5 varianti (`hero`, `soft`, `solid`, `outline`, `dot`), colori semaforici rigidi |
| `<AllergyChip />` | `src/components/ui/AllergyChip.tsx` | Cerchio emoji con bordo di gravità (2.5px) e checkmark badge |
| `<PillToggle />` | `src/components/ui/PillToggle.tsx` | Toggle a slitta animata con sfondo `surfaceTertiary` e pill `surfaceSecondary` |
| `<GlassTabBar />` | `src/components/ui/GlassTabBar.tsx` | Dock capsule fluttuante a raggio 30px con Cosmic Glass e integrazione profilo / AI |
| `<Section />` | `src/components/ui/Section.tsx` | Intestazione di sezione con titolo `eyebrow` maiuscolo e slot azione |

---

## 9. Do's & Don'ts Visivi

### ✅ DA FARE (DO)
- **Mantieni le card bianche e pulite** (`#FFFFFF` su sfondo `#F8FAFC`).
- **Usa Cosmic `#23212C` per le azioni primarie** con tocchi luminosi di Vanilla `#F1FEC8`.
- **Riserva il verde (`#10B981`) unicamente ai piatti sicuri e idonei**.
- **Garantisci sempre il padding inferiore** di almeno `110px` negli `ScrollView` per non andare sotto la Dock bar fluttuante.
- **Usa solo icone outline** per mantenere un'estetica snella e raffinata.

### ❌ DA EVITARE (DON'T)
- **NON usare il verde come colore di sfondo del brand o per i badge del profilo** (genera confusione con il semaforo "Idoneo").
- **NON usare grigi spenti e piatti**: usa le sfumature Cosmic, Vanilla e Slate chiarissimo.
- **NON mischiare stili iconografici** (vietate icone piene colorate o pacchetti disomogenei).
- **NON applicare blur o trasparenze eccessive sui badge semaforici**: la valutazione di sicurezza deve essere netta, solida e leggibile istantaneamente.
