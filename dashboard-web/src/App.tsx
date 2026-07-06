import { useEffect, useState, useRef } from 'react';
import { api, API, clearToken, hasToken, type Allergen, type DishIn, type Restaurant } from './api';
import ClientArea from './components/ClientArea';
import InternalAdmin from './components/InternalAdmin';
import Login from './components/Login';
import MenuEditor from './components/MenuEditor';
import Landing from './Landing';

const PLAN_LABELS = {
  free: 'Gratis',
  verified: 'Verificato',
  pro: 'Pro',
  premium: 'Premium',
} as const;

const PLAN_PRICES = {
  free: 0,
  verified: 990,
  pro: 1990,
  premium: 3990,
} as const;

const PLAN_FEATURES = [
  {
    code: 'free',
    name: 'Gratis',
    price: '€0',
    description: 'Scheda base sulla mappa per essere trovato dai clienti.',
    features: ['Nome, città, indirizzo e contatti', 'Presenza nell’elenco clienti', 'Scheda non verificata'],
  },
  {
    code: 'verified',
    name: 'Verificato',
    price: '€9,90/mese',
    description: 'Badge e profilo più affidabile per chi cerca locali attenti.',
    features: ['Tutto del piano Gratis', 'Badge locale verificato', 'Dati attività aggiornati'],
  },
  {
    code: 'pro',
    name: 'Pro',
    price: '€19,90/mese',
    description: 'Menu digitale con allergeni e tracce per ogni piatto.',
    features: ['Editor menu digitale', 'QR code per tavoli e banco', 'Registro allergeni stampabile'],
  },
  {
    code: 'premium',
    name: 'Premium',
    price: '€39,90/mese',
    description: 'Più visibilità e strumenti per locali con maggiore volume.',
    features: ['Tutto del piano Pro', 'Priorità nei risultati', 'Supporto e statistiche avanzate'],
  },
] as const;

function centsToEuro(cents: number | null | undefined) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format((cents ?? 0) / 100);
}

function restaurantCanUseMenu(r: Restaurant | null) {
  if (!r) return false;
  const plan = r.business_plan ?? 'free';
  const status = r.subscription_status ?? 'free';
  return status === 'comped' || ((plan === 'pro' || plan === 'premium') && ['trialing', 'active'].includes(status));
}

