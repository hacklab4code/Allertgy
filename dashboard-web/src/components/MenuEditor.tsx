import { useRef, useState } from 'react';
import { api, type Allergen, type DishIn, type DishOut, type Photo, type MenuOutItem } from '../api';

export type DishSaveResult = {
  dish: DishOut;
  menu_version: number;
  menu_updated_at: string | null;
  published: boolean;
  registry_ready: boolean;
  index: number;
  silent?: boolean;
};

interface Props {
  piatti: DishIn[];
  allergens: Allergen[];
  onChange: (p: DishIn[]) => void;
  onDelete?: (dish: DishIn, newList: DishIn[]) => void;
  restaurantPhotos?: Photo[];
  menus?: MenuOutItem[];
  /** Se presente, ogni scheda ha Salva immediato (niente replace del menù intero). */
  restaurantId?: number;
  onDishSaved?: (result: DishSaveResult) => void;
  /** Chiamato dopo conferma cucina su tutti i piatti. */
  onKitchenAllConfirmed?: (res: {
    updated: number;
    menu_version: number;
    menu_updated_at: string | null;
    published: boolean;
  }) => void;
}

const AUTOSAVE_MS = 650;

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

export default function MenuEditor({
  piatti,
  allergens,
  onChange,
  onDelete,
  restaurantPhotos,
  menus = [],
  restaurantId,
  onDishSaved,
  onKitchenAllConfirmed,
}: Props) {
  const foodAllergens = allergens.filter((a) => !a.is_diet);
  const diets = allergens.filter((a) => a.is_diet);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const [galleryTab, setGalleryTab] = useState<'stock' | 'restaurant'>('stock');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [activeAllergensIndex, setActiveAllergensIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedFlashIndex, setSavedFlashIndex] = useState<number | null>(null);
  const [confirmingKitchenAll, setConfirmingKitchenAll] = useState(false);
  const piattiRef = useRef(piatti);
  piattiRef.current = piatti;
  const autosaveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const saveDish = async (
    i: number,
    opts?: { silent?: boolean; dishOverride?: DishIn },
  ) => {
    if (!restaurantId) return;
    const dish = opts?.dishOverride ?? piattiRef.current[i];
    if (!dish?.nome_piatto?.trim()) {
      if (!opts?.silent) alert('Inserisci il nome del piatto prima di salvare.');
      return;
    }
    // Autosave solo su piatti già persistiti (evita create spam mentre si digita il nome)
    if (opts?.silent && !dish.id) return;
    setSavingIndex(i);
    try {
      const payload: DishIn = {
        nome_piatto: dish.nome_piatto.trim(),
        descrizione: dish.descrizione ?? null,
        categoria: dish.categoria ?? null,
        prezzo_cents: dish.prezzo_cents ?? null,
        image_url: dish.image_url ?? null,
        menu_group: dish.menu_group ?? 'Principale',
        menu_id: dish.menu_id ?? null,
        kitchen_protocol_confirmed: dish.kitchen_protocol_confirmed ?? 0,
        cross_contamination_checked_at: dish.cross_contamination_checked_at ?? null,
        allergeni_contenuti: dish.allergeni_contenuti || [],
        allergeni_tracce: dish.allergeni_tracce || [],
        translations: dish.translations,
      };
      const res = dish.id
        ? await api.updateDish(restaurantId, dish.id, payload, true)
        : await api.createDish(restaurantId, payload, true);
      const latest = piattiRef.current;
      const next = [...latest];
      const base = latest[i] ?? dish;
      next[i] = {
        ...base,
        id: res.dish.id,
        nome_piatto: res.dish.nome_piatto,
        descrizione: res.dish.descrizione ?? null,
        categoria: res.dish.categoria ?? null,
        prezzo_cents: res.dish.prezzo_cents ?? null,
        image_url: res.dish.image_url ?? null,
        menu_group: res.dish.menu_group ?? 'Principale',
        menu_id: res.dish.menu_id ?? null,
        kitchen_protocol_confirmed: res.dish.kitchen_protocol_confirmed,
        cross_contamination_checked_at: res.dish.cross_contamination_checked_at ?? null,
        allergeni_contenuti: res.dish.allergeni_contenuti || [],
        allergeni_tracce: res.dish.allergeni_tracce || [],
        translations: res.dish.translations,
      };
      onChange(next);
      onDishSaved?.({ ...res, index: i, silent: opts?.silent });
      setSavedFlashIndex(i);
      setTimeout(() => setSavedFlashIndex((cur) => (cur === i ? null : cur)), 1600);
      if (!opts?.silent) setActiveAllergensIndex(null);
    } catch (err) {
      if (!opts?.silent) alert((err as Error).message);
    } finally {
      setSavingIndex(null);
    }
  };

  const scheduleAutosave = (i: number) => {
    if (!restaurantId) return;
    const existing = autosaveTimers.current[i];
    if (existing) clearTimeout(existing);
    autosaveTimers.current[i] = setTimeout(() => {
      void saveDish(i, { silent: true });
    }, AUTOSAVE_MS);
  };

  const update = (i: number, patch: Partial<DishIn>, autosave = false) => {
    const next = piattiRef.current.map((p, j) => (j === i ? { ...p, ...patch } : p));
    onChange(next);
    if (autosave) scheduleAutosave(i);
  };

  const toggleDiet = (i: number, code: string) => {
    const p = piattiRef.current[i];
    let contenuti = [...p.allergeni_contenuti];
    if (contenuti.includes(code)) {
      contenuti = contenuti.filter((c) => c !== code);
    } else {
      contenuti.push(code);
    }
    update(i, { allergeni_contenuti: contenuti }, true);
  };

  const toggleAllergen = (i: number, code: string) => {
    const p = piattiRef.current[i];
    let contenuti = [...p.allergeni_contenuti];
    let tracce = [...p.allergeni_tracce];
    if (contenuti.includes(code)) {
      contenuti = contenuti.filter((c) => c !== code);
      tracce.push(code);
    } else if (tracce.includes(code)) {
      tracce = tracce.filter((c) => c !== code);
    } else {
      contenuti.push(code);
    }
    update(i, { allergeni_contenuti: contenuti, allergeni_tracce: tracce }, true);
  };

  const confirmKitchenAll = async () => {
    if (!restaurantId) return;
    setConfirmingKitchenAll(true);
    try {
      const res = await api.confirmKitchenAll(restaurantId, true);
      const now = new Date().toISOString();
      onChange(piattiRef.current.map((p) => ({
        ...p,
        kitchen_protocol_confirmed: 1,
        cross_contamination_checked_at: now,
      })));
      onKitchenAllConfirmed?.(res);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setConfirmingKitchenAll(false);
    }
  };

  const pendingKitchen = piatti.filter((p) => (p.kitchen_protocol_confirmed ?? 0) !== 1).length;

  const handleFileUpload = async (i: number, file: File) => {
    setUploadingIndex(i);
    try {
      const res = await api.uploadImage(file);
      // Salva il path relativo restituito dal server
      update(i, { image_url: res.url });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploadingIndex(null);
    }
  };

  // Seleziona un'immagine predefinita stock per la dish card
  const getFullImageUrl = (url: string | null | undefined, dishName: string, dishCat: string) => {
    if (url) {
      if (url.startsWith('http')) return url;
      // path relativo per il backend
      const baseApi = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
      return `${baseApi}${url}`;
    }
    // Fallback stock automatico basato su parole chiave
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
    
    return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80'; // general food
  };

  return (
    <div className="space-y-8">
      {restaurantId && piatti.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/80 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-amber-950 font-semibold leading-snug">
            Tap allergeni = autosave.
            {pendingKitchen > 0
              ? ` ${pendingKitchen} piatti senza conferma cucina.`
              : ' Tutte le schede hanno conferma cucina.'}
          </p>
          <button
            type="button"
            onClick={confirmKitchenAll}
            disabled={confirmingKitchenAll || pendingKitchen === 0}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-black disabled:opacity-40"
          >
            {confirmingKitchenAll ? 'Conferma...' : 'Conferma cucina su tutti'}
          </button>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {piatti.map((p, i) => {
          const imgUrl = getFullImageUrl(p.image_url, p.nome_piatto, p.categoria || '');
          const isCustomImage = !!p.image_url;
          const isEditingAllergens = activeAllergensIndex === i;

          // Calcola allergeni attivi per lo stato compresso
          const activeContains = foodAllergens.filter(a => p.allergeni_contenuti.includes(a.code));
          const activeTraces = foodAllergens.filter(a => p.allergeni_tracce.includes(a.code));
          const activeDiets = diets.filter(d => p.allergeni_contenuti.includes(d.code));
          const hasAnySelections = activeContains.length > 0 || activeTraces.length > 0 || activeDiets.length > 0;

          return (
            <div key={i} className="bg-white rounded-3xl shadow-sm border border-slate-200/85 overflow-hidden flex flex-col relative group/card hover:shadow-lg hover:border-slate-300/80 transition-all duration-300">
              {/* Bottone Elimina */}
              <button 
                onClick={() => {
                  const nuovi = piatti.filter((_, j) => j !== i);
                  if (onDelete) {
                    onDelete(p, nuovi);
                  } else {
                    onChange(nuovi);
                  }
                }}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow hover:scale-105"
                title="Elimina Piatto"
              >
                ✕
              </button>

              {/* Contenitore Immagine del Piatto */}
              <div className="h-48 relative bg-slate-100 group/img overflow-hidden">
                <img 
                  src={imgUrl} 
                  alt={p.nome_piatto}
                  className="w-full h-full object-cover group-hover/card:scale-102 transition-transform duration-500"
                />
                
                {/* Gradiente scuro sul fondo dell'immagine */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                {/* Badge Foto Stock o Caricata */}
                <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-white/10">
                  {isCustomImage ? '📸 Foto caricata' : '🍲 Foto automatica'}
                </span>

                {/* Overlap con bottoni di modifica foto */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <label className="bg-white text-slate-800 hover:bg-slate-50 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow-md transition-all hover:scale-105 flex items-center gap-1">
                    {uploadingIndex === i ? 'Caricamento...' : 'Upload'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(i, f);
                      }}
                    />
                  </label>
                  <button 
                    onClick={() => setActiveGalleryIndex(activeGalleryIndex === i ? null : i)}
                    className="bg-white text-slate-800 hover:bg-slate-50 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition-all hover:scale-105"
                  >
                    Usa Stock
                  </button>
                </div>
              </div>

              {/* Galleria Stock / Ristorante a comparsa */}
              {activeGalleryIndex === i && (
                <div className="absolute inset-x-0 top-0 bg-slate-900/98 backdrop-blur-lg p-4 text-white z-20 h-48 overflow-y-auto transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGalleryTab('stock')}
                        className={`text-xs px-2.5 py-1 rounded-lg transition-all font-bold ${galleryTab === 'stock' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                      >
                        Foto Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setGalleryTab('restaurant')}
                        className={`text-xs px-2.5 py-1 rounded-lg transition-all font-bold ${galleryTab === 'restaurant' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                      >
                        Foto Locale
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setActiveGalleryIndex(null)}
                      className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors font-bold"
                    >
                      Chiudi
                    </button>
                  </div>
                  {galleryTab === 'stock' ? (
                    <div className="grid grid-cols-3 gap-2">
                      {STOCK_PHOTOS.map((stock) => (
                        <button
                          key={stock.name}
                          type="button"
                          onClick={() => {
                            update(i, { image_url: stock.url });
                            setActiveGalleryIndex(null);
                          }}
                          className="relative h-14 rounded-xl overflow-hidden border border-white/10 hover:border-emerald-400 transition-all group/stock"
                        >
                          <img src={stock.url} className="w-full h-full object-cover group-hover/stock:scale-105 transition-transform" />
                          <span className="absolute inset-x-0 bottom-0 bg-black/75 text-[9px] truncate text-center px-1 py-0.5">
                            {stock.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {restaurantPhotos && restaurantPhotos.length > 0 ? (
                        restaurantPhotos.map((photo) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => {
                              update(i, { image_url: photo.url });
                              setActiveGalleryIndex(null);
                            }}
                            className="relative h-14 rounded-xl overflow-hidden border border-white/10 hover:border-emerald-400 transition-all group/restaurant"
                          >
                            <img src={photo.url} className="w-full h-full object-cover group-hover/restaurant:scale-105 transition-transform" />
                            {photo.is_cover && (
                              <span className="absolute top-1 left-1 bg-emerald-650 text-white text-[7px] font-extrabold px-1 rounded">Copertina</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-4 text-xs text-slate-400">
                          Nessuna foto caricata nel tuo locale.
                          <br />
                          Caricale in <span className="underline cursor-pointer text-emerald-450 font-bold">Impostazioni Locale</span>.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Informazioni Piatto */}
              <div className="p-5 flex-1 flex flex-col space-y-4">
                
                {/* Nome Piatto e Prezzo */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <input 
                      type="text" 
                      value={p.nome_piatto}
                      onChange={(e) => update(i, { nome_piatto: e.target.value })}
                      placeholder="Nome del piatto"
                      className="font-extrabold text-lg text-slate-800 w-full border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none transition-all py-0.5"
                    />
                  </div>
                  <div className="flex items-center bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-500 transition-all shrink-0">
                    <span className="text-xs font-bold text-slate-400 mr-0.5">€</span>
                    <input 
                      type="number" 
                      step="0.10"
                      value={p.prezzo_cents != null ? (p.prezzo_cents / 100).toFixed(2) : ''}
                      onChange={(e) => update(i, {
                        prezzo_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null,
                      })}
                      placeholder="0.00"
                      className="text-sm font-black text-slate-800 bg-transparent focus:outline-none w-14 text-right"
                    />
                  </div>
                </div>

                {/* Descrizione / Ingredienti */}
                <div className="relative">
                  <textarea 
                    value={p.descrizione ?? ''}
                    onChange={(e) => update(i, { descrizione: e.target.value })}
                    placeholder="Descrizione o elenco degli ingredienti..."
                    rows={2}
                    className="text-xs text-slate-655 w-full resize-none border border-slate-200/50 hover:border-slate-200 focus:border-emerald-500/50 focus:outline-none rounded-2xl p-3 bg-slate-50/40 focus:bg-white transition-all leading-relaxed"
                  />
                </div>

                {/* Selettore Menù di appartenenza (Multi-menù) */}
                {menus && menus.length > 0 && (
                  <div className="mb-2">
                    <label className="text-[10px] tracking-wider uppercase text-slate-400 font-bold block mb-1">Menù di appartenenza</label>
                    <select
                      value={p.menu_id || ''}
                      onChange={(e) => update(i, { menu_id: e.target.value ? Number(e.target.value) : null })}
                      className="text-xs text-slate-700 font-semibold border border-slate-200/60 rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:outline-none w-full transition-all cursor-pointer"
                    >
                      <option value="">Nessuno (Tutti i Menù)</option>
                      {menus.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sezione Menù e Categoria in 2 colonne */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] tracking-wider uppercase text-slate-450 font-bold block mb-1">Sezione Menù</label>
                    <input 
                      type="text" 
                      value={p.menu_group ?? 'Principale'}
                      onChange={(e) => update(i, { menu_group: e.target.value || 'Principale' })}
                      placeholder="es. Pranzo"
                      className="text-xs text-slate-700 font-semibold border border-slate-200/60 rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:outline-none w-full transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-wider uppercase text-slate-450 font-bold block mb-1">Categoria</label>
                    <input 
                      type="text" 
                      value={p.categoria ?? ''}
                      onChange={(e) => update(i, { categoria: e.target.value })}
                      placeholder="Primi, Secondi..."
                      className="text-xs text-slate-700 font-semibold border border-slate-200/60 rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:outline-none w-full transition-all"
                    />
                  </div>
                </div>

                {/* Area Allergeni e Stili Alimentari */}
                <div className="pt-3 border-t border-slate-100 flex-1 flex flex-col justify-between">
                  
                  {isEditingAllergens ? (
                    /* STATO DI EDITING ALLERGENI */
                    <div className="space-y-4 bg-slate-50/80 border border-slate-200/50 rounded-2xl p-3 animate-fadeIn">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">
                          Modifica Allergeni e Dieta
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveAllergensIndex(null)}
                          className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          ✓ Fatto
                        </button>
                      </div>

                      {/* Legend */}
                      <p className="text-[9px] text-slate-450 leading-snug">
                        Clicca sugli allergeni per ciclarli: <span className="text-slate-400">Assente</span> → <span className="text-rose-600 font-bold">Contiene</span> → <span className="text-amber-700 font-bold">Tracce</span>
                      </p>

                      {/* Grid Allergeni Alimentari */}
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Allergeni</span>
                        <div className="flex flex-wrap gap-1">
                          {foodAllergens.map((a) => {
                            const contains = p.allergeni_contenuti.includes(a.code);
                            const traces = p.allergeni_tracce.includes(a.code);
                            
                            let btnClass = 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700';
                            if (contains) {
                              btnClass = 'bg-rose-500 border-rose-500 text-white font-bold shadow-sm shadow-rose-500/15';
                            } else if (traces) {
                              btnClass = 'bg-amber-450 border-amber-450 text-white font-bold shadow-sm shadow-amber-500/15';
                            }

                            return (
                              <button
                                key={a.code}
                                onClick={() => toggleAllergen(i, a.code)}
                                type="button"
                                title={`${a.name_it} (${contains ? 'Contiene' : traces ? 'Tracce' : 'Assente'})`}
                                className={`px-2 py-1 border rounded-full text-[10px] transition-all flex items-center gap-0.5 ${btnClass}`}
                              >
                                <span>{a.emoji}</span>
                                <span>{a.code}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dieta */}
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Dieta / Stile</span>
                        <div className="flex flex-wrap gap-1">
                          {diets.map((d) => {
                            const contains = p.allergeni_contenuti.includes(d.code);
                            let btnClass = contains
                              ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/15'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700';

                            return (
                              <button
                                key={d.code}
                                onClick={() => toggleDiet(i, d.code)}
                                type="button"
                                title={`${d.name_it} (${contains ? 'Idoneo' : 'Non specificato'})`}
                                className={`px-2.5 py-1 border rounded-full text-[10px] transition-all flex items-center gap-0.5 ${btnClass}`}
                              >
                                <span>{d.emoji}</span>
                                <span>{d.code}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Controllo Contaminazione Cucina */}
                      <div className="bg-amber-50 border border-amber-250 rounded-2xl p-3 mt-3 space-y-2">
                        <span className="text-[10px] font-black text-amber-900 uppercase tracking-wide block">
                          🛡️ Sicurezza Contaminazione Crociata
                        </span>
                        <label className="flex items-start gap-2 cursor-pointer text-[10px] text-slate-700 font-semibold leading-relaxed">
                          <input
                            type="checkbox"
                            checked={p.kitchen_protocol_confirmed === 1}
                            onChange={(e) => {
                              const checked = e.target.checked ? 1 : 0;
                              update(i, {
                                kitchen_protocol_confirmed: checked,
                                cross_contamination_checked_at: checked ? new Date().toISOString() : null,
                              }, true);
                            }}
                            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>
                            Confermo l'assenza di contaminazione crociata (es. farine volatili, olio di frittura condiviso) per gli allergeni esclusi.
                          </span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    /* STATO COMPRESSO (VISTA GENERALE) */
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] tracking-wider uppercase text-slate-400 font-bold block mb-1.5">Allergeni & Stili Alimentari</span>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                          {hasAnySelections ? (
                            <>
                              {/* Contains badges */}
                              {activeContains.map(a => (
                                <span 
                                  key={a.code} 
                                  className="bg-rose-50 border border-rose-150 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
                                  title={`${a.name_it} (Contiene)`}
                                >
                                  <span>{a.emoji}</span>
                                  <span>{a.code}</span>
                                </span>
                              ))}

                              {/* Traces badges */}
                              {activeTraces.map(a => (
                                <span 
                                  key={a.code} 
                                  className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
                                  title={`${a.name_it} (Tracce)`}
                                >
                                  <span>{a.emoji}</span>
                                  <span>{a.code} (tracce)</span>
                                </span>
                              ))}

                              {/* Diets badges */}
                              {activeDiets.map(d => (
                                <span 
                                  key={d.code} 
                                  className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-0.5"
                                  title={`${d.name_it} (Idoneo)`}
                                >
                                  <span>{d.emoji}</span>
                                  <span>{d.code}</span>
                                </span>
                              ))}
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic flex items-center gap-1.5 bg-slate-50/50 py-1.5 px-3 rounded-xl border border-slate-200/40 w-full justify-center">
                              🌿 Nessun allergene o dieta selezionata
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-1">
                        {p.kitchen_protocol_confirmed === 1 ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                            Cucina OK
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Cucina non confermata</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveAllergensIndex(i)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200/65 rounded-xl px-3.5 py-1.5 transition-all font-bold flex items-center gap-1 bg-white hover:scale-102"
                        >
                          Gestisci Allergeni
                        </button>
                      </div>
                    </div>
                  )}

                  {restaurantId ? (
                    <button
                      type="button"
                      onClick={() => saveDish(i)}
                      disabled={savingIndex === i}
                      className={`w-full mt-3 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${
                        savedFlashIndex === i
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
                      }`}
                    >
                      {savingIndex === i
                        ? 'Salvataggio...'
                        : savedFlashIndex === i
                          ? 'Salvato'
                          : p.id
                            ? 'Salva ora'
                            : 'Crea e salva piatto'}
                    </button>
                  ) : null}

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pulsante Aggiungi */}
      <div className="pt-4 text-center">
        <button
          onClick={() => onChange([...piatti, {
            nome_piatto: 'Nuovo piatto', 
            categoria: 'Primi',
            prezzo_cents: 1000,
            allergeni_contenuti: [], 
            allergeni_tracce: [],
          }])}
          className="border-2 border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-3 rounded-2xl text-sm transition-all"
        >
          ＋ Aggiungi un piatto al menù
        </button>
      </div>
    </div>
  );
}
