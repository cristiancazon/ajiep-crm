import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Limpieza profunda de cualquier token corrupto viejo de intentos anteriores
window.localStorage.clear();
console.log('🧹 LocalStorage limpiado. Estado prístino.');
console.log('🚀 Main.jsx cargado');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
