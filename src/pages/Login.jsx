import React, { useState } from 'react';
import { directus } from '../lib/directus';
import logo from '../assets/logo.jpg';
import { LogIn, Mail, Lock } from 'lucide-react';

console.log('🔑 Login.jsx restaurado a código limpio');

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Si el usuario no tiene el dominio @sistema.com, se lo agregamos automáticamente
      const fullEmail = username.trim().includes('@') 
        ? username.trim() 
        : `${username.trim()}@sistema.com`;

      // Usamos objeto para login (requerido por versiones recientes del SDK como la v21 instalada)
      await directus.login({ 
        email: fullEmail, 
        password: password.trim() 
      });
      
      // Ahora App.jsx podrá usar readMe() sin error 401.
      onLogin();
      
    } catch (err) {
      console.error('ERROR DETECTADO EN LOGIN CRUDA:', err);
      let msg = 'Error de conexión o configuración.';
      if (err.errors && err.errors[0]?.extensions?.code === 'INVALID_CREDENTIALS') {
        msg = 'Contraseña o Mail incorrecto en la Base de Datos.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--surface-container-lowest)' }}>
      <div className="card" style={{ width: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={logo} alt="AJIEP Logo" style={{ maxWidth: '120px', marginBottom: '1rem' }} />
          <h2>Acceso AJIEP</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Usuario</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              autoComplete="username"
              placeholder="nombre.apellido"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
            />
          </div>

          {error && <p style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}

          <button className="btn-primary" style={{ width: '100%', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={loading}>
            <LogIn size={20} />
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
