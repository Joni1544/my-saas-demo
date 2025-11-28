# Multi-Tenant SaaS System

Ein vollständiges Multi-Tenant SaaS Grundgerüst erstellt mit Next.js (App Router), PostgreSQL, Prisma und NextAuth.

## Features

- ✅ **Benutzer-Authentifizierung**: Login und Registrierung mit Email & Passwort
- ✅ **Rollen-System**: Admin und Mitarbeiter mit unterschiedlichen Berechtigungen
- ✅ **Multi-Tenant**: Jede Firma hat eine eindeutige tenantId
- ✅ **Datenfilterung**: 
  - Admin sieht alle Daten seiner Firma
  - Mitarbeiter sieht nur eigene Termine/Kunden
- ✅ **PostgreSQL + Prisma ORM**: Vollständige Datenbank-Integration
- ✅ **CRUD API Routes**: Für Kunden, Termine und Aufgaben
- ✅ **Dashboard**: Übersicht mit Statistiken (Kunden, Termine, Aufgaben)
- ✅ **Kalender**: Monatsansicht mit Tagesliste
- ✅ **Tailwind CSS**: Moderne UI-Komponenten
- ✅ **Auth Middleware**: Automatischer Schutz geschützter Routen

## Projektstruktur

```
my-saas-demo/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts    # NextAuth Handler
│   │   │   └── register/route.ts         # Registrierungs-API
│   │   ├── customers/
│   │   │   ├── route.ts                  # GET, POST Kunden
│   │   │   └── [id]/route.ts             # GET, PUT, DELETE einzelner Kunde
│   │   ├── appointments/
│   │   │   ├── route.ts                  # GET, POST Termine
│   │   │   └── [id]/route.ts             # GET, PUT, DELETE einzelner Termin
│   │   └── tasks/
│   │       ├── route.ts                  # GET, POST Aufgaben
│   │       └── [id]/route.ts             # GET, PUT, DELETE einzelne Aufgabe
│   ├── dashboard/
│   │   ├── layout.tsx                     # Dashboard Layout mit Navigation
│   │   └── page.tsx                       # Dashboard Hauptseite
│   ├── login/
│   │   └── page.tsx                       # Login-Seite
│   ├── register/
│   │   └── page.tsx                       # Registrierungsseite
│   ├── layout.tsx                         # Root Layout
│   └── page.tsx                           # Startseite
├── components/
│   ├── Calendar.tsx                       # Kalender-Komponente
│   ├── DashboardStats.tsx                 # Statistik-Karten
│   ├── Navbar.tsx                         # Navigationsleiste
│   └── Providers.tsx                      # Client-Side Providers
├── lib/
│   ├── auth.ts                            # NextAuth Konfiguration
│   └── prisma.ts                          # Prisma Client Singleton
├── prisma/
│   └── schema.prisma                      # Prisma Schema
├── types/
│   └── next-auth.d.ts                     # NextAuth Type Definitions
├── middleware.ts                           # Auth Middleware
└── .env                                    # Umgebungsvariablen (nicht im Git)
```

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Root-Verzeichnis:

```env
# Database
# Railway PostgreSQL Connection String
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# App
NODE_ENV="development"
```

**Wichtig**: 
- Ersetze `DATABASE_URL` mit deiner Railway PostgreSQL Verbindungs-URL
- Generiere einen sicheren `NEXTAUTH_SECRET` (z.B. mit `openssl rand -base64 32`)

### 3. Datenbank-Migrationen ausführen

```bash
# Prisma Client generieren
npx prisma generate

# Datenbank-Migration erstellen und ausführen
npx prisma migrate dev --name init
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung läuft dann auf [http://localhost:3000](http://localhost:3000)

## Datenbank-Schema

### Modelle

- **User**: Benutzer mit Rollen (ADMIN, MITARBEITER)
- **Shop**: Firma/Tenant mit eindeutiger tenantId
- **Customer**: Kunden, gehören zu einem Tenant
- **Employee**: Mitarbeiter-Verknüpfung (User <-> Shop)
- **Appointment**: Termine mit Kunden- und Mitarbeiter-Verknüpfung
- **Task**: Aufgaben für das Dashboard

### Beziehungen

- User → Shop (tenantId)
- Customer → Shop (tenantId)
- Employee → User + Shop
- Appointment → Shop + Customer + Employee

## API Endpunkte

### Authentication

- `POST /api/auth/register` - Neuen Benutzer und Shop registrieren
- `POST /api/auth/[...nextauth]` - NextAuth Handler (Login, Logout, Session)

### Customers

- `GET /api/customers` - Alle Kunden abrufen
- `POST /api/customers` - Neuen Kunden erstellen
- `GET /api/customers/[id]` - Einzelnen Kunden abrufen
- `PUT /api/customers/[id]` - Kunden aktualisieren
- `DELETE /api/customers/[id]` - Kunden löschen

### Appointments

- `GET /api/appointments?startDate=&endDate=` - Termine abrufen (mit optionalen Datumsfiltern)
- `POST /api/appointments` - Neuen Termin erstellen
- `GET /api/appointments/[id]` - Einzelnen Termin abrufen
- `PUT /api/appointments/[id]` - Termin aktualisieren
- `DELETE /api/appointments/[id]` - Termin löschen

### Tasks

- `GET /api/tasks` - Alle Aufgaben abrufen
- `POST /api/tasks` - Neue Aufgabe erstellen
- `GET /api/tasks/[id]` - Einzelne Aufgabe abrufen
- `PUT /api/tasks/[id]` - Aufgabe aktualisieren
- `DELETE /api/tasks/[id]` - Aufgabe löschen

## Berechtigungen

### Admin
- Sieht alle Kunden, Termine und Aufgaben seiner Firma
- Kann alle CRUD-Operationen durchführen

### Mitarbeiter
- Sieht nur eigene Termine (mit employeeId verknüpft)
- Sieht nur Kunden, mit denen er Termine hat
- Kann nur eigene Termine erstellen/bearbeiten/löschen

## Nächste Schritte

- [ ] Weitere Dashboard-Seiten (Kunden-Liste, Termin-Verwaltung, etc.)
- [ ] Formulare für CRUD-Operationen
- [ ] Benachrichtigungen/Toast-Messages
- [ ] Erweiterte Kalender-Funktionen (Wochenansicht, etc.)
- [ ] Suche und Filter
- [ ] Export-Funktionen
- [ ] E-Mail-Benachrichtigungen

## Technologien

- **Next.js 16** - React Framework mit App Router
- **TypeScript** - Type Safety
- **Prisma** - ORM für PostgreSQL
- **NextAuth.js** - Authentication
- **Tailwind CSS** - Styling
- **date-fns** - Datums-Formatierung

## Lizenz

MIT
