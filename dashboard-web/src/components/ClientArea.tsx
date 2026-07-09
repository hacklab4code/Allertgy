import { type ReactNode, useEffect, useMemo, useState, useRef } from 'react';
import { api, API, clearToken, hasToken, setToken, type Allergen, type DishOut, type MenuOut } from '../api';

type Semaforo = 'verde' | 'giallo' | 'rosso';
type SafetyStatus = 'verde' | 'giallo' | 'rosso' | 'grigio';

interface MenuSafetyOut extends MenuOut {
  x: number;
  y: number;
  red: number;
  yellow: number;
  green: number;
  status: SafetyStatus;
  safetyLabel: string;
}

function calcolaSemaforo(profilo: Set<string>, p: DishOut): { stato: Semaforo; match: string[] } {
  const contenuti = p.allergeni_contenuti.filter((a) => profilo.has(a));
  const tracce = p.allergeni_tracce.filter((a) => profilo.has(a));
  if (contenuti.length > 0) return { stato: 'rosso', match: contenuti };
  if (tracce.length > 0) return { stato: 'giallo', match: tracce };
  return { stato: 'verde', match: [] };
}

const STOCK_PHOTOS = [
  { name: 'Bruschetta', url: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=600&q=80' },
  { name: 'Insalata', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
  { name: 'Pasta/Carbonara', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { name: 'Risotto', url: 'https://images.unsplash.com/photo-1595908129746-57ca1a63dd4d?auto=format&fit=crop&w=600&q=80' },
  { name: 'Frittura Pesce', url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80' },
  { name: 'Carne/Tagliata', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
  { name: 'Verdure Grigliate', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
  { name: 'Tiramisù', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
  { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
];

export default function ClientArea({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) {
  const [logged, setLogged] = useState(hasToken());
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptHealthData, setAcceptHealthData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [profileSaved, setProfileSaved] = useState(false);

  const [codice, setCodice] = useState('');
  const [menu, setMenu] = useState<MenuOut | null>(null);

  // Navigazione
  const [phoneScreen, setPhoneScreen] = useState<'onboarding' | 'app'>('onboarding');
  const [activeTab, setActiveTab] = useState<'search' | 'map' | 'profile'>('search');
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [menuFilter, setMenuFilter] = useState<'tutti' | 'verde' | 'giallo' | 'rosso'>('tutti');

  // Mappa e ristoranti caricati dal backend
  const [allRestaurants, setAllRestaurants] = useState<MenuOut[]>([]);
  const [selectedMapRest, setSelectedMapRest] = useState<MenuSafetyOut | null>(null);

  // Geolocalizzazione client reale
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const clientMapRef = useRef<any>(null);
  const clientMarkersGroupRef = useRef<any>(null);

  // Note SOS e documenti
  const [userProfile, setUserProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [emergencyDraft, setEmergencyDraft] = useState('');
  const [showAllergenPicker, setShowAllergenPicker] = useState(false);
  const [allergenSearch, setAllergenSearch] = useState('');

  const slides = [
    {
      title: 'Benvenuto su AllerTgy',
      text: 'Mangiare fuori con allergie o intolleranze non deve più farti paura. Scopri come semplifichiamo la tua scelta al ristorante.',
      emoji: '🥗'
    },
    {
      title: 'Il Semaforo degli Allergeni',
      text: 'Un sistema semplice e chiaro in tre colori:\n🟢 Idoneo per il tuo profilo\n🟡 Con attenzione (possibili tracce)\n🔴 Non idoneo',
      emoji: '🚦'
    },
    {
      title: 'Scansiona e Ordina',
      text: 'Inquadra il QR Code sul tavolo o digita il codice a 6 cifre del ristorante per sbloccare all\'istante il menù personalizzato su di te.',
      emoji: '📱'
    }
  ];

  // Caricamento iniziale
  useEffect(() => {
    if (!logged) return;
    api.allergens().then(setAllergens).catch((e) => setError(e.message));
    api.myAllergens()
      .then((mine) => {
        if (mine.length > 0) {
          setSelected(new Set(mine.map((a) => a.code)));
          setProfileSaved(true);
          setPhoneScreen('app');
          setActiveTab('map'); // Apri direttamente sulla Mappa se le allergie ci sono già
        } else {
          setPhoneScreen('onboarding');
        }
      })
      .catch((e) => {
        if (/token|credenziali/i.test(e.message)) { clearToken(); setLogged(false); }
      });
  }, [logged]);

  // Caricamento dei ristoranti per la mappa quando si apre l'app
  const fetchRestaurants = async () => {
    try {
      const rs = await api.listRestaurants();
      setAllRestaurants(rs);
    } catch (e) {
      console.error('Errore durante il caricamento dei locali:', e);
    }
  };

  const fetchProfileAndDocs = async () => {
    try {
      const prof = await api.getProfile();
      setUserProfile(prof);
      setEmergencyDraft(prof.emergency_medicines || '');
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error('Errore durante caricamento profilo/documenti:', e);
    }
  };

  useEffect(() => {
    if (logged && phoneScreen === 'app') {
      fetchRestaurants();
      fetchProfileAndDocs();
    }
  }, [logged, phoneScreen, activeTab]);

  const submitAuth = async () => {
    setBusy(true); setError('');
    try {
      const res = mode === 'login'
        ? await api.login(email.trim(), password)
        : await api.register(email.trim(), password, 'customer', undefined, {
            accept_terms: acceptTerms,
            accept_privacy: acceptPrivacy,
            accept_health_data: acceptHealthData,
          });
      setToken(res.access_token);
      setLogged(true);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setBusy(true); setError('');
    try {
      await api.uploadDocument(file);
      await fetchProfileAndDocs();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  const saveEmergencyNotes = async () => {
    setBusy(true);
    try {
      await api.updateAppleHealth(0, emergencyDraft.trim() || null, null, null);
      await fetchProfileAndDocs();
    } catch (err) {
      console.error(err);
    }
    setBusy(false);
  };

  const toggleAllergen = (code: string) => {
    const s = new Set(selected);
    s.has(code) ? s.delete(code) : s.add(code);
    setSelected(s);
    setProfileSaved(false);
  };

  // Allergeni filtrati dalla ricerca nel picker
  const filteredAllergens = useMemo(() => {
    if (!allergenSearch.trim()) return allergens;
    const q = allergenSearch.toLowerCase().trim();
    return allergens.filter(
      (a) =>
        a.name_it.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.emoji && a.emoji.includes(q))
    );
  }, [allergens, allergenSearch]);

  const saveProfile = async () => {
    setBusy(true); setError('');
    try {
      await api.saveAllergens([...selected]);
      setProfileSaved(true);
      setPhoneScreen('app');
      setActiveTab('map');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const openMenu = async (code: string) => {
    setBusy(true); setError('');
    try {
      const res = await api.publicMenu(code.trim());
      setMenu(res);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const valutati = useMemo(() => {
    if (!menu) return [];
    return menu.piatti.map((p) => ({ p, esito: calcolaSemaforo(selected, p) }));
  }, [menu, selected]);

  const getDishImage = (url: string | null | undefined, dishName: string, dishCat: string) => {
    if (url) {
      if (url.startsWith('http')) return url;
      const baseApi = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
      return `${baseApi}${url}`;
    }
    const name = (dishName || '').toLowerCase();
    const cat = (dishCat || '').toLowerCase();
    if (name.includes('pizza')) return STOCK_PHOTOS[8].url;
    if (name.includes('pasta') || name.includes('carbonara') || name.includes('tagliatelle') || cat.includes('primi')) return STOCK_PHOTOS[2].url;
    if (name.includes('risotto')) return STOCK_PHOTOS[3].url;
    if (name.includes('bruschetta') || cat.includes('antipast')) return STOCK_PHOTOS[0].url;
    if (name.includes('frittur') || name.includes('calamari') || name.includes('polpo') || name.includes('pesce') || name.includes('mare')) return STOCK_PHOTOS[4].url;
    if (name.includes('carne') || name.includes('tagliata') || name.includes('manzo') || cat.includes('secondi')) return STOCK_PHOTOS[5].url;
    if (name.includes('verdur') || name.includes('insalat') || cat.includes('contorn')) return STOCK_PHOTOS[6].url;
    if (name.includes('tiramis') || name.includes('dolce') || cat.includes('dolc')) return STOCK_PHOTOS[7].url;
    return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80';
  };

  const filteredDishes = useMemo(() => {
    if (menuFilter === 'tutti') return valutati;
    return valutati.filter(v => v.esito.stato === menuFilter);
  }, [valutati, menuFilter]);

  const countByState = (s: Semaforo) => valutati.filter((v) => v.esito.stato === s).length;

  // Calcola coordinate e indicatori di sicurezza per la mappa
  const restaurantsWithSafety = useMemo(() => {
    return allRestaurants.map((r, index) => {
      const valutatiMock = r.piatti.map((p) => calcolaSemaforo(selected, p as any));
      const red = valutatiMock.filter(e => e.stato === 'rosso').length;
      const yellow = valutatiMock.filter(e => e.stato === 'giallo').length;
      const green = valutatiMock.filter(e => e.stato === 'verde').length;

      let status: SafetyStatus = 'verde';
      if (r.piatti.length === 0) status = 'grigio';
      else if (red > 0 && green === 0) status = 'rosso';
      else if (red > 0 || yellow > 0) status = 'giallo';

      // Coordinate fittizie deterministiche sulla mappa per i locali
      const x = [35, 75, 48, 22, 85, 45][index % 6];
      const y = [32, 22, 60, 78, 55, 75][index % 6];

      return {
        ...r,
        x,
        y,
        red,
        yellow,
        green,
        status,
        safetyLabel: status === 'verde' ? 'Idoneo' : status === 'giallo' ? 'Con attenzione' : status === 'rosso' ? 'Non idoneo' : 'Vuoto'
      };
    });
  }, [allRestaurants, selected]);

  // Richiesta geolocalizzazione client all'apertura del tab Mappa
  useEffect(() => {
    if (activeTab === 'map') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLat(position.coords.latitude);
            setUserLng(position.coords.longitude);
          },
          () => {
            // Fallback: Duomo di Milano
            setUserLat(45.4642);
            setUserLng(9.1900);
          }
        );
      } else {
        setUserLat(45.4642);
        setUserLng(9.1900);
      }
    }
  }, [activeTab]);

  // Inizializzazione della mappa reale Leaflet per il cliente
  useEffect(() => {
    if (activeTab !== 'map' || userLat === null || userLng === null) {
      if (clientMapRef.current) {
        clientMapRef.current.remove();
        clientMapRef.current = null;
        clientMarkersGroupRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    if (clientMapRef.current) {
      clientMapRef.current.setView([userLat, userLng], 14);
      return;
    }

    const timer = setTimeout(() => {
      const mapEl = document.getElementById('client-map');
      if (!mapEl) return;

      const map = L.map('client-map').setView([userLat, userLng], 14);
      clientMapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      // Aggiungi marker dell'utente
      const userIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 bg-blue-500 rounded-full opacity-40 animate-ping"></div>
            <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow flex items-center justify-center">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        className: 'custom-user-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([userLat, userLng], { icon: userIcon }).addTo(map).bindTooltip("Tu", { permanent: false, direction: 'top' });

      // Gruppo marker ristoranti
      const markersGroup = L.layerGroup().addTo(map);
      clientMarkersGroupRef.current = markersGroup;
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [activeTab, userLat, userLng]);

  // Aggiornamento dei marker quando cambiano i ristoranti o lo stato allergeni
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !clientMapRef.current || !clientMarkersGroupRef.current) return;

    clientMarkersGroupRef.current.clearLayers();

    restaurantsWithSafety.forEach((r, idx) => {
      const lat = r.latitude ?? (45.4642 + (idx % 3 - 1) * 0.008 + Math.sin(idx) * 0.003);
      const lng = r.longitude ?? (9.1900 + (idx % 2 - 0.5) * 0.01 + Math.cos(idx) * 0.003);

      let colorCls = 'bg-slate-400 border-slate-650';
      if (r.status === 'verde') colorCls = 'bg-emerald-555 border-emerald-600 shadow shadow-emerald-500/25';
      if (r.status === 'giallo') colorCls = 'bg-amber-500 border-amber-600 shadow shadow-amber-500/25';
      if (r.status === 'rosso') colorCls = 'bg-rose-500 border-rose-600 shadow shadow-rose-500/25';

      const logoUrlStr = r.image_url 
        ? (r.image_url.startsWith('http') ? r.image_url : `${API}${r.image_url}`)
        : '';

      const markerHtml = `
        <div class="relative flex items-center justify-center group" style="width: 34px; height: 34px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.25)); cursor: pointer;">
          <div class="w-8 h-8 rounded-full border-2 ${colorCls} overflow-hidden bg-white flex items-center justify-center transition-transform group-hover:scale-110">
            ${logoUrlStr 
              ? `<img src="${logoUrlStr}" class="w-full h-full object-cover" />` 
              : `<span class="text-xs">🍴</span>`
            }
          </div>
          <div class="absolute -bottom-1.5 w-3 h-3 border-r-2 border-b-2 ${colorCls} bg-white rounded-br-sm rotate-45 -z-10" style="background-color: inherit;"></div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-restaurant-marker',
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      const marker = L.marker([lat, lng], { icon }).addTo(clientMarkersGroupRef.current);

      marker.on('click', () => {
        setSelectedMapRest(r as any);
        clientMapRef.current.setView([lat, lng], 15);
      });
    });
  }, [restaurantsWithSafety, userLat, userLng]);

  return (
    <div className="min-h-screen bg-slate-900 py-10 flex flex-col items-center justify-center relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_40%)] pointer-events-none" />

      {/* Back to desktop home */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg z-55"
      >
        <span>←</span>
        <span>Esci dall'Area Clienti</span>
      </button>

      {/* virtual iPhone mockup */}
      <div className="relative w-[370px] h-[780px] bg-slate-950 rounded-[55px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-[11px] border-slate-800 overflow-hidden flex flex-col">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 inset-x-0 h-6 z-50 flex items-center justify-center pointer-events-none">
          <div className="w-28 h-4.5 bg-black rounded-full shadow-inner flex items-center justify-between px-2.5">
            <div className="w-1.5 h-1.5 bg-emerald-800 rounded-full" />
            <div className="w-3 h-1 bg-slate-900 rounded-full" />
          </div>
        </div>

        {/* Screen Status Bar */}
        <div className="h-9 bg-slate-50 flex items-center justify-between px-6 pt-1 text-slate-800 text-[10px] font-black z-45 select-none pointer-events-none">
          <span>12:30</span>
          <div className="flex items-center gap-1">
            <span>📶</span>
            <span>🛜</span>
            <span>🔋 100%</span>
          </div>
        </div>

        {/* Phone screen body */}
        <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative">
          
          {/* Auth screen */}
          {!logged && (
            <div className="flex-1 flex flex-col justify-center py-6 px-4 text-slate-800">
              <div className="text-center mb-6">
                <span className="text-4xl">🥗</span>
                <h2 className="text-2xl font-black text-emerald-800 mt-2">AllerTgy Clienti</h2>
                <p className="text-xs text-slate-400 mt-1">Trova piatti sicuri per il tuo profilo</p>
              </div>

              {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">{error}</div>}

              <div className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />
                <input 
                  type="password" 
                  placeholder="Password (min. 8 caratteri)" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />

                <button
                  onClick={submitAuth}
                  disabled={
                    busy || !email || password.length < 8 ||
                    (mode === 'register' && (!acceptTerms || !acceptPrivacy || !acceptHealthData))
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-emerald-600/10 disabled:opacity-40"
                >
                  {busy ? 'Caricamento...' : mode === 'login' ? 'Accedi' : 'Registrati'}
                </button>
              </div>

              {mode === 'register' && (
                <div className="mt-3 bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
                  <TinyCheck checked={acceptTerms} onClick={() => setAcceptTerms(!acceptTerms)}>
                    Accetto Termini di servizio.
                  </TinyCheck>
                  <TinyCheck checked={acceptPrivacy} onClick={() => setAcceptPrivacy(!acceptPrivacy)}>
                    Ho letto l'Informativa Privacy.
                  </TinyCheck>
                  <TinyCheck checked={acceptHealthData} onClick={() => setAcceptHealthData(!acceptHealthData)}>
                    Acconsento al trattamento dei dati su allergie e preferenze alimentari.
                  </TinyCheck>
                </div>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-xs text-slate-500 underline"
                >
                  {mode === 'login' ? 'Crea un nuovo profilo cliente' : 'Hai già un account? Accedi'}
                </button>
              </div>
            </div>
          )}

          {/* Onboarding carousel */}
          {logged && phoneScreen === 'onboarding' && (
            <div className="flex-1 flex flex-col justify-between py-6 px-4">
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 px-2">
                <div className="w-24 h-24 rounded-3xl bg-emerald-100 flex items-center justify-center text-5xl shadow-sm">
                  {slides[onboardingSlide].emoji}
                </div>
                <h3 className="text-xl font-black text-slate-800">{slides[onboardingSlide].title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line max-w-[250px]">
                  {slides[onboardingSlide].text}
                </p>
                <div className="flex justify-center gap-1.5">
                  {slides.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all ${onboardingSlide === i ? 'w-4 bg-emerald-600' : 'w-1.5 bg-slate-200'}`} 
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (onboardingSlide < slides.length - 1) {
                      setOnboardingSlide(onboardingSlide + 1);
                    } else {
                      setPhoneScreen('app');
                      setActiveTab('profile'); // Vai a selezionare le allergie dopo l'onboarding
                    }
                  }}
                  className="w-full bg-emerald-600 text-white font-extrabold py-3.5 rounded-2xl text-xs"
                >
                  {onboardingSlide === slides.length - 1 ? 'Scegli Allergie' : 'Continua'}
                </button>
                <button
                  onClick={() => { setPhoneScreen('app'); setActiveTab('profile'); }}
                  className="w-full text-slate-400 font-semibold py-2 text-xs"
                >
                  Salta istruzioni
                </button>
              </div>
            </div>
          )}

          {/* MAIN APP SYSTEM (WITH BOTTOM TABS NAVIGATION) */}
          {logged && phoneScreen === 'app' && (
            <div className="flex-1 flex flex-col justify-between pb-[56px] relative">
              
              {menu ? (
                <div className="flex-1 flex flex-col py-3 px-4 text-slate-800 bg-slate-50 absolute inset-0 z-50 overflow-y-auto">
                  {/* Header locale */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{menu.nome_ristorante}</h4>
                        <span className="text-[9px] font-bold text-blue-800 border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded-lg">✓ Verificato</span>
                      </div>
                      <p className="text-[10px] text-slate-450 mt-1">
                        Profilo: {selected.size > 0 ? [...selected].join(', ') : 'Nessuna allergia selezionata'}
                      </p>
                    </div>
                    <button 
                      onClick={() => setMenu(null)}
                      className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-xl text-[10px] font-extrabold"
                    >
                      Chiudi
                    </button>
                  </div>

                  {/* Riepilogo conteggi semaforo */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-150">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-2.5 text-center">
                      <div className="text-lg font-black text-emerald-800">{countByState('verde')}</div>
                      <div className="text-[9.5px] font-bold text-emerald-800">Idonei</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-center">
                      <div className="text-lg font-black text-amber-800">{countByState('giallo')}</div>
                      <div className="text-[9.5px] font-bold text-amber-800">Con attenzione</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5 text-center">
                      <div className="text-lg font-black text-rose-800">{countByState('rosso')}</div>
                      <div className="text-[9.5px] font-bold text-rose-800">Non idonei</div>
                    </div>
                  </div>

                  {/* Pill dei filtri semaforo */}
                  <div className="flex justify-between gap-1 py-3 border-b border-slate-150 sticky top-0 bg-slate-50 z-30">
                    <button 
                      onClick={() => setMenuFilter('tutti')}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-colors
                        ${menuFilter === 'tutti' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                      Tutti ({valutati.length})
                    </button>
                    <button 
                      onClick={() => setMenuFilter('verde')}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-colors
                        ${menuFilter === 'verde' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-emerald-700'}`}
                    >
                      🟢 Sì ({countByState('verde')})
                    </button>
                    <button 
                      onClick={() => setMenuFilter('giallo')}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-colors
                        ${menuFilter === 'giallo' ? 'bg-amber-500 border-amber-500 text-slate-900' : 'bg-white border-slate-200 text-amber-700'}`}
                    >
                      🟡 Tracce ({countByState('giallo')})
                    </button>
                    <button 
                      onClick={() => setMenuFilter('rosso')}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-colors
                        ${menuFilter === 'rosso' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 text-rose-700'}`}
                    >
                      🔴 No ({countByState('rosso')})
                    </button>
                  </div>

                  {/* Elenco piatti filtrato */}
                  <div className="flex-1 space-y-3 pt-3">
                    {filteredDishes.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400 font-medium">Nessun piatto trovato in questa sezione</div>
                    ) : (
                      filteredDishes.map(({ p, esito }) => {
                        const sem = esito.stato;
                        let borderCls = 'border-slate-200 bg-white';
                        let badgeCls = 'bg-emerald-600 text-white';
                        let label = '🟢 IDONEO';
                        
                        if (sem === 'rosso') {
                          borderCls = 'border-rose-200 bg-rose-50/20 opacity-75';
                          badgeCls = 'bg-rose-500 text-white';
                          label = '🔴 NON IDONEO';
                        } else if (sem === 'giallo') {
                          borderCls = 'border-amber-200 bg-amber-50/20';
                          badgeCls = 'bg-amber-500 text-slate-900';
                          label = '🟡 CON ATTENZIONE';
                        }
 
                        const dishImg = getDishImage(p.image_url, p.nome_piatto, p.categoria || '');

                        return (
                          <div 
                            key={p.id} 
                            className={`border rounded-2xl p-3 flex gap-3 transition-all ${borderCls}`}
                          >
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-200">
                              <img src={dishImg} className="w-full h-full object-cover" alt={p.nome_piatto} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <h5 className={`font-extrabold text-[12px] truncate ${sem === 'rosso' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                  {p.nome_piatto}
                                </h5>
                                <span className="text-[11px] font-black text-slate-650">
                                  {p.prezzo_cents ? `${(p.prezzo_cents / 100).toFixed(2)}€` : ''}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-450 mt-0.5 line-clamp-2 leading-tight">{p.descrizione}</p>
                              
                              {esito.match.length > 0 && (
                                <div className="text-[9px] font-bold text-slate-700 mt-1.5 flex flex-wrap gap-0.5 items-center">
                                  <span>⚠️ {sem === 'rosso' ? 'Contiene: ' : 'Tracce: '}</span>
                                  {esito.match.map((m, idx) => (
                                    <span key={m} className="underline">{m}{idx < esito.match.length - 1 ? ',' : ''}</span>
                                  ))}
                                </div>
                              )}

                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-450">{p.categoria || 'Generale'}</span>
                                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${badgeCls}`}>{label}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="text-center p-3 bg-slate-100 border border-slate-200/50 rounded-2xl mt-4">
                    <p className="text-[8.5px] text-slate-500 font-bold leading-tight">
                      ⚠️ Comunica sempre le tue intolleranze alimentari allo staff prima di ordinare.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* TAB 1: CERCA (QR SCANNER) */}
              {activeTab === 'search' && (
                <div className="flex-1 flex flex-col justify-between py-4 px-4 text-slate-800">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Inquadra il QR Code</h3>
                      <p className="text-[10px] text-slate-400">Scansiona il QR code al tavolo del ristorante o digita il codice locale:</p>
                    </div>

                    {/* Camera simulation box */}
                    <div className="h-40 bg-slate-900 rounded-3xl relative border border-slate-800 overflow-hidden flex flex-col items-center justify-center group">
                      <div className="absolute inset-0 bg-emerald-500/10 opacity-30 flex flex-col items-center justify-center">
                        <div className="w-[140px] h-[140px] border border-emerald-400 border-dashed rounded-2xl relative flex items-center justify-center">
                          <div className="w-[160px] h-0.5 bg-emerald-400 absolute animate-pulse shadow-md" />
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest relative z-10 animate-bounce">
                        📷 Fotocamera Attiva
                      </span>
                    </div>

                    {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">{error}</div>}

                    <div className="space-y-2">
                      <div className="text-center text-[10px] font-bold text-slate-400 uppercase">Oppure digita codice locale</div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Esempio: 100001"
                        value={codice}
                        onChange={(e) => setCodice(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-center font-mono text-base tracking-widest focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => openMenu(codice)}
                      disabled={busy || codice.trim().length < 4}
                      className="w-full bg-emerald-600 text-white font-extrabold py-3 rounded-2xl text-xs shadow disabled:opacity-40"
                    >
                      {busy ? 'Caricamento...' : 'Visualizza Menù'}
                    </button>
                    
                    {/* Pulsante Salta per test rapido */}
                    <button
                      onClick={() => openMenu('100001')}
                      className="w-full bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-xs"
                    >
                      ⏭️ Salta (Usa locale di prova)
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: MAPPA DEI RISTORANTI ADIACENTI (NEW) */}
              {activeTab === 'map' && (
                <div className="flex-1 flex flex-col justify-between text-slate-800 h-full relative overflow-hidden">
                  
                  {/* Real Leaflet Map */}
                  <div className="h-56 border-b border-slate-200 relative z-10 overflow-hidden bg-slate-100">
                    <div id="client-map" className="w-full h-full"></div>
                    
                    {/* Pop-up Overlay Card for clicked Marker */}
                    {selectedMapRest && (
                      <div className="absolute inset-x-3 bottom-2 bg-white rounded-2xl p-2.5 border border-slate-200 shadow-lg flex items-center gap-3 z-30 animate-fade-in">
                        <div className="w-11 h-11 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                          <img 
                            src={selectedMapRest.image_url 
                              ? (selectedMapRest.image_url.startsWith('http') ? selectedMapRest.image_url : `${API}${selectedMapRest.image_url}`)
                              : getDishImage(null, selectedMapRest.nome_ristorante, '')
                            } 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h6 className="font-extrabold text-[11px] text-slate-800 leading-tight truncate">
                            {selectedMapRest.nome_ristorante}
                          </h6>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {/* Safety badge indicator */}
                            <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full
                              ${selectedMapRest.status === 'verde' ? 'bg-green-100 text-green-700' : 
                                selectedMapRest.status === 'giallo' ? 'bg-amber-100 text-amber-700' : 
                                selectedMapRest.status === 'rosso' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                              {(selectedMapRest as any).safetyLabel}
                            </span>
                            <span className="text-[8px] text-slate-400 font-semibold truncate">
                              {(selectedMapRest as any).green} piatti sicuri
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => openMenu(selectedMapRest.public_code)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-xl flex-shrink-0"
                        >
                          Vedi Menù
                        </button>
                        <button 
                          onClick={() => setSelectedMapRest(null)}
                          className="text-[9px] font-bold text-slate-350 hover:text-slate-550 ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Nearby Restaurant List View */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      RISTORANTI ADIACENTI ({restaurantsWithSafety.length})
                    </span>

                    {restaurantsWithSafety.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">Nessun ristorante caricato</div>
                    ) : (
                      restaurantsWithSafety.map((r) => {
                        let badgeColor = 'bg-slate-100 text-slate-500';
                        if (r.status === 'verde') badgeColor = 'bg-emerald-100 text-emerald-700';
                        if (r.status === 'giallo') badgeColor = 'bg-amber-100 text-amber-700';
                        if (r.status === 'rosso') badgeColor = 'bg-rose-100 text-rose-700';

                        return (
                          <div 
                            key={r.restaurant_id}
                            onClick={() => openMenu(r.public_code)}
                            className="bg-white border border-slate-200 rounded-2xl p-3 flex gap-3 items-center hover:border-emerald-500 hover:shadow-sm cursor-pointer transition-all"
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                              <img 
                                src={r.image_url 
                                  ? (r.image_url.startsWith('http') ? r.image_url : `${API}${r.image_url}`)
                                  : getDishImage(null, r.nome_ristorante, '')
                                } 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline gap-1">
                                <span className="font-extrabold text-[12px] text-slate-800 truncate">{r.nome_ristorante}</span>
                                <span className="text-[8px] font-mono text-slate-400">#{r.public_code}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">📍 {r.citta || 'Non specificata'}</span>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${badgeColor}`}>
                                  {r.safetyLabel}
                                </span>
                                <span className="text-[8px] text-slate-400 font-semibold">
                                  {r.green} piatti sicuri • {r.red} a rischio
                                </span>
                              </div>
                            </div>
                            <span className="text-slate-350 text-xs">➔</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PROFILO IMPOSTAZIONI (iOS Style) */}
              {activeTab === 'profile' && (
                <div className="flex-1 flex flex-col text-slate-800 bg-slate-100 h-full relative overflow-y-auto pb-4">
                  
                  {/* Allergen Picker Modal Overlay */}
                  {showAllergenPicker && (
                    <div className="absolute inset-0 bg-white z-55 flex flex-col py-4 px-4 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3 flex-shrink-0">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">Seleziona Allergeni</h4>
                          <p className="text-[9px] text-slate-400 mt-0.5">{selected.size} selezionati · {allergens.length} disponibili</p>
                        </div>
                        <button 
                          onClick={() => { saveProfile(); setShowAllergenPicker(false); setAllergenSearch(''); }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl text-[10px] font-black"
                        >
                          Fatto
                        </button>
                      </div>

                      {/* Search bar */}
                      <div className="relative mb-3 flex-shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none">🔍</span>
                        <input
                          type="text"
                          value={allergenSearch}
                          onChange={(e) => setAllergenSearch(e.target.value)}
                          placeholder="Cerca allergene (es. latte, glut…)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-[11px] font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors"
                        />
                        {allergenSearch && (
                          <button
                            onClick={() => setAllergenSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-300 hover:bg-slate-400 flex items-center justify-center text-[8px] text-white font-black transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Risultati counter */}
                      {allergenSearch && (
                        <p className="text-[10px] text-slate-500 font-semibold mb-2 flex-shrink-0">
                          {filteredAllergens.length > 0
                            ? `${filteredAllergens.length} risultati per "${allergenSearch}"`
                            : `Nessun risultato per "${allergenSearch}"`}
                        </p>
                      )}

                      {/* Lista allergeni filtrati */}
                      <div className="flex flex-wrap gap-1.5 pr-1 flex-grow overflow-y-auto">
                        {filteredAllergens.length === 0 && allergenSearch ? (
                          <div className="w-full text-center py-8">
                            <span className="text-2xl block mb-2">🔍</span>
                            <p className="text-[11px] text-slate-400 font-semibold">Nessun allergene trovato</p>
                            <button
                              onClick={() => setAllergenSearch('')}
                              className="mt-2 text-[10px] text-emerald-600 font-bold underline"
                            >
                              Cancella ricerca
                            </button>
                          </div>
                        ) : filteredAllergens.map((a) => {
                          const isSelected = selected.has(a.code);
                          return (
                            <button
                              key={a.code}
                              onClick={() => toggleAllergen(a.code)}
                              className={`px-2.5 py-1.5 border rounded-full text-[11px] font-bold transition-all flex items-center gap-1
                                ${isSelected 
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                            >
                              <span>{a.emoji}</span>
                              <span>{a.name_it}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Settings Main Content */}
                  <div className="py-4 px-3 space-y-4">
                    
                    {/* User profile header card */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg font-black uppercase">
                        {(userProfile?.email || 'C')[0]}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[13px] text-slate-800 leading-tight">
                          {userProfile?.display_name || 'Utente Cliente'}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">{userProfile?.email}</span>
                        <span className="inline-block bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 py-0.2 rounded mt-1">
                          🙋 Account Cliente
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Health & Allergens */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider ml-1 mb-1 block">Salute e Profilo</span>
                      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm divide-y divide-slate-100 overflow-hidden">
                        
                        {/* Allergies Row */}
                        <div 
                          onClick={() => setShowAllergenPicker(true)}
                          className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🛡️</span>
                            <span className="text-xs font-bold text-slate-700">Allergie e intolleranze</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-450 font-semibold">{selected.size} attive</span>
                            <span className="text-slate-350 text-sm">›</span>
                          </div>
                        </div>

                        <div className="p-3.5 bg-rose-50/20 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">💊</span>
                            <span className="text-xs font-extrabold text-slate-700">Note SOS e farmaci</span>
                          </div>
                          <textarea
                            value={emergencyDraft}
                            onChange={(e) => setEmergencyDraft(e.target.value)}
                            placeholder="es. EpiPen nello zaino, chiamare 112"
                            rows={3}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-[10px] text-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
                          />
                          <button
                            onClick={saveEmergencyNotes}
                            disabled={busy}
                            className="bg-emerald-600 text-white font-black text-[9px] px-3 py-1.5 rounded-xl disabled:opacity-40"
                          >
                            Salva note SOS
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Medical Documents */}
                    <div>
                      <div className="flex justify-between items-baseline mb-1 px-1">
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Documenti Certificati</span>
                        <label className="text-[9px] font-bold text-emerald-700 cursor-pointer">
                          + Aggiungi
                          <input 
                            type="file" 
                            onChange={handleUploadDocument} 
                            accept=".pdf,.png,.jpg,.jpeg" 
                            className="hidden" 
                          />
                        </label>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3 space-y-2">
                        {documents.length === 0 ? (
                          <div className="text-center py-4">
                            <span className="text-slate-350 text-[10px] font-semibold block">Nessun documento caricato</span>
                            <span className="text-[8px] text-slate-400 leading-tight block mt-0.5">
                              Carica un certificato medico per validare il tuo profilo allergeni.
                            </span>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {documents.map((d) => (
                              <div key={d.id} className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
                                <div className="min-w-0 flex-1 pr-2">
                                  <span className="text-[10px] font-extrabold text-slate-700 truncate block">📄 {d.filename}</span>
                                  <span className="text-[8px] text-slate-450 block mt-0.5">Caricato il: {d.created_at.substring(0, 10)}</span>
                                </div>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full
                                  ${d.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {d.status === 'verified' ? 'Verificato' : 'In attesa'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 3: Actions */}
                    <div className="pt-2">
                      <button
                        onClick={onLogout}
                        className="w-full bg-white border border-rose-100 hover:border-rose-200 text-rose-600 font-extrabold py-3.5 rounded-2xl text-xs shadow-sm transition-colors text-center"
                      >
                        Esci dall'Account
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* FIXED PHONE BOTTOM TABS BAR */}
              <div className="absolute bottom-0 inset-x-0 h-[52px] bg-white border-t border-slate-250 flex justify-around items-center z-40 select-none">
                <button 
                  onClick={() => { setMenu(null); setActiveTab('search'); }}
                  className={`flex flex-col items-center justify-center w-20 h-full transition-colors
                    ${activeTab === 'search' && !menu ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="text-base leading-none">🔍</span>
                  <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">Cerca</span>
                </button>
                <button 
                  onClick={() => { setMenu(null); setActiveTab('map'); fetchRestaurants(); }}
                  className={`flex flex-col items-center justify-center w-20 h-full transition-colors
                    ${activeTab === 'map' && !menu ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="text-base leading-none">🗺️</span>
                  <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">Mappa</span>
                </button>
                <button 
                  onClick={() => { setMenu(null); setActiveTab('profile'); }}
                  className={`flex flex-col items-center justify-center w-20 h-full transition-colors
                    ${activeTab === 'profile' && !menu ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="text-base leading-none">👤</span>
                  <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">Profilo</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* iPhone Home Indicator */}
        <div className="h-4.5 bg-slate-50 flex justify-center items-center z-45">
          <div className="w-28 h-1 bg-slate-800 rounded-full" />
        </div>
      </div>

      <div className="mt-6 text-slate-500 text-xs text-center flex flex-col gap-1">
        <span className="text-slate-350 font-bold uppercase tracking-wider">Simulatore App Mobile</span>
        <span>Simula l'esperienza reale dell'applicazione per i tuoi clienti.</span>
        <span>Account demo: <b>cliente@allertgy.it</b> / Password: <b>Cliente123!</b></span>
      </div>
    </div>
  );
}

function TinyCheck({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex items-start gap-2 text-left w-full">
      <span className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] font-black shrink-0 ${checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
        ✓
      </span>
      <span className="text-[9px] text-slate-600 font-semibold leading-tight">{children}</span>
    </button>
  );
}
