import { directus } from './src/lib/directus.js';
import { readItems } from '@directus/sdk';

async function run() {
  try {
    const items = await directus.request(readItems('biblio', { fields: ['id', 'titulo', 'categoria'], limit: 100 }));
    console.log('Categorías encontradas:', [...new Set(items.map(i => i.categoria))]);
    console.log('Detalle:', items);
  } catch(e) {
    console.error('Error:', e);
  }
}
run();
