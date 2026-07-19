import { useEffect, useState, useRef } from 'react';
import { api, API, clearToken, type Allergen, type DishIn, type Photo, type Restaurant, type MenuOutItem } from './api';
import MenuEditor from './components/MenuEditor';
import NotificationsPanel from './components/NotificationsPanel';
import PushNotificationPanel from './components/PushNotificationPanel';
import TimeSeriesChart from './components/TimeSeriesChart';
import OwnerReviewsPanel from './components/OwnerReviewsPanel';
import InvoicesPanel from './components/InvoicesPanel';
import BoostHistoryPanel from './components/BoostHistoryPanel';
import MenuAuditPanel from './components/MenuAuditPanel';
import {
  PLAN_LABELS, PLAN_PRICES, PLAN_FEATURES, centsToEuro,
  restaurantCanUseMenu, restaurantCanPushNotify,
} from './data/plans';
import OwnerWebShell, { type OwnerTab } from './owner/OwnerWebShell';
import { WireBtn, WireRow, WireZone } from './wireframe/WireframeUi';

type Props = {
  onLogout: () => void;
  onBackToLanding: () => void;
};

export default function OwnerDashboard({ onLogout, onBackToLanding }: Props) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [current, setCurrent] = useState<Restaurant | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const getAllergenName = (code: string) => {
    const found = allergens.find(a => a.code === code);
    return found ? found.name_it : code.replace(/_/g, ' ');
  };
  const [piatti, setPiatti] = useState<DishIn[] | null>(null);
  const [hasPublished, setHasPublished] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [menuUrl, setMenuUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [printMode, setPrintMode] = useState<'qr' | 'registry' | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [approved, setApproved] = useState<Restaurant | null>(null);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newInviteCode, setNewInviteCode] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLatitude, setNewLatitude] = useState<number | ''>('');
  const [newLongitude, setNewLongitude] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [menuLegalAck, setMenuLegalAck] = useState(false);
  const [menus, setMenus] = useState<MenuOutItem[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [newMenuName, setNewMenuName] = useState('');
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [webLang, setWebLang] = useState('it');

  const TRANSLATIONS: Record<string, Record<string, string>> = {
    it: {
      dashboardTitle: "Area Ristoratori",
      welcome: "Benvenuto",
      menuEditor: "Editor Menù",
      save: "Salva",
      settings: "Impostazioni",
      translateButton: "🤖 Traduci con AI",
      translateSuccess: "Traduzione completata!",
      crossContaminationTitle: "Controllo Contaminazione Crociata",
      crossContaminationQ1: "Questo piatto viene preparato in aree con rischio di contatto crociato?",
      crossContaminationConfirm: "Confermo che lo staff segue i protocolli di prevenzione delle contaminazioni crociate.",
      newMenu: "Nuovo Menù",
      addMenu: "Aggiungi Menù",
      menuName: "Nome del Menù"
    },
    en: {
      dashboardTitle: "Restaurant Area",
      welcome: "Welcome",
      menuEditor: "Menu Editor",
      save: "Save & Publish",
      settings: "Settings",
      translateButton: "🤖 Translate with AI",
      translateSuccess: "Menu translated successfully!",
      crossContaminationTitle: "Cross-Contamination Verification",
      crossContaminationQ1: "Is this dish prepared in areas with cross-contamination risk?",
      crossContaminationConfirm: "I confirm the staff follows cross-contamination prevention protocols.",
      newMenu: "New Menu",
      addMenu: "Add Menu",
      menuName: "Menu Name"
    }
  };
  const t = (key: string) => {
    return TRANSLATIONS[webLang]?.[key] ?? TRANSLATIONS['it']?.[key] ?? key;
  };

  // Navigazione — allineata ai 4 tab mobile + sezioni secondarie da Profilo
  const [activeSubTab, setActiveSubTab] = useState<OwnerTab>('attivita');

  // Campi form Impostazioni Ristorante
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [website, setWebsite] = useState('');
  const [settingsMenuUrl, setSettingsMenuUrl] = useState('');
  const [description, setDescription] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [tripadvisorUrl, setTripadvisorUrl] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [allergenManager, setAllergenManager] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [analytics, setAnalytics] = useState<{
    restaurant_id: number;
    total_views: number;
    total_allergen_queries: number;
    distribution: { code: string; name: string; emoji: string; count: number }[];
    time_series: { date: string; count: number }[];
  } | null>(null);

  const settingsMapRef = useRef<any>(null);
  const settingsMarkerRef = useRef<any>(null);

  // Sincronizza i campi form quando cambia il ristorante selezionato
  useEffect(() => {
    if (current) {
      setAddress(current.address || '');
      setPhone(current.phone || '');
      setEmailContact(current.email_contact || '');
      setOpeningHours(current.opening_hours || '');
      setLogoUrl(current.image_url || '');
      setLatitude(current.latitude ?? '');
      setLongitude(current.longitude ?? '');
      setWebsite(current.website || '');
      setSettingsMenuUrl(current.menu_url || '');
      setDescription(current.description || '');
      setGooglePlaceId(current.google_place_id || '');
      setTripadvisorUrl(current.tripadvisor_url || '');
      setVatNumber(current.vat_number || '');
      setAllergenManager(current.allergen_manager || '');
      api.listRestaurantPhotos(current.id).then(setPhotos).catch(() => setPhotos([]));
      api.getRestaurantAnalytics(current.id).then(setAnalytics).catch(() => setAnalytics(null));
      api.listMenus(current.id).then((m) => {
        setMenus(m);
        if (m.length > 0) setSelectedMenuId(m[0].id);
      }).catch(() => {
        setMenus([]);
        setSelectedMenuId(null);
      });
    }
  }, [current]);

  // Inizializza la mappa interattiva per le impostazioni locale
  useEffect(() => {
    if (activeSubTab !== 'attivita') {
      if (settingsMapRef.current) {
        settingsMapRef.current.remove();
        settingsMapRef.current = null;
        settingsMarkerRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    if (settingsMapRef.current) return;

    const timer = setTimeout(() => {
      const mapEl = document.getElementById('settings-map');
      if (!mapEl) return;

      const initialLat = latitude !== '' ? Number(latitude) : 45.4642;
      const initialLng = longitude !== '' ? Number(longitude) : 9.1900;

      const map = L.map('settings-map').setView([initialLat, initialLng], 13);
      settingsMapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      settingsMarkerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLatitude(pos.lat);
        setLongitude(pos.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setLatitude(e.latlng.lat);
        setLongitude(e.latlng.lng);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [activeSubTab]);

  // Gestione classe body per la stampa
  useEffect(() => {
    if (printMode) {
      document.body.classList.add(`print-mode-${printMode}`);
      window.print();
      const timer = setTimeout(() => {
        setPrintMode(null);
        document.body.classList.remove(`print-mode-${printMode}`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printMode]);

  // Caricamento allergeni e locali all'avvio
  useEffect(() => {
    api.allergens().then(setAllergens).catch((e) => setError(e.message));
    api.myRestaurants().then((rs) => {
      setRestaurants(rs);
      if (rs.length === 1) selectRestaurant(rs[0]);
    }).catch((e) => {
      setError(e.message);
      if (/token/i.test(e.message)) { clearToken(); onLogout(); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectRestaurant = async (r: Restaurant) => {
    setCurrent(r); setPiatti(null); setApproved(null); setError('');
    setActiveSubTab('attivita');
    try {
      const m = await api.publicMenu(r.public_code);
      setHasPublished(m.piatti.length > 0);
      if (m.piatti.length > 0) {
        setPiatti(m.piatti.map(({ id, ...p }) => p));
      } else {
        setPiatti(null);
      }
    } catch { 
      setHasPublished(false);
      setPiatti(null);
    }
  };

  const loadExisting = async () => {
    if (!current) return;
    setBusy(true); setError('');
    try {
      const m = await api.publicMenu(current.public_code);
      setPiatti(m.piatti.map(({ id, ...p }) => p));
      setAiNote('');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const upload = async (file: File) => {
    setBusy(true); setError(''); setApproved(null);
    try {
      const res = await api.analyze(file);
      setPiatti(res.piatti);
      setAiNote(res.note);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const analyzeFromUrl = async () => {
    if (!menuUrl.trim()) return;
    setBusy(true); setError(''); setApproved(null);
    try {
      const res = await api.analyzeUrl(menuUrl.trim());
      setPiatti(res.piatti);
      setAiNote(res.note);
      setMenuUrl('');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const save = async () => {
    if (!current || !piatti) return;
    if (!restaurantCanUseMenu(current)) {
      setError('Il menu digitale con allergeni per piatto è incluso nel piano Base (€9/mese) o superiore.');
      setActiveSubTab('piano');
      return;
    }
    if (!menuLegalAck) {
      setError('Prima di pubblicare devi confermare la verifica di allergeni, tracce e responsabilità del menù.');
      return;
    }
    setBusy(true); setError('');
    try {
      await api.saveMenu(current.id, piatti);
      const r = await api.approve(current.id, menuLegalAck);
      setApproved(r); setHasPublished(true);
      setMenuLegalAck(false);
      // Aggiorna localmente
      setCurrent(r);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const res = await api.uploadImage(file);
      setLogoUrl(res.url);
      alert("Logo caricato con successo!");
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalizzazione non è supportata da questo browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        
        const L = (window as any).L;
        if (L && settingsMapRef.current && settingsMarkerRef.current) {
          settingsMarkerRef.current.setLatLng([lat, lng]);
          settingsMapRef.current.setView([lat, lng], 15);
        }
      },
      (error) => {
        alert("Impossibile rilevare la posizione: " + error.message);
      }
    );
  };

  const searchNominatim = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`, {
        headers: {
          'Accept-Language': 'it,en'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchSuggestions(data);
      }
    } catch (err) {
      console.error("Errore ricerca Nominatim:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestionForCreate = (s: any) => {
    const name = s.address.restaurant || s.address.pub || s.address.cafe || s.address.amenity || s.address.shop || s.address.name || s.name || s.display_name.split(',')[0];
    const city = s.address.city || s.address.town || s.address.village || s.address.municipality || s.address.county || '';
    const road = s.address.road || '';
    const houseNumber = s.address.house_number || '';
    const addressStr = houseNumber ? `${road} ${houseNumber}` : road;

    setNewName(name);
    setNewCity(city);
    setNewAddress(addressStr);
    setNewLatitude(Number(s.lat));
    setNewLongitude(Number(s.lon));
    setSearchSuggestions([]);
    setSearchQuery('');
  };

  const handleSelectSuggestionForEdit = (s: any) => {
    const road = s.address.road || '';
    const houseNumber = s.address.house_number || '';
    const addressStr = houseNumber ? `${road} ${houseNumber}` : road;
    const lat = Number(s.lat);
    const lng = Number(s.lon);

    setAddress(addressStr);
    setLatitude(lat);
    setLongitude(lng);

    const L = (window as any).L;
    if (L && settingsMapRef.current && settingsMarkerRef.current) {
      settingsMarkerRef.current.setLatLng([lat, lng]);
      settingsMapRef.current.setView([lat, lng], 16);
    }

    setSearchSuggestions([]);
    setSearchQuery('');
  };

  const saveSettings = async () => {
    if (!current) return;
    setBusy(true); setError('');
    try {
      const res = await api.updateRestaurant(current.id, {
        name: current.name,
        city: current.city,
        address: address.trim(),
        phone: phone.trim(),
        email_contact: emailContact.trim(),
        opening_hours: openingHours.trim(),
        image_url: logoUrl || null,
        latitude: latitude === '' ? null : Number(latitude),
        longitude: longitude === '' ? null : Number(longitude),
        website: website.trim() || null,
        menu_url: settingsMenuUrl.trim() || null,
        description: description.trim() || null,
        google_place_id: googlePlaceId.trim() || null,
        tripadvisor_url: tripadvisorUrl.trim() || null,
        vat_number: vatNumber.trim() || null,
        allergen_manager: allergenManager.trim() || null,
      });
      setCurrent(res);
      setRestaurants(restaurants.map(r => r.id === res.id ? res : r));
      alert("Impostazioni salvate con successo!");
      setActiveSubTab('attivita');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const syncExternal = async () => {
    if (!current) return;
    setBusy(true); setError('');
    try {
      const res = await api.syncExternalReviews(current.public_code);
      setCurrent(res);
      setRestaurants(restaurants.map(r => r.id === res.id ? res : r));
      alert("Valutazioni Google e TripAdvisor sincronizzate con successo!");
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const canUseMenu = restaurantCanUseMenu(current);
  const currentPlan = current?.business_plan ?? 'free';
  const currentPlanPrice = current?.plan_price_cents ?? PLAN_PRICES[currentPlan];
  const currentPlanLabel = PLAN_LABELS[currentPlan];

  const step1 = !!(current?.address && current?.phone && current?.email_contact);
  const step2 = !!current?.opening_hours;
  const step3 = !!(current?.image_url || photos.length > 0);
  const step4 = !!(piatti && piatti.length > 0);
  const step5 = !!(menuLegalAck || hasPublished);
  const setupDone = [step1, step2, step3, step4, step5].filter(Boolean).length;
  const setupComplete = setupDone >= 5;
  const hasMenu = !!current?.menu_updated_at;
  const hasPublicProfile = !!(current?.city && current?.address && current?.phone);
  const hasLegalData = !!(current?.vat_number && current?.allergen_manager);

  return (
    <>
    <OwnerWebShell
      onBackToLanding={onBackToLanding}
      onLogout={onLogout}
      activeTab={activeSubTab}
      onTabChange={setActiveSubTab}
      venueName={current?.name}
      venueCode={current?.public_code}
      onChangeVenue={current ? () => { setCurrent(null); setPiatti(null); setApproved(null); } : undefined}
      headerExtra={<NotificationsPanel />}
      showGuide={showGuide}
      onToggleGuide={() => setShowGuide(!showGuide)}
      error={error}
      noVenue={
        <WireZone label="SELEZIONE LOCALE — come tab Attività mobile">
          <p className="text-xs mb-3">Crea un nuovo locale o seleziona uno esistente:</p>
            
            {restaurants.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">I TUOI LOCALI</span>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {restaurants.map((r) => (
                    <button 
                      key={r.id} 
                      onClick={() => selectRestaurant(r)}
                      className="px-5 py-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-left transition-all group relative overflow-hidden"
                    >
                      <span className="font-extrabold text-sm text-slate-850 block">{r.name}</span>
                      <span className="text-xs text-slate-450 mt-1 block">📍 {r.city || 'Non specificata'}</span>
                      <span className="text-[10px] text-emerald-700 font-black mt-2 inline-block bg-emerald-50 px-2 py-0.5 rounded-lg">
                        {PLAN_LABELS[r.business_plan ?? 'free']}
                      </span>
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-700 px-2 py-0.5 rounded">
                        #{r.public_code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AGGIUNGI UN NUOVO LOCALE</span>
              
              {/* Ricerca Rapida Autocompletamento */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-3xl p-4 space-y-3">
                <label className="text-[10px] text-emerald-800 uppercase font-black tracking-wider block">🔍 Ricerca Automatica (Trova subito indirizzo e mappa)</label>
                <div className="flex gap-2">
                  <input 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchNominatim(searchQuery);
                      }
                    }}
                    placeholder="Digita il nome del locale (es. Trattoria Da Matteo Milano)" 
                    className="border border-slate-250 rounded-2xl px-4 py-3 flex-1 text-sm bg-white focus:outline-none" 
                  />
                  <button 
                    type="button"
                    onClick={() => searchNominatim(searchQuery)}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition-colors disabled:opacity-40"
                  >
                    {isSearching ? 'Cerca...' : 'Trova'}
                  </button>
                </div>

                {searchSuggestions.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-2 max-h-60 overflow-y-auto space-y-1 shadow-lg relative z-20">
                    {searchSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestionForCreate(s)}
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 rounded-xl transition-colors block border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-extrabold text-slate-800">{s.display_name.split(',')[0]}</div>
                        <div className="text-slate-500 mt-0.5 text-[10px] truncate">{s.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Campi di verifica manuale/creazione */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome del locale (es. Trattoria Da Matteo)" 
                    className="border border-slate-250 rounded-2xl px-4 py-3 flex-1 text-sm bg-slate-50 focus:bg-white focus:outline-none" 
                  />
                  <input 
                    value={newCity} 
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Città" 
                    className="border border-slate-250 rounded-2xl px-4 py-3 w-full sm:w-48 text-sm bg-slate-50 focus:bg-white focus:outline-none" 
                  />
                </div>

                {restaurants.length === 0 && (
                  <div className="space-y-1">
                    <input
                      value={newInviteCode}
                      onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
                      placeholder="Codice invito cliente (opzionale)"
                      className="border border-slate-250 rounded-2xl px-4 py-3 w-full text-sm bg-slate-50 focus:bg-white focus:outline-none font-mono tracking-wider"
                    />
                    <p className="text-[11px] text-slate-500 px-1">
                      Se un cliente AllerTgy ti ha invitato, inserisci il suo codice: tu ricevi 1 mese di Pro omaggio e al cliente regaliamo Plus Famiglia.
                    </p>
                  </div>
                )}

                {newAddress && (
                  <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-wrap gap-x-4 gap-y-1 items-center">
                    <span>📍 <b>Indirizzo:</b> {newAddress}</span>
                    {newLatitude && newLongitude && (
                      <span className="text-[10px] text-slate-400 font-mono">({Number(newLatitude).toFixed(4)}, {Number(newLongitude).toFixed(4)})</span>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button 
                    disabled={!newName || busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const r = await api.createRestaurant(
                          newName, 
                          newCity, 
                          newAddress || undefined, 
                          undefined, 
                          undefined, 
                          undefined, 
                          newLatitude !== '' ? Number(newLatitude) : undefined, 
                          newLongitude !== '' ? Number(newLongitude) : undefined,
                          newInviteCode || undefined,
                        );
                        setRestaurants([...restaurants, r]); 
                        selectRestaurant(r);
                        if (newInviteCode.trim() && r.business_plan === 'pro_notify') {
                          window.alert(`${r.name} ha il piano Pro gratis per 30 giorni grazie al codice invito del cliente.`);
                        }
                        // Reset form di creazione
                        setNewName('');
                        setNewCity('');
                        setNewInviteCode('');
                        setNewAddress('');
                        setNewLatitude('');
                        setNewLongitude('');
                      } catch (e) { setError((e as Error).message); }
                      setBusy(false);
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs disabled:opacity-40 transition-colors shadow-md shadow-emerald-600/10"
                  >
                    Crea locale
                  </button>
                </div>
              </div>
            </div>
        </WireZone>
      }
    >
      {current && (
          <div className="space-y-6">

              {/* TAB 1: PANORAMICA */}
              {activeSubTab === 'attivita' && (
                <div className="space-y-6">

                  {/* Guida al Completamento Profilo (Onboarding Wizard) */}
                  {(() => {
                    if (!current) return null;
                    const step1 = !!(current.address && current.phone && current.email_contact);
                    const step2 = !!current.opening_hours;
                    const step3 = !!(current.image_url || photos.length > 0);
                    const step4 = !!(piatti && piatti.length > 0);
                    const step5 = !!(menuLegalAck || hasPublished);

                    const completedCount = [step1, step2, step3, step4, step5].filter(Boolean).length;
                    const percentage = completedCount * 20;

                    return (
                      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl space-y-5 border border-emerald-950/20">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <span className="text-[10px] tracking-wider uppercase text-emerald-400 font-black">Guida commerciante</span>
                            <h3 className="text-lg font-black mt-1">Completa il profilo del tuo locale</h3>
                            <p className="text-xs text-slate-350 mt-1 leading-relaxed">
                              Segui questi passaggi per completare i dati del locale e del menù, così da permettere ai tuoi clienti di consultarlo in sicurezza.
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-slate-800 border-4 border-slate-700/50">
                              <span className="text-sm font-black text-emerald-400">{percentage}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Barra di avanzamento */}
                        <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        {/* Elenco dei passi */}
                        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-1">
                          {/* Passo 1: Informazioni Locale */}
                          <div className={`p-3.5 rounded-2xl border transition-all ${step1 ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-350' : 'bg-slate-900/60 border-slate-800/80 text-slate-400'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg">{step1 ? '✅' : '📍'}</span>
                              <button 
                                onClick={() => setActiveSubTab('attivita')}
                                className="text-[9px] uppercase tracking-wider font-extrabold hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded-md cursor-pointer"
                              >
                                Configura
                              </button>
                            </div>
                            <h5 className="text-[11px] font-black leading-snug">Dati Principali</h5>
                            <p className="text-[9px] text-slate-450 mt-1 leading-relaxed">Indirizzo, telefono e recapito email.</p>
                          </div>

                          {/* Passo 2: Orari di Apertura */}
                          <div className={`p-3.5 rounded-2xl border transition-all ${step2 ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-350' : 'bg-slate-900/60 border-slate-800/80 text-slate-400'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg">{step2 ? '✅' : '🕐'}</span>
                              <button 
                                onClick={() => setActiveSubTab('attivita')}
                                className="text-[9px] uppercase tracking-wider font-extrabold hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded-md cursor-pointer"
                              >
                                Configura
                              </button>
                            </div>
                            <h5 className="text-[11px] font-black leading-snug">Orari di Apertura</h5>
                            <p className="text-[9px] text-slate-450 mt-1 leading-relaxed">Inserisci i turni settimanali.</p>
                          </div>

                          {/* Passo 3: Logo e Foto */}
                          <div className={`p-3.5 rounded-2xl border transition-all ${step3 ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-350' : 'bg-slate-900/60 border-slate-800/80 text-slate-400'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg">{step3 ? '✅' : '📸'}</span>
                              <button 
                                onClick={() => setActiveSubTab('attivita')}
                                className="text-[9px] uppercase tracking-wider font-extrabold hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded-md cursor-pointer"
                              >
                                Galleria
                              </button>
                            </div>
                            <h5 className="text-[11px] font-black leading-snug">Immagini Locale</h5>
                            <p className="text-[9px] text-slate-450 mt-1 leading-relaxed">Logo e foto del ristorante.</p>
                          </div>

                          {/* Passo 4: Menù e Allergeni */}
                          <div className={`p-3.5 rounded-2xl border transition-all ${step4 ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-350' : 'bg-slate-900/60 border-slate-800/80 text-slate-400'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg">{step4 ? '✅' : '🍲'}</span>
                              <button 
                                onClick={() => setActiveSubTab('menu')}
                                className="text-[9px] uppercase tracking-wider font-extrabold hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded-md cursor-pointer"
                              >
                                Gestisci
                              </button>
                            </div>
                            <h5 className="text-[11px] font-black leading-snug">Piatti e Allergeni</h5>
                            <p className="text-[9px] text-slate-450 mt-1 leading-relaxed">Aggiungi piatti al tuo menù digitale.</p>
                          </div>

                          {/* Passo 5: Scheda Allergeni stampata/verificata */}
                          <div className={`p-3.5 rounded-2xl border transition-all ${step5 ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-350' : 'bg-slate-900/60 border-slate-800/80 text-slate-400'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg">{step5 ? '✅' : '📋'}</span>
                              <button 
                                onClick={() => {
                                  if (step4) {
                                    setPrintMode('registry');
                                  } else {
                                    alert("Devi prima aggiungere almeno un piatto al menù per poter stampare la scheda allergeni!");
                                    setActiveSubTab('menu');
                                  }
                                }}
                                className="text-[9px] uppercase tracking-wider font-extrabold hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded-md cursor-pointer"
                              >
                                Stampa
                              </button>
                            </div>
                            <h5 className="text-[11px] font-black leading-snug">Scheda Allergeni</h5>
                            <p className="text-[9px] text-slate-450 mt-1 leading-relaxed">Stampa o scarica il registro ufficiale.</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Header summary card */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-800">Pannello di Controllo</h2>
                      <p className="text-xs text-slate-400">Verifica i contatti, gli orari e lo stato di pubblicazione del menù.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {hasPublished && (
                        <button 
                          onClick={async () => {
                            if (!piatti) {
                              setBusy(true);
                              try {
                                const m = await api.publicMenu(current.public_code);
                                setPiatti(m.piatti.map(({ id, ...p }) => p));
                              } catch (e) {
                                setError((e as Error).message);
                              }
                              setBusy(false);
                            }
                            setPrintMode('registry');
                          }}
                          className="bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <span>📄</span> Registro Allergeni
                        </button>
                      )}
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold 
                        ${hasPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {hasPublished ? '🟢 Menù Pubblicato' : '🔴 Menù non compilato'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Piano commerciale</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-black text-slate-850">{currentPlanLabel}</span>
                        {current?.is_verified ? (
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg text-[10px] font-black">Verificato</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-black">Non verificato</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {canUseMenu
                          ? 'Menu digitale, QR code e registro allergeni sono attivi per questo locale.'
                          : 'La scheda locale è attiva; il menu digitale si sblocca con il piano Base (€9/mese).'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-emerald-800">{centsToEuro(currentPlanPrice)} / mese</span>
                      <button
                        onClick={() => setActiveSubTab('piano')}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl text-xs"
                      >
                        Vedi piani
                      </button>
                    </div>
                  </div>

                  {/* Dettagli Locale & Orari */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                          <span>📍</span> Informazioni e Contatti
                        </h4>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Indirizzo</span>
                          <span className="text-slate-800 font-semibold">{current.address || 'Non impostato (Modifica in Impostazioni)'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Città</span>
                          <span className="text-slate-800 font-semibold">{current.city || 'Non impostata'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Telefono</span>
                          <span className="text-slate-800 font-semibold">{current.phone || 'Non impostato'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Email Contatto</span>
                          <span className="text-slate-800 font-semibold">{current.email_contact || 'Non impostata'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                          <span>🕐</span> Orari di Apertura
                        </h4>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Turni settimanali</span>
                          <span className="text-slate-800 font-semibold whitespace-pre-line leading-relaxed">
                            {current.opening_hours || 'Orari non definiti (Modifica in Impostazioni)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storico modifiche menù */}
                  {current && restaurantCanUseMenu(current) && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                          <span>📜</span> Storico modifiche menù
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Audit log per conformità e tracciabilità</p>
                      </div>
                      <MenuAuditPanel restaurantId={current.id} />
                    </div>
                  )}

                  {/* Statistiche Menù */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                      <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                        <span>📊</span> Riepilogo Menù
                      </h4>
                      <button 
                        onClick={() => setActiveSubTab('menu')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        Modifica Menù →
                      </button>
                    </div>
                    {hasPublished ? (
                      <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-xs text-slate-500">I tuoi clienti possono inquadrare il codice per mangiare in sicurezza.</span>
                          <span className="block text-[10px] text-slate-400 font-mono">Ultimo aggiornamento: {current.menu_updated_at ? current.menu_updated_at.substring(0, 10) : 'oggi'}</span>
                        </div>
                        <span className="text-2xl font-black text-emerald-800">🟢 Attivo</span>
                      </div>
                    ) : (
                      <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-xs text-slate-500">Non hai ancora inserito o pubblicato alcun piatto per questa attività.</span>
                          <span className="block text-[10px] text-slate-450 font-bold">Consigliato: Carica una foto o inserisci manualmente.</span>
                        </div>
                        <button 
                          onClick={() => setActiveSubTab('menu')} 
                          className="bg-emerald-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs cursor-pointer hover:bg-emerald-700 transition-colors"
                        >
                          Compila Ora
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scheda Allergeni Card */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-black text-base text-slate-800 flex items-center gap-2">
                          <span>📋</span> Registro e Scheda Allergeni
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Regolamento UE 1169/2011 - Informazione obbligatoria per i consumatori</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-100">Obbligatorio</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="space-y-1 md:max-w-[70%]">
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          Genera il Registro degli Allergeni del tuo menù aggiornato in tempo reale. È obbligatorio per legge esporre o rendere consultabile questo registro ai clienti nel tuo locale.
                        </p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          La scheda viene compilata automaticamente utilizzando le associazioni degli allergeni impostate sui piatti nel menù digitale.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
                        <button
                          onClick={async () => {
                            if (!piatti) {
                              setBusy(true);
                              try {
                                const m = await api.publicMenu(current.public_code);
                                setPiatti(m.piatti.map(({ id, ...p }) => p));
                              } catch (e) {
                                setError((e as Error).message);
                              }
                              setBusy(false);
                            }
                            setPrintMode('registry');
                          }}
                          disabled={!piatti || piatti.length === 0}
                          className={`flex-1 md:flex-initial text-center bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${(!piatti || piatti.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span>🖨️</span> Stampa Scheda
                        </button>
                        <button
                          onClick={async () => {
                            if (!current) return;
                            setBusy(true);
                            setError('');
                            try {
                              const blob = await api.downloadRegistryPdf(current.id);
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `registro_allergeni_${current.slug || 'locale'}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                            } catch (err) {
                              setError((err as Error).message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                          disabled={!piatti || piatti.length === 0}
                          className={`flex-1 md:flex-initial text-center bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${(!piatti || piatti.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span>📥</span> Scarica PDF
                        </button>
                      </div>
                    </div>
                    {(!piatti || piatti.length === 0) && (
                      <p className="text-[10px] text-rose-600 font-bold bg-rose-50/50 p-2 rounded-xl border border-rose-100/50 text-center">
                        ⚠️ Aggiungi almeno un piatto al menù per poter stampare o scaricare il registro degli allergeni.
                      </p>
                    )}
                  </div>

                </div>
              )}

              {/* TAB: STATISTICHE — tab nascosto su mobile */}
              {activeSubTab === 'statistiche' && analytics && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-black text-base text-slate-800 flex items-center gap-2">
                      <span>📊</span> Statistiche e ricerche clienti
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Visite menù e allergeni cercati (Pro)</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Visualizzazioni</span>
                      <span className="text-2xl font-black">{analytics.total_views}</span>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Allergie cercate</span>
                      <span className="text-2xl font-black">{analytics.total_allergen_queries}</span>
                    </div>
                  </div>
                  <TimeSeriesChart data={analytics.time_series} label="Visite" />
                </div>
              )}

              {/* TAB: PROFILO — come account mobile ristoratore */}
              {activeSubTab === 'profilo' && current && (
                <div className="space-y-3">
                  <WireZone label="HERO — Account ristoratore">
                    <p className="text-xs font-bold">Ristoratore</p>
                    <p className="text-xs text-neutral-600">{current.name} · #{current.public_code}</p>
                    <select
                      value={webLang}
                      onChange={(e) => setWebLang(e.target.value)}
                      className="mt-2 border border-black px-2 py-1 text-xs"
                    >
                      <option value="it">IT</option>
                      <option value="en">EN</option>
                    </select>
                  </WireZone>

                  <WireZone label="LA MIA ATTIVITÀ">
                    <WireRow label={current.name} value={`${setupDone}/5 setup`} onClick={() => setActiveSubTab('attivita')} />
                    <div className="flex gap-2 p-2 text-xs border-t border-black">
                      <span>Menù: {hasMenu ? 'OK' : 'NO'}</span>
                      <span>· Piano: {currentPlanLabel}</span>
                    </div>
                  </WireZone>

                  <WireZone label="CHECKLIST OBBLIGATORIA — collassabile">
                    <WireRow label={hasPublicProfile ? '✓ Scheda pubblica' : '! Scheda pubblica'} onClick={() => setActiveSubTab('attivita')} />
                    <WireRow label={hasMenu ? '✓ Menù pubblicato' : '! Menù pubblicato'} onClick={() => setActiveSubTab('menu')} />
                    <WireRow label={hasLegalData ? '✓ Dati legali' : '! P.IVA e referente'} onClick={() => setActiveSubTab('attivita')} />
                    <WireRow label={currentPlan !== 'free' ? '✓ Piano attivo' : '! Piano attivo'} onClick={() => setActiveSubTab('piano')} />
                    <p className="text-[10px] p-2 border-t border-black">
                      {setupComplete ? 'Setup completato' : `${setupDone}/5 passaggi`}
                    </p>
                  </WireZone>

                  <WireZone label="CRESCITA — link sezioni secondarie">
                    <WireRow label="QR code tavoli" onClick={() => setActiveSubTab('qr')} />
                    <WireRow label="Statistiche" onClick={() => setActiveSubTab('statistiche')} />
                    <WireRow label="Piano e fatturazione" onClick={() => setActiveSubTab('piano')} />
                    <WireRow label="Boost e notifiche push" onClick={() => setActiveSubTab('crescita')} />
                    <WireRow label="Recensioni" onClick={() => setActiveSubTab('recensioni')} />
                  </WireZone>

                  <WireZone label="ASSISTENZA">
                    <WireRow label="supporto@allertgy.it" onClick={() => window.location.href = 'mailto:supporto@allertgy.it'} />
                  </WireZone>

                  <WireBtn variant="danger" onClick={onLogout}>Esci dall&apos;account</WireBtn>
                </div>
              )}

              {/* TAB 2: GESTIONE MENU */}
              {activeSubTab === 'menu' && (
                <div className="space-y-6">
                  {!canUseMenu ? (
                    <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                      <div className="max-w-2xl">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Funzione Pro</span>
                        <h2 className="text-2xl font-black text-slate-850 mt-2">Menu digitale con allergeni per piatto</h2>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                          Il piano attuale consente la scheda base del locale. Per creare il menu, associare allergeni/tracce,
                          pubblicare il QR e stampare il registro serve il piano Base (€9/mese) o superiore.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        {[
                          ['Editor piatti', 'Crea categorie, prezzi, descrizioni e foto dei piatti.'],
                          ['Allergeni e tracce', 'Indica cosa contiene ogni piatto e cosa può avere in contaminazione.'],
                          ['QR e registro', 'Genera il QR per i clienti e stampa il registro allergeni.'],
                        ].map(([title, body]) => (
                          <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <h3 className="font-black text-sm text-slate-800">{title}</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{body}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                        <div>
                          <div className="font-black text-emerald-900">A partire da €9/mese (piano Base)</div>
                          <p className="text-xs text-emerald-800/80 mt-1">
                            Per attivarlo in questa versione, contatta l'amministratore AllerTgy.
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveSubTab('piano')}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-2xl text-xs font-black"
                        >
                          Confronta i piani
                        </button>
                      </div>
                    </section>
                  ) : (
                    <>
                  
                  {/* Gestione dei Multi-menù */}
                  {!piatti && !approved && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6 space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-lg font-black text-slate-800">📋 Gestione Menù Multipli</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Crea diversi menù per pranzo, cena, diete particolari o bambini.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!current) return;
                              if (confirm("Sei sicuro di voler tradurre automaticamente tutti i piatti del menù in Inglese, Spagnolo, Tedesco e Francese tramite AI?")) {
                                setBusy(true);
                                try {
                                  await api.translateMenu(current.id);
                                  alert("🤖 Menù tradotto con successo!");
                                } catch (err) { alert((err as Error).message); }
                                setBusy(false);
                              }
                            }}
                            disabled={busy}
                            className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5"
                          >
                            {busy ? 'Traduzione...' : '🤖 Traduci menù con AI'}
                          </button>
                          <button
                            onClick={() => setShowAddMenuModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black transition-all"
                          >
                            + Nuovo Menù
                          </button>
                        </div>
                      </div>

                      {menus.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">Nessun menù configurato. Crea un menù per iniziare ad organizzare i tuoi piatti.</p>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {menus.map((m) => (
                            <div key={m.id} className="border border-slate-150 rounded-2xl p-4 bg-slate-50 flex items-center justify-between gap-3 hover:border-slate-350 transition-all">
                              <div className="min-w-0">
                                <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${m.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <span className="font-extrabold text-sm text-slate-800 truncate">{m.name}</span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={async () => {
                                    const nName = prompt("Inserisci il nuovo nome del menù:", m.name);
                                    if (nName && nName.trim()) {
                                      try {
                                        const updated = await api.updateMenu(current!.id, m.id, nName.trim(), m.is_active, m.sort_order);
                                        setMenus(menus.map(x => x.id === m.id ? updated : x));
                                      } catch (err) { alert((err as Error).message); }
                                    }
                                  }}
                                  className="text-xs hover:text-emerald-750 font-bold bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-500"
                                >
                                  Modifica
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Sei sicuro di voler eliminare il menù "${m.name}"? I piatti associati verranno scollegati ma rimarranno nel database.`)) {
                                      try {
                                        await api.deleteMenu(current!.id, m.id);
                                        setMenus(menus.filter(x => x.id !== m.id));
                                      } catch (err) { alert((err as Error).message); }
                                    }
                                  }}
                                  className="text-xs hover:text-red-700 font-bold bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-500"
                                >
                                  Elimina
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Menu Modal */}
                  {showAddMenuModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl">
                        <h3 className="text-lg font-black text-slate-850">Crea Nuovo Menù</h3>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nome Menù</label>
                          <input
                            type="text"
                            value={newMenuName}
                            onChange={(e) => setNewMenuName(e.target.value)}
                            placeholder="es. Menù Serale, Carta dei Vini"
                            className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => { setShowAddMenuModal(false); setNewMenuName(''); }}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-50"
                          >
                            Annulla
                          </button>
                          <button
                            onClick={async () => {
                              if (!newMenuName.trim()) return;
                              try {
                                const newM = await api.createMenu(current!.id, newMenuName.trim());
                                setMenus([...menus, newM]);
                                setShowAddMenuModal(false);
                                setNewMenuName('');
                              } catch (err) { alert((err as Error).message); }
                            }}
                            disabled={!newMenuName.trim()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black disabled:opacity-50"
                          >
                            Crea
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scelta come caricare */}
                  {!piatti && !approved && (
                    <div className="grid md:grid-cols-3 gap-6">
                      
                      {/* Drag and Drop o File Upload per AI Vision */}
                      <section
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
                        className="bg-white border-2 border-dashed border-emerald-300 rounded-3xl p-6 text-center flex flex-col items-center justify-between space-y-4 hover:bg-emerald-50/10 transition-colors cursor-pointer"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-4xl shadow-inner">📸</div>
                        <div>
                          <p className="text-lg font-extrabold text-slate-800">Foto menù cartaceo (AI)</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                            Carica la foto del menù. L'AI estrarrà piatti, descrizioni e allergeni previsti.
                          </p>
                        </div>
                        <label className="inline-block w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs cursor-pointer shadow shadow-emerald-600/10 transition-colors">
                          {busy ? 'Analisi in corso...' : 'Seleziona immagine'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            disabled={busy}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} 
                          />
                        </label>
                      </section>

                      {/* Analizza da URL/Link */}
                      <section className="bg-white border border-slate-200 rounded-3xl p-6 text-center flex flex-col items-center justify-between space-y-4 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-4xl shadow-inner">🔗</div>
                        <div>
                          <p className="text-lg font-extrabold text-slate-800">Link del menù (AI)</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                            Inserisci il link di un menù online (es. PDF o sito). L'AI analizzerà scritte e allergeni.
                          </p>
                        </div>
                        <div className="w-full space-y-2">
                          <input
                            type="url"
                            value={menuUrl}
                            onChange={(e) => setMenuUrl(e.target.value)}
                            placeholder="https://esempio.it/menu.pdf"
                            className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                          />
                          <button
                            onClick={analyzeFromUrl}
                            disabled={busy || !menuUrl.trim()}
                            className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow shadow-emerald-600/10 transition-colors disabled:opacity-50"
                          >
                            {busy ? 'Analisi in corso...' : 'Analizza Link'}
                          </button>
                        </div>
                      </section>

                      {/* Pulsanti manuali */}
                      <div className="flex flex-col gap-4">
                        {hasPublished && (
                          <button 
                            onClick={loadExisting} 
                            disabled={busy}
                            className="flex-1 bg-white rounded-3xl border border-slate-200 p-6 text-left hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between"
                          >
                            <div className="text-3xl">✏️</div>
                            <div>
                              <div className="font-extrabold text-sm text-slate-800 group-hover:text-emerald-700">Modifica menù attuale</div>
                              <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                                Recupera i piatti pubblicati e aggiornali nell'editor visuale.
                              </div>
                            </div>
                          </button>
                        )}
                        <button 
                          onClick={() => { setPiatti([{ nome_piatto: 'Nuovo piatto', categoria: 'Primi', prezzo_cents: 1000, allergeni_contenuti: [], allergeni_tracce: [] }]); setAiNote(''); }}
                          className="flex-1 bg-white rounded-3xl border border-slate-200 p-6 text-left hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between"
                        >
                          <div className="text-3xl">➕</div>
                          <div>
                            <div className="font-extrabold text-sm text-slate-800 group-hover:text-emerald-700">Inserisci a mano</div>
                            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                              Crea il menù da zero inserendo i piatti uno per uno.
                            </div>
                          </div>
                        </button>
                      </div>

                    </div>
                  )}

                  {/* Editor Menù Visuale */}
                  {piatti && !approved && (
                    <div className="space-y-6">
                      {aiNote && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
                          <span>⚡ Note AI:</span>
                          <span>{aiNote}</span>
                        </div>
                      )}
                      
                      <MenuEditor piatti={piatti} allergens={allergens} onChange={setPiatti} restaurantPhotos={photos} menus={menus} />
                      
                      <button
                        type="button"
                        onClick={() => setMenuLegalAck(!menuLegalAck)}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-left hover:border-emerald-300 transition-colors"
                      >
                        <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center text-xs font-black shrink-0 ${menuLegalAck ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-300 text-transparent'}`}>
                          ✓
                        </span>
                        <span className="text-xs text-slate-600 font-semibold leading-relaxed">
                          Confermo di aver verificato ingredienti, allergeni contenuti e possibili tracce.
                          Sono consapevole che le informazioni pubblicate su AllerTgy sono sotto la responsabilità del locale
                          e devono essere aggiornate a ogni variazione di ricetta, fornitore o procedura di cucina.
                        </span>
                      </button>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                        <button 
                          onClick={() => setPiatti(null)} 
                          className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                          ↩︎ Annulla
                        </button>
                        <button 
                          onClick={save} 
                          disabled={busy || piatti.length === 0 || !menuLegalAck}
                          className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black disabled:opacity-40 transition-all shadow-md shadow-emerald-600/10"
                        >
                          {busy ? 'Salvataggio...' : '✓ Salva e Pubblica menù'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pubblicato con visualizzazione QR e anteprima */}
                  {approved && (
                    <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8 text-center">
                      <div className="space-y-2">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 text-3xl flex items-center justify-center mx-auto shadow-inner">✓</div>
                        <h2 className="text-2xl font-black text-slate-800">Menù pubblicato con successo!</h2>
                        <p className="text-xs text-slate-400">Il locale è attivo. I tuoi clienti possono scansionare il codice ed ordinare in sicurezza.</p>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4 max-w-sm mx-auto">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Codice Locale</span>
                          <span className="font-mono font-black text-3xl text-emerald-800 block mt-1 tracking-widest">{approved.public_code}</span>
                        </div>
                        
                        <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200 inline-block">
                          <img 
                            alt={`QR ${approved.public_code}`} 
                            className="w-48 h-48"
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.origin + '/r/' + (approved.slug || approved.public_code))}`} 
                          />
                        </div>

                        <p className="text-[10px] text-slate-455 font-semibold leading-relaxed">
                          Usa la sezione <b>QR Code</b> per scaricarlo o stamparlo.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex flex-col gap-3 items-center">
                        <button 
                          onClick={() => { setPiatti(null); setApproved(null); }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-850 hover:underline"
                        >
                          Modifica ancora il menù del locale
                        </button>
                      </div>
                    </section>
                  )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: IMPOSTAZIONI LOCALE */}
              {activeSubTab === 'attivita' && (
                <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Impostazioni Locale</h2>
                    <p className="text-xs text-slate-500 mt-1">Configura il logo, la geolocalizzazione, l'indirizzo dell'attività, i recapiti di contatto e gli orari per i tuoi clienti:</p>
                  </div>

                  {/* Logo Section */}
                  <div className="bg-slate-50 border border-slate-205 rounded-3xl p-5 space-y-3">
                    <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Logo del Ristorante</label>
                    <div className="flex items-center gap-4">
                      {logoUrl ? (
                        <img 
                          src={logoUrl.startsWith('http') ? logoUrl : `${API}${logoUrl}`} 
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm" 
                          alt="Logo locale" 
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-250 border-dashed flex items-center justify-center text-slate-400 text-[10px] font-bold">
                          Nessun Logo
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm shadow-emerald-600/10">
                          Carica Nuovo Logo
                          <input type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
                        </label>
                        <p className="text-[10px] text-slate-405">Dimensione consigliata: quadrata, max 5MB. Formati: JPG, PNG, WebP.</p>
                      </div>
                    </div>
                  </div>

                  {/* Galleria foto (limite per piano) */}
                  <div className="bg-slate-50 border border-slate-205 rounded-3xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Galleria foto del locale</label>
                        <p className="text-[10px] text-slate-405 mt-0.5">
                          Le foto compaiono sulla pagina pubblica del locale. Limite del piano attuale:
                          {' '}{{ free: 1, base: 10, pro_notify: 20 }[currentPlan]} foto.
                        </p>
                      </div>
                      <label className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm shadow-emerald-600/10">
                        + Aggiungi foto
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f || !current) return;
                            setBusy(true); setError('');
                            try {
                              await api.uploadRestaurantPhoto(current.id, f);
                              setPhotos(await api.listRestaurantPhotos(current.id));
                            } catch (err) { setError((err as Error).message); }
                            setBusy(false);
                          }}
                        />
                      </label>
                    </div>
                    {photos.length === 0 ? (
                      <p className="text-xs text-slate-400">Nessuna foto caricata: la scheda pubblica mostrerà solo il logo.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {photos.map((p) => (
                          <div key={p.id} className="relative group">
                            <img src={p.url} alt="Foto locale" className={`w-full h-24 object-cover rounded-2xl border ${p.is_cover ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'}`} />
                            {p.is_cover && (
                              <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">Copertina</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                              {!p.is_cover && (
                                <button
                                  onClick={async () => {
                                    if (!current) return;
                                    try { setPhotos(await api.setCoverPhoto(current.id, p.id)); }
                                    catch (err) { setError((err as Error).message); }
                                  }}
                                  className="bg-white text-slate-800 text-[9px] font-black px-2 py-1 rounded-lg"
                                >
                                  Copertina
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (!current) return;
                                  try {
                                    await api.deleteRestaurantPhoto(current.id, p.id);
                                    setPhotos(await api.listRestaurantPhotos(current.id));
                                  } catch (err) { setError((err as Error).message); }
                                }}
                                className="bg-rose-600 text-white text-[9px] font-black px-2 py-1 rounded-lg"
                              >
                                Elimina
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Geolocation Section */}
                  <div className="bg-slate-50 border border-slate-205 rounded-3xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-[10px] text-slate-455 uppercase font-black tracking-wider block">Posizione Geografica sulla Mappa</label>
                        <p className="text-[10px] text-slate-405 mt-0.5">Trascina il pin o clicca sulla mappa per impostare la posizione del tuo ristorante.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-extrabold rounded-xl transition-colors border border-slate-200 shadow-sm"
                      >
                        📍 Rileva posizione attuale
                      </button>
                    </div>

                    {/* Ricerca indirizzo per geolocalizzazione */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">🔍 Cerca indirizzo o luogo su mappa</label>
                      <div className="flex gap-2">
                        <input 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              searchNominatim(searchQuery);
                            }
                          }}
                          placeholder="es. Via Garibaldi 12 Milano o Trattoria Da Matteo" 
                          className="border border-slate-250 rounded-xl px-3 py-2 flex-1 text-xs bg-slate-50 focus:bg-white focus:outline-none" 
                        />
                        <button 
                          type="button"
                          onClick={() => searchNominatim(searchQuery)}
                          disabled={isSearching || !searchQuery.trim()}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] transition-colors disabled:opacity-40"
                        >
                          {isSearching ? 'Cerca...' : 'Cerca'}
                        </button>
                      </div>

                      {searchSuggestions.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-1.5 max-h-48 overflow-y-auto space-y-0.5 shadow-md relative z-30">
                          {searchSuggestions.map((s, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectSuggestionForEdit(s)}
                              className="w-full text-left px-2 py-1.5 text-[11px] hover:bg-slate-50 rounded-lg transition-colors block border-b border-slate-100 last:border-b-0"
                            >
                              <div className="font-extrabold text-slate-800">{s.display_name.split(',')[0]}</div>
                              <div className="text-slate-500 text-[9px] truncate">{s.display_name}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Latitudine</label>
                        <input
                          type="number"
                          step="any"
                          value={latitude}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setLatitude(val);
                            if (val !== '' && longitude !== '' && settingsMarkerRef.current) {
                              settingsMarkerRef.current.setLatLng([val, Number(longitude)]);
                              settingsMapRef.current?.setView([val, Number(longitude)]);
                            }
                          }}
                          placeholder="es. 45.4642"
                          className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Longitudine</label>
                        <input
                          type="number"
                          step="any"
                          value={longitude}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setLongitude(val);
                            if (latitude !== '' && val !== '' && settingsMarkerRef.current) {
                              settingsMarkerRef.current.setLatLng([Number(latitude), val]);
                              settingsMapRef.current?.setView([Number(latitude), val]);
                            }
                          }}
                          placeholder="es. 9.1900"
                          className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="h-56 rounded-2xl overflow-hidden border border-slate-250 shadow-inner relative z-10">
                      <div id="settings-map" className="w-full h-full"></div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Indirizzo Completo</label>
                      <input 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="es. Via Garibaldi 12" 
                        className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Telefono Ristorante</label>
                      <input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="es. +39 02 1234567" 
                        className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Email Contatto Pubblico</label>
                      <input 
                        value={emailContact} 
                        onChange={(e) => setEmailContact(e.target.value)}
                        placeholder="es. info@trattoriadamatteo.it" 
                        className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Orari di Apertura</label>
                      <textarea
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                        rows={4}
                        placeholder="es. Lun - Ven: 12:30 - 14:30, 19:30 - 22:30&#10;Sab - Dom: 19:00 - 23:00"
                        className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Sito Web</label>
                      <input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="es. https://www.trattoriadamatteo.it"
                        className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Link Menù Originale (PDF / Web)</label>
                      <input
                        value={settingsMenuUrl}
                        onChange={(e) => setSettingsMenuUrl(e.target.value)}
                        placeholder="es. https://www.trattoriadamatteo.it/menu.pdf"
                        className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Partita IVA (P.IVA)</label>
                      <input
                        value={vatNumber}
                        onChange={(e) => setVatNumber(e.target.value)}
                        placeholder="es. 12345678901"
                        className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Referente Allergeni (Responsabile HACCP)</label>
                      <input
                        value={allergenManager}
                        onChange={(e) => setAllergenManager(e.target.value)}
                        placeholder="es. Chef Mario Rossi"
                        className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Descrizione del Locale (pagina pubblica)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="es. Cucina tradizionale con menù dedicato a celiaci e allergici…"
                        className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Collegamenti Esterni (Recensioni) */}
                  <div className="bg-slate-50 border border-slate-205 rounded-3xl p-5 space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-455 uppercase font-black tracking-wider block">Collegamenti Esterni (Google & TripAdvisor)</label>
                      <p className="text-[10px] text-slate-405 mt-0.5">Associa il tuo locale a Google e TripAdvisor per mostrare le valutazioni e recensioni sulla tua pagina pubblica.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Google Place ID</label>
                        <input
                          value={googlePlaceId}
                          onChange={(e) => setGooglePlaceId(e.target.value)}
                          placeholder="es. ChIJP3SaNzDExokRkRXXEIQ5OIU"
                          className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none"
                        />
                        {current.google_rating !== undefined && current.google_rating !== null && (
                          <p className="text-[10px] text-emerald-800 mt-1 font-black">⭐ Valutazione Google: {current.google_rating} ({current.google_reviews_count} recensioni)</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">TripAdvisor URL</label>
                        <input
                          value={tripadvisorUrl}
                          onChange={(e) => setTripadvisorUrl(e.target.value)}
                          placeholder="es. https://www.tripadvisor.it/Restaurant_Review..."
                          className="w-full border border-slate-250 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none"
                        />
                        {current.tripadvisor_rating !== undefined && current.tripadvisor_rating !== null && (
                          <p className="text-[10px] text-emerald-800 mt-1 font-black">⭐ Valutazione TripAdvisor: {current.tripadvisor_rating} ({current.tripadvisor_reviews_count} recensioni)</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={syncExternal}
                        disabled={busy || (!googlePlaceId.trim() && !tripadvisorUrl.trim())}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] transition-colors disabled:opacity-40"
                      >
                        {busy ? 'Sincronizzazione...' : '🔄 Sincronizza Recensioni Esterne'}
                      </button>
                    </div>
                  </div>

                  {current.slug && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-xs text-slate-600">
                      🌐 Pagina pubblica del locale:{' '}
                      <a href={`/r/${current.slug}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                        {window.location.origin}/r/{current.slug}
                      </a>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={saveSettings}
                      disabled={busy}
                      className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/10 disabled:opacity-40"
                    >
                      {busy ? 'Salvataggio...' : 'Salva Impostazioni'}
                    </button>
                  </div>
                </section>
              )}

              {/* TAB 4: PIANO E FUNZIONI */}
              {activeSubTab === 'piano' && (
                <section className="space-y-6">
                  {/* Stato abbonamento attuale */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Piano attuale</span>
                      <h2 className="text-2xl font-black text-slate-850 mt-1">{currentPlanLabel}</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Stato: <b>{current?.subscription_status ?? 'free'}</b> · Prezzo: <b>{centsToEuro(currentPlanPrice)} / mese</b>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`px-4 py-2 rounded-2xl text-xs font-black ${canUseMenu ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {canUseMenu ? 'Menu digitale attivo' : 'Menu digitale non incluso'}
                      </div>
                      {restaurantCanPushNotify(current) && (
                        <div className="px-4 py-2 rounded-2xl text-xs font-black bg-violet-50 text-violet-800">
                          🔔 Notifiche push attive
                        </div>
                      )}
                      {currentPlan !== 'free' && (
                        <button
                          onClick={async () => {
                            if (!current) return;
                            try {
                              const res = await api.billingPortal(current.id);
                              window.location.href = res.portal_url;
                            } catch (e) {
                              alert((e as Error).message);
                            }
                          }}
                          className="px-4 py-2 rounded-2xl text-xs font-black border border-slate-250 text-slate-700 hover:bg-slate-50"
                        >
                          Gestisci abbonamento
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Griglia piani */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {PLAN_FEATURES.map((plan) => {
                      const isCurrent = plan.code === currentPlan;
                      const isPaidPlan = plan.code === 'base' || plan.code === 'pro_notify';
                      return (
                        <div key={plan.code} className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 relative ${
                          plan.highlight ? 'border-emerald-500 ring-2 ring-emerald-500/10' : isCurrent ? 'border-slate-400' : 'border-slate-200'
                        }`}>
                          {plan.highlight && !isCurrent && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">⭐ Più scelto</span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-black text-lg text-slate-850">{plan.name}</h3>
                              {isCurrent && <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg">Attuale</span>}
                            </div>
                            <div className="text-xl font-black text-emerald-800 mt-1">{plan.price}</div>
                            {'trial' in plan && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{(plan as any).trial}</span>
                            )}
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{plan.description}</p>
                          </div>
                          <div className="space-y-2">
                            {plan.features.map((feature) => (
                              <div key={feature} className="text-xs text-slate-600 font-semibold flex gap-2">
                                <span className="text-emerald-700 font-black">✓</span>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                          {isPaidPlan && !isCurrent && (
                            <button
                              onClick={async () => {
                                if (!current) return;
                                setBusy(true); setError('');
                                try {
                                  const updated = await api.billingStartTrial(current.id, plan.code);
                                  setCurrent(updated);
                                  setRestaurants(restaurants.map(r => r.id === updated.id ? updated : r));
                                } catch (e) {
                                  const msg = (e as Error).message;
                                  if (/già un piano|già stata utilizzata|piano attivo/i.test(msg)) {
                                    try {
                                      const res = await api.billingCheckout(current.id, plan.code);
                                      window.location.href = res.checkout_url;
                                    } catch (checkoutErr) {
                                      const checkoutMsg = (checkoutErr as Error).message;
                                      if (/STRIPE|Pagamenti non ancora attivi/i.test(checkoutMsg)) {
                                        setError('I pagamenti online non sono ancora attivi sul server.');
                                      } else {
                                        setError(checkoutMsg);
                                      }
                                    }
                                  } else if (/STRIPE|Pagamenti non ancora attivi/i.test(msg)) {
                                    setError('I pagamenti online non sono ancora attivi sul server.');
                                  } else {
                                    setError(msg);
                                  }
                                }
                                setBusy(false);
                              }}
                              disabled={busy}
                              className={`w-full px-4 py-3 rounded-2xl text-xs font-black disabled:opacity-40 ${
                                plan.highlight
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              Inizia 14 giorni gratis
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {current && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-black text-lg text-slate-800">Storico fatture</h3>
                        <p className="text-xs text-slate-500 mt-1">Fatture emesse da Stripe per questo locale.</p>
                      </div>
                      <InvoicesPanel restaurantId={current.id} />
                    </div>
                  )}

                </section>
              )}

              {/* TAB: CRESCITA — Boost + Notifiche push */}
              {activeSubTab === 'crescita' && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Crescita</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Boost visibilità e messaggi ai clienti che hanno salvato il locale nei preferiti.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/60 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shrink-0">🚀</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-lg text-slate-800">Boost Visibilità</h3>
                        <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full uppercase">€9,90 · 30 giorni</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Metti il locale <strong>in cima ai risultati</strong> nell&apos;app clienti. Disponibile con qualsiasi piano.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!current) return;
                        setBusy(true);
                        try {
                          const res = await api.billingBoost(current.id);
                          if (res.activated) {
                            alert(res.message || 'Boost attivato per 30 giorni.');
                          } else if (res.checkout_url) {
                            window.location.href = res.checkout_url;
                          }
                        } catch (e) {
                          const msg = (e as Error).message;
                          if (/STRIPE|Pagamenti non ancora attivi/i.test(msg)) {
                            alert('I pagamenti online non sono ancora attivi. In test il Boost si attiva se Stripe non è configurato.');
                          } else {
                            alert(msg);
                          }
                        }
                        setBusy(false);
                      }}
                      disabled={busy}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black disabled:opacity-40 whitespace-nowrap shrink-0"
                    >
                      🚀 Attiva Boost
                    </button>
                  </div>

                  {current && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-black text-lg text-slate-800">Storico Boost</h3>
                        <p className="text-xs text-slate-500 mt-1">Boost attivi e scaduti per questo locale.</p>
                      </div>
                      <BoostHistoryPanel restaurantId={current.id} />
                    </div>
                  )}

                  {restaurantCanPushNotify(current) ? (
                    <PushNotificationPanel restaurantId={current!.id} />
                  ) : (
                    <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-black text-lg">🔔 Notifiche push ai clienti fedeli</h3>
                        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                          Invia promozioni e novità ai clienti che ti hanno salvato nei preferiti. Richiede il piano Pro (€19/mese).
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveSubTab('piano')}
                        className="bg-white text-slate-900 hover:bg-slate-100 px-5 py-3 rounded-2xl text-xs font-black whitespace-nowrap"
                      >
                        Passa a Pro
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* TAB: RECENSIONI */}
              {activeSubTab === 'recensioni' && current && (
                <OwnerReviewsPanel restaurant={current} />
              )}

              {/* TAB 5: QR CODE DOWNLOAD AREA */}
              {activeSubTab === 'qr' && (
                canUseMenu ? (
                <div className="space-y-8 max-w-3xl mx-auto">
                  {/* Sezione 1: Stato Conformità & Esenzione Burocrazia */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 text-left">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-lg font-black text-slate-850 flex items-center gap-2">
                          <span>🛡️</span> Esenzione Burocrazia Allergeni
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-0.5">Gestione legale conforme al Regolamento UE 1169/2011</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                        Attivo e Conforme
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed space-y-2">
                      <p>
                        <b>Come funziona?</b> Il menu digitale di AllerTgy aggiorna in tempo reale gli ingredienti e gli allergeni di ogni piatto ad ogni tua modifica. Questo sostituisce a tutti gli effetti di legge il vecchio "registro cartaceo", a patto che nel locale sia esposto l'avviso al consumatore (tramite il QR Code qui sotto) e sia disponibile un registro cartaceo di emergenza stampato.
                      </p>
                    </div>

                    {/* Campi dati legali ad accesso rapido */}
                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Partita IVA del Locale</label>
                        <input
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                          placeholder="es. 12345678901"
                          className="w-full border border-slate-250 rounded-2xl px-4 py-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Referente Allergeni (Responsabile HACCP)</label>
                        <input
                          value={allergenManager}
                          onChange={(e) => setAllergenManager(e.target.value)}
                          placeholder="es. Chef Mario Rossi"
                          className="w-full border border-slate-250 rounded-2xl px-4 py-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={async () => {
                          if (!current) return;
                          setBusy(true); setError('');
                          try {
                            const res = await api.updateRestaurant(current.id, {
                              name: current.name,
                              city: current.city,
                              address: address.trim(),
                              phone: phone.trim(),
                              email_contact: emailContact.trim(),
                              opening_hours: openingHours.trim(),
                              image_url: logoUrl || null,
                              latitude: latitude === '' ? null : Number(latitude),
                              longitude: longitude === '' ? null : Number(longitude),
                              website: website.trim() || null,
                              menu_url: settingsMenuUrl.trim() || null,
                              description: description.trim() || null,
                              google_place_id: googlePlaceId.trim() || null,
                              tripadvisor_url: tripadvisorUrl.trim() || null,
                              vat_number: vatNumber.trim() || null,
                              allergen_manager: allergenManager.trim() || null,
                            });
                            setCurrent(res);
                            setRestaurants(restaurants.map(r => r.id === res.id ? res : r));
                            alert("Dati legali aggiornati con successo!");
                          } catch (err) { setError((err as Error).message); }
                          setBusy(false);
                        }}
                        disabled={busy}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] shadow-sm disabled:opacity-40"
                      >
                        {busy ? 'Aggiornamento...' : '💾 Aggiorna Dati Legali'}
                      </button>
                    </div>
                  </div>

                  {/* Sezione 2: Cartello Ufficiale ed Esposizione */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 text-center">
                    <div className="text-left border-b border-slate-100 pb-3">
                      <h3 className="text-base font-black text-slate-850">🖨️ Cartello Legale da Esporre</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Stampa questo cartello e posizionalo sui tavoli o all'ingresso per essere in regola con la legge.</p>
                    </div>

                    {/* Printable area */}
                    <div id="printable-qr-card" className="p-8 bg-white rounded-3xl border-2 border-dashed border-slate-250 space-y-6 max-w-sm mx-auto text-center shadow-sm">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{current.name}</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Registro Allergeni Digitale</p>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 inline-block mx-auto">
                        <img 
                          alt={`QR ${current.public_code}`} 
                          className="w-44 h-44 mx-auto"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/r/' + (current.slug || current.public_code))}`} 
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="font-mono font-black text-lg text-emerald-800 tracking-widest block">Codice Locale: #{current.public_code}</span>
                        {vatNumber && <span className="text-[9px] font-bold text-slate-450 block">P.IVA: {vatNumber}</span>}
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-left text-[10px] text-emerald-950 font-semibold leading-relaxed">
                        <p className="font-bold text-center mb-1 text-[11px] text-emerald-900">⚠️ AVVISO AL CONSUMATORE</p>
                        Le informazioni sulla presenza di sostanze o prodotti che provocano allergie o intolleranze sono disponibili in formato digitale. Inquadra il QR Code con la fotocamera del tuo smartphone per consultare il menù interattivo filtrato sulle tue allergie, oppure richiedi il registro cartaceo al personale. (Reg. UE n. 1169/2011)
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => setPrintMode('qr')}
                        className="px-6 py-3 rounded-2xl border border-slate-250 text-slate-700 font-extrabold text-xs hover:bg-slate-100"
                      >
                        🖨️ Stampa Cartello QR
                      </button>
                      <a 
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '/r/' + (current.slug || current.public_code))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/10 text-center"
                      >
                        💾 Scarica QR ad Alta Risoluzione
                      </a>
                    </div>
                  </div>

                  {/* Sezione 3: Registro di Emergenza Cartaceo */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 text-left">
                    <h3 className="text-base font-black text-slate-850">📄 Registro degli Allergeni Cartaceo (Stampa di Emergenza)</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      In caso di assenza temporanea di connessione a internet o qualora le autorità competenti (es. NAS, ASL) richiedessero un documento fisico, devi tenere a disposizione questo registro cartaceo stampato ed aggiornato all'ultima versione.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={async () => {
                          if (!piatti) {
                            setBusy(true);
                            try {
                              const m = await api.publicMenu(current.public_code);
                              setPiatti(m.piatti.map(({ id, ...p }) => p));
                            } catch (e) {
                              setError((e as Error).message);
                            }
                            setBusy(false);
                          }
                          setPrintMode('registry');
                        }}
                        disabled={!piatti || piatti.length === 0}
                        className={`flex-1 text-center bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-extrabold px-6 py-3 rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${(!piatti || piatti.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span>🖨️</span> Stampa Registro (Browser)
                      </button>

                      <button
                        onClick={async () => {
                          if (!current) return;
                          setBusy(true);
                          setError('');
                          try {
                            const blob = await api.downloadRegistryPdf(current.id);
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `registro_allergeni_${current.slug || 'locale'}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            setError((err as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                        disabled={!piatti || piatti.length === 0}
                        className={`flex-1 text-center bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${(!piatti || piatti.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span>📥</span> Scarica Registro PDF Ufficiale
                      </button>
                    </div>
                  </div>
                </div>
                ) : (
                  <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-5 text-center max-w-xl mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-2xl flex items-center justify-center mx-auto">🔒</div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">QR menu disponibile nel Pro</h2>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Il QR apre il menu digitale con allergeni per piatto. Attiva il piano Base o Pro per pubblicarlo ai clienti.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('piano')}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-2xl text-xs font-black"
                    >
                      Vedi piano Pro
                    </button>
                  </section>
                )
              )}

          </div>
      )}
    </OwnerWebShell>
      
      {/* Container di Stampa Registro Allergeni (nascosto su schermo, visibile solo in stampa) */}
      <div id="printable-allergen-registry" className="hidden p-8 bg-white text-slate-800">
        <div className="border-b border-slate-350 pb-4 mb-6">
          <h1 className="text-2xl font-black">{current?.name}</h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {current?.address ? `📍 ${current.address}` : ''} {current?.phone ? ` | 📞 ${current.phone}` : ''}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <div>Codice Locale: #{current?.public_code}</div>
            <div>P.IVA: {vatNumber || '—'}</div>
            <div>Referente Allergeni: {allergenManager || '—'}</div>
            <div>Menu Aggiornato il: {current?.menu_updated_at ? new Date(current.menu_updated_at).toLocaleDateString('it-IT') : '—'}</div>
          </div>
        </div>

        <h2 className="text-sm font-black uppercase tracking-wider mb-3 text-slate-700">
          Registro Ufficiale degli Allergeni Alimentari (Regolamento UE n. 1169/2011)
        </h2>
        
        <table className="w-full text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-3 text-xs font-bold w-1/4">Piatto</th>
              <th className="border border-slate-300 p-3 text-xs font-bold w-1/5">Categoria / Sezione</th>
              <th className="border border-slate-300 p-3 text-xs font-bold w-1/4 text-rose-700">Allergeni Contenuti</th>
              <th className="border border-slate-300 p-3 text-xs font-bold w-1/4 text-amber-700">Possibili Tracce</th>
            </tr>
          </thead>
          <tbody>
            {piatti?.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="border border-slate-300 p-3 text-xs font-semibold">{p.nome_piatto}</td>
                <td className="border border-slate-300 p-3 text-xs text-slate-550">{p.categoria || 'Generale'}</td>
                <td className="border border-slate-300 p-3 text-xs text-rose-700 font-bold">
                  {p.allergeni_contenuti
                    .filter(c => c !== 'vegano' && c !== 'vegetariano')
                    .map(getAllergenName)
                    .join(', ') || 'Nessuno'}
                </td>
                <td className="border border-slate-300 p-3 text-xs text-amber-700 font-semibold">
                  {p.allergeni_tracce
                    .filter(c => c !== 'vegano' && c !== 'vegetariano')
                    .map(getAllergenName)
                    .join(', ') || 'Nessuna'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Note legali in fondo */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed space-y-2">
          <p>
            <b>Nota Informativa:</b> Ai sensi del Regolamento UE n. 1169/2011, le informazioni fornite in questo registro descrivono l'elenco delle sostanze o dei prodotti che provocano allergie o intolleranze utilizzati nella preparazione di ciascun piatto servito all'interno del locale, incluse possibili tracce derivanti da contaminazione crociata accidentale durante la lavorazione.
          </p>
          <p>
            Si raccomanda vivamente alla clientela di segnalare preventivamente qualsiasi allergia o intolleranza alimentare al personale di sala prima di effettuare l'ordinazione.
          </p>
        </div>
      </div>
    </>
  );
}
