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
  { id: 'attivita', label: 'Attività' },
  { id: 'menu', label: 'Menù' },
  { id: 'qr', label: 'QR' },
  { id: 'profilo', label: 'Profilo' },
];

const SECONDARY_NAV: { id: OwnerTab; label: string }[] = [
  { id: 'recensioni', label: 'Recensioni' },
  { id: 'statistiche', label: 'Statistiche' },
  { id: 'piano', label: 'Piano' },
  { id: 'crescita', label: 'Crescita' },
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
        title="AllerTgy Ristoratore"
        left={<WireBtn onClick={onBackToLanding}>← Landing</WireBtn>}
        right={
          <>
            <WireBtn onClick={onToggleGuide}>{showGuide ? 'Nascondi guida' : 'Guida'}</WireBtn>
            {headerExtra}
            <WireBtn variant="danger" onClick={onLogout}>Esci</WireBtn>
          </>
        }
      />

      {hasVenue && (
        <div style={{ borderBottom: '1px solid #000' }} className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>
            Locale: <b>{venueName}</b>
            {venueCode && <> · codice <b>#{venueCode}</b></>}
          </span>
          {onChangeVenue && <WireBtn onClick={onChangeVenue}>Cambia locale</WireBtn>}
        </div>
      )}

      {hasVenue && (
        <WireNav
          items={PRIMARY_NAV}
          active={activeTab}
          onChange={(id) => onTabChange(id as OwnerTab)}
        />
      )}

      {error && (
        <div className="mx-4 mt-2 p-2 border border-black text-xs">{error}</div>
      )}

      {showGuide && (
        <div className="mx-4 mt-2">
          <WireZone label="GUIDA — onboarding ristoratore">
            <ol className="text-xs list-decimal ml-4 space-y-1">
              <li>Registra o seleziona il locale → codice univoco</li>
              <li>Attività → completa vetrina (indirizzo, contatti, foto)</li>
              <li>Menù → inserisci piatti e allergeni, pubblica</li>
              <li>QR → stampa codice tavoli e registro allergeni</li>
              <li>Profilo → checklist, piano, crescita</li>
            </ol>
          </WireZone>
        </div>
      )}

      {!hasVenue ? (
        <div className="p-4">{noVenue}</div>
      ) : (
        <WireLayout
          sidebar={
            <div>
              <p className="px-3 py-2 text-[10px] font-bold border-b border-black">
                [NAV SECONDARIA — da Profilo mobile]
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
            <WireZone label="AZIONI RAPIDE">
              <WireRow label="Modifica menù" onClick={() => onTabChange('menu')} />
              <WireRow label="Stampa QR" onClick={() => onTabChange('qr')} />
              <WireRow label="Recensioni" onClick={() => onTabChange('recensioni')} />
              <WireRow label="Piano" onClick={() => onTabChange('piano')} />
            </WireZone>
          }
        />
      )}
    </WireApp>
  );
}
