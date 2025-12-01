// Configure this to your deployed Worker URL (Cloudflare Worker)
const WORKER_URL = 'worker-presiones.wilderalberto2000.workers.dev'; // <-- replace

import { obtenerPendientes, borrarPendiente } from './db.js';

export async function enviarPendientes() {
  const pendientes = await obtenerPendientes();
  if (!pendientes || pendientes.length === 0) throw new Error('No hay pendientes');

  for (const item of pendientes) {
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      if (res.ok) {
        await borrarPendiente(item.id);
      } else {
        const texto = await res.text();
        console.error('Error worker:', texto);
        throw new Error('Worker error');
      }
    } catch (e) {
      console.error('No se pudo enviar (offline o error):', e);
      // rethrow so caller knows some failed
      throw e;
    }
  }

  // clear backups
  localStorage.removeItem('pruebasAprobadas');
}
