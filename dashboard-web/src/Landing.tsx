import { useState } from 'react';

interface Props {
  onEnter: () => void;
  onClienti: () => void;
}

interface DemoDish {
  nome: string;
  descrizione: string;
  categoria: string;
  prezzo: string;
  contenuti: string[];
  tracce: string[];
}

const DEMO_DISHES: DemoDish[] = [
  {
    nome: "Spaghetti alla Carbonara",
    descrizione: "Guanciale croccante, uova biologiche, pecorino romano DOP",
    categoria: "Primi",
    prezzo: "12.00 €",
    contenuti: ["glutine", "uova", "latte"],
    tracce: [],
  },
  {
    nome: "Insalata di Mare",
    descrizione: "Polpo fresco, gamberi sgusciati, sedano, olio al limone",
    categoria: "Antipasti",
    prezzo: "14.00 €",
    contenuti: ["crostacei"],
    tracce: ["pesce"],
  },
  {
    nome: "Sorbetto al Limone",
    descrizione: "Limoni di Sorrento, zucchero, acqua, foglioline di menta",
    categoria: "Dolci",
    prezzo: "4.50 €",
    contenuti: [],
    tracce: ["latte"],
  }
];

const ALLERGEN_INFO = [
  { code: 'glutine', name: 'Glutine', emoji: '🌾' },
  { code: 'latte', name: 'Latte', emoji: '🥛' },
  { code: 'uova', name: 'Uova', emoji: '🥚' },
  { code: 'pesce', name: 'Pesce', emoji: '🐟' },
  { code: 'crostacei', name: 'Crostacei', emoji: '🦐' },
  { code: 'arachidi', name: 'Arachidi', emoji: '🥜' },
  { code: 'soia', name: 'Soia', emoji: '🌱' },
  { code: 'frutta_a_guscio', name: 'Frutta a guscio', emoji: '🌰' },
  { code: 'sedano', name: 'Sedano', emoji: '🥬' },
  { code: 'senape', name: 'Senape', emoji: '🟡' },
  { code: 'sesamo', name: 'Sesamo', emoji: '⚪' },
  { code: 'solfiti', name: 'Solfiti', emoji: '🍷' },
  { code: 'lupini', name: 'Lupini', emoji: '🫘' },
  { code: 'molluschi', name: 'Molluschi', emoji: '🦑' },
];

