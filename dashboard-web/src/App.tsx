import { useState } from 'react';
import { hasToken, clearToken } from './api';
import ClientArea from './components/ClientArea';
import InternalAdmin from './components/InternalAdmin';
import LegalPage from './components/LegalPage';
import Login from './components/Login';
import PublicRestaurant from './components/PublicRestaurant';
import ResetPassword from './components/ResetPassword';
import Landing from './Landing';
import OwnerDashboard from './OwnerDashboard';

const LEGAL_ROUTES: Record<string, string> = {
  '/termini': 'terms',
  '/privacy': 'privacy',
  '/cookie': 'cookies',
  '/sicurezza': 'safety',
};

export default function App() {
  const path = window.location.pathname;
  if (path === '/internal-admin') {
    return <InternalAdmin />;
  }
  if (path === '/reset-password') {
    return <ResetPassword />;
  }
  if (path.startsWith('/r/') && path.length > 3) {
    return <PublicRestaurant codeOrSlug={decodeURIComponent(path.slice(3).replace(/\/+$/, ''))} />;
  }
  if (LEGAL_ROUTES[path]) {
    return <LegalPage doc={LEGAL_ROUTES[path]} />;
  }

  const [view, setView] = useState<'landing' | 'app' | 'client' | 'login'>('landing');
  const [logged, setLogged] = useState(hasToken());
  const [role, setRole] = useState<'customer' | 'owner' | null>(null);
  const [defaultRole, setDefaultRole] = useState<'customer' | 'owner'>('owner');

  const handleOwnerEntry = () => {
    if (logged) {
      if (role === 'owner') setView('app');
      else alert("Questo account è registrato come Cliente. Disconnettiti dall'area clienti per accedere come Ristoratore.");
    } else {
      setDefaultRole('owner');
      setView('login');
    }
  };

  const handleCustomerEntry = () => {
    if (logged) {
      if (role === 'customer') setView('client');
      else alert("Questo account è registrato come Ristoratore. Disconnettiti dalla dashboard per accedere come Cliente.");
    } else {
      setDefaultRole('customer');
      setView('login');
    }
  };

  const handleLogout = () => {
    clearToken();
    setLogged(false);
    setRole(null);
    setView('landing');
  };

  if (view === 'landing') {
    return <Landing onEnter={handleOwnerEntry} onClienti={handleCustomerEntry} />;
  }
  if (view === 'client') {
    return <ClientArea onBack={() => setView('landing')} onLogout={handleLogout} />;
  }
  if (view === 'login' || !logged) {
    return (
      <Login
        defaultRole={defaultRole}
        onDone={(userRole) => {
          setLogged(true);
          setRole(userRole as 'customer' | 'owner');
          setView(userRole === 'owner' ? 'app' : 'client');
        }}
        onBack={() => setView('landing')}
      />
    );
  }

  return <OwnerDashboard onLogout={handleLogout} onBackToLanding={() => setView('landing')} />;
}
