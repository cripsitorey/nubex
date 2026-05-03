import { openDB } from "idb";

const DB_NAME = "nubex-db";
const DB_VERSION = 2;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains("vapes")) {
        db.createObjectStore("vapes", { keyPath: "id" });
      }
      
      if (!db.objectStoreNames.contains("planes")) {
        db.createObjectStore("planes", { keyPath: "id" });
      }
      
      if (!db.objectStoreNames.contains("syncQueue")) {
        const queueStore = db.createObjectStore("syncQueue", {
          keyPath: "id",
          autoIncrement: true,
        });
        queueStore.createIndex("status", "status");
        queueStore.createIndex("timestamp", "timestamp");
      }

      // Migración v2: agregar índice de retries si no existe
      if (oldVersion < 2) {
        if (db.objectStoreNames.contains("syncQueue")) {
          const tx = db.transaction ? null : null; // No-op, los índices se crean en upgrade
          // Los nuevos campos (retryCount, lastError) se manejan a nivel de aplicación
        }
      }
    },
  });
}

export async function getStore(storeName) {
  const db = await initDB();
  return db.transaction(storeName, "readonly").objectStore(storeName).getAll();
}

export async function putToStore(storeName, item) {
  const db = await initDB();
  const tx = db.transaction(storeName, "readwrite");
  await tx.objectStore(storeName).put(item);
  await tx.done;
}

export async function clearStore(storeName) {
  const db = await initDB();
  const tx = db.transaction(storeName, "readwrite");
  await tx.objectStore(storeName).clear();
  await tx.done;
}

export async function addToQueue(type, payload) {
  const db = await initDB();
  const tx = db.transaction("syncQueue", "readwrite");
  const id = await tx.objectStore("syncQueue").add({
    type,
    payload,
    status: "pending",
    retryCount: 0,
    lastError: null,
    timestamp: Date.now(),
  });
  await tx.done;
  return id;
}

export async function getPendingQueue() {
  const db = await initDB();
  const tx = db.transaction("syncQueue", "readonly");
  const store = tx.objectStore("syncQueue");
  const index = store.index("status");
  return index.getAll("pending");
}

export async function getPendingCount() {
  const items = await getPendingQueue();
  return items.length;
}

export async function markQueueProcessed(id) {
  const db = await initDB();
  const tx = db.transaction("syncQueue", "readwrite");
  const store = tx.objectStore("syncQueue");
  const item = await store.get(id);
  if (item) {
    item.status = "processed";
    await store.put(item);
  }
  await tx.done;
}

export async function markQueueFailed(id, errorMessage) {
  const db = await initDB();
  const tx = db.transaction("syncQueue", "readwrite");
  const store = tx.objectStore("syncQueue");
  const item = await store.get(id);
  if (item) {
    item.retryCount = (item.retryCount || 0) + 1;
    item.lastError = errorMessage;
    // Después de 5 intentos, marcar como failed permanentemente
    if (item.retryCount >= 5) {
      item.status = "failed";
    }
    await store.put(item);
  }
  await tx.done;
}

export async function removeFromQueue(id) {
  const db = await initDB();
  const tx = db.transaction("syncQueue", "readwrite");
  await tx.objectStore("syncQueue").delete(id);
  await tx.done;
}

export async function getFailedQueue() {
  const db = await initDB();
  const tx = db.transaction("syncQueue", "readonly");
  const store = tx.objectStore("syncQueue");
  const index = store.index("status");
  return index.getAll("failed");
}

export async function retryFailedItem(id) {
  const db = await initDB();
  const tx = db.transaction("syncQueue", "readwrite");
  const store = tx.objectStore("syncQueue");
  const item = await store.get(id);
  if (item) {
    item.status = "pending";
    item.retryCount = 0;
    item.lastError = null;
    await store.put(item);
  }
  await tx.done;
}
