import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { directus } from '../lib/directus';
import { updateMe } from '@directus/sdk';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.jpg';
import { 
  Home, 
  CreditCard, 
  BookOpen, 
  Bell, 
  LogOut, 
  User,
  Settings,
  ShieldCheck,
  Users,
  UserCog,
  X,
  FileText,
  Menu
} from 'lucide-react';

function Layout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await directus.logout();
    window.location.reload();
  };

  // State for Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    if (passForm.newPassword.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsUpdating(true);
    try {
      await directus.request(updateMe({ password: passForm.newPassword }));
      alert('Contraseña actualizada correctamente.');
      setIsProfileModalOpen(false);
      setPassForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Error al actualizar la contraseña: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsUpdating(false);
    }
  };

  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/' },
    { icon: <CreditCard size={20} />, label: 'Pagos y Facturas', path: '/billing' },
    { icon: <BookOpen size={20} />, label: 'Biblioteca', path: '/biblio' },
    { icon: <FileText size={20} />, label: 'Estados Contables', path: '/estados-contables' },
    { icon: <Bell size={20} />, label: 'Notificaciones', path: '/notifications' },
  ];

  if (user?.es_administrador) {
    menuItems.splice(3, 0, { icon: <Users size={20} />, label: 'Socios', path: '/socios' }); 
    menuItems.splice(4, 0, { icon: <UserCog size={20} />, label: 'Usuarios', path: '/usuarios' });
    // Insert Socios and Usuarios before Notificaciones
  }

  const getPageTitle = () => {
    const current = menuItems.find(item => item.path === location.pathname);
    return current ? current.label : 'AJIEP CRM';
  };

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <div 
        className="glass ghost-border"
        style={{ 
          display: 'none', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '64px', 
          padding: '0 1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1000,
        }}
        id="mobile-header"
      >
        <button 
          onClick={() => setIsSidebarOpen(true)}
          style={{ background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}
        >
          <Menu size={24} />
        </button>
        <img src={logo} alt="Logo" style={{ height: '32px' }} />
        <div style={{ width: '24px' }}></div> {/* Spacer */}
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            #mobile-header { display: flex !important; }
          }
        `}
      </style>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.5)', 
              zIndex: 90 
            }}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center', position: 'relative' }}>
          <img src={logo} alt="AJIEP Logo" style={{ maxWidth: '140px' }} />
          <button 
            className="mobile-only"
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: 'absolute', right: 0, top: 0, display: 'none', background: 'transparent', border: 'none', cursor: 'pointer' }}
            id="close-sidebar"
          >
            <X size={24} />
          </button>
        </div>
        
        <style>
          {`
            @media (max-width: 768px) {
              #close-sidebar { display: block !important; }
            }
          `}
        </style>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                backgroundColor: isActive ? 'var(--surface-container-high)' : 'transparent',
                fontWeight: isActive ? '600' : '400',
                transition: 'all 0.2s ease'
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--outline-variant)', paddingTop: '1.5rem' }}>
          {user.es_administrador && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'rgba(0, 94, 184, 0.1)', borderRadius: '8px', marginBottom: '1rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700' }}>
              <ShieldCheck size={16} />
              ADMINISTRADOR
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', padding: '0 8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.first_name || user.email.split('@')[0]}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>{user.es_administrador ? 'Directiva' : 'Socio'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '12px 16px', 
              width: '100%', 
              backgroundColor: 'transparent', 
              color: 'var(--error)', 
              borderRadius: '8px',
              textAlign: 'left',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem' }}>{getPageTitle()}</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="card ghost-border" 
              onClick={() => setIsProfileModalOpen(true)}
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <Settings size={18} />
              Perfil
            </button>
          </div>
        </header>
        {children}
      </main>

      {/* Profile Password Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Actualizar Contraseña</h3>
                <button onClick={() => setIsProfileModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(0, 94, 184, 0.05)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <p style={{ margin: 0, color: 'var(--primary)' }}>Usuario: <strong>{user.email}</strong></p>
              </div>

              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Nueva Contraseña</label>
                  <input 
                    type="password" 
                    value={passForm.newPassword} 
                    onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} 
                    placeholder="Mínimo 8 caracteres"
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Confirmar Nueva Contraseña</label>
                  <input 
                    type="password" 
                    value={passForm.confirmPassword} 
                    onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} 
                    placeholder="Repite la contraseña"
                    required 
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--outline-variant)',
                      borderColor: passForm.confirmPassword && passForm.newPassword !== passForm.confirmPassword ? 'var(--error)' : 'var(--outline-variant)'
                    }}
                  />
                  {passForm.confirmPassword && passForm.newPassword !== passForm.confirmPassword && (
                    <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px' }}>Las contraseñas no coinciden</p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsProfileModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}>
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUpdating || !passForm.newPassword || passForm.newPassword !== passForm.confirmPassword} 
                    className="btn-primary" 
                    style={{ padding: '10px 24px' }}
                  >
                    {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Layout;
