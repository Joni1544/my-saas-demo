# FuerstFlow PWA Setup

## 📁 Erstellte Dateien

### Icons & Logo
- `/public/logo.png` - Hauptlogo als PNG
- `/public/icons/icon-192.png` - Icon 192x192 (wird generiert)
- `/public/icons/icon-256.png` - Icon 256x256 (wird generiert)
- `/public/icons/icon-384.png` - Icon 384x384 (wird generiert)
- `/public/icons/icon-512.png` - Icon 512x512 (wird generiert)
- `/public/apple-touch-icon.png` - Apple Touch Icon 180x180 (wird generiert)
- `/public/icon.png` - Standard Icon 512x512 (wird generiert)
- `/public/favicon.ico` - Favicon

### PWA-Konfiguration
- `/public/manifest.json` - PWA Manifest
- `/public/sw.js` - Service Worker
- `/next.config.js` - Next.js PWA-Konfiguration
- `/app/layout.tsx` - PWA Meta-Tags integriert
- `/lib/branding.ts` - Multi-Tenant Branding Funktionen
- `/components/PWAInstallPrompt.tsx` - Install-Prompt Komponente
- `/scripts/generate-icons.js` - Icon-Generator Script

## 🎨 Icons generieren

### Schritt 1: Sharp installieren
```bash
npm install sharp
```

### Schritt 2: Icons generieren
```bash
node scripts/generate-icons.js
```

Dies erstellt automatisch alle benötigten PNG-Icons aus dem SVG-Logo.

## 🧪 Lokal testen

### 1. Development Server starten
```bash
npm run dev
```

### 2. PWA-Features testen

#### Chrome/Edge:
1. Öffne `http://localhost:3000`
2. Öffne DevTools (F12)
3. Gehe zu "Application" Tab
4. Prüfe:
   - **Manifest**: Sollte alle Icons und Metadaten zeigen
   - **Service Workers**: Sollte "sw.js" registriert sein
   - **Storage**: Cache sollte funktionieren

#### Install-Prompt testen:
1. Öffne DevTools → "Application" → "Service Workers"
2. Klicke "Update" um Service Worker zu aktualisieren
3. Schließe und öffne die App erneut
4. Der Install-Prompt sollte erscheinen (rechts unten)

#### Offline-Modus testen:
1. DevTools → "Network" Tab
2. Wähle "Offline" aus
3. Lade die Seite neu
4. Die App sollte weiterhin funktionieren (aus Cache)

### 3. Mobile Testen (iOS/Android)

#### iOS (Safari):
1. Öffne die App auf dem iPhone/iPad
2. Tippe auf "Teilen" Button
3. Wähle "Zum Home-Bildschirm"
4. Die App wird als PWA installiert

#### Android (Chrome):
1. Öffne die App im Chrome Browser
2. Tippe auf das Menü (3 Punkte)
3. Wähle "Zur Startseite hinzufügen" oder "App installieren"
4. Die App wird als PWA installiert

## 🚀 Vercel Deployment

### Automatische PWA-Auslieferung

Vercel erkennt automatisch:
- ✅ `manifest.json` → Wird als PWA-Manifest ausgeliefert
- ✅ `sw.js` → Service Worker wird registriert
- ✅ Meta-Tags → Werden in HTML eingefügt

### HTTPS erforderlich

PWA funktioniert nur über HTTPS. Vercel stellt automatisch HTTPS bereit.

### Cache-Strategie

Der Service Worker verwendet:
- **Cache First** für statische Assets (Icons, CSS, JS)
- **Network First** für API-Calls
- **Offline Fallback** zur Startseite

## 🎨 Multi-Tenant Branding

### Aktueller Stand

Die Funktion `getBrandingForTenant()` ist vorbereitet, aber noch nicht vollständig implementiert.

### Später implementieren:

1. **Prisma Schema erweitern**:
```prisma
model Shop {
  // ... bestehende Felder
  branding Json? // Branding-Konfiguration als JSON
}
```

2. **Branding speichern**:
```typescript
import { setBrandingForTenant } from '@/lib/branding'

await setBrandingForTenant(tenantId, {
  name: "Mein Studio",
  primaryColor: "#FF5733",
  secondaryColor: "#FF8C42",
  logoUrl: "/custom-logos/studio-123.png",
})
```

3. **Dynamisches Manifest**:
Die Route `/app/manifest/route.ts` gibt bereits tenant-spezifische Manifeste zurück.

### Verwendung:

```typescript
import { getBrandingForTenant } from '@/lib/branding'

const branding = await getBrandingForTenant(session.user.tenantId)
// { name: "FuerstFlow", primaryColor: "#4F46E5", ... }
```

## 📱 PWA-Features

### ✅ Implementiert:
- ✅ Manifest.json
- ✅ Service Worker mit Cache-Strategie
- ✅ Install-Prompt
- ✅ Offline-Fallback
- ✅ Icons in allen Größen
- ✅ Apple Touch Icon
- ✅ Theme Color
- ✅ Multi-Tenant Branding (vorbereitet)

### 🔄 Später erweitern:
- Push Notifications
- Background Sync
- Share Target API
- File System Access API

## 🐛 Troubleshooting

### Service Worker registriert sich nicht:
1. Prüfe Browser-Konsole auf Fehler
2. Stelle sicher, dass `sw.js` unter `/public/sw.js` liegt
3. Prüfe HTTPS (erforderlich für PWA)

### Icons werden nicht angezeigt:
1. Führe `node scripts/generate-icons.js` aus
2. Prüfe ob Icons in `/public/icons/` existieren
3. Leere Browser-Cache

### Install-Prompt erscheint nicht:
1. PWA muss installierbar sein (Manifest + Service Worker)
2. App muss über HTTPS laufen
3. Browser muss PWA unterstützen (Chrome, Edge, Safari)

## 📚 Weitere Ressourcen

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Next.js PWA Guide](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)

