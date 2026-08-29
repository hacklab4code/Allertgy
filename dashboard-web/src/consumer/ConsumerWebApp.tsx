import { useEffect, useMemo, useRef, useState } from 'react';
import { api, API, type Allergen, type DishOut, type MenuOut } from '../api';
import {
  WireApp, WireBlock, WireBtn, WireGrid, WireHeader, WireInput,
  WireLayout, WireNav, WireRow, WireZone,
} from '../wireframe/WireframeUi';
import { calcolaSemaforo, compatibilitaPercentuale, statoLocale } from '../wireframe/semaforo';
import {
  ACCOUNT_DISCLAIMER,
  KITCHEN_SAFE_HINT,
  SAFETY_REMINDER,
  SEMAFORO_SECTION,
} from './trustCopy';

type Tab = 'home' | 'locali' | 'scanner' | 'account';
type Overlay = 'menu' | 'emergency' | 'notifiche' | 'preferiti' | 'allergie' | null;
type LocaliMode = 'lista' | 'mappa';
type MenuFilter = 'tutti' | 'verde' | 'giallo' | 'rosso';

type Props = {
  onBack: () => void;
  onLogout: () => void;
};

export default function ConsumerWebApp({ onBack, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);

  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [customerPlans, setCustomerPlans] = useState<{ code: string; name: string; price_cents: number; features: string[] }[]>([]);
  const [emergencyDraft, setEmergencyDraft] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState('');

  const [restaurants, setRestaurants] = useState<MenuOut[]>([]);
  const [menu, setMenu] = useState<MenuOut | null>(null);
  const [menuFilter, setMenuFilter] = useState<MenuFilter>('tutti');
  const [codice, setCodice] = useState('');
  const [scanHistory, setScanHistory] = useState<string[]>([]);

  const [localiMode, setLocaliMode] = useState<LocaliMode>('lista');
  const [search, setSearch] = useState('');
  const [compatFilter, setCompatFilter] = useState<'tutti' | '100' | '80'>('tutti');
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [allergenSearch, setAllergenSearch] = useState('');

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>(null);

  const hasAllergie = selected.size > 0;

  const loadData = async () => {
    try {
      const [all, mine, prof, ref, docs, rs, cplans] = await Promise.all([
        api.allergens(),
        api.myAllergens(),
        api.getProfile(),
        api.getReferralStats().catch(() => null),
        api.getDocuments(),
        api.listRestaurants(),
        api.getCustomerPlans().catch(() => []),
      ]);
      setAllergens(all);
      setSelected(new Set(mine.map((a) => a.code)));
      setProfile(prof);
      setDisplayNameDraft(prof.display_name ?? '');
      setReferral(ref);
      setDocuments(docs);
      setRestaurants(rs);
      setCustomerPlans(cplans);
      setEmergencyDraft(prof.emergency_medicines ?? '');
      setContactName(prof.emergency_contact_name ?? '');
      setContactPhone(prof.emergency_contact_phone ?? '');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get('customer_billing');
    if (!billing) return;
    if (billing === 'success') {
      setError('');
      loadData();
    } else if (billing === 'cancel') {
      setError('Acquisto Plus Famiglia annullato.');
    }
    params.delete('customer_billing');
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState({}, '', next);
  }, []);

  const plusPlan = customerPlans.find((p) => p.code === 'customer_plus');
  const hasPlus = referral?.has_plus ?? false;
  const plusActive = referral?.customer_subscription_status === 'active';

  const purchasePlus = async () => {
    setBusy(true); setError('');
    try {
      const res = await api.customerCheckout();
      if (res.checkout_url) window.location.href = res.checkout_url;
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'SESSION_EXPIRED') onLogout();
      else setError(msg);
    }
    setBusy(false);
  };

  const managePlus = async () => {
    setBusy(true); setError('');
    try {
      const res = await api.customerPortal();
      if (res.portal_url) window.location.href = res.portal_url;
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'SESSION_EXPIRED') onLogout();
      else setError(msg);
    }
    setBusy(false);
  };

  useEffect(() => {
    if (localiMode !== 'mappa') return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { setUserLat(p.coords.latitude); setUserLng(p.coords.longitude); },
        () => { setUserLat(45.4642); setUserLng(9.1900); },
      );
    } else {
      setUserLat(45.4642); setUserLng(9.1900);
    }
  }, [localiMode, tab]);

  useEffect(() => {
    if (tab !== 'locali' || localiMode !== 'mappa' || userLat == null || userLng == null) {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      return;
    }
    const L = (window as any).L;
    if (!L) return;
    const timer = setTimeout(() => {
      const el = document.getElementById('consumer-map');
      if (!el || mapRef.current) return;
      const map = L.map('consumer-map').setView([userLat, userLng], 13);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      markersRef.current = L.layerGroup().addTo(map);
      L.marker([userLat, userLng]).addTo(map).bindTooltip('Tu');
    }, 100);
    return () => clearTimeout(timer);
  }, [tab, localiMode, userLat, userLng]);

  const restaurantsEnriched = useMemo(() => {
    return restaurants.map((r, idx) => {
      const pct = compatibilitaPercentuale(selected, r.piatti);
      const stato = statoLocale(selected, r.piatti);
      const lat = r.latitude ?? 45.4642 + (idx % 5 - 2) * 0.01;
      const lng = r.longitude ?? 9.19 + (idx % 3 - 1) * 0.01;
      return { ...r, pct, stato, lat, lng };
    });
  }, [restaurants, selected]);

  const filteredRestaurants = useMemo(() => {
    let list = restaurantsEnriched;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        r.nome_ristorante.toLowerCase().includes(q) ||
        (r.citta ?? '').toLowerCase().includes(q) ||
        r.public_code.includes(q),
      );
    }
    if (compatFilter === '100') list = list.filter((r) => r.pct === 100);
    if (compatFilter === '80') list = list.filter((r) => (r.pct ?? 0) >= 80);
    return list;
  }, [restaurantsEnriched, search, compatFilter]);

  const nearbyTop3 = useMemo(() => {
    if (userLat == null || userLng == null) return filteredRestaurants.slice(0, 3);
    return [...filteredRestaurants]
      .sort((a, b) => {
        const da = (a.lat - userLat) ** 2 + (a.lng - userLng) ** 2;
        const db = (b.lat - userLat) ** 2 + (b.lng - userLng) ** 2;
        return da - db;
      })
      .slice(0, 3);
  }, [filteredRestaurants, userLat, userLng]);

  const openMenu = async (code: string) => {
    setBusy(true); setError('');
    try {
      const res = await api.publicMenu(code.trim());
      setMenu(res);
      setOverlay('menu');
      setScanHistory((h) => [code, ...h.filter((c) => c !== code)].slice(0, 8));
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const valutati = useMemo(() => {
    if (!menu) return [];
    return menu.piatti.map((p) => ({ p, esito: calcolaSemaforo(selected, p) }));
  }, [menu, selected]);

  const filteredDishes = useMemo(() => {
    if (menuFilter === 'tutti') return valutati;
    return valutati.filter((v) => v.esito.stato === menuFilter);
  }, [valutati, menuFilter]);

  const countBy = (s: 'verde' | 'giallo' | 'rosso') => valutati.filter((v) => v.esito.stato === s).length;

  const toggleAllergen = (code: string) => {
    const s = new Set(selected);
    s.has(code) ? s.delete(code) : s.add(code);
    setSelected(s);
  };

  const saveAllergens = async () => {
    setBusy(true);
    try {
      await api.saveAllergens([...selected]);
      setOverlay(null);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const saveEmergency = async () => {
    setBusy(true);
    try {
      await api.updateAppleHealth(0, emergencyDraft.trim() || null, contactName.trim() || null, contactPhone.trim() || null);
      await loadData();
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const saveDisplayName = async () => {
    const name = displayNameDraft.trim();
    if (!name) {
      setAccountMsg('Inserisci un nome.');
      return;
    }
    setBusy(true);
    setAccountMsg('');
    setError('');
    try {
      const p = await api.updateProfile(name);
      setProfile(p);
      setDisplayNameDraft(p.display_name ?? name);
      setAccountMsg('Nome aggiornato.');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'SESSION_EXPIRED') onLogout();
      else setError(msg);
    }
    setBusy(false);
  };

  const savePassword = async () => {
    if (!currentPassword) {
      setAccountMsg('Inserisci la password attuale.');
      return;
    }
    if (newPassword.length < 8) {
      setAccountMsg('La nuova password deve avere almeno 8 caratteri.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAccountMsg('Le due password non coincidono.');
      return;
    }
    setBusy(true);
    setAccountMsg('');
    setError('');
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setAccountMsg('Password aggiornata.');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'SESSION_EXPIRED') onLogout();
      else setError(msg);
    }
    setBusy(false);
  };

  const filteredAllergens = useMemo(() => {
    const q = allergenSearch.trim().toLowerCase();
    if (!q) return allergens;
    return allergens.filter((a) => a.name_it.toLowerCase().includes(q) || a.code.includes(q));
  }, [allergens, allergenSearch]);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'locali', label: 'Ristoranti' },
    { id: 'scanner', label: 'Scansiona' },
    { id: 'account', label: 'Profilo' },
  ];

  const closeOverlay = () => { setOverlay(null); setMenu(null); };

  return (
    <WireApp>
      {/* HEADER GLOBALE — come tab layout mobile */}
      <WireHeader
        title="AllerTgy Cliente"
        left={<WireBtn onClick={onBack}>← Esci</WireBtn>}
        right={
          <>
            <WireBtn variant="danger" onClick={() => setOverlay('emergency')}>SOS</WireBtn>
            <WireBtn onClick={() => setOverlay('notifiche')}>Notifiche</WireBtn>
          </>
        }
      />

      {/* BARRA PROFILO ATTIVO */}
      <div style={{ borderBottom: '1px solid #000' }} className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          Profilo attivo: <b>{profile?.display_name ?? profile?.email ?? '—'}</b>
          {' · '}{selected.size} allergeni
        </span>
        <WireBtn onClick={() => setOverlay('allergie')}>Cambia allergie</WireBtn>
      </div>

      {/* NAV PRINCIPALE — 4 tab come mobile */}
      <WireNav items={navItems} active={tab} onChange={(id) => { setTab(id as Tab); closeOverlay(); }} />

      {error && (
        <div className="mx-4 mt-2 p-2 border border-black text-xs bg-neutral-100">{error}</div>
      )}

      <WireLayout
        main={
          <>
            {/* ─── HOME ─── */}
            {tab === 'home' && !overlay && (
              <div className="space-y-3">
                {!hasAllergie && (
                  <WireZone label="BANNER — Configura allergie">
                    <p className="text-xs mb-2">Nessuna allergia configurata. Il semaforo non può funzionare.</p>
                    <WireBtn onClick={() => setOverlay('allergie')}>Configura profilo allergeni</WireBtn>
                  </WireZone>
                )}

                <WireZone label="HERO — Azione prioritaria">
                  <p className="text-[10px] text-neutral-600 mb-2 leading-relaxed">⚠️ {SAFETY_REMINDER}</p>
                  <WireGrid cols={2}>
                    <WireBlock label="Riprendi ultimo locale">
                      {scanHistory[0] ? (
                        <WireBtn onClick={() => openMenu(scanHistory[0])}>#{scanHistory[0]}</WireBtn>
                      ) : (
                        <span className="text-neutral-500">Nessuna visita recente</span>
                      )}
                    </WireBlock>
                    <WireBlock label="Scansiona QR / codice">
                      <WireBtn onClick={() => setTab('scanner')}>Vai a Scansiona</WireBtn>
                    </WireBlock>
                  </WireGrid>
                </WireZone>

                <WireZone label="ATTIVITÀ RECENTE — carousel orizzontale">
                  {scanHistory.length === 0 ? (
                    <p className="text-xs text-neutral-500">Nessuna attività recente</p>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {scanHistory.map((code) => {
                        const r = restaurants.find((x) => x.public_code === code);
                        return (
                          <WireBlock key={code} label={r?.nome_ristorante ?? code}>
                            <WireBtn onClick={() => openMenu(code)}>Apri menù</WireBtn>
                          </WireBlock>
                        );
                      })}
                    </div>
                  )}
                </WireZone>

                <WireZone label="VICINO A TE — sezione collassabile">
                  <WireRow
                    label={nearbyOpen ? 'Nascondi locali vicini' : 'Mostra locali vicini'}
                    onClick={() => setNearbyOpen(!nearbyOpen)}
                  />
                  {nearbyOpen && (
                    <div className="mt-2 space-y-1">
                      {nearbyTop3.map((r) => (
                        <WireRow
                          key={r.restaurant_id}
                          label={`${r.nome_ristorante} — ${r.pct ?? '—'}% compatibile`}
                          onClick={() => openMenu(r.public_code)}
                        />
                      ))}
                    </div>
                  )}
                </WireZone>
              </div>
            )}

            {/* ─── LOCALI ─── */}
            {tab === 'locali' && !overlay && (
              <div className="space-y-3">
                <WireZone label="RICERCA">
                  <WireInput value={search} onChange={setSearch} placeholder="Nome, città, codice..." />
                </WireZone>

                {!hasAllergie && (
                  <WireZone label="BANNER allergie" dashed>
                    <WireBtn onClick={() => setOverlay('allergie')}>Configura allergie per vedere compatibilità</WireBtn>
                  </WireZone>
                )}

                <WireZone label="VISTA">
                  <div className="flex gap-2">
                    <WireBtn active={localiMode === 'lista'} onClick={() => setLocaliMode('lista')}>Lista</WireBtn>
                    <WireBtn active={localiMode === 'mappa'} onClick={() => setLocaliMode('mappa')}>Mappa</WireBtn>
                  </div>
                </WireZone>

                <WireZone label="FILTRI — collassabile">
                  <WireRow label={filtersOpen ? 'Chiudi filtri' : 'Apri filtri'} onClick={() => setFiltersOpen(!filtersOpen)} />
                  {filtersOpen && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(['tutti', '100', '80'] as const).map((f) => (
                        <WireBtn key={f} active={compatFilter === f} onClick={() => setCompatFilter(f)}>
                          {f === 'tutti' ? 'Tutti' : f === '100' ? '100% sicuri' : '≥80%'}
                        </WireBtn>
                      ))}
                    </div>
                  )}
                </WireZone>

                {localiMode === 'mappa' && (
                  <WireZone label="MAPPA — Leaflet">
                    <div id="consumer-map" className="h-48 border border-black bg-neutral-100" />
                  </WireZone>
                )}

                <WireZone label={`RISULTATI (${filteredRestaurants.length})`}>
                  {filteredRestaurants.length === 0 ? (
                    <p className="text-xs text-neutral-500">Nessun locale trovato</p>
                  ) : (
                    <div className="divide-y divide-black border border-black">
                      {filteredRestaurants.map((r) => (
                        <WireRow
                          key={r.restaurant_id}
                          label={`[${r.stato.toUpperCase()}] ${r.nome_ristorante} · ${r.citta ?? '—'} · #${r.public_code}`}
                          value={r.pct != null ? `${r.pct}%` : '—'}
                          onClick={() => openMenu(r.public_code)}
                        />
                      ))}
                    </div>
                  )}
                </WireZone>
              </div>
            )}

            {/* ─── SCANNER ─── */}
            {tab === 'scanner' && !overlay && (
              <div className="space-y-3">
                <WireZone label="FOTOCAMERA — QR e barcode">
                  <WireBlock label="Area camera" minHeight={120}>
                    <p className="text-neutral-500">[Web: usa input manuale o app mobile per scansione camera]</p>
                  </WireBlock>
                </WireZone>

                <WireZone label="INSERIMENTO MANUALE">
                  <p className="text-[10px] text-neutral-600 mb-2 leading-relaxed">⚠️ {SAFETY_REMINDER}</p>
                  <WireInput
                    value={codice}
                    onChange={setCodice}
                    placeholder="Codice locale 6 cifre o barcode"
                  />
                  <div className="mt-2">
                    <WireBtn disabled={busy || codice.trim().length < 4} onClick={() => openMenu(codice)}>
                      {busy ? 'Caricamento...' : 'Apri menù'}
                    </WireBtn>
                  </div>
                </WireZone>

                <WireZone label="CRONOLOGIA SCANSIONI">
                  {scanHistory.length === 0 ? (
                    <p className="text-xs text-neutral-500">Vuota</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {scanHistory.map((c) => (
                        <WireBtn key={c} onClick={() => openMenu(c)}>#{c}</WireBtn>
                      ))}
                    </div>
                  )}
                </WireZone>
              </div>
            )}

            {/* ─── ACCOUNT / PROFILO ─── */}
            {tab === 'account' && !overlay && (
              <div className="space-y-3">
                <WireZone label="HERO — Identità utente">
                  <p className="text-xs"><b>{profile?.display_name ?? 'Utente'}</b></p>
                  <p className="text-xs text-neutral-600">{profile?.email}</p>
                </WireZone>

                <WireZone label="DATI ACCOUNT">
                  <div className="p-2 space-y-2">
                    <label className="text-[10px] font-bold block">Nome visualizzato</label>
                    <WireInput value={displayNameDraft} onChange={setDisplayNameDraft} placeholder="Il tuo nome" />
                    <WireBtn onClick={saveDisplayName} disabled={busy}>Salva nome</WireBtn>
                    <label className="text-[10px] font-bold block mt-2">Email (sola lettura)</label>
                    <p className="text-xs text-neutral-600">{profile?.email ?? '—'}</p>
                    <p className="text-[10px] text-neutral-500">Per cambiare email: supporto@allertgy.it</p>
                    <label className="text-[10px] font-bold block mt-3">Password attuale</label>
                    <WireInput value={currentPassword} onChange={setCurrentPassword} placeholder="Password attuale" type="password" />
                    <label className="text-[10px] font-bold block">Nuova password</label>
                    <WireInput value={newPassword} onChange={setNewPassword} placeholder="Min. 8 caratteri" type="password" />
                    <label className="text-[10px] font-bold block">Conferma nuova password</label>
                    <WireInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Ripeti password" type="password" />
                    <WireBtn onClick={savePassword} disabled={busy}>Aggiorna password</WireBtn>
                    {accountMsg ? <p className="text-xs text-emerald-700 font-bold">{accountMsg}</p> : null}
                  </div>
                </WireZone>

                <WireZone label="IL TUO PROFILO">
                  <WireRow label="Allergie e intolleranze" value={`${selected.size} attive`} onClick={() => setOverlay('allergie')} />
                  <WireRow label="Profili famiglia" value="App mobile" />
                  <WireRow label="Preferiti" onClick={() => setOverlay('preferiti')} />
                </WireZone>

                <WireZone label="SOS EMERGENZA — collassabile">
                  <WireRow label="Schermata emergenza" onClick={() => setOverlay('emergency')} />
                  <div className="p-2 space-y-2 border-t border-black">
                    <label className="text-[10px] font-bold block">Farmaci / note SOS</label>
                    <textarea
                      value={emergencyDraft}
                      onChange={(e) => setEmergencyDraft(e.target.value)}
                      rows={2}
                      className="w-full border border-black p-2 text-xs"
                    />
                    <WireInput value={contactName} onChange={setContactName} placeholder="Contatto emergenza — nome" />
                    <WireInput value={contactPhone} onChange={setContactPhone} placeholder="Contatto emergenza — telefono" />
                    <WireBtn onClick={saveEmergency} disabled={busy}>Salva dati SOS</WireBtn>
                  </div>
                </WireZone>

                <WireZone label="SALUTE E DOCUMENTI">
                  <WireRow label="Pass allergeni (tessera staff)" value="App mobile" />
                  <div className="border-t border-black p-2">
                    <p className="text-[10px] font-bold mb-1">Documenti medici ({documents.length})</p>
                    {documents.map((d) => (
                      <p key={d.id} className="text-xs">{d.filename} — {d.status}</p>
                    ))}
                  </div>
                </WireZone>

                <WireZone label="ABBONAMENTO">
                  {referral?.invite_code && (
                    <WireBlock label="Codice invito ristoratore">
                      <span className="font-mono text-lg">{referral.invite_code}</span>
                      <p className="text-xs mt-1">{referral.referrals_count} referral · {referral.has_plus ? 'Plus attivo' : 'Free'}</p>
                    </WireBlock>
                  )}
                  <WireBlock label={plusPlan?.name ?? 'Plus Famiglia'}>
                    <p className="text-xs">
                      {hasPlus
                        ? `Piano attivo${plusActive ? '' : ' (omaggio/referral)'}`
                        : ((plusPlan as any)?.tagline ?? 'Sottoprofili famiglia, scan illimitati, condivisione profilo')}
                    </p>
                    {plusPlan && !hasPlus && (
                      <p className="text-xs mt-1 font-bold">
                        €{(plusPlan.price_cents / 100).toFixed(2).replace('.', ',')}/mese
                      </p>
                    )}
                    {hasPlus && plusActive ? (
                      <WireBtn onClick={managePlus} disabled={busy}>Gestisci abbonamento</WireBtn>
                    ) : !hasPlus ? (
                      <WireBtn onClick={purchasePlus} disabled={busy}>Attiva Plus Famiglia</WireBtn>
                    ) : null}
                  </WireBlock>
                </WireZone>

                <WireZone label="IMPOSTAZIONI">
                  <WireRow label="Lingua" value="IT" />
                  <WireRow label="Notifiche" onClick={() => setOverlay('notifiche')} />
                  <WireRow label="Condividi profilo" value="App mobile" />
                  <WireRow label="Termini di servizio" value="/termini" onClick={() => { window.location.href = '/termini'; }} />
                  <WireRow label="Privacy" value="/privacy" onClick={() => { window.location.href = '/privacy'; }} />
                  <WireRow label="Sicurezza e responsabilità" value="/sicurezza" onClick={() => { window.location.href = '/sicurezza'; }} />
                </WireZone>

                <WireZone label="DISCLAIMER">
                  <p className="text-xs leading-relaxed">{ACCOUNT_DISCLAIMER}</p>
                </WireZone>

                <WireZone label="ACCOUNT">
                  <WireBtn variant="danger" onClick={onLogout}>Esci</WireBtn>
                </WireZone>
              </div>
            )}

            {/* ─── OVERLAY: MENÙ RISTORANTE ─── */}
            {overlay === 'menu' && menu && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold text-sm">[{menu.nome_ristorante}]</h2>
                  <WireBtn onClick={closeOverlay}>Chiudi</WireBtn>
                </div>

                {menu.safety_notice && (
                  <div className="p-2 border border-black bg-neutral-100 text-xs leading-relaxed">
                    ⚠️ {menu.safety_notice}
                  </div>
                )}

                <WireZone label="HEADER — compatibilità">
                  <WireGrid cols={3}>
                    <WireBlock label="Verde">{countBy('verde')}</WireBlock>
                    <WireBlock label="Giallo">{countBy('giallo')}</WireBlock>
                    <WireBlock label="Rosso">{countBy('rosso')}</WireBlock>
                  </WireGrid>
                  <p className="text-[10px] mt-2 leading-relaxed">⚠️ {SAFETY_REMINDER}</p>
                </WireZone>

                <WireZone label="FILTRI SEMAFORO — sticky">
                  <div className="flex flex-wrap gap-1">
                    {(['tutti', 'verde', 'giallo', 'rosso'] as const).map((f) => (
                      <WireBtn key={f} active={menuFilter === f} onClick={() => setMenuFilter(f)}>
                        {f} ({f === 'tutti' ? valutati.length : countBy(f)})
                      </WireBtn>
                    ))}
                  </div>
                </WireZone>

                <WireZone label="INFO LOCALE — collassabile">
                  <WireRow label="Indirizzo" value={menu.citta ?? '—'} />
                  <WireRow label="Orari" value="—" />
                  <WireRow label="Ultimo aggiornamento" value="—" />
                </WireZone>

                <WireZone label="MENÙ — piatti per categoria">
                  {filteredDishes.length === 0 ? (
                    <p className="text-xs text-neutral-500">Nessun piatto in questa sezione</p>
                  ) : (
                    <div className="space-y-1">
                      {filteredDishes.map(({ p, esito }) => {
                        const sectionHint = esito.stato === 'verde'
                          ? SEMAFORO_SECTION.verde.sub
                          : esito.stato === 'giallo'
                            ? SEMAFORO_SECTION.giallo.sub
                            : esito.stato === 'rosso'
                              ? SEMAFORO_SECTION.rosso.sub
                              : null;
                        return (
                        <div key={p.id} className="border border-black p-2 text-xs">
                          <div className="flex justify-between font-bold">
                            <span>[{esito.stato.toUpperCase()}] {p.nome_piatto}</span>
                            <span>{p.prezzo_cents ? `${(p.prezzo_cents / 100).toFixed(2)}€` : ''}</span>
                          </div>
                          <p className="text-neutral-600">{p.categoria} · {p.descrizione?.slice(0, 80)}</p>
                          {sectionHint && hasAllergie && (
                            <p className="text-[10px] mt-1 leading-relaxed">{sectionHint}</p>
                          )}
                          {p.kitchen_protocol_confirmed === 1 && (
                            <p className="text-[10px] mt-1">🛡️ Cucina sicura — {KITCHEN_SAFE_HINT}</p>
                          )}
                          {esito.match.length > 0 && (
                            <p>Match: {esito.match.join(', ')}</p>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </WireZone>

                <WireZone label="RECENSIONI — tab AllerTgy / Google / TripAdvisor" dashed>
                  <p className="text-xs text-neutral-500">Vedi pagina pubblica /r/{menu.public_code}</p>
                </WireZone>

                <WireZone label="AVVISO SICUREZZA">
                  <p className="text-xs leading-relaxed">{ACCOUNT_DISCLAIMER}</p>
                  <p className="text-xs mt-2 font-bold">⚠️ {SAFETY_REMINDER}</p>
                </WireZone>
              </div>
            )}

            {/* ─── OVERLAY: EMERGENZA ─── */}
            {overlay === 'emergency' && (
              <WireZone label="SOS — Schermata emergenza (modal mobile)">
                <p className="text-xs mb-2">Profilo: {profile?.display_name ?? '—'}</p>
                <p className="text-xs mb-2">Allergie: {[...selected].join(', ') || 'nessuna'}</p>
                <p className="text-xs mb-3">Farmaci: {emergencyDraft || '—'}</p>
                <WireGrid cols={3}>
                  <WireBtn onClick={() => contactPhone && (window.location.href = `tel:${contactPhone}`)}>
                    Chiama contatto
                  </WireBtn>
                  <WireBtn onClick={() => window.location.href = 'tel:112'}>112</WireBtn>
                  <WireBtn onClick={closeOverlay}>Chiudi</WireBtn>
                </WireGrid>
              </WireZone>
            )}

            {/* ─── OVERLAY: NOTIFICHE ─── */}
            {overlay === 'notifiche' && (
              <WireZone label="NOTIFICHE — inbox">
                <p className="text-xs text-neutral-500 mb-2">Tipi: menù aggiornato, promo, referral, profilo condiviso</p>
                <WireBlock label="Non lette">Vuoto (push solo app mobile)</WireBlock>
                <WireBlock label="Lette">Vuoto</WireBlock>
                <WireBtn onClick={closeOverlay}>Chiudi</WireBtn>
              </WireZone>
            )}

            {/* ─── OVERLAY: PREFERITI ─── */}
            {overlay === 'preferiti' && (
              <WireZone label="PREFERITI — locali e prodotti">
                <div className="flex gap-2 mb-2">
                  <WireBtn active>Locali salvati</WireBtn>
                  <WireBtn>Prodotti usuali</WireBtn>
                </div>
                <p className="text-xs text-neutral-500">Sincronizzazione completa su app mobile</p>
                <WireBtn onClick={closeOverlay}>Chiudi</WireBtn>
              </WireZone>
            )}

            {/* ─── OVERLAY: ALLERGIE ─── */}
            {overlay === 'allergie' && (
              <WireZone label="PROFILO ALLERGENI">
                <WireInput value={allergenSearch} onChange={setAllergenSearch} placeholder="Cerca allergene..." />
                <div className="flex flex-wrap gap-1 mt-2 max-h-64 overflow-y-auto">
                  {filteredAllergens.map((a) => (
                    <WireBtn key={a.code} active={selected.has(a.code)} onClick={() => toggleAllergen(a.code)}>
                      {a.emoji} {a.name_it}
                    </WireBtn>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <WireBtn onClick={saveAllergens} disabled={busy}>Salva ({selected.size})</WireBtn>
                  <WireBtn onClick={closeOverlay}>Annulla</WireBtn>
                </div>
              </WireZone>
            )}
          </>
        }
        aside={
          tab !== 'account' && !overlay ? (
            <WireZone label="CONTESTO — pannello laterale web">
              <p className="text-xs text-neutral-600 mb-2">
                Su desktop le funzioni secondarie stanno qui invece che in stack/modal.
              </p>
              <WireRow label="Preferiti" onClick={() => setOverlay('preferiti')} />
              <WireRow label="Allergie" onClick={() => setOverlay('allergie')} />
              <WireRow label="SOS" onClick={() => setOverlay('emergency')} />
              {scanHistory[0] && (
                <WireRow label="Ultimo locale" value={`#${scanHistory[0]}`} onClick={() => openMenu(scanHistory[0])} />
              )}
            </WireZone>
          ) : undefined
        }
      />
    </WireApp>
  );
}