export default function Landing({ onEnter, onClienti }: Props) {
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set(['latte']));

  const toggleAllergen = (code: string) => {
    const next = new Set(selectedAllergens);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedAllergens(next);
  };

  const getSemaforo = (dish: DemoDish) => {
    const cont = dish.contenuti.filter(a => selectedAllergens.has(a));
    const trac = dish.tracce.filter(a => selectedAllergens.has(a));
    if (cont.length > 0) return { stato: 'rosso', match: cont, label: 'NON IDONEO', cls: 'border-rose-200 bg-rose-50/95 text-rose-900', badge: 'bg-rose-500 text-white', icon: '🔴' };
    if (trac.length > 0) return { stato: 'giallo', match: trac, label: 'CON ATTENZIONE', cls: 'border-amber-200 bg-amber-50/95 text-amber-900', badge: 'bg-amber-500 text-slate-900', icon: '🟡' };
    return { stato: 'verde', match: [], label: 'IDONEO', cls: 'border-emerald-100 bg-emerald-50/95 text-emerald-900', badge: 'bg-emerald-600 text-white', icon: '🟢' };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-200">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <span className="text-xl font-extrabold tracking-tight text-slate-800">Aller<span className="text-emerald-600">Tgy</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClienti} 
              className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
            >
              Area Clienti
            </button>
            <button 
              onClick={onEnter}
              className="bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-bold px-4 py-2 rounded-xl text-sm shadow shadow-emerald-600/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              Dashboard Ristoratori
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-slate-50 text-slate-850 relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,138,106,0.05),transparent_50%)]" />
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center relative z-10">
          <div className="md:col-span-7 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <span>🛡️</span> Sicurezza al tavolo
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-800">
              Il menu allergeni <br />
              <span className="text-emerald-600">che si adatta al tuo profilo.</span>
            </h1>
            <p className="text-base text-slate-500 max-w-xl leading-relaxed">
              Confronta istantaneamente il tuo profilo allergenico con il menù del ristorante, mostrandoti al volo cosa è idoneo mangiare con il semplice sistema a semaforo.
            </p>
            <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
              <button 
                onClick={onClienti} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-4 rounded-2xl shadow shadow-emerald-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                🙋 Prova come cliente
              </button>
              <button 
                onClick={onEnter} 
                className="bg-white border border-slate-200 text-emerald-800 hover:bg-slate-100 font-extrabold px-8 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                👨‍🍳 Entra come ristoratore
              </button>
            </div>
          </div>

          {/* Interactive Demo Block */}
          <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative">
            <div className="absolute -top-3 -right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow">
              Live Demo
            </div>
            <h3 className="font-black text-lg text-slate-800 mb-1">Simula il tuo profilo</h3>
            <p className="text-xs text-slate-400 mb-4">Seleziona le tue allergie per testare la risposta dei piatti:</p>
            
            {/* Allergen select pills */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {ALLERGEN_INFO.map(a => {
                const active = selectedAllergens.has(a.code);
                return (
                  <button
                    key={a.code}
                    onClick={() => toggleAllergen(a.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border
                      ${active 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800 shadow shadow-emerald-500/5' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <span>{a.emoji}</span>
                    <span>{a.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Menu Cards */}
            <div className="space-y-3">
              {DEMO_DISHES.map(dish => {
                const s = getSemaforo(dish);
                return (
                  <div 
                    key={dish.nome}
                    className={`p-4 rounded-2xl border transition-all duration-300 ${s.cls}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{s.icon}</span>
                          <h4 className="font-extrabold text-sm text-slate-800">{dish.nome}</h4>
                        </div>
                        <p className="text-xs mt-1 text-slate-500 leading-tight">{dish.descrizione}</p>
                        {s.match.length > 0 && (
                          <div className="mt-2 text-xs font-bold flex flex-wrap gap-1">
                            {s.stato === 'rosso' ? '⚠️ Contiene: ' : '⚠️ Possibili tracce: '}
                            {s.match.map(c => (
                              <span key={c} className="underline decoration-wavy">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-xs font-black text-slate-700">{dish.prezzo}</span>
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full mt-1.5 ${s.badge}`}>
                          {s.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Il Semaforo Explanation */}
      <section className="py-20 max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Un menù personalizzato in 3 colori</h2>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto text-sm">Nessun fraintendimento, nessuna ansia al momento dell'ordine.</p>
        
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all hover:border-slate-350">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-4xl shadow-inner">🟢</div>
            <h3 className="font-black text-lg mt-4 text-slate-800">Idoneo per il tuo profilo</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Nessun allergene dichiarato tra quelli selezionati. Idoneo secondo i dati dichiarati dal locale.
            </p>
          </div>
          
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all hover:border-slate-350">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center text-4xl shadow-inner">🟡</div>
            <h3 className="font-black text-lg mt-4 text-slate-800">Con attenzione</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Possibili tracce di allergeni o contaminazione incrociata. Chiedi conferma al personale.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all hover:border-slate-350">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-center text-4xl shadow-inner">🔴</div>
            <h3 className="font-black text-lg mt-4 text-slate-800">Non idoneo</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Contiene allergeni del tuo profilo. Il piatto è da evitare secondo i dati dichiarati.
            </p>
          </div>
        </div>
      </section>

      {/* Come funziona — clienti */}
      <section id="clienti" className="bg-slate-100 border-y border-slate-200 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-800 text-center tracking-tight">🙋 Per chi mangia fuori</h2>
          <p className="text-center text-slate-500 mt-2 mb-12">Scansiona e ordina in sicurezza in soli 3 passi.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              ['1', 'Imposta il tuo profilo', 'Registrati e seleziona le tue intolleranze tra i 14 allergeni previsti per legge e le preferenze alimentari (es. vegano).'],
              ['2', 'Scansiona il QR Code', 'Arrivato al ristorante, inquadra il QR Code AllerTgy posto sul tavolo oppure digita il codice locale a 6 cifre.'],
              ['3', 'Ordina con il semaforo', 'Visualizza il menù colorato sulle TUE esigenze. Ricorda comunque di avvisare sempre lo staff del locale.'],
            ].map(([n, t, d]) => (
              <div key={n} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50 hover:scale-[1.01] transition-transform">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center">{n}</div>
                <h3 className="font-bold text-lg mt-4 text-slate-800">{t}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona — ristoratori */}
      <section id="ristoratori" className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-slate-800 text-center tracking-tight">👨‍🍳 Per i ristoratori</h2>
        <p className="text-center text-slate-500 mt-2 mb-12">
          Digitalizza il tuo registro degli allergeni in pochi minuti ed elimina i rischi.
        </p>
        
        <div className="grid md:grid-cols-4 gap-6">
          {[
            ['📝', 'Registra il locale', "Crea il profilo del ristorante e inserisci gli orari o la città."],
            ['📸', 'Analisi con AI Vision', "Carica una foto del menù cartaceo: l'AI estrae i piatti e suggerisce gli allergeni."],
            ['✅', 'Editor & Conferma', 'Verifica i suggerimenti dell\'AI, adatta prezzi e ingredienti sul nostro editor visuale.'],
            ['🖨️', 'Stampa e Condividi', 'Ottieni il QR Code personalizzato da incollare sui tavoli. Fatto!'],
          ].map(([e, t, d]) => (
            <div key={t} className="bg-white rounded-3xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-shadow">
              <div className="text-4xl">{e}</div>
              <h3 className="font-bold text-base mt-4 text-slate-800">{t}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>

        {/* Pricing grid — nuovi piani */}
        <div className="mt-14 space-y-6">

          {/* Badge intro */}
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              🎁 30 giorni gratis su tutti i piani — nessuna carta richiesta
            </span>
          </div>

          {/* Abbonamenti mensili */}
          <div className="grid lg:grid-cols-2 gap-5">

            {/* Piano Base */}
            <div className="rounded-3xl border border-slate-200/70 bg-white p-7 shadow-sm flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-xl text-slate-800">Base</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">Carica il tuo menù e gestisci il locale con tutti gli strumenti.</p>
                </div>
                <span className="shrink-0 text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded-xl ml-3">30 gg gratis</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-slate-800">€9</span>
                <span className="text-slate-400 text-sm font-semibold mb-1">/mese</span>
              </div>
              <ul className="space-y-2 flex-1">
                {[
                  '✅ Menù digitale con allergeni e tracce',
                  '✅ Badge "Locale verificato"',
                  '✅ Fino a 10 foto in galleria',
                  '✅ QR code per tavoli e banco',
                  '✅ Registro allergeni stampabile (PDF)',
                  '✅ Rispondi alle recensioni',
                ].map(f => (
                  <li key={f} className="text-xs text-slate-600 font-medium">{f}</li>
                ))}
              </ul>
              <button
                onClick={onEnter}
                className="mt-2 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
              >
                Prova gratis 30 giorni →
              </button>
            </div>

            {/* Piano Pro Notifiche */}
            <div className="rounded-3xl border-2 border-emerald-500 bg-white p-7 shadow-lg shadow-emerald-500/10 flex flex-col gap-4 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                  ⭐ Più scelto
                </span>
              </div>
              <div className="flex items-start justify-between pt-2">
                <div>
                  <h3 className="font-black text-xl text-slate-800">Pro Notifiche</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">Come Base, più la possibilità di inviare push ai tuoi clienti fedeli.</p>
                </div>
                <span className="shrink-0 text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded-xl ml-3">30 gg gratis</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-slate-800">€19</span>
                <span className="text-slate-400 text-sm font-semibold mb-1">/mese</span>
              </div>
              <ul className="space-y-2 flex-1">
                {[
                  '✅ Tutto del piano Base',
                  '🔔 Invia notifiche push ai clienti che ti hanno preferito',
                  '📢 Promuovi sconti, novità e offerte speciali',
                  '🖼️ Fino a 20 foto in galleria',
                ].map(f => (
                  <li key={f} className="text-xs text-slate-600 font-medium">{f}</li>
                ))}
              </ul>
              <button
                onClick={onEnter}
                className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl shadow shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
              >
                Prova gratis 30 giorni →
              </button>
            </div>
          </div>

          {/* Add-on: Boost Visibilità */}
          <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/60 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shrink-0">🚀</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-lg text-slate-800">Boost Visibilità</h3>
                <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full uppercase">Add-on · Una tantum</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Metti il tuo locale <strong>in cima ai risultati di ricerca per 30 giorni</strong>.
                Pagamento singolo senza abbonamento — attivabile quando vuoi, anche più volte.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-amber-800">€9,90</div>
              <div className="text-[10px] text-amber-600 font-semibold">per 30 giorni</div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <button 
            onClick={onEnter}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2"
          >
            <span>Entra nella Dashboard Ristoratori</span>
            <span>→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-white font-extrabold text-lg">
            <span>🥗</span> AllerTgy
          </div>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            Le informazioni sugli allergeni sono inserite sotto la responsabilità esclusiva dei ristoratori. 
            Il sistema AllerTgy è uno strumento di supporto: segnala sempre le tue allergie al personale.
          </p>
          <div className="text-xs text-slate-600 pt-4">
            &copy; 2026 AllerTgy Platform. Tutti i diritti riservati.
          </div>
        </div>
      </footer>
    </div>
  );
}
