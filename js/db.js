let db;
export function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('presionesDB', 1);
    req.onupgradeneeded = e => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('pendientes')) {
        db.createObjectStore('pendientes', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(); };
    req.onerror = e => reject(e);
  });
}

export function guardarPendiente(prueba) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendientes', 'readwrite');
    tx.objectStore('pendientes').add(prueba);
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e);
  });
}

export function obtenerPendientes() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendientes', 'readonly');
    const req = tx.objectStore('pendientes').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e);
  });
}

export function borrarPendiente(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendientes', 'readwrite');
    tx.objectStore('pendientes').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e);
  });
}
