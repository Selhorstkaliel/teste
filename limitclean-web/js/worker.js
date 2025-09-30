const DB_NAME = 'limitclean-db';
const DB_VERSION = 1;

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

const readAllEntries = async () => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const updateEntryStatus = async (id, status) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    const request = store.get(id);
    request.onsuccess = () => {
      const entry = request.result;
      if (!entry) {
        resolve(false);
        return;
      }
      entry.status = status;
      entry.updatedAt = new Date().toISOString();
      store.put(entry);
    };
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const evaluateStatus = (entry) => {
  const created = new Date(entry.createdAt);
  const now = new Date();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  if (diffDays >= 180) return 'Reprotocolo';
  if (diffDays >= 30) return 'Finalizado';
  return 'Restrição';
};

const runScheduler = async () => {
  const entries = await readAllEntries();
  let updates = 0;
  await Promise.all(
    entries.map(async (entry) => {
      const status = evaluateStatus(entry);
      if (status !== entry.status) {
        await updateEntryStatus(entry.id, status);
        updates += 1;
      }
    })
  );
  postMessage({ type: 'sync-complete', updates });
};

setInterval(runScheduler, 60000);

self.addEventListener('message', (event) => {
  if (event.data === 'run') {
    runScheduler();
  }
});

runScheduler();
