import { initializeDatabase } from './db.js';
import { initializeAuth } from './auth.js';
import { setupRouter, updateRouterContext } from './router.js';

const schedulerListeners = new Set();

const createScheduler = () => {
  const worker = new Worker('./worker.js', { type: 'module' });
  worker.addEventListener('message', (event) => {
    if (event.data?.type === 'sync-complete') {
      schedulerListeners.forEach((listener) => listener(event.data));
    }
  });
  return {
    runNow: () => worker.postMessage('run'),
    subscribe: (listener) => {
      schedulerListeners.add(listener);
      return () => schedulerListeners.delete(listener);
    },
  };
};

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./sw.js', { scope: './' });
  } catch (error) {
    console.warn('SW registration failed', error);
  }
};

const bootstrap = async () => {
  await initializeDatabase();
  await initializeAuth();
  const nav = document.getElementById('app-nav');
  const container = document.getElementById('view-container');
  const scheduler = createScheduler();
  setupRouter(container, nav, () => {}, { scheduler });
  registerServiceWorker();
};

bootstrap();
