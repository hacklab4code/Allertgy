import { API } from '../api/client';

const STOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1595908129746-57ca1a63dd4d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
];

export function resolveDishImageUrl(
  url: string | null | undefined,
  name: string,
  category?: string | null,
): string {
  if (url) {
    if (url.startsWith('http')) return url;
    return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('pizza')) return STOCK_PHOTOS[8];
  if (n.includes('pasta') || n.includes('carbonara') || n.includes('tagliatelle') || c.includes('primi')) return STOCK_PHOTOS[2];
  if (n.includes('risotto')) return STOCK_PHOTOS[3];
  if (n.includes('bruschetta') || c.includes('antipast')) return STOCK_PHOTOS[0];
  if (n.includes('frittur') || n.includes('calamari') || n.includes('pesce') || n.includes('mare')) return STOCK_PHOTOS[4];
  if (n.includes('carne') || n.includes('tagliata') || n.includes('manzo') || c.includes('secondi')) return STOCK_PHOTOS[5];
  if (n.includes('verdur') || n.includes('insalat') || c.includes('contorn')) return STOCK_PHOTOS[6];
  if (n.includes('tiramis') || n.includes('dolce') || c.includes('dolc')) return STOCK_PHOTOS[7];
  return STOCK_PHOTOS[9];
}

export function uniqueDishGalleryUris(
  piatti: { image_url?: string | null; nome_piatto: string; categoria?: string | null }[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of piatti) {
    const uri = resolveDishImageUrl(p.image_url, p.nome_piatto, p.categoria);
    if (!seen.has(uri)) {
      seen.add(uri);
      out.push(uri);
    }
  }
  return out;
}
