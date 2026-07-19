# AllerTgy — Usa l'app anche fuori casa (Mac come VPS)

Il tuo Mac fa da server personale. Il telefono si collega al backend sul Mac anche quando non sei sulla stessa Wi‑Fi.

## Quale metodo scegliere?

| Metodo | Costo | URL stabile | Sicurezza | Consigliato per |
|---|---|---|---|---|
| **Tailscale** | Gratis | Sì (IP fisso `100.x.x.x`) | Alta (VPN privata) | Uso quotidiano |
| **Cloudflare Tunnel** | Gratis | No* | Media | Test rapidi senza app extra |
| **ngrok** | Gratis | No | Media | Test rapidi |

\* Con dominio Cloudflare puoi avere URL stabile (setup avanzato).

**Consiglio:** usa **Tailscale**. È gratuito, sicuro e l'IP non cambia mai.

---

## Opzione A — Tailscale (consigliata)

### 1. Sul Mac

```bash
brew install --cask tailscale
```

Apri **Tailscale** dal menu bar → fai login (account Google/GitHub va bene).

### 2. Sul telefono

- iOS: [Tailscale su App Store](https://apps.apple.com/app/tailscale/id1475387142)
- Android: [Tailscale su Play Store](https://play.google.com/store/apps/details?id=com.tailscale.ipn)

Accedi con lo **stesso account** del Mac.

### 3. Avvia AllerTgy in modalità remota

```bash
bash scripts/dev-remote.sh tailscale
```

Lo script mostra l'IP Tailscale (es. `100.64.0.5`) e il QR per Expo Go:
`exp://100.64.0.5:8081`

### 4. Sul telefono

1. Attiva Tailscale (icona verde = connesso)
2. Apri **Expo Go** e scansiona il QR
3. L'app funziona ovunque (4G, altra Wi‑Fi, all'estero)

### Requisiti

- Il Mac deve restare **acceso** e connesso a internet
- In **Impostazioni → Batteria** disattiva "Metti Mac in stop automaticamente" quando è collegato alla corrente

---

## Opzione B — Cloudflare Tunnel (senza app sul telefono)

Utile se non vuoi installare Tailscale sul telefono. L'URL API cambia a ogni avvio.

```bash
bash scripts/dev-remote.sh cloudflare
```

Expo usa il tunnel integrato: funziona anche fuori casa, ma l'URL cambia ogni volta che riavvii.

---

## Opzione C — ngrok

```bash
# Una tantum: crea account su https://ngrok.com
ngrok config add-authtoken <IL_TUO_TOKEN>

bash scripts/dev-remote.sh ngrok
```

---

## Avvio locale (solo stessa Wi‑Fi)

```bash
bash dev.sh
# oppure
npm run dev
```

---

## Mac sempre acceso come server

Per non dover avviare manualmente ogni volta:

1. **Energia:** Impostazioni → Batteria → alimentazione → disattiva stop automatico
2. **Riavvio automatico:** opzionale, crea un LaunchAgent (avanzato)
3. **Build installata sul telefono** (fase successiva): con `eas build` l'app non dipende più da Expo Go né da Metro — serve solo che il backend sia raggiungibile

```bash
cd app-mobile
eas build --profile development --platform ios   # o android
```

Nella build imposti `EXPO_PUBLIC_API_URL` con l'IP Tailscale o il dominio tunnel.

---

## Risoluzione problemi

| Problema | Soluzione |
|---|---|
| App non si connette fuori casa | Verifica che Tailscale sia attivo su Mac e telefono |
| QR non funziona | Stesso account Tailscale su entrambi i dispositivi |
| API 401 / CORS | Riavvia con `dev-remote.sh` (imposta `CORS_ORIGINS=*`) |
| Mac si spegne | Collega alimentatore, disattiva stop automatico |
| URL ngrok/cloudflare cambia | Usa Tailscale per URL stabile |

---

## Sicurezza

- **Tailscale:** solo i tuoi dispositivi vedono il Mac. Nessuna porta aperta sul router.
- **Tunnel pubblici (ngrok/cloudflare):** l'API è esposta su internet. Usa solo in sviluppo, non in produzione.
- Per produzione vera: VPS dedicato (~€5/mese) — vedi `PRODUZIONE.md`.
