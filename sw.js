// Service worker : met tout le jeu en cache pour qu'il marche hors-ligne.
// Pour publier une mise à jour, augmenter le numéro de VERSION (voir README).

const VERSION = 1;
const CACHE = `coucou-v${VERSION}`;

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './js/main.js',
  './js/core/input.js',
  './js/core/audio.js',
  './js/core/layout.js',
  './js/core/session.js',
  './js/core/homeGuard.js',
  './js/core/effects.js',
  './js/data/recordings.js',
  './js/games/bubbles.js',
  './js/games/shapes.js',
  './js/games/colors.js',
  './js/games/animals.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Ajouter ici les éventuels fichiers audio enregistrés, ex. './audio/chat.m4a'
];

// En local (développement), on privilégie le réseau pour voir les modifications tout de suite.
const DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(DEV ? networkFirst(req) : cacheFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
  if (cached) return cached;
  return fetchAndStore(req);
}

async function networkFirst(req) {
  try {
    return await fetchAndStore(req);
  } catch (err) {
    const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (cached) return cached;
    throw err;
  }
}

async function fetchAndStore(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    if (req.mode === 'navigate') {
      const index = await caches.match('./index.html');
      if (index) return index;
    }
    throw err;
  }
}
