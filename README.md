# Multi-Tenant SaaS System

Ein vollständiges Multi-Tenant SaaS System für Terminverwaltung, Kundenmanagement und Geschäftsprozesse. Erstellt mit Next.js 15, PostgreSQL, Prisma und NextAuth v5.

## 🚀 Features

### ✅ Kundenverwaltung (CRM Lite)
- **Vollständige Kundenverwaltung** mit Name, Telefon, E-Mail, Adresse
- **Notizen** für jeden Kunden
- **Tags** (VIP, Problemkunde, No-Show, Neu, Stammkunde, Wichtig)
- **Historie**: Letzter Termin, Termin-Häufigkeit
- **Suche & Filter**: Nach Name, Email, Telefon, Tags
- **Sortierung**: Nach Name, Erstellungsdatum, Terminanzahl
- **Archivierung**: Kunden archivieren statt löschen

### ✅ Mitarbeiterverwaltung
- **Mitarbeiter anlegen** aus bestehenden Usern
- **Rollen**: Admin, Mitarbeiter
- **Arbeitszeiten** pro Wochentag konfigurierbar
- **Kalender-Farbe** für jeden Mitarbeiter
- **Aktiv/Inaktiv** Status
- **Mitarbeiter-Detail** mit allen Terminen

### ✅ Kalender (bis 2035)
- **Tag-Ansicht**: Stundenraster mit allen Terminen
- **Wochen-Ansicht**: 7-Tage-Übersicht mit Stundenraster
- **Monats-Ansicht**: Vollständiger Monatskalender
- **Filter**:
  - Nach Mitarbeiter
  - Nach Kunde
  - Nach Status
  - Nach Zeitraum
- **Termin-Details**: Klick auf Termin öffnet Detail-Modal

### ✅ Termin-System (Booking System)
- **Termin erstellen** mit allen Details
- **Termin bearbeiten** (Status, Zeit, Kunde, Mitarbeiter, Preis)
- **Termin löschen**
- **Terminstatus**:
  - Offen (OPEN)
  - Angenommen (ACCEPTED)
  - Storniert (CANCELLED)
  - Verschoben (RESCHEDULED)
  - Abgeschlossen (COMPLETED)
- **Termin-Notizen** für interne Informationen
- **Termin-Farbe** automatisch nach Status oder Mitarbeiter
- **Preis/Umsatz** pro Termin
- **Kunde → Termine** anzeigen
- **Mitarbeiter → Termine** anzeigen

### ✅ Umsatz- und Statistikseite
- **Perioden**: Tag, Woche, Monat, Jahr
- **Key Metrics**:
  - Gesamtumsatz
  - Anzahl Termine
  - Durchschnitt pro Termin
  - No-Shows
- **Aufschlüsselung**:
  - Umsatz pro Kunde
  - Umsatz pro Mitarbeiter
  - Top 10 Kunden
- **Wiederkehrende Kunden** (mehr als 1 Termin)
- **No-Shows** Tracking

### ✅ Aufgabenverwaltung (Tasks)
- **Aufgaben erstellen** mit Priorität und Fälligkeitsdatum
- **Mitarbeiter zuweisen**
- **Status**:
  - To-Do (TODO)
  - In Bearbeitung (IN_PROGRESS)
  - Erledigt (DONE)
  - Abgebrochen (CANCELLED)
- **Priorität**: Niedrig, Mittel, Hoch, Dringend
- **Fälligkeitsdatum** mit Überfällig-Warnung
- **Kommentare**: Vollständiges Kommentar-System für jede Aufgabe

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma 5
- **Authentication**: NextAuth v5 (JWT, Credentials)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Password Hashing**: bcryptjs

## 📋 Voraussetzungen

- Node.js 18+ 
- PostgreSQL Datenbank (z.B. Railway)
- npm oder yarn

## 🚀 Installation

### 1. Repository klonen

```bash
git clone <your-repo-url>
cd my-saas-demo
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Umgebungsvariablen einrichten

Erstelle eine `.env` Datei im Root-Verzeichnis:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"  # Development
# NEXTAUTH_URL="https://your-app.vercel.app"  # Production
NEXTAUTH_SECRET="your-secret-key-here"

# Node Environment
NODE_ENV="development"
```

