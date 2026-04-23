import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { directus } from './lib/directus';
import { readMe } from '@directus/sdk';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Biblio from './pages/Biblio';
import BiblioDetail from './pages/BiblioDetail';
import Comprobantes from './pages/Comprobantes';
import Socios from './pages/Socios';
import Usuarios from './pages/Usuarios';
import EstadosContables from './pages/EstadosContables';
import Notifications from './pages/Notifications';
import Multimedia from './pages/Multimedia';
import MultimediaDetail from './pages/MultimediaDetail';
import Layout from './components/Layout';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const me = await directus.request(readMe());
      setUser(me);
    } catch (e) {
      // Es 100% normal fallar aquí en el primer render de la web porque no hay sesión iniciada
      if (e?.errors?.[0]?.extensions?.code !== 'INVALID_CREDENTIALS') {
         // console.error('Error fetching user info in App.jsx:', e);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--surface-container-high)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
        <p style={{ fontWeight: '600', color: 'var(--on-surface-variant)' }}>Iniciando AJIEP CRM...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login onLogin={checkUser} />} 
          />
          <Route 
            path="/" 
            element={user ? <Layout user={user}><PageWrapper><Dashboard user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/billing" 
            element={user ? <Layout user={user}><PageWrapper><Billing user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/biblio" 
            element={user ? <Layout user={user}><PageWrapper><Biblio user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/biblio/:id" 
            element={user ? <Layout user={user}><PageWrapper><BiblioDetail user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/comprobante" 
            element={user ? <Layout user={user}><PageWrapper><Comprobantes user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/comprobante/:id" 
            element={user ? <Layout user={user}><PageWrapper><BiblioDetail user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/multimedia" 
            element={user ? <Layout user={user}><PageWrapper><Multimedia user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/multimedia/:id" 
            element={user ? <Layout user={user}><PageWrapper><MultimediaDetail user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/socios" 
            element={user ? <Layout user={user}><PageWrapper><Socios user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/usuarios" 
            element={user ? <Layout user={user}><PageWrapper><Usuarios user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/estados-contables" 
            element={user ? <Layout user={user}><PageWrapper><EstadosContables user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/notifications" 
            element={user ? <Layout user={user}><PageWrapper><Notifications user={user} /></PageWrapper></Layout> : <Navigate to="/login" />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

export default App;
