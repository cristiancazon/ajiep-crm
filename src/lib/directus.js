import { createDirectus, rest, authentication } from '@directus/sdk';

// 1. Obtener la URL base completa para evitar "Invalid URL" y pantalla en blanco
const isLocalhost = typeof window !== 'undefined' && window.location.origin.includes('localhost');
const DIRECTUS_URL = isLocalhost ? `${window.location.origin}/directus-proxy` : (import.meta.env.VITE_DIRECTUS_URL || 'https://xer.pascalito.com.ar');

console.log('🔗 URL de Directus activa:', DIRECTUS_URL);

// 2. Adaptador de storage para tokens
const storage = {
  get: () => window.localStorage.getItem('directus_auth_token'),
  set: (value) => window.localStorage.setItem('directus_auth_token', value),
  remove: () => window.localStorage.removeItem('directus_auth_token'),
};

export const directus = createDirectus(DIRECTUS_URL)
  .with(authentication('json', { storage }))
  .with(rest());

export const SOCIO_ROLE_ID = '4cdc9771-b946-435a-ba09-6943beeeb6c9';
