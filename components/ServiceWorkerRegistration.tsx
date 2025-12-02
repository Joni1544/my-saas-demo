/**
 * Service Worker Registration Component
 * Registriert Service Worker client-side
 */
'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registriert:', registration.scope)

            // Prüfe auf Updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🔄 Neuer Service Worker verfügbar')
                    // Optional: Update-Benachrichtigung anzeigen
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('❌ Service Worker Registrierung fehlgeschlagen:', error)
          })
      })
    }
  }, [])

  return null
}

