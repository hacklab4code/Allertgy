import { useState } from 'react';
import { api } from '../api';

/** Pagina /reset-password?token=... raggiunta dal link nell'email. */
export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password !== confirm) {
      setError('Le due password non coincidono');
      return;
    }
    setBusy(true); setError('');
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 flex items-center justify-center">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <span className="text-4xl">🥗</span>
          <h1 className="text-2xl font-black text-emerald-800 mt-2">AllerTgy</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Reimposta la password</p>
        </div>

        {!token && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">
            Link non valido: manca il token. Richiedi un nuovo link dalla pagina di accesso.
          </div>
        )}

        {done ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold">
              ✅ Password aggiornata. Ora puoi accedere con la nuova password.
            </div>
            <a href="/" className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-8 rounded-2xl text-sm">
              Vai all'accesso
            </a>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">{error}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Nuova password</label>
                <input
                  type="password"
                  placeholder="Minimo 8 caratteri, maiuscole, minuscole e numeri"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Conferma password</label>
                <input
                  type="password"
                  placeholder="Ripeti la nuova password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              onClick={submit}
              disabled={busy || !token || password.length < 8}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl text-sm disabled:opacity-40"
            >
              {busy ? 'Salvataggio...' : 'Imposta nuova password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