**NEXTAUTH_SECRET generieren:**
```bash
openssl rand -base64 32
```

### 4. Datenbank initialisieren

```bash
# Prisma Client generieren
npm run db:generate

# Migration erstellen und ausführen
npm run db:migrate
```

Bei der ersten Migration wirst du nach einem Namen gefragt - verwende z.B. `init`.

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist jetzt unter [http://localhost:3000](http://localhost:3000) erreichbar.

## 📁 Projektstruktur

```
my-saas-demo/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts    # NextAuth Handler
│   │   │   └── register/route.ts         # Registrierungs-API
│   │   ├── customers/                    # Kunden-API
│   │   ├── employees/                    # Mitarbeiter-API
│   │   ├── appointments/                 # Termine-API
│   │   ├── tasks/                        # Aufgaben-API
│   │   ├── stats/revenue/                # Umsatz-Statistiken
│   │   └── users/                        # Users-API
│   ├── dashboard/
│   │   ├── calendar/                     # Kalender-Seite
│   │   ├── customers/                    # Kundenverwaltung
│   │   ├── employees/                    # Mitarbeiterverwaltung
│   │   ├── appointments/                # Termin-Verwaltung
│   │   ├── revenue/                      # Umsatz-Dashboard
│   │   ├── tasks/                        # Aufgabenverwaltung
│   │   ├── layout.tsx                    # Dashboard Layout
│   │   └── page.tsx                      # Dashboard Hauptseite
│   ├── login/
│   │   └── page.tsx                      # Login-Seite
│   ├── register/
│   │   └── page.tsx                      # Registrierungsseite
│   └── page.tsx                          # Startseite
├── components/
│   ├── Calendar.tsx                       # Kalender-Komponente
│   ├── DashboardStats.tsx                # Statistik-Karten
│   ├── QuickActions.tsx                  # Schnellzugriff
│   ├── UpcomingAppointments.tsx          # Nächste Termine
│   ├── Navbar.tsx                        # Navigationsleiste
│   └── Providers.tsx                     # Client-Side Providers
├── lib/
│   ├── auth.ts                           # NextAuth Konfiguration
│   └── prisma.ts                         # Prisma Client Singleton
├── prisma/
│   └── schema.prisma                     # Prisma Schema
├── types/
│   └── next-auth.d.ts                    # NextAuth Type Definitions
├── middleware.ts                          # Auth Middleware
└── .env                                   # Umgebungsvariablen
```

## 🔐 Authentifizierung

### Rollen

- **ADMIN**: 
  - Sieht alle Daten der Firma
  - Kann Mitarbeiter verwalten
  - Kann Umsatz-Statistiken sehen
  - Vollständiger Zugriff auf alle Features

- **MITARBEITER**:
  - Sieht nur eigene Termine
  - Sieht nur Kunden mit eigenen Terminen
  - Kann eigene Termine erstellen/bearbeiten
  - Eingeschränkter Zugriff

### Registrierung

Bei der Registrierung wird automatisch:
- Ein neuer User erstellt
- Ein neuer Shop (Tenant) erstellt
- Der User als **ADMIN** des Shops zugewiesen

## 📊 Datenbank-Schema

### Modelle

- **User**: Benutzer mit Rollen (ADMIN, MITARBEITER)
- **Shop**: Firma/Tenant mit eindeutiger tenantId
- **Customer**: Kunden mit Tags, Notizen, Historie
- **Employee**: Mitarbeiter mit Arbeitszeiten, Farbe, Status
- **Appointment**: Termine mit Status, Preis, Notizen, Farbe
- **Task**: Aufgaben mit Priorität, Fälligkeitsdatum
- **TaskComment**: Kommentare zu Aufgaben

## 🔌 API Endpunkte

### Authentication
- `POST /api/auth/register` - Neuen Benutzer und Shop registrieren
- `POST /api/auth/[...nextauth]` - NextAuth Handler

### Customers
- `GET /api/customers` - Alle Kunden (mit Filter, Suche, Tags)
- `POST /api/customers` - Neuen Kunden erstellen
- `GET /api/customers/[id]` - Einzelnen Kunden abrufen
- `PUT /api/customers/[id]` - Kunden aktualisieren
- `DELETE /api/customers/[id]` - Kunden archivieren

### Employees
- `GET /api/employees` - Alle Mitarbeiter
- `POST /api/employees` - Neuen Mitarbeiter erstellen
- `GET /api/employees/[id]` - Einzelnen Mitarbeiter abrufen
- `PUT /api/employees/[id]` - Mitarbeiter aktualisieren
- `DELETE /api/employees/[id]` - Mitarbeiter deaktivieren

### Appointments
- `GET /api/appointments` - Termine (mit Filter: customerId, status, employeeId, startDate, endDate)
- `POST /api/appointments` - Neuen Termin erstellen
- `GET /api/appointments/[id]` - Einzelnen Termin abrufen
- `PUT /api/appointments/[id]` - Termin aktualisieren
- `DELETE /api/appointments/[id]` - Termin löschen

### Tasks
- `GET /api/tasks` - Alle Aufgaben
- `POST /api/tasks` - Neue Aufgabe erstellen
- `GET /api/tasks/[id]` - Einzelne Aufgabe abrufen (mit Kommentaren)
- `PUT /api/tasks/[id]` - Aufgabe aktualisieren
- `DELETE /api/tasks/[id]` - Aufgabe löschen
- `GET /api/tasks/[id]/comments` - Kommentare einer Aufgabe
- `POST /api/tasks/[id]/comments` - Neuen Kommentar erstellen

### Statistics
- `GET /api/stats/revenue?period=day|week|month|year` - Umsatz-Statistiken

## 🚢 Deployment auf Vercel

### 1. Repository zu GitHub pushen

```bash
git add .
git commit -m "Initial commit"
git push
```

### 2. Vercel Projekt erstellen

1. Gehe zu [Vercel](https://vercel.com)
2. Importiere dein GitHub Repository
3. Wähle das Projekt aus

### 3. Umgebungsvariablen setzen

In Vercel Dashboard → Projekt → Settings → Environment Variables:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-app.vercel.app"
```

**WICHTIG**: `NEXTAUTH_URL` muss deine Vercel-Domain sein!

### 4. Build Settings

Vercel erkennt Next.js automatisch. Die Build-Command ist bereits in `package.json`:

```json
{
  "build": "prisma generate && next build"
}
```

### 5. Deployment

Nach dem Push wird automatisch deployed. Prüfe die Logs für:
- `AUTH OPTIONS LOADED`
- `🚀 NextAuth route handler loaded`
- Prisma Migration Status

## 📝 Nützliche Befehle

```bash
# Entwicklungsserver starten
npm run dev

# Production Build
npm run build

# Prisma Client generieren
npm run db:generate

# Migration erstellen
npm run db:migrate

# Prisma Studio öffnen (Datenbank-GUI)
npm run db:studio
```

## 🐛 Troubleshooting

### "Prisma Client not found"
```bash
npm run db:generate
```

### "DATABASE_URL not found"
- Überprüfe `.env` Datei
- Stelle sicher, dass `DATABASE_URL` korrekt gesetzt ist

### "NextAuth secret missing"
- Generiere ein neues Secret: `openssl rand -base64 32`
- Füge es zur `.env` Datei hinzu

### "Migration failed"
- Überprüfe die Datenbank-Verbindung
- Stelle sicher, dass die Datenbank erreichbar ist
- Prüfe die Railway-Datenbank-URL

### Login funktioniert nicht auf Vercel
- Prüfe ob `NEXTAUTH_URL` die Vercel-Domain ist (nicht localhost!)
- Prüfe ob `NEXTAUTH_SECRET` gesetzt ist
- Prüfe Vercel Logs für Debug-Messages

## 📄 Lizenz

Dieses Projekt ist für den privaten und kommerziellen Gebrauch freigegeben.

## 🙏 Support

Bei Fragen oder Problemen erstelle ein Issue im Repository.

---

**Erstellt mit ❤️ für Multi-Tenant SaaS Anwendungen**
