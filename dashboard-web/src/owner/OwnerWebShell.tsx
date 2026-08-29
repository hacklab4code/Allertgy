import type { ReactNode } from 'react';
import {
  WireApp, WireBtn, WireHeader, WireLayout, WireNav, WireRow, WireZone,
} from '../wireframe/WireframeUi';

export type OwnerTab =
  | 'attivita'
  | 'menu'
  | 'qr'
  | 'profilo'
  | 'piano'
  | 'crescita'
  | 'recensioni'
  | 'statistiche';

const PRIMARY_NAV: { id: OwnerTab; label: string }[] = [
  { id: 'attivita', label: '🏢 Info Ristorante' },
  { id: 'menu', label: '🍲 Editor Menù' },
  { id: 'qr', label: '📱 Stampa QR & Registro' },
  { id: 'profilo', label: '👤 Profilo Account' },
];

const SECONDARY_NAV: { id: OwnerTab; label: string }[] = [
  { id: 'recensioni', label: '⭐ Recensioni' },
  { id: 'statistiche', label: '📊 Statistiche' },
  { id: 'piano', label: '💳 Piano Abbonamento' },
  { id: 'crescita', label: '🚀 Promozione & Push' },
];

type Props = {
  onBackToLanding: () => void;
  onLogout: () => void;
  activeTab: OwnerTab;
  onTabChange: (tab: OwnerTab) => void;
  venueName?: string;
  venueCode?: string;
  onChangeVenue?: () => void;
  headerExtra?: ReactNode;
  showGuide: boolean;
  onToggleGuide: () => void;
  error: string;
  noVenue: ReactNode;
  children: ReactNode;
};

export default function OwnerWebShell({
  onBackToLanding,
  onLogout,
  activeTab,
  onTabChange,
  venueName,
  venueCode,
  onChangeVenue,
  headerExtra,
  showGuide,
  onToggleGuide,
  error,
  noVenue,
  children,
}: Props) {
  const hasVenue = !!venueName;

  return (
    <WireApp>
      <WireHeader
        title="AllerTgy Ristoratori"
        left={<WireBtn onClick={onBackToLanding}>← Home</WireBtn>}
        right={
          <>
            <WireBtn onClick={onToggleGuide}>{showGuide ? 'Nascondi guida' : '💡 Guida Rapida'}</WireBtn>
            {headerExtra}
            <WireBtn variant="danger" onClick={onLogout}>Esci</WireBtn>
          </>
        }
      />

      {hasVenue && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-extrabold">👨‍🍳 Locale attivo:</span>
            <span className="font-extrabold text-slate-800 text-sm">{venueName}</span>
            {venueCode && (
              <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] shadow-xs">
                #{venueCode}
              </span>
            )}
          </div>
          {onChangeVenue && <WireBtn onClick={onChangeVenue}>Cambia locale</WireBtn>}
        </div>
      )}

      {hasVenue && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-5">
          <WireNav
            items={PRIMARY_NAV}
            active={activeTab}
            onChange={(id) => onTabChange(id as OwnerTab)}
          />
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-3">
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
          <WireZone label="💡 GUIDA GUIDATA — CONFIGURAZIONE IN 4 PASSI">
            <ol className="text-xs text-slate-600 list-decimal ml-4 space-y-1.5 leading-relaxed font-semibold">
              <li><b className="text-slate-800">Seleziona o registra il tuo locale:</b> inserisci nome, città ed indirizzo.</li>
              <li><b className="text-slate-800">Info Ristorante:</b> aggiungi orari di apertura, contatti e foto della struttura.</li>
              <li><b className="text-slate-800">Editor Menù:</b> inserisci i tuoi piatti ed assegna gli allergeni o usa la scansione AI.</li>
              <li><b className="text-slate-800">Stampa QR & Registro:</b> scarica il QR Code per i tavoli ed il Registro Allergeni PDF conforme per legge.</li>
            </ol>
          </WireZone>
        </div>
      )}

      {!hasVenue ? (
        <div className="max-w-7xl mx-auto p-6">{noVenue}</div>
      ) : (
        <WireLayout
          sidebar={
            <div className="space-y-3">
              <p className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Pannello Ristorante
              </p>
              <WireNav
                items={SECONDARY_NAV}
                active={activeTab}
                onChange={(id) => onTabChange(id as OwnerTab)}
                vertical
              />
            </div>
          }
          main={children}
          aside={
            <WireZone label="⚡ AZIONI RAPIDE">
              <WireRow label="🍲 Editor menù e piatti" onClick={() => onTabChange('menu')} />
              <WireRow label="📱 Stampa QR Code tavoli" onClick={() => onTabChange('qr')} />
              <WireRow label="⭐ Recensioni ospiti" onClick={() => onTabChange('recensioni')} />
              <WireRow label="💳 Piano abbonamento" onClick={() => onTabChange('piano')} />
            </WireZone>
          }
        />
      )}
    </WireApp>
  );
}
