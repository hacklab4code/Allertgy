import { useEffect, useState } from 'react';
import { api, clearToken, hasToken } from './api';
import ConsumerWebApp from './consumer/ConsumerWebApp';
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
  const [sessionLoading, setSessionLoading] = useState(hasToken());

  useEffect(() => {
    if (!hasToken()) {
      setSessionLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await api.getProfile();
        if (cancelled) return;
        const userRole = profile.role === 'owner' ? 'owner' : 'customer';
        setLogged(true);
        setRole(userRole);
      } catch {
        if (!cancelled) {
          clearToken();
          setLogged(false);
          setRole(null);
        }
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const switchAccount = (target: 'customer' | 'owner') => {
    clearToken();
    setLogged(false);
    setRole(null);
    setDefaultRole(target);
    setView('login');
  };

  const handleOwnerEntry = () => {
    if (sessionLoading) return;
    if (logged && role === 'owner') {
      setView('app');
      return;
    }
    if (logged && role === 'customer') {
      if (confirm('Sei loggato come Cliente.\n\nVuoi uscire e accedere come Ristoratore?')) {
        switchAccount('owner');
      }
      return;
    }
    setDefaultRole('owner');
    setView('login');
  };

  const handleCustomerEntry = () => {
    if (sessionLoading) return;
    if (logged && role === 'customer') {
      setView('client');
      return;
    }
    if (logged && role === 'owner') {
      if (confirm('Sei loggato come Ristoratore.\n\nVuoi uscire e accedere come Cliente?')) {
        switchAccount('customer');
      }
      return;
    }
    setDefaultRole('customer');
    setView('login');
  };

  const handleLogout = () => {
    clearToken();
    setLogged(false);
    setRole(null);
    setView('landing');
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <p className="text-[#4A3B32] font-semibold">Caricamento sessione...</p>
      </div>
    );
  }

  if (view === 'landing') {
    return <Landing onEnter={handleOwnerEntry} onClienti={handleCustomerEntry} />;
  }
  if (view === 'client') {
    return <ConsumerWebApp onBack={() => setView('landing')} onLogout={handleLogout} />;
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
