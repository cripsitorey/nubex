const DB_NAME = 'nubex_offline';
const DB_VERSION = 1;

const STORES = ['inventario', 'clientes', 'ventasQueue'];

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const keyPath = name === 'ventasQueue' ? 'localId' : 'id';
          db.createObjectStore(name, { keyPath, autoIncrement: name === 'ventasQueue' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

function requestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function replaceAll(storeName, items) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    for (const item of items) store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAll(storeName) {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readonly');
  return requestToPromise(tx.objectStore(storeName).getAll());
}

export async function put(storeName, item) {
  return withStore(storeName, 'readwrite', (store) => store.put(item));
}

export async function addToQueue(item) {
  const db = await openDb();
  const tx = db.transaction('ventasQueue', 'readwrite');
  const key = await requestToPromise(tx.objectStore('ventasQueue').add({ ...item, createdAt: Date.now() }));
  return key;
}

export async function removeFromQueue(localId) {
  return withStore('ventasQueue', 'readwrite', (store) => store.delete(localId));
}

export async function getQueue() {
  return getAll('ventasQueue');
}
