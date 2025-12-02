/**
 * Service Worker für FuerstFlow PWA
 * Cache-Strategie: Cache First für statische Assets, Network First für API-Calls
 */

const CACHE_NAME = 'fuerstflow-v1'
const STATIC_CACHE_NAME = 'fuerstflow-static-v1'
const DYNAMIC_CACHE_NAME = 'fuerstflow-dynamic-v1'

// Statische Assets die gecacht werden sollen
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-256.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/logo.png',
]

// Install Event - Cache statische Assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME
            )
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  return self.clients.claim()
})

// Fetch Event - Cache-Strategie
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API-Calls: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Nur erfolgreiche Responses cachen
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback zu Cache wenn Offline
          return caches.match(request)
        })
    )
    return
  }

  // Statische Assets: Cache First
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          // Cache neue Assets
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // HTML-Seiten: Network First mit Cache Fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match('/') // Offline-Fallback zur Startseite
        })
    )
    return
  }

  // Default: Network First
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request)
    })
  )
})

// Message Event - Cache löschen bei Update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(STATIC_CACHE_NAME)
    caches.delete(DYNAMIC_CACHE_NAME)
    caches.delete(CACHE_NAME)
  }
})

