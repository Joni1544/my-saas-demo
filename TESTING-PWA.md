# PWA Lokal Testen - Schritt für Schritt

## 🚀 Schnellstart

### 1. Development Server starten

```bash
npm run dev
```

Die App läuft dann auf: `http://localhost:3000`

---

## 📱 PWA-Features lokal testen

### ✅ Service Worker testen

**Chrome/Edge:**

1. Öffne `http://localhost:3000` im Browser
2. Öffne DevTools (F12 oder Rechtsklick → "Untersuchen")
3. Gehe zum Tab **"Application"** (oder "Anwendung")
4. Im linken Menü unter **"Service Workers"**:
   - Du solltest `sw.js` sehen
   - Status sollte "activated and is running" sein
   - Falls nicht: Klicke auf "Update" oder "Unregister" → Seite neu laden

**Firefox:**

1. DevTools öffnen (F12)
2. Tab **"Application"** → **"Service Workers"**
3. Prüfe ob der Service Worker registriert ist

---

### 📋 Manifest prüfen

**Chrome/Edge:**

1. DevTools → **"Application"** Tab
2. Links: **"Manifest"**
3. Du solltest sehen:
   - ✅ Name: "FuerstFlow"
   - ✅ Short name: "FFlow"
   - ✅ Icons: Alle 4 Größen sollten angezeigt werden
   - ✅ Theme color: #4F46E5
   - ✅ Display: standalone

**Was bedeutet das?**
- Wenn alles grün ist → Manifest ist korrekt
- Falls Fehler: Prüfe Browser-Konsole auf Fehlermeldungen

---

### 🔌 Install-Prompt testen

**Automatisch:**

1. Öffne `http://localhost:3000`
2. Warte 2-3 Sekunden
3. Rechts unten sollte ein **Install-Prompt** erscheinen:
   - "FuerstFlow installieren"
   - Button "Installieren" und "Später"

**Manuell triggern:**

1. DevTools → **"Application"** → **"Service Workers"**
2. Klicke **"Update"** (falls verfügbar)
3. Schließe den Tab komplett
4. Öffne `http://localhost:3000` erneut
5. Install-Prompt sollte erscheinen

**Chrome/Edge Adressleiste:**

- Rechts in der Adressleiste sollte ein **Install-Icon** (➕) erscheinen
- Klicke darauf → "Installieren"

---

### 📴 Offline-Modus testen

**Schritt 1: Service Worker aktivieren**

1. Öffne `http://localhost:3000`
2. Warte bis Service Worker registriert ist (siehe DevTools)

**Schritt 2: Offline schalten**

1. DevTools öffnen (F12)
2. Tab **"Network"** (Netzwerk)
3. Oben rechts: **"Offline"** aktivieren ✅
4. Oder: DevTools → **"Application"** → **"Service Workers"** → **"Offline"** Checkbox

**Schritt 3: Testen**

1. Lade die Seite neu (F5 oder Cmd+R)
2. Die App sollte **weiterhin funktionieren** (aus Cache)
3. Du solltest die Startseite sehen können
4. API-Calls werden aus Cache geladen (falls gecacht)

**Schritt 4: Wieder online**

1. DevTools → **"Network"** → **"Offline"** deaktivieren
2. Seite neu laden
3. Alles sollte wieder normal funktionieren

---

### 🎨 Icons prüfen

**Im Browser:**

1. Öffne `http://localhost:3000`
2. Rechtsklick auf Tab → **"Seite neu laden"**
3. Tab-Icon sollte das FuerstFlow-Logo zeigen

**In DevTools:**

1. DevTools → **"Application"** → **"Manifest"**
2. Scroll zu **"Icons"**
3. Klicke auf jedes Icon → sollte sich öffnen
4. Prüfe: Alle Icons sollten das neue Logo zeigen

**Installierte PWA:**

1. Installiere die PWA (siehe Install-Prompt)
2. Öffne die installierte App
3. App-Icon sollte das FuerstFlow-Logo zeigen

---

### 📱 Mobile Testen (lokal)

**Option 1: Chrome DevTools Mobile Emulation**

1. DevTools öffnen (F12)
2. Klicke auf **Device Toolbar** (📱 Icon) oder `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows)
3. Wähle ein Gerät (z.B. "iPhone 12 Pro")
4. Teste:
   - Install-Prompt sollte erscheinen
   - Icons sollten korrekt angezeigt werden
   - Touch-Gesten sollten funktionieren

**Option 2: Auf echtem Gerät (gleiches Netzwerk)**

1. Finde deine lokale IP-Adresse:
   ```bash
   # Mac/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Oder:
   ipconfig getifaddr en0
   ```

2. Starte Next.js mit IP-Adresse:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```

