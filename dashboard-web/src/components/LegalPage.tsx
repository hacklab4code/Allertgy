import { useEffect, useState } from 'react';
import { api, type LegalDoc } from '../api';

/** Pagine pubbliche /termini /privacy /cookie /sicurezza: testo servito dall'API
 * (fonte unica con l'app mobile). Render minimale del markdown senza dipendenze. */
export default function LegalPage({ doc }: { doc: string }) {
  const [data, setData] = useState<LegalDoc | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.legalDoc(doc).then(setData).catch((e) => setError(e.message));
  }, [doc]);

  useEffect(() => {
    if (data) document.title = `${data.title} — AllerTgy`;
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-900 text-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 hover:opacity-90">
            <span className="text-2xl">🥗</span>
            <span className="text-lg font-black tracking-tight">AllerTgy</span>
          </a>
          <nav className="flex gap-4 text-[11px] font-bold text-emerald-200">
            <a href="/termini" className="hover:text-white">Termini</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/cookie" className="hover:text-white">Cookie</a>
            <a href="/sicurezza" className="hover:text-white">Sicurezza</a>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">{error}</div>
        )}
        {data && (
          <article className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">
              Versione {data.version}
            </p>
            <MarkdownLite text={data.content_markdown} />
            <p className="text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-100 leading-relaxed">
              In caso di dubbi o richieste su questi documenti scrivi al contatto indicato nell'informativa.
            </p>
          </article>
        )}
      </main>
    </div>
  );
}

/** Convertitore markdown minimale: titoli, grassetto, corsivo, liste e tabelle. */
function MarkdownLite({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\n+/);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (block.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-black text-slate-850">{block.slice(2)}</h1>;
        }
        if (lines.every((l) => l.trim().startsWith('|'))) {
          const rows = lines
            .filter((l) => !/^\|[\s\-|]+\|$/.test(l.trim()))
            .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
          const [head, ...body] = rows;
          return (
            <table key={i} className="w-full text-xs border-collapse">
              <thead>
                <tr>{head.map((h, j) => <th key={j} className="border border-slate-200 bg-slate-50 p-2 text-left font-black">{h}</th>)}</tr>
              </thead>
              <tbody>
                {body.map((row, j) => (
                  <tr key={j}>{row.map((c, k) => <td key={k} className="border border-slate-200 p-2">{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          );
        }
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={i} className="list-disc ml-5 space-y-1 text-sm text-slate-600 leading-relaxed">
              {lines.map((l, j) => <li key={j}>{renderInline(l.trim().slice(2))}</li>)}
            </ul>
          );
        }
        return <p key={i} className="text-sm text-slate-600 leading-relaxed">{renderInline(block)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  // **grassetto** e *corsivo*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-slate-800">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
