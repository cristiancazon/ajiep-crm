import React, { useState } from 'react';
import { directus } from '../lib/directus';
import logo from '../assets/logo.jpg';
import { LogIn, Mail, Lock } from 'lucide-react';

console.log('🔑 Login.jsx restaurado a código limpio');

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // LA REGLA DE ORO DE DIRECTUS v17: ¡Toma UN SÓLO OBJETO como argumento!
      await directus.login({ 
        email: email.trim(), 
        password: password.trim() 
      });
      
      // El SDK guardó el token nativamente usando su propio modelo de storage interno.
      // Ahora App.jsx podrá usar readMe() sin que reciba error 401.
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
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
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
