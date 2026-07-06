import { useEffect, useState } from 'react';
import { api, hasToken, API, type PublicRestaurant as PublicRestaurantData, type Review } from '../api';

const SEMAFORO_LEGEND = [
  ['🔴', 'Contiene un tuo allergene dichiarato'],
  ['🟡', 'Possibili tracce / contaminazione'],
  ['🟢', 'Nessun allergene dichiarato dal locale'],
] as const;

/** Pagina pubblica /r/{slug} (o /r/{codice}): visibile senza login, con SEO base. */
export default function PublicRestaurant({ codeOrSlug }: { codeOrSlug: string }) {
  const [data, setData] = useState<PublicRestaurantData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const logged = hasToken();

  useEffect(() => {
    api.publicRestaurant(codeOrSlug)
      .then((r) => {
        setData(r);
        return api.listReviews(r.public_code).then(setReviews);
      })
      .catch((e) => setError(e.message));
  }, [codeOrSlug]);

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

  const submitReview = async () => {
    if (!data) return;
    setReviewMsg('');
    try {
      await api.upsertReview(data.public_code, rating, comment.trim());
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
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Scheda locale</span>
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
              {data.rating_count > 0 && (
                <p className="text-xs font-bold text-amber-600 mt-1">
                  {'★'.repeat(Math.round(data.rating_avg ?? 0))}{'☆'.repeat(5 - Math.round(data.rating_avg ?? 0))}
                  <span className="text-slate-500 font-semibold"> {data.rating_avg} · {data.rating_count} recensioni</span>
                </p>
              )}
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
          <h2 className="font-black text-lg text-slate-850">🍽️ Menù e allergeni</h2>
          {data.menu_available ? (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 font-semibold leading-relaxed">
                ⚠️ {data.safety_notice}
              </div>
              <div className="flex gap-4 text-[10px] text-slate-500 font-semibold">
                {SEMAFORO_LEGEND.map(([emoji, label]) => <span key={emoji}>{emoji} {label}</span>)}
              </div>
              <div className="divide-y divide-slate-100">
                {data.piatti.map((p) => (
                  <div key={p.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 block">{p.nome_piatto}</span>
                      {p.descrizione && <span className="text-xs text-slate-500">{p.descrizione}</span>}
                      <div className="flex gap-2 flex-wrap mt-1">
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
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                Per il semaforo personalizzato sulle TUE allergie, scarica l'app AllerTgy e inquadra il codice <b>#{data.public_code}</b>.
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
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-black text-lg text-slate-850">⭐ Recensioni</h2>
          {reviews.length === 0 && <p className="text-sm text-slate-400">Ancora nessuna recensione per questo locale.</p>}
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800">{rev.author_name}</span>
                  <span className="text-amber-500 text-xs">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                </div>
                {rev.comment && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{rev.comment}</p>}
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
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Lascia una recensione</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? 'grayscale-0' : 'grayscale opacity-40'}`}>⭐</button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Com'è andata? Il locale è stato attento alle tue allergie?"
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none resize-none"
              />
              {reviewMsg && <p className="text-xs font-semibold text-slate-600">{reviewMsg}</p>}
              <button onClick={submitReview} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs">
                Pubblica recensione
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
              <a href="/" className="text-emerald-700 font-bold hover:underline">Accedi</a> con il tuo account cliente per lasciare una recensione o salvare il locale tra i preferiti.
            </p>
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