export default function App() {
  if (window.location.pathname === '/internal-admin') {
    return <InternalAdmin />;
  }

  const [view, setView] = useState<'landing' | 'app' | 'client' | 'login'>('landing');
  const [logged, setLogged] = useState(hasToken());
  const [printMode, setPrintMode] = useState<'qr' | 'registry' | null>(null);
  const [role, setRole] = useState<'customer' | 'owner' | null>(null);
  const [defaultRole, setDefaultRole] = useState<'customer' | 'owner'>('owner');
  const [showGuide, setShowGuide] = useState(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [current, setCurrent] = useState<Restaurant | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [piatti, setPiatti] = useState<DishIn[] | null>(null);
  const [hasPublished, setHasPublished] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState<Restaurant | null>(null);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [menuLegalAck, setMenuLegalAck] = useState(false);

  // Navigazione interna Ristorante (SaaS tabs)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'menu' | 'settings' | 'plan' | 'qr'>('overview');

  // Campi form Impostazioni Ristorante
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');

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
    }
  }, [current]);

  // Inizializza la mappa interattiva per le impostazioni locale
  useEffect(() => {
    if (activeSubTab !== 'settings') {
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

  // Caricamento del profilo all'avvio per determinare il ruolo
  useEffect(() => {
    if (logged) {
      api.getProfile().then((prof) => {
        setRole(prof.role as any);
        if (view === 'landing' || view === 'login') {
          setView(prof.role === 'owner' ? 'app' : 'client');
        }
      }).catch(() => {
        clearToken();
        setLogged(false);
        setRole(null);
        setView('landing');
      });
    }
  }, [logged]);

  useEffect(() => {
    if (!logged || view !== 'app') return;
    api.allergens().then(setAllergens).catch((e) => setError(e.message));
    api.myRestaurants().then((rs) => {
      setRestaurants(rs);
      if (rs.length === 1) selectRestaurant(rs[0]);
    }).catch((e) => {
      setError(e.message);
      if (/token/i.test(e.message)) { clearToken(); setLogged(false); setRole(null); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logged, view]);

  const selectRestaurant = async (r: Restaurant) => {
    setCurrent(r); setPiatti(null); setApproved(null); setError('');
    setActiveSubTab('overview');
    try {
      const m = await api.publicMenu(r.public_code);
      setHasPublished(m.piatti.length > 0);
    } catch { setHasPublished(false); }
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

  const save = async () => {
    if (!current || !piatti) return;
    if (!restaurantCanUseMenu(current)) {
      setError('Il menu digitale con allergeni per piatto è incluso nel piano Pro o Premium.');
      setActiveSubTab('plan');
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
        longitude: longitude === '' ? null : Number(longitude)
      });
      setCurrent(res);
      setRestaurants(restaurants.map(r => r.id === res.id ? res : r));
      alert("Impostazioni salvate con successo!");
      setActiveSubTab('overview');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const handleOwnerEntry = () => {
    if (logged) {
      if (role === 'owner') setView('app');
      else alert("Questo account è registrato come Cliente. Disconnettiti dall'Area Clienti per accedere come Ristoratore.");
    } else {
      setDefaultRole('owner');
      setView('login');
    }
  };

  const handleCustomerEntry = () => {
    if (logged) {
      if (role === 'customer') setView('client');
      else alert("Questo account è registrato come Ristoratore. Disconnettiti dalla dashboard per accedere come Cliente.");
    } else {
      setDefaultRole('customer');
      setView('login');
    }
  };

  const handleLogout = () => {
    clearToken();
    setLogged(false);
    setRole(null);
    setView('landing');
    setCurrent(null);
  };

  const canUseMenu = restaurantCanUseMenu(current);
  const currentPlan = current?.business_plan ?? 'free';
  const currentPlanPrice = current?.plan_price_cents ?? PLAN_PRICES[currentPlan];
  const currentPlanLabel = PLAN_LABELS[currentPlan];

  if (view === 'landing') {
    return <Landing onEnter={handleOwnerEntry} onClienti={handleCustomerEntry} />;
  }
  if (view === 'client') {
    return <ClientArea onBack={() => setView('landing')} onLogout={handleLogout} />;
  }
  if (view === 'login' || !logged) {
    return (
      <Login 
        defaultRole={defaultRole}
        onDone={(userRole) => { 
          setLogged(true); 
          setRole(userRole as any); 
          setView(userRole === 'owner' ? 'app' : 'client'); 
        }} 
        onBack={() => setView('landing')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 selection:bg-emerald-150">
      
      {/* Header */}
      <header className="bg-emerald-900 border-b border-emerald-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <button onClick={() => setView('landing')} className="flex items-center gap-2 hover:opacity-90">
            <span className="text-2xl">🥗</span>
            <span className="text-lg font-black tracking-tight">AllerTgy <span className="text-emerald-300 font-light text-xs uppercase tracking-widest ml-2">Dashboard Ristoratori</span></span>
          </button>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-bold text-emerald-200 hover:text-white transition-colors"
            >
              ❓ Come Funziona
            </button>
            <button 
              onClick={handleLogout}
              className="bg-emerald-800/60 hover:bg-emerald-800 border border-emerald-700/50 text-emerald-100 font-bold px-3 py-1.5 rounded-xl text-xs transition-all"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        
        {/* Guida rapida a comparsa */}
        {showGuide && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 text-slate-700 space-y-3 relative shadow-inner">
            <h3 className="font-extrabold text-emerald-800 text-sm flex items-center gap-1.5">
              <span>💡</span> Istruzioni per la compilazione
            </h3>
            <ol className="list-decimal ml-5 text-xs space-y-2 leading-relaxed">
              <li><b>Registra o Scegli il tuo locale</b>: otterrai il codice univoco per la scansione.</li>
              <li><b>Configura Indirizzo, Contatti e Orari</b>: vai nella sezione <i>Impostazioni Locale</i> per descrivere la tua attività.</li>
              <li><b>Prepara il menù</b>: puoi caricare una foto del tuo menù cartaceo (il nostro motore AI leggerà e compilerà i piatti) oppure caricarli manualmente da zero.</li>
              <li><b>Pubblica e Stampa</b>: approva il menù e genera il QR Code da mettere sui tavoli.</li>
            </ol>
          </div>
        )}

        {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-250 text-rose-700 text-xs font-semibold">{error}</div>}

        {/* locale non selezionato: passo 1 selezione/creazione locale */}
        {!current && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-800">Il tuo locale</h2>
              <p className="text-xs text-slate-500 mt-1">Crea un nuovo punto ristorazione o seleziona un ristorante esistente per gestirne il menù:</p>
            </div>
            
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

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AGGIUNGI UN NUOVO LOCALE</span>
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
                <button 
                  disabled={!newName || busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const r = await api.createRestaurant(newName, newCity);
                      setRestaurants([...restaurants, r]); 
                      selectRestaurant(r);
                    } catch (e) { setError((e as Error).message); }
                    setBusy(false);
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm disabled:opacity-40 transition-colors shadow-md shadow-emerald-600/10"
                >
                  Crea locale
                </button>
              </div>
            </div>
          </section>
        )}

        {/* locale selezionato: dashboard SaaS a schede */}
        {current && (
          <div className="grid md:grid-cols-12 gap-6 items-start">
            
            {/* Sidebar di Navigazione Locale */}
            <aside className="md:col-span-3 bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="px-2 py-1">
                <h3 className="font-extrabold text-slate-800 text-base leading-tight truncate">{current.name}</h3>
                <span className="inline-block bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded-lg mt-1">
                  Codice #{current.public_code}
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setApproved(null); setActiveSubTab('overview'); }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2
                    ${activeSubTab === 'overview' ? 'bg-emerald-800 text-white shadow shadow-emerald-700/10' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>📊</span>
                  <span>Panoramica</span>
                </button>
                <button
                  onClick={() => { setApproved(null); setActiveSubTab('menu'); }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2
                    ${activeSubTab === 'menu' ? 'bg-emerald-800 text-white shadow shadow-emerald-700/10' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>🍽️</span>
                  <span>Gestisci Menù</span>
                </button>
                <button
                  onClick={() => { setApproved(null); setActiveSubTab('settings'); }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2
                    ${activeSubTab === 'settings' ? 'bg-emerald-800 text-white shadow shadow-emerald-700/10' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>⚙️</span>
                  <span>Impostazioni Locale</span>
                </button>
                <button
                  onClick={() => { setApproved(null); setActiveSubTab('plan'); }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2
                    ${activeSubTab === 'plan' ? 'bg-emerald-800 text-white shadow shadow-emerald-700/10' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>💳</span>
                  <span>Piano e funzioni</span>
                </button>
                <button
                  onClick={() => { setApproved(null); setActiveSubTab('qr'); }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2
                    ${activeSubTab === 'qr' ? 'bg-emerald-800 text-white shadow shadow-emerald-700/10' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>🖨️</span>
                  <span>QR Code</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setCurrent(null); setPiatti(null); setApproved(null); }}
                  className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  ← Cambia Locale
                </button>
              </div>
            </aside>

            {/* Area Contenuto Tab Attiva */}
            <main className="md:col-span-9 space-y-6">

              {/* TAB 1: PANORAMICA */}
              {activeSubTab === 'overview' && (
                <div className="space-y-6">
                  
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
                          : 'La scheda locale è attiva; il menu digitale si sblocca con il piano Pro.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-emerald-800">{centsToEuro(currentPlanPrice)} / mese</span>
                      <button
                        onClick={() => setActiveSubTab('plan')}
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
                          className="bg-emerald-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs"
                        >
                          Compila Ora
                        </button>
                      </div>
                    )}
                  </div>
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
                          pubblicare il QR e stampare il registro serve il piano Pro o Premium.
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
                          <div className="font-black text-emerald-900">Pro da €19,90/mese</div>
                          <p className="text-xs text-emerald-800/80 mt-1">
                            Per attivarlo in questa versione, contatta l'amministratore AllerTgy.
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveSubTab('plan')}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-2xl text-xs font-black"
                        >
                          Confronta i piani
                        </button>
                      </div>
                    </section>
                  ) : (
                    <>
                  
                  {/* Scelta come caricare */}
                  {!piatti && !approved && (
                    <div className="grid md:grid-cols-3 gap-6">
                      
                      {/* Drag and Drop o File Upload per AI Vision */}
                      <section
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
                        className="md:col-span-2 bg-white border-2 border-dashed border-emerald-300 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4 hover:bg-emerald-50/10 transition-colors cursor-pointer"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-4xl shadow-inner">📸</div>
                        <div>
                          <p className="text-lg font-extrabold text-slate-800">Analizza foto menù cartaceo (AI)</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                            Carica o trascina la foto del menù cartaceo. L'AI estrarrà piatti, descrizioni e allergeni suggeriti in pochi secondi.
                          </p>
                        </div>
                        <label className="inline-block px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs cursor-pointer shadow shadow-emerald-600/10 transition-colors">
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
                      
                      <MenuEditor piatti={piatti} allergens={allergens} onChange={setPiatti} />
                      
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
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=allertgy:${approved.public_code}`} 
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
              {activeSubTab === 'settings' && (
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
                  </div>

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
              {activeSubTab === 'plan' && (
                <section className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Piano attuale</span>
                      <h2 className="text-2xl font-black text-slate-850 mt-1">{currentPlanLabel}</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Stato: <b>{current?.subscription_status ?? 'free'}</b> · Prezzo: <b>{centsToEuro(currentPlanPrice)} / mese</b>
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl text-xs font-black ${canUseMenu ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {canUseMenu ? 'Menu digitale attivo' : 'Menu digitale non incluso'}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {PLAN_FEATURES.map((plan) => {
                      const isCurrent = plan.code === currentPlan;
                      const isProPlan = plan.code === 'pro' || plan.code === 'premium';
                      return (
                        <div key={plan.code} className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 ${isCurrent ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200'}`}>
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-black text-lg text-slate-850">{plan.name}</h3>
                              {isCurrent && <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg">Attuale</span>}
                            </div>
                            <div className="text-xl font-black text-emerald-800 mt-1">{plan.price}</div>
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
                          {isProPlan && (
                            <button
                              onClick={() => alert("Richiesta salvata: in questa versione l'attivazione del piano si gestisce dalla dashboard interna admin.")}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-2xl text-xs font-black"
                            >
                              Richiedi attivazione
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black text-lg">Il menu allergeni è la funzione Pro</h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        La scheda gratuita serve a comparire nella mappa. Il valore a pagamento è creare un menu consultabile dai clienti,
                        con allergeni per ogni piatto, QR code e registro stampabile.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('menu')}
                      className="bg-white text-slate-900 hover:bg-slate-100 px-5 py-3 rounded-2xl text-xs font-black"
                    >
                      Vai al menu
                    </button>
                  </div>
                </section>
              )}

              {/* TAB 5: QR CODE DOWNLOAD AREA */}
              {activeSubTab === 'qr' && (
                canUseMenu ? (
                <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 text-center max-w-xl mx-auto">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-800">QR Code del Ristorante</h2>
                    <p className="text-xs text-slate-400">Posiziona questo codice sui tavoli per consentire ai clienti di leggere il menù personalizzato.</p>
                  </div>

                  <div id="printable-qr-card" className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4 inline-block">
                    <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200 inline-block mx-auto">
                      <img 
                        alt={`QR ${current.public_code}`} 
                        className="w-48 h-48 mx-auto"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=allertgy:${current.public_code}`} 
                      />
                    </div>
                    <span className="font-mono font-black text-2xl text-emerald-800 block tracking-widest">#{current.public_code}</span>
                    <p className="hidden print:block text-slate-600 text-xs font-bold mt-2">
                      Inquadra il QR per verificare gli allergeni con AllerTgy!
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setPrintMode('qr')}
                      className="px-6 py-3 rounded-2xl border border-slate-250 text-slate-700 font-extrabold text-xs hover:bg-slate-100"
                    >
                      🖨️ Stampa Codice
                    </button>
                    <a 
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=allertgy:${current.public_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/10 text-center"
                    >
                      💾 Scarica QR ad Alta Risoluzione
                    </a>
                  </div>
                </section>
                ) : (
                  <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-5 text-center max-w-xl mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-2xl flex items-center justify-center mx-auto">🔒</div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">QR menu disponibile nel Pro</h2>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Il QR apre il menu digitale con allergeni per piatto. Attiva Pro o Premium per pubblicarlo ai clienti.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('plan')}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-2xl text-xs font-black"
                    >
                      Vedi piano Pro
                    </button>
                  </section>
                )
              )}

            </main>
          </div>
        )}

      </div>
      
      {/* Container di Stampa Registro Allergeni (nascosto su schermo, visibile solo in stampa) */}
      <div id="printable-allergen-registry" className="hidden p-8 bg-white text-slate-800">
        <h1 className="text-2xl font-black mb-1">{current?.name}</h1>
        <p className="text-xs text-slate-400 mb-6">
          Registro degli Allergeni Alimentari (Reg. UE 1169/2011) - Generato il {new Date().toLocaleDateString('it-IT')}
        </p>
        <table className="w-full text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-3 text-xs font-bold w-1/4">Piatto</th>
              <th className="border border-slate-300 p-3 text-xs font-bold w-1/4">Categoria</th>
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
                  {p.allergeni_contenuti.filter(c => c !== 'vegano' && c !== 'vegetariano').join(', ') || 'Nessuno'}
                </td>
                <td className="border border-slate-300 p-3 text-xs text-amber-700 font-semibold">
                  {p.allergeni_tracce.join(', ') || 'Nessuna'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Note legali in fondo */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
          <p>Ai sensi del Reg. UE 1169/2011, le informazioni fornite descrivono la presenza di ingredienti considerati allergeni o di possibili tracce derivanti da contaminazione crociata accidentale nei nostri piatti. Si raccomanda ai clienti di informare sempre il personale di sala circa le proprie allergie/intolleranze al momento dell'ordine.</p>
        </div>
      </div>
    </div>
  );
}
