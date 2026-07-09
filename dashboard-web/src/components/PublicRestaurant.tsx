import { useEffect, useState } from 'react';
import { api, hasToken, API, type Allergen, type DishOut, type PublicRestaurant as PublicRestaurantData, type Review, type MenuOutItem } from '../api';

const SEMAFORO_LEGEND = [
  ['🔴', 'Contiene un tuo allergene dichiarato'],
  ['🟡', 'Possibili tracce / contaminazione'],
  ['🟢', 'Nessun allergene dichiarato dal locale'],
] as const;

type GuestSemaforo = {
  stato: 'verde' | 'giallo' | 'rosso';
  label: string;
  match: string[];
};

function evalGuestDish(dish: DishOut, selected: Set<string>): GuestSemaforo {
  if (selected.size === 0) return { stato: 'verde', label: 'Seleziona allergie', match: [] };
  const contains = dish.allergeni_contenuti.filter((c) => selected.has(c));
  if (contains.length > 0) return { stato: 'rosso', label: 'Da evitare', match: contains };
  const traces = dish.allergeni_tracce.filter((c) => selected.has(c));
  if (traces.length > 0) return { stato: 'giallo', label: 'Chiedi conferma', match: traces };
  return { stato: 'verde', label: 'Compatibile', match: [] };
}

