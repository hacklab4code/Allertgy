import { type ReactNode, useEffect, useState } from 'react';
import { api, setToken } from '../api';

interface LoginProps {
  defaultRole: 'customer' | 'owner';
  onDone: (role: string) => void;
  onBack?: () => void;
}

export default function Login({ defaultRole, onDone, onBack }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'customer' | 'owner'>(defaultRole);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptHealthData, setAcceptHealthData] = useState(false);
  const [acceptOwnerResponsibility, setAcceptOwnerResponsibility] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Forza il ruolo di default passato dal bottone cliccato in landing
  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole, mode]);

  const legalOk = mode === 'login' || (
    acceptTerms &&
    acceptPrivacy &&
    (role === 'customer' ? acceptHealthData : acceptOwnerResponsibility)
  );

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const res = mode === 'login'
        ? await api.login(email.trim(), password)
        : await api.register(email.trim(), password, role, displayName.trim(), {
            accept_terms: acceptTerms,
            accept_privacy: acceptPrivacy,
            accept_health_data: role === 'customer' ? acceptHealthData : false,
            accept_owner_responsibility: role === 'owner' ? acceptOwnerResponsibility : false,
          });
      setToken(res.access_token);
      onDone(res.role);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 flex items-center justify-center relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_40%)] pointer-events-none" />
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 w-full max-w-md relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <span className="text-4xl">🥗</span>
          <h1 className="text-2xl font-black text-emerald-800 mt-2">AllerTgy</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">
            {mode === 'login' ? 'Accedi al tuo Account' : 'Registra un nuovo Account'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        {/* Role Selector (only in signup mode) */}
        {mode === 'register' && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Tipo Account</label>
            <div className="flex gap-2">
              <button
                onClick={() => setRole('customer')}
                className={`flex-1 py-3 px-4 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all
                  ${role === 'customer' 
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-800 ring-2 ring-emerald-500/20' 
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                <span className="text-lg">🙋</span>
                <span>Sono un Cliente</span>
              </button>
              <button
                onClick={() => setRole('owner')}
                className={`flex-1 py-3 px-4 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all
                  ${role === 'owner' 
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-800 ring-2 ring-emerald-500/20' 
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                <span className="text-lg">👨‍🍳</span>
                <span>Sono Ristoratore</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Nome Ristoratore/Utente (solo in registrazione) */}
          {mode === 'register' && (
            <div>
              <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Nome Completo</label>
              <input 
                type="text" 
                placeholder="es. Marco Rossi"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Indirizzo Email</label>
            <input 
              type="email" 
              placeholder="es. marco@allertgy.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-450 uppercase font-black tracking-wider block mb-1">Password</label>
            <input 
              type="password" 
              placeholder="Minimo 8 caratteri"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <CheckRow checked={acceptTerms} onClick={() => setAcceptTerms(!acceptTerms)}>
              Accetto i Termini di servizio di AllerTgy.
            </CheckRow>
            <CheckRow checked={acceptPrivacy} onClick={() => setAcceptPrivacy(!acceptPrivacy)}>
              Ho letto l'Informativa Privacy.
            </CheckRow>
            {role === 'customer' ? (
              <CheckRow checked={acceptHealthData} onClick={() => setAcceptHealthData(!acceptHealthData)}>
                Acconsento al trattamento dei dati su allergie e preferenze alimentari per personalizzare i menu.
              </CheckRow>
            ) : (
              <CheckRow checked={acceptOwnerResponsibility} onClick={() => setAcceptOwnerResponsibility(!acceptOwnerResponsibility)}>
                Confermo di essere autorizzato a gestire il locale e pubblicare dati allergeni verificati.
              </CheckRow>
            )}
          </div>
        )}

        {/* Submit */}
        <button 
          onClick={submit} 
          disabled={busy || !email || password.length < 8 || (mode === 'register' && (!displayName || !legalOk))}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-emerald-600/10 disabled:opacity-40"
        >
          {busy ? 'Caricamento...' : mode === 'login' ? 'Accedi' : 'Registra Account'}
        </button>

        {/* Toggle Mode */}
        <div className="text-center pt-2">
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs text-slate-500 hover:text-emerald-700 underline transition-colors"
          >
            {mode === 'login' ? 'Non hai ancora un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
        </div>

        {onBack && (
          <div className="pt-2 border-t border-slate-100 text-center">
            <button 
              onClick={onBack} 
              className="text-xs font-semibold text-slate-400 hover:text-slate-650 transition-colors"
            >
              ← Torna alla Pagina Iniziale
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function CheckRow({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex items-start gap-2 text-left w-full">
      <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center text-[10px] font-black shrink-0 ${checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
        ✓
      </span>
      <span className="text-[11px] text-slate-600 font-semibold leading-relaxed">{children}</span>
    </button>
  );
}
