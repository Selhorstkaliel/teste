import { hashPassword } from './utils/crypto.js';

const DB_NAME = 'limitclean-db';
const DB_VERSION = 1;
let dbPromise;

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'id' });
        store.createIndex('username', 'username', { unique: true });
      }
      if (!db.objectStoreNames.contains('representatives')) {
        const store = db.createObjectStore('representatives', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: true });
      }
      if (!db.objectStoreNames.contains('sellers')) {
        const store = db.createObjectStore('sellers', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: true });
        store.createIndex('representativeId', 'representativeId', { unique: false });
      }
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('tickets')) {
        const store = db.createObjectStore('tickets', { keyPath: 'id' });
        store.createIndex('userId', 'userId');
      }
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id' });
        store.createIndex('entryId', 'entryId');
        store.createIndex('ticketId', 'ticketId');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

const getDatabase = async () => {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
};

const runOnStore = async (storeName, mode, handler) => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    Promise.resolve(handler(store, tx))
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      })
      .catch(reject);
  });
};

const getSetting = async (key) => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
};

const setSetting = async (key, value) =>
  runOnStore('settings', 'readwrite', (store) => store.put({ key, value }));

const ensureAdminSeed = async () => {
  const seeded = await getSetting('seeded');
  if (seeded) return;
  const passHash = await hashPassword('kaskolk14');
  const now = new Date().toISOString();
  await runOnStore('users', 'readwrite', (store) =>
    store.put({
      id: crypto.randomUUID(),
      name: 'Kaliel',
      email: 'kaliel@example.com',
      username: 'Kaliel',
      role: 'admin',
      passHash,
      phone: '+55 11 99999-9999',
      createdAt: now,
    })
  );
  await setSetting('seeded', true);
};

export const initializeDatabase = async () => {
  await getDatabase();
  await ensureAdminSeed();
};

const requestPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const getAll = async (storeName, indexName, query) =>
  runOnStore(storeName, 'readonly', (store) => {
    if (indexName) {
      return requestPromise(store.index(indexName).getAll(query));
    }
    return requestPromise(store.getAll());
  });

export const getByKey = async (storeName, key) =>
  runOnStore(storeName, 'readonly', (store) => requestPromise(store.get(key)));

export const getByIndex = async (storeName, indexName, value) =>
  runOnStore(storeName, 'readonly', (store) => requestPromise(store.index(indexName).get(value)));

export const putItem = async (storeName, value) =>
  runOnStore(storeName, 'readwrite', (store) => requestPromise(store.put(value)));

export const deleteItem = async (storeName, key) =>
  runOnStore(storeName, 'readwrite', (store) => requestPromise(store.delete(key)));

export const clearStore = async (storeName) =>
  runOnStore(storeName, 'readwrite', (store) => requestPromise(store.clear()));
