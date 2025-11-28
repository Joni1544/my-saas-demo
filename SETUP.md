# Setup-Anleitung

## Schritt-für-Schritt Einrichtung

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen einrichten

Erstelle eine `.env` Datei im Root-Verzeichnis:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generiere-ein-sicheres-secret"
NODE_ENV="development"
```

**Railway PostgreSQL Setup:**
1. Gehe zu [Railway](https://railway.app)
2. Erstelle ein neues Projekt
3. Füge eine PostgreSQL-Datenbank hinzu
4. Kopiere die `DATABASE_URL` aus den Umgebungsvariablen
5. Füge sie in deine `.env` Datei ein

**NEXTAUTH_SECRET generieren:**
```bash
openssl rand -base64 32
```

### 3. Datenbank initialisieren

```bash
# Prisma Client generieren
npm run db:generate

# Migration erstellen und ausführen
npm run db:migrate
```

Bei der ersten Migration wirst du nach einem Namen gefragt - verwende z.B. `init`.

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist jetzt unter [http://localhost:3000](http://localhost:3000) erreichbar.

### 5. Ersten Benutzer registrieren

1. Gehe zu `/register`
2. Fülle das Formular aus:
   - Firmenname (erstellt automatisch einen Tenant)
   - Dein Name
   - Email
   - Passwort (mindestens 8 Zeichen)
3. Nach erfolgreicher Registrierung wirst du automatisch als **Admin** erstellt
4. Melde dich mit deinen Credentials an

## Nützliche Befehle

```bash
# Prisma Studio öffnen (Datenbank-GUI)
npm run db:studio

# Neue Migration erstellen (nach Schema-Änderungen)
npm run db:migrate

# Prisma Client neu generieren
npm run db:generate
```

## Troubleshooting

### "Prisma Client not found"
```bash
npm run db:generate
```

### "DATABASE_URL not found"
- Überprüfe, ob die `.env` Datei im Root-Verzeichnis existiert
- Stelle sicher, dass `DATABASE_URL` korrekt gesetzt ist

### "Migration failed"
- Überprüfe die Datenbank-Verbindung
- Stelle sicher, dass die Datenbank erreichbar ist
- Prüfe die Railway-Datenbank-URL

### "NextAuth secret missing"
- Generiere ein neues Secret: `openssl rand -base64 32`
- Füge es zur `.env` Datei hinzu