3. Auf dem Handy:
   - Öffne Browser
   - Gehe zu: `http://[DEINE-IP]:3000`
   - Beispiel: `http://192.168.1.100:3000`

4. Teste PWA-Installation:
   - **iOS Safari**: Teilen → "Zum Home-Bildschirm"
   - **Android Chrome**: Menü → "App installieren"

---

## 🔍 Troubleshooting

### Service Worker registriert sich nicht

**Problem:** Service Worker erscheint nicht in DevTools

**Lösung:**

1. DevTools → **"Application"** → **"Service Workers"**
2. Klicke **"Unregister"** bei allen alten Service Workern
3. Leere Browser-Cache:
   - DevTools → **"Application"** → **"Storage"**
   - Klicke **"Clear site data"**
4. Schließe alle Tabs der App
5. Öffne `http://localhost:3000` neu
6. Prüfe Browser-Konsole auf Fehler

**Prüfe auch:**

- Ist `sw.js` unter `/public/sw.js` vorhanden?
- Öffne `http://localhost:3000/sw.js` direkt → sollte JavaScript-Code zeigen
- Prüfe Browser-Konsole auf Fehlermeldungen

---

### Install-Prompt erscheint nicht

**Problem:** Kein Install-Button sichtbar

**Lösung:**

1. **Prüfe Manifest:**
   - DevTools → **"Application"** → **"Manifest"**
   - Sollte keine Fehler zeigen

2. **Prüfe Service Worker:**
   - DevTools → **"Application"** → **"Service Workers"**
   - Sollte aktiviert sein

3. **Manuell triggern:**
   - Chrome: Adressleiste → Install-Icon (➕)
   - Edge: Menü → "App installieren"

4. **Browser-Kompatibilität:**
   - Chrome/Edge: ✅ Funktioniert
   - Firefox: ⚠️ Eingeschränkt
   - Safari: ⚠️ Nur auf iOS

---

### Icons werden nicht angezeigt

**Problem:** Tab zeigt kein Icon oder Standard-Icon

**Lösung:**

1. **Prüfe ob Icons existieren:**
   ```bash
   ls -la public/icons/
   ls -la public/apple-touch-icon.png
   ```

2. **Prüfe Browser-Cache:
   - Hard Reload: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
   - Oder: DevTools → Network → "Disable cache" aktivieren

3. **Prüfe Pfade:**
   - Öffne `http://localhost:3000/icons/icon-192.png` direkt
   - Sollte das Icon zeigen

---

### Offline-Modus funktioniert nicht

**Problem:** App lädt nicht im Offline-Modus

**Lösung:**

1. **Service Worker muss aktiviert sein:**
   - DevTools → **"Application"** → **"Service Workers"**
   - Status sollte "activated" sein

2. **Cache prüfen:**
   - DevTools → **"Application"** → **"Cache Storage"**
   - Sollte Caches zeigen (fuerstflow-static-v1, fuerstflow-dynamic-v1)

3. **Seite neu laden:**
   - Nach Aktivierung des Service Workers: Seite neu laden
   - Dann erst Offline schalten

---

## ✅ Checkliste für erfolgreiches PWA-Testen

- [ ] Development Server läuft (`npm run dev`)
- [ ] App öffnet auf `http://localhost:3000`
- [ ] Service Worker ist registriert (DevTools → Application → Service Workers)
- [ ] Manifest zeigt keine Fehler (DevTools → Application → Manifest)
- [ ] Alle Icons sind sichtbar (DevTools → Application → Manifest → Icons)
- [ ] Install-Prompt erscheint (oder Install-Icon in Adressleiste)
- [ ] Offline-Modus funktioniert (Network → Offline → Seite neu laden)
- [ ] Tab-Icon zeigt das Logo
- [ ] Installierte PWA zeigt korrektes Icon

---

## 🎯 Nächste Schritte nach lokalem Test

Wenn alles lokal funktioniert:

1. **Commit & Push:**
   ```bash
   git add .
   git commit -m "feat: PWA Setup mit neuem Logo"
   git push
   ```

2. **Vercel Deployment:**
   - Vercel erkennt automatisch PWA-Features
   - HTTPS wird automatisch bereitgestellt
   - PWA sollte sofort funktionieren

3. **Auf Vercel testen:**
   - Öffne die deployed URL
   - Teste alle PWA-Features erneut
   - Install-Prompt sollte automatisch erscheinen

---

## 💡 Wichtige Hinweise

- **localhost funktioniert:** Service Workers funktionieren auch auf `localhost` ohne HTTPS
- **HTTPS erforderlich:** Für echte Produktion (Vercel) ist HTTPS automatisch vorhanden
- **Browser-Cache:** Leere Cache wenn Änderungen nicht sichtbar werden
- **Service Worker Updates:** Änderungen am Service Worker erfordern manuelles Update in DevTools