/** Pagina pubblica /r/{slug} (o /r/{codice}): visibile senza login, con SEO base. */
export default function PublicRestaurant({ codeOrSlug }: { codeOrSlug: string }) {
  const [data, setData] = useState<PublicRestaurantData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [ratingStaff, setRatingStaff] = useState(5);
  const [ratingMenu, setRatingMenu] = useState(5);
  const [ratingSafety, setRatingSafety] = useState(5);
  const [activeReviewTab, setActiveReviewTab] = useState<'allertgy' | 'google' | 'tripadvisor'>('allertgy');
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const logged = hasToken();
  const [selectedLang, setSelectedLang] = useState('it');
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [guestAllergens, setGuestAllergens] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.publicRestaurant(codeOrSlug, selectedLang)
      .then((r) => {
        setData(r);
        return api.listReviews(r.public_code).then(setReviews);
      })
      .catch((e) => setError(e.message));
  }, [codeOrSlug, selectedLang]);

  useEffect(() => {
    api.allergens().then(setAllergens).catch(() => {});
  }, []);

  useEffect(() => {
    if (data && data.menus && data.menus.length > 0) {
      if (!selectedMenuId || !data.menus.some((m: MenuOutItem) => m.id === selectedMenuId)) {
        setSelectedMenuId(data.menus[0].id);
      }
    } else {
      setSelectedMenuId(null);
    }
  }, [data]);

  // Meta tag SEO dinamici
  useEffect(() => {
    if (!data) return;
    document.title = `${data.name}${data.city ? ` — ${data.city}` : ''} | AllerTgy`;
    const desc = data.description
      ?? `Menù e allergeni di ${data.name}${data.city ? ` a ${data.city}` : ''} su AllerTgy: mangia fuori casa in sicurezza.`;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, [data]);

  // JSON-LD per SEO Semantica (Schema.org)
  useEffect(() => {
    if (!data) return;
    
    const existingScript = document.getElementById('jsonld-restaurant');
    if (existingScript) {
      existingScript.remove();
    }
    
    const menuSection = data.menu_available ? {
      "@type": "FoodMenu",
      "name": "Menù AllerTgy",
      "hasMenuSection": Object.entries(
        data.piatti.reduce((acc, p) => {
          const cat = p.categoria || "Principale";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(p);
          return acc;
        }, {} as Record<string, typeof data.piatti>)
      ).map(([categoryName, items]) => ({
        "@type": "MenuSection",
        "name": categoryName,
        "hasMenuItem": items.map((p) => {
          const suitableDiets: string[] = [];
          if (p.allergeni_contenuti.includes('vegano')) suitableDiets.push("https://schema.org/VeganDiet");
          if (p.allergeni_contenuti.includes('vegetariano')) suitableDiets.push("https://schema.org/VegetarianDiet");
          if (!p.allergeni_contenuti.includes('glutine')) suitableDiets.push("https://schema.org/GlutenFreeDiet");
          
          return {
            "@type": "MenuItem",
            "name": p.nome_piatto,
            "description": p.descrizione || undefined,
            "offers": p.prezzo_cents ? {
              "@type": "Offer",
              "price": (p.prezzo_cents / 100).toFixed(2),
              "priceCurrency": "EUR"
            } : undefined,
            "suitableForDiet": suitableDiets.length > 0 ? suitableDiets : undefined
          };
        })
      }))
    } : undefined;

    const jsonld = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": data.name,
      "image": data.image_url || (data.photos.length > 0 ? data.photos[0].url : undefined),
      "telephone": data.phone || undefined,
      "url": window.location.href,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": data.address || "",
        "addressLocality": data.city || ""
      },
      "geo": (data.latitude && data.longitude) ? {
        "@type": "GeoCoordinates",
        "latitude": data.latitude,
        "longitude": data.longitude
      } : undefined,
      "hasMenu": menuSection
    };
    
    const script = document.createElement('script');
    script.id = 'jsonld-restaurant';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(jsonld);
    document.head.appendChild(script);
    
    return () => {
      const cleanupScript = document.getElementById('jsonld-restaurant');
      if (cleanupScript) {
        cleanupScript.remove();
      }
    };
  }, [data]);

  const submitReview = async () => {
    if (!data) return;
    setReviewMsg('');
    try {
      const avg = Math.round((ratingStaff + ratingMenu + ratingSafety) / 3);
      await api.upsertReview(data.public_code, avg, comment.trim(), ratingStaff, ratingMenu, ratingSafety);
      setReviews(await api.listReviews(data.public_code));
      setComment('');
      setReviewMsg('✅ Recensione pubblicata, grazie!');
    } catch (e) { setReviewMsg((e as Error).message); }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md text-center space-y-4">
          <span className="text-4xl">🥗</span>
          <p className="text-sm text-slate-600 font-semibold">{error}</p>
          <a href="/" className="inline-block text-xs font-bold text-emerald-700 hover:underline">← Torna ad AllerTgy</a>
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">Caricamento…</div>;
  }

  const cover = data.photos.find((p) => p.is_cover) ?? data.photos[0];
  const logoSrc = data.image_url ? (data.image_url.startsWith('http') ? data.image_url : `${API}${data.image_url}`) : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-emerald-900 text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 hover:opacity-90">
            <span className="text-2xl">🥗</span>
            <span className="text-lg font-black tracking-tight">AllerTgy</span>
          </a>
          <div className="flex items-center gap-3">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-emerald-800 text-white border-none rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-300 cursor-pointer"
            >
              <option value="it">🇮🇹 Italiano</option>
              <option value="en">🇬🇧 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
            <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest hidden sm:inline">Scheda locale</span>
          </div>
        </div>
      </header>

      {/* Copertina */}
      {cover && (
        <div className="max-w-4xl mx-auto px-6 mt-6">
          <img src={cover.url} alt={`Foto di ${data.name}`} className="w-full h-56 md:h-72 object-cover rounded-3xl border border-slate-200 shadow-sm" />
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 mt-6 space-y-6">
        {/* Intestazione locale */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {logoSrc && <img src={logoSrc} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-850">{data.name}</h1>
                {data.is_verified && (
                  <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg text-[10px] font-black">✓ Verificato</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                📍 {[data.address, data.city].filter(Boolean).join(', ') || 'Indirizzo non indicato'}
              </p>
              <div className="flex gap-4 flex-wrap mt-2 text-xs">
                {/* AllerTgy */}
                <div className="bg-slate-50 border border-slate-205 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                  <span className="font-extrabold text-emerald-800">🥗 AllerTgy (Allergie):</span>
                  {data.rating_count > 0 ? (
                    <span className="font-black text-slate-800">{data.rating_avg}★ ({data.rating_count})</span>
                  ) : (
                    <span className="text-slate-400">Nessuna recensione</span>
                  )}
                </div>

                {/* Google */}
                {data.google_rating !== null && data.google_rating !== undefined && (
                  <div className="bg-slate-50 border border-slate-205 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                    <span className="font-extrabold text-blue-700">🌐 Google:</span>
                    <span className="font-black text-slate-800">{data.google_rating}★ ({data.google_reviews_count})</span>
                  </div>
                )}

                {/* TripAdvisor */}
                {data.tripadvisor_rating !== null && data.tripadvisor_rating !== undefined && (
                  <div className="bg-slate-50 border border-slate-205 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                    <span className="font-extrabold text-emerald-600">🦉 TripAdvisor:</span>
                    <span className="font-black text-slate-800">{data.tripadvisor_rating}★ ({data.tripadvisor_reviews_count})</span>
                  </div>
                )}
              </div>
              {data.description && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{data.description}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Telefono</span>
              {data.phone ? <a href={`tel:${data.phone}`} className="text-emerald-700 font-bold">{data.phone}</a> : <span className="text-slate-400">—</span>}
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Sito web</span>
              {data.website ? <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold break-all">{data.website}</a> : <span className="text-slate-400">—</span>}
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Orari</span>
              <span className="text-slate-700 font-semibold whitespace-pre-line">{data.opening_hours || '—'}</span>
            </div>
          </div>
        </section>

        {/* Galleria */}
        {data.photos.length > 1 && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.photos.filter((p) => p.id !== cover?.id).map((p) => (
              <img key={p.id} src={p.url} alt={`Foto di ${data.name}`} className="w-full h-28 object-cover rounded-2xl border border-slate-200" />
            ))}
          </section>
        )}

        {/* Menù */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="font-black text-lg text-slate-850">🍽️ Menù e allergeni</h2>
            {data.menu_url && (
              <a 
                href={data.menu_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black rounded-xl transition-colors shadow-sm"
              >
                📄 Vedi Menù Originale
              </a>
            )}
          </div>
          {data.menu_available ? (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 font-semibold leading-relaxed">
                ⚠️ {data.safety_notice}
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div>
                  <h3 className="text-sm font-black text-emerald-950">Cosa posso mangiare qui?</h3>
                  <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                    Seleziona le tue allergie: i piatti cambiano colore subito. Il profilo resta solo in questa sessione.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allergens.slice(0, 28).map((a) => {
                    const active = guestAllergens.has(a.code);
                    return (
                      <button
                        key={a.code}
                        type="button"
                        onClick={() => {
                          setGuestAllergens((prev) => {
                            const next = new Set(prev);
                            next.has(a.code) ? next.delete(a.code) : next.add(a.code);
                            return next;
                          });
                        }}
                        className={`text-[11px] font-black rounded-full px-3 py-1.5 border transition ${
                          active
                            ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                            : 'bg-white border-emerald-200 text-emerald-900 hover:border-emerald-500'
                        }`}
                      >
                        {a.emoji} {a.name_it}
                      </button>
                    );
                  })}
                </div>
                {guestAllergens.size === 0 && (
                  <p className="text-[10px] text-emerald-700 font-bold">
                    Se non selezioni allergie, il colore non rappresenta ancora la tua compatibilità personale.
                  </p>
                )}
              </div>
              <div className="flex gap-4 text-[10px] text-slate-500 font-semibold">
                {SEMAFORO_LEGEND.map(([emoji, label]) => <span key={emoji}>{emoji} {label}</span>)}
              </div>
              {/* Selettore dei Multi-menù */}
              {data.menus && data.menus.length > 0 && (
                <div className="flex border-b border-slate-100 gap-2 pb-1 text-xs overflow-x-auto">
                  {data.menus.map((m: MenuOutItem) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMenuId(m.id)}
                      className={`pb-2 px-3 font-bold whitespace-nowrap transition-all border-b-2 ${
                        selectedMenuId === m.id
                          ? 'border-emerald-600 text-emerald-800 font-extrabold'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {(() => {
                  const visibleDishes = selectedMenuId
                    ? data.piatti.filter((p) => p.menu_id === selectedMenuId)
                    : data.piatti;

                  if (visibleDishes.length === 0) {
                    return <p className="text-xs text-slate-400 py-6 text-center">Nessun piatto presente in questo menù.</p>;
                  }

                  return visibleDishes.map((p) => {
                    const s = evalGuestDish(p, guestAllergens);
                    const pillClass = s.stato === 'rosso'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : s.stato === 'giallo'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    const dot = s.stato === 'rosso' ? '🔴' : s.stato === 'giallo' ? '🟡' : '🟢';
                    return (
                    <div key={p.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-800 block">{p.nome_piatto}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${pillClass}`}>
                            {dot} {s.label}
                          </span>
                        </div>
                        {p.descrizione && <span className="text-xs text-slate-500">{p.descrizione}</span>}
                        <div className="flex gap-2 flex-wrap mt-1">
                          {s.match.length > 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${s.stato === 'rosso' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                              Match: {s.match.map((c) => c.replace(/_/g, ' ')).join(', ')}
                            </span>
                          )}
                          {p.allergeni_contenuti.filter((c) => c !== 'vegano' && c !== 'vegetariano').map((c) => (
                            <span key={c} className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-lg">contiene {c.replace(/_/g, ' ')}</span>
                          ))}
                          {p.allergeni_tracce.map((c) => (
                            <span key={c} className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-lg">tracce {c.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      </div>
                      {p.prezzo_cents != null && (
                        <span className="text-sm font-black text-emerald-800 shrink-0">
                          {(p.prezzo_cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </span>
                      )}
                    </div>
                  )});
                })()}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Questo semaforo è calcolato sul profilo selezionato in questa sessione web. Per salvare profilo, famiglia, preferiti e notifiche, usa l'app AllerTgy con il codice <b>#{data.public_code}</b>.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500 leading-relaxed">
              Questo locale non ha ancora pubblicato il menù digitale con gli allergeni per piatto.
              Chiedi al personale oppure invita il locale ad attivare il piano Pro su AllerTgy.
            </p>
          )}
        </section>

        {/* Recensioni */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg text-slate-850">⭐ Recensioni</h2>
          </div>

          {/* Tab Selezionatore */}
          <div className="flex border-b border-slate-150 gap-2 pb-1 text-xs">
            <button
              onClick={() => setActiveReviewTab('allertgy')}
              className={`pb-2 px-3 font-black transition-all border-b-2 ${activeReviewTab === 'allertgy' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              🥗 AllerTgy ({reviews.length})
            </button>
            {data.google_rating !== null && (
              <button
                onClick={() => setActiveReviewTab('google')}
                className={`pb-2 px-3 font-black transition-all border-b-2 ${activeReviewTab === 'google' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
              >
                🌐 Google ({data.google_reviews_count || 0})
              </button>
            )}
            {data.tripadvisor_rating !== null && (
              <button
                onClick={() => setActiveReviewTab('tripadvisor')}
                className={`pb-2 px-3 font-black transition-all border-b-2 ${activeReviewTab === 'tripadvisor' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
              >
                🦉 TripAdvisor ({data.tripadvisor_reviews_count || 0})
              </button>
            )}
          </div>

          {activeReviewTab === 'allertgy' && (
            <div className="space-y-4">
              {reviews.length === 0 && <p className="text-sm text-slate-400">Ancora nessuna recensione per questo locale.</p>}
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border border-slate-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800">{rev.author_name}</span>
                      <span className="text-amber-500 text-xs">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                    </div>

                    {(rev.rating_staff || rev.rating_menu || rev.rating_safety) && (
                      <div className="flex gap-3 text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg w-max flex-wrap">
                        {rev.rating_staff && <span>👤 Staff: {rev.rating_staff}★</span>}
                        {rev.rating_menu && <span>📋 Menù: {rev.rating_menu}★</span>}
                        {rev.rating_safety && <span>🛡️ Sicurezza: {rev.rating_safety}★</span>}
                      </div>
                    )}

                    {rev.comment && <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>}
                    {rev.reply && (
                      <div className="mt-3 ml-4 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Risposta del locale</span>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rev.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {logged ? (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Lascia una recensione sull'esperienza allergie</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">👤 Attenzione Staff</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setRatingStaff(n)} className={`text-xl ${n <= ratingStaff ? 'grayscale-0' : 'grayscale opacity-40'}`}>⭐</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">📋 Chiarezza Menù</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setRatingMenu(n)} className={`text-xl ${n <= ratingMenu ? 'grayscale-0' : 'grayscale opacity-40'}`}>⭐</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">🛡️ Sicurezza Pasto</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setRatingSafety(n)} className={`text-xl ${n <= ratingSafety ? 'grayscale-0' : 'grayscale opacity-40'}`}>⭐</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                    Punteggio complessivo stimato: <span className="text-amber-500 text-sm font-black">{'★'.repeat(Math.round((ratingStaff + ratingMenu + ratingSafety)/3))}</span>
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Com'è andata? Descrivi se il locale è stato attento alle tue allergie..."
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none resize-none"
                  />
                  {reviewMsg && <p className="text-xs font-semibold text-slate-650">{reviewMsg}</p>}
                  <button onClick={submitReview} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs">
                    Pubblica recensione AllerTgy
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <a href="/" className="text-emerald-700 font-bold hover:underline">Accedi</a> con il tuo account cliente per lasciare una recensione o salvare il locale tra i preferiti.
                </p>
              )}
            </div>
          )}

          {activeReviewTab !== 'allertgy' && (
            <div className="space-y-4">
              {data.external_reviews.filter(r => r.source === activeReviewTab).length === 0 ? (
                <p className="text-sm text-slate-400">Nessuna recensione trovata per questa sorgente esterna.</p>
              ) : (
                <div className="space-y-4">
                  {data.external_reviews.filter(r => r.source === activeReviewTab).map((rev, idx) => (
                    <div key={idx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800">{rev.author_name}</span>
                        <span className="text-amber-500 text-xs">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                      <span className="text-[9px] text-slate-400 block pt-1">
                        {new Date(rev.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="text-center text-[10px] text-slate-400 space-x-3">
          <a href="/termini" className="hover:underline">Termini</a>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/cookie" className="hover:underline">Cookie</a>
          <a href="/sicurezza" className="hover:underline">Sicurezza</a>
        </footer>
      </main>
    </div>
  );
}
