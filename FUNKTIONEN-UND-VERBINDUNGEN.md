# 🔗 FuerstFlow - Alle Funktionen und Verbindungen

## 📊 Übersicht: Was ist implementiert?

### ✅ Vollständig implementierte Module

1. **Authentifizierung & Benutzerverwaltung**
2. **Multi-Tenant System**
3. **Kundenverwaltung (CRM)**
4. **Mitarbeiterverwaltung**
5. **Terminverwaltung**
6. **Kalender**
7. **Aufgabenverwaltung**
8. **Finanzverwaltung**
9. **Inventarverwaltung**
10. **Chat-System**
11. **Berichte & Statistiken**
12. **Admin-Funktionen**
13. **PWA-Funktionalität**

---

## 🔐 1. Authentifizierung & Benutzerverwaltung

### Implementierte Funktionen:
- ✅ **Registrierung** (`/api/auth/register`)
- ✅ **Login** (NextAuth v5)
- ✅ **Session-Management**
- ✅ **Passwort-Hashing** (bcryptjs)
- ✅ **Einladungssystem** (`/api/invitations/*`)
- ✅ **Einladungs-Validierung** (`/api/invitations/validate`)
- ✅ **Onboarding** (`/api/onboarding/*`)

### Verbindungen:
```
Registrierung → Erstellt Shop (Tenant) → Erstellt User als ADMIN
Einladung → Erstellt Invitation Token → Mitarbeiter registriert sich → Wird MITARBEITER
Login → NextAuth Session → Tenant-ID wird gespeichert → Alle API-Calls filtern nach Tenant
```

### API-Endpunkte:
- `POST /api/auth/register` - Neue Registrierung
- `POST /api/auth/[...nextauth]` - NextAuth Handler
- `GET /api/invitations` - Alle Einladungen
- `POST /api/invitations/create` - Neue Einladung erstellen
- `GET /api/invitations/validate` - Einladung validieren
- `GET /api/invitations/[id]` - Einzelne Einladung
- `POST /api/onboarding/complete` - Onboarding abschließen
- `GET /api/onboarding/validate` - Onboarding validieren

---

## 🏢 2. Multi-Tenant System

### Implementierte Funktionen:
- ✅ **Automatische Tenant-Isolation** (auf allen API-Ebenen)
- ✅ **Tenant-Filterung** in allen Datenbankabfragen
- ✅ **Rollenbasierte Zugriffskontrolle** (ADMIN/MITARBEITER)

### Verbindungen:
```
Jeder API-Call → Prüft Session → Holt tenantId → Filtert Daten nach tenantId
Admin → Sieht alle Daten des Tenants
Mitarbeiter → Sieht nur eigene Daten (Termine, Aufgaben)
```

### Wie es funktioniert:
- Jede API-Route prüft `session.user.tenantId`
- Alle Datenbankabfragen filtern mit `where: { tenantId: session.user.tenantId }`
- Mitarbeiter sehen nur eigene Termine/Aufgaben

---

## 👥 3. Kundenverwaltung (CRM)

### Implementierte Funktionen:
- ✅ **Kunden erstellen** (`/api/customers` POST)
- ✅ **Kunden auflisten** mit Filter/Suche (`/api/customers` GET)
- ✅ **Kunden bearbeiten** (`/api/customers/[id]` PUT)
- ✅ **Kunden archivieren** (`/api/customers/[id]` DELETE)
- ✅ **Kunden-Detailansicht** (`/api/customers/[id]` GET)
- ✅ **Tags** (VIP, Problemkunde, No-Show, etc.)
- ✅ **Suche** nach Name, Email, Telefon
- ✅ **Filter** nach Tags, Archivierung
- ✅ **Sortierung** nach Name, Datum, Terminanzahl

### Verbindungen:
```
Kunde → Hat mehrere Termine (Appointment)
Kunde → Wird in Termin-Erstellung ausgewählt
Kunde → Erscheint in Umsatz-Statistiken
Kunde → Wird im Kalender gefiltert
```

### API-Endpunkte:
- `GET /api/customers` - Alle Kunden (mit Filter/Suche)
- `POST /api/customers` - Neuen Kunden erstellen
- `GET /api/customers/[id]` - Kunden-Details
- `PUT /api/customers/[id]` - Kunden bearbeiten
- `DELETE /api/customers/[id]` - Kunden archivieren

### Frontend-Seiten:
- `/dashboard/customers` - Kunden-Liste
- `/dashboard/customers/new` - Neuer Kunde
- `/dashboard/customers/[id]` - Kunden-Details

---

## 👔 4. Mitarbeiterverwaltung

### Implementierte Funktionen:
- ✅ **Mitarbeiter erstellen** (`/api/employees` POST)
- ✅ **Mitarbeiter auflisten** (`/api/employees` GET)
- ✅ **Mitarbeiter bearbeiten** (`/api/employees/[id]` PUT)
- ✅ **Mitarbeiter deaktivieren** (`/api/employees/[id]` DELETE)
- ✅ **Mitarbeiter-Details** (`/api/employees/[id]` GET)
- ✅ **Arbeitszeiten** pro Wochentag konfigurieren
- ✅ **Verfügbarkeitsprüfung** (`/api/employees/check-availability`)
- ✅ **Verfügbarkeitskalender** (`/api/employees/availability-calendar`)
- ✅ **Krankheitsstatus** (`/api/employees/sick`)
- ✅ **Urlaubsanträge** (`/api/employees/vacation/*`)
- ✅ **Zeiterfassung** (`/api/employees/times`)
- ✅ **Profil-Verwaltung** (`/api/employees/profile/*`)
- ✅ **Avatar-Upload** (`/api/employees/profile/avatar`)
- ✅ **Passwort zurücksetzen** (`/api/employees/[id]/password`)

### Verbindungen:
```
Mitarbeiter → Hat mehrere Termine (Appointment)
Mitarbeiter → Hat Arbeitszeiten → Wird bei Termin-Erstellung geprüft
Mitarbeiter → Kann krank sein → Termine werden als NEEDS_REASSIGNMENT markiert
Mitarbeiter → Hat Urlaubsanträge → Admin kann genehmigen/ablehnen
Mitarbeiter → Hat Zeiterfassung → Wird im Profil angezeigt
Mitarbeiter → Wird in Termin-Erstellung ausgewählt
Mitarbeiter → Erscheint in Umsatz-Statistiken
Mitarbeiter → Wird im Kalender gefiltert
Mitarbeiter → Kann Aufgaben zugewiesen bekommen
Mitarbeiter → Kann Ausgaben zugeordnet werden
```

### API-Endpunkte:
- `GET /api/employees` - Alle Mitarbeiter
- `POST /api/employees` - Neuen Mitarbeiter erstellen
- `GET /api/employees/[id]` - Mitarbeiter-Details
- `PUT /api/employees/[id]` - Mitarbeiter bearbeiten
- `DELETE /api/employees/[id]` - Mitarbeiter deaktivieren
- `POST /api/employees/check-availability` - Verfügbarkeit prüfen
- `GET /api/employees/availability-calendar` - Verfügbarkeitskalender
- `POST /api/employees/sick` - Krankheitsstatus setzen
- `POST /api/employees/vacation/request` - Urlaubsantrag erstellen
- `GET /api/employees/vacation/list` - Urlaubsanträge auflisten
- `POST /api/employees/vacation/approve` - Urlaubsantrag genehmigen/ablehnen
- `GET /api/employees/times` - Zeiterfassung
- `GET /api/employees/profile` - Profil abrufen
- `PUT /api/employees/profile` - Profil aktualisieren
- `POST /api/employees/profile/avatar` - Avatar hochladen
- `PUT /api/employees/[id]/password` - Passwort zurücksetzen
- `POST /api/employees/invite` - Mitarbeiter einladen

### Frontend-Seiten:
- `/dashboard/employees` - Mitarbeiter-Liste
- `/dashboard/employees/new` - Neuer Mitarbeiter
- `/dashboard/employees/[id]` - Mitarbeiter-Details

---

## 📅 5. Terminverwaltung

### Implementierte Funktionen:
- ✅ **Termin erstellen** (`/api/appointments` POST)
- ✅ **Termine auflisten** mit Filter (`/api/appointments` GET)
- ✅ **Termin bearbeiten** (`/api/appointments/[id]` PUT)
- ✅ **Termin löschen** (`/api/appointments/[id]` DELETE)
- ✅ **Termin-Details** (`/api/appointments/[id]` GET)
- ✅ **Termin-Neuverteilung** (`/api/appointments/[id]/reassign`)
- ✅ **Verfügbarkeitsprüfung** bei Erstellung
- ✅ **Admin Override** für Termine außerhalb der Arbeitszeit
- ✅ **Zeitzonen-Korrektur** (lokale Zeit ↔ UTC)
- ✅ **6 Status-Typen** (OPEN, ACCEPTED, CANCELLED, RESCHEDULED, COMPLETED, NEEDS_REASSIGNMENT)
- ✅ **Preis/Umsatz** pro Termin

### Verbindungen:
```
Termin → Gehört zu einem Kunden (Customer) - optional
Termin → Gehört zu einem Mitarbeiter (Employee) - optional
Termin → Wird im Kalender angezeigt
Termin → Wird in Umsatz-Statistiken gezählt
Termin → Kann neu zugewiesen werden (bei Krankheit)
Termin → Prüft Mitarbeiter-Verfügbarkeit vor Erstellung
Termin → Preis wird zu Umsatz hinzugezählt
```

### API-Endpunkte:
- `GET /api/appointments` - Alle Termine (mit Filter)
- `POST /api/appointments` - Neuen Termin erstellen
- `GET /api/appointments/[id]` - Termin-Details
- `PUT /api/appointments/[id]` - Termin bearbeiten
- `DELETE /api/appointments/[id]` - Termin löschen
- `POST /api/appointments/[id]/reassign` - Termin neu zuweisen

### Frontend-Seiten:
- `/dashboard/appointments` - Termin-Liste
- `/dashboard/appointments/new` - Neuer Termin
- `/dashboard/appointments/[id]` - Termin-Details

---

## 📆 6. Kalender

### Implementierte Funktionen:
- ✅ **Tag-Ansicht** (0-23 Uhr Stundenraster)
- ✅ **Wochen-Ansicht** (7-Tage-Übersicht)
- ✅ **Monats-Ansicht** (Vollständiger Monatskalender)
- ✅ **Filter** nach Mitarbeiter, Kunde, Status, Zeitraum
- ✅ **Termin-Details** per Klick
- ✅ **Termin-Farben** nach Status oder Mitarbeiter
- ✅ **Schnellnavigation** (Heute, Vorherige/Nächste Periode)
- ✅ **Datumsauswahl** für Tag/Woche/Monat

### Verbindungen:
```
Kalender → Lädt Termine von /api/appointments
Kalender → Filtert nach Mitarbeiter (Employee)
Kalender → Filtert nach Kunde (Customer)
Kalender → Filtert nach Status
Kalender → Zeigt Termin-Details an
Kalender → Navigiert zu Termin-Detailseite
```

### Frontend-Seiten:
- `/dashboard/calendar` - Kalender-Hauptseite

---

## ✅ 7. Aufgabenverwaltung

### Implementierte Funktionen:
- ✅ **Aufgabe erstellen** (`/api/tasks` POST)
- ✅ **Aufgaben auflisten** (`/api/tasks` GET)
- ✅ **Aufgabe bearbeiten** (`/api/tasks/[id]` PUT)
- ✅ **Aufgabe löschen** (`/api/tasks/[id]` DELETE)
- ✅ **Aufgabe-Details** (`/api/tasks/[id]` GET)
- ✅ **Kommentare hinzufügen** (`/api/tasks/[id]/comments` POST)
- ✅ **Kommentare auflisten** (`/api/tasks/[id]/comments` GET)
- ✅ **4 Status-Typen** (TODO, IN_PROGRESS, DONE, CANCELLED)
- ✅ **4 Prioritäten** (LOW, MEDIUM, HIGH, URGENT)
- ✅ **Fälligkeitsdatum** mit Überfällig-Warnung

### Verbindungen:
```
Aufgabe → Wird einem Mitarbeiter zugewiesen (User)
Aufgabe → Hat mehrere Kommentare (TaskComment)
Aufgabe → Kommentare werden von Usern erstellt
Aufgabe → Erscheint im Dashboard (KPIs)
Aufgabe → Mitarbeiter sieht nur eigene Aufgaben
```

### API-Endpunkte:
- `GET /api/tasks` - Alle Aufgaben
- `POST /api/tasks` - Neue Aufgabe erstellen
- `GET /api/tasks/[id]` - Aufgabe-Details
- `PUT /api/tasks/[id]` - Aufgabe bearbeiten
- `DELETE /api/tasks/[id]` - Aufgabe löschen
- `GET /api/tasks/[id]/comments` - Kommentare auflisten
- `POST /api/tasks/[id]/comments` - Kommentar hinzufügen

### Frontend-Seiten:
- `/dashboard/tasks` - Aufgaben-Liste
- `/dashboard/tasks/new` - Neue Aufgabe
- `/dashboard/tasks/[id]` - Aufgabe-Details

---

## 💰 8. Finanzverwaltung

### Implementierte Funktionen:

#### Ausgaben:
- ✅ **Ausgabe erstellen** (`/api/expenses` POST)
- ✅ **Ausgaben auflisten** (`/api/expenses` GET)
- ✅ **Ausgabe bearbeiten** (`/api/expenses/[id]` PUT)
- ✅ **Ausgabe löschen** (`/api/expenses/[id]` DELETE)
- ✅ **7 Kategorien** (GEHALT, MIETE, MARKETING, MATERIAL, VERSICHERUNG, STEUERN, SONSTIGES)
- ✅ **Mitarbeiter-Zuordnung** (optional)
- ✅ **Rechnung/Dokument-URL** (optional)

#### Daueraufträge:
- ✅ **Dauerauftrag erstellen** (`/api/recurring-expenses` POST)
- ✅ **Daueraufträge auflisten** (`/api/recurring-expenses` GET)
- ✅ **Dauerauftrag bearbeiten** (`/api/recurring-expenses/[id]` PUT)
- ✅ **Dauerauftrag löschen** (`/api/recurring-expenses/[id]` DELETE)
- ✅ **4 Intervalle** (DAILY, WEEKLY, MONTHLY, YEARLY)
- ✅ **Automatische Generierung** via Cron-Job (`/api/cron/recurring-expenses`)
- ✅ **Gehalts-Ausgaben generieren** (`/api/expenses/generate-salary`)

#### Umsatz:
- ✅ **Umsatz pro Termin** erfassen
- ✅ **Umsatz-Statistiken** (`/api/revenue`, `/api/stats/revenue`)
- ✅ **Finanz-Statistiken** (`/api/finance/stats`)
- ✅ **Zeitreihen-Daten** (`/api/finances/timeseries`)

### Verbindungen:
```
Ausgabe → Kann einem Mitarbeiter zugeordnet sein (Employee)
Ausgabe → Kann aus Dauerauftrag generiert sein (RecurringExpense)
Dauerauftrag → Generiert automatisch Ausgaben (via Cron-Job)
Dauerauftrag → Kann für Gehälter verwendet werden (Employee)
Termin → Hat Preis → Wird zu Umsatz gezählt
Umsatz → Wird in Statistiken angezeigt
Ausgaben → Werden in Finanz-Dashboard angezeigt
```

### API-Endpunkte:
- `GET /api/expenses` - Alle Ausgaben
- `POST /api/expenses` - Neue Ausgabe erstellen
- `GET /api/expenses/[id]` - Ausgabe-Details
- `PUT /api/expenses/[id]` - Ausgabe bearbeiten
- `DELETE /api/expenses/[id]` - Ausgabe löschen
- `POST /api/expenses/generate-auto` - Ausgaben automatisch generieren
- `POST /api/expenses/generate-salary` - Gehalts-Ausgaben generieren
- `GET /api/recurring-expenses` - Alle Daueraufträge
- `POST /api/recurring-expenses` - Neuen Dauerauftrag erstellen
- `GET /api/recurring-expenses/[id]` - Dauerauftrag-Details
- `PUT /api/recurring-expenses/[id]` - Dauerauftrag bearbeiten
- `DELETE /api/recurring-expenses/[id]` - Dauerauftrag löschen
- `GET /api/revenue` - Umsatz-Statistiken
- `GET /api/stats/revenue` - Umsatz-Statistiken (alternativ)
- `GET /api/finance/stats` - Finanz-Statistiken
- `GET /api/finances/timeseries` - Zeitreihen-Daten

### Frontend-Seiten:
- `/dashboard/expenses` - Ausgaben-Liste
- `/dashboard/expenses/new` - Neue Ausgabe
- `/dashboard/expenses/[id]/edit` - Ausgabe bearbeiten
- `/dashboard/finance` - Finanz-Dashboard
- `/dashboard/revenue` - Umsatz-Dashboard
- `/dashboard/recurring-expenses` - Daueraufträge

---

## 📦 9. Inventarverwaltung

### Implementierte Funktionen:
- ✅ **Artikel erstellen** (`/api/inventory` POST)
- ✅ **Artikel auflisten** (`/api/inventory` GET)
- ✅ **Artikel bearbeiten** (`/api/inventory/[id]` PUT)
- ✅ **Artikel löschen** (`/api/inventory/[id]` DELETE)
- ✅ **Bestand aktualisieren**
- ✅ **Mindestbestand** (Threshold)
- ✅ **Niedrigbestand-Warnung**
- ✅ **Kategorien**
- ✅ **Preis pro Einheit**
- ✅ **Link zum Produkt** (optional)
- ✅ **Hersteller** (optional)

### Verbindungen:
```
Inventar → Wird im Dashboard angezeigt (niedrige Bestände)
Inventar → Wird in Statistiken gezählt
```

### API-Endpunkte:
- `GET /api/inventory` - Alle Artikel
- `POST /api/inventory` - Neuen Artikel erstellen
- `GET /api/inventory/[id]` - Artikel-Details
- `PUT /api/inventory/[id]` - Artikel bearbeiten
- `DELETE /api/inventory/[id]` - Artikel löschen

### Frontend-Seiten:
- `/dashboard/inventory` - Inventar-Liste
- `/dashboard/inventory/new` - Neuer Artikel
- `/dashboard/inventory/[id]/edit` - Artikel bearbeiten

---

## 💬 10. Chat-System

### Implementierte Funktionen:
- ✅ **Einzelchat** (1:1 Nachrichten)
- ✅ **Gruppenchat** (Channel-basiert)
- ✅ **Channel erstellen** (`/api/chat/channels` POST)
- ✅ **Channels auflisten** (`/api/chat/channels` GET)
- ✅ **Channel bearbeiten** (`/api/chat/channels/[id]` PUT)
- ✅ **Channel löschen** (`/api/chat/channels/[id]` DELETE)
- ✅ **Channel-Mitglieder** (`/api/chat/channels/[id]/members`)
- ✅ **Nachrichten senden** (`/api/chat/send`)
- ✅ **Nachrichten abrufen** (`/api/chat/messages`)
- ✅ **Nachrichten löschen** (`/api/chat/messages/[id]` DELETE)
- ✅ **Read/Unread Status**
- ✅ **Chat-Benutzerliste** (`/api/chat/users`)

### Verbindungen:
```
Nachricht → Wird von User gesendet (senderId)
Nachricht → Geht an User (receiverId) oder Channel (channelId)
Channel → Hat mehrere Mitglieder (ChannelMember)
Channel → Hat mehrere Nachrichten (Message)
User → Kann Mitglied mehrerer Channels sein
```

### API-Endpunkte:
- `GET /api/chat/channels` - Alle Channels
- `POST /api/chat/channels` - Neuen Channel erstellen
- `GET /api/chat/channels/[id]` - Channel-Details
- `PUT /api/chat/channels/[id]` - Channel bearbeiten
- `DELETE /api/chat/channels/[id]` - Channel löschen
- `GET /api/chat/channels/[id]/members` - Channel-Mitglieder
- `POST /api/chat/channels/[id]/members` - Mitglied hinzufügen
- `GET /api/chat/messages` - Nachrichten abrufen
- `POST /api/chat/send` - Nachricht senden
- `GET /api/chat/messages/[id]` - Nachricht-Details
- `DELETE /api/chat/messages/[id]` - Nachricht löschen
- `GET /api/chat/users` - Chat-Benutzerliste
- `GET /api/chat/private` - Private Nachrichten
- `GET /api/chat/members` - Channel-Mitglieder

### Frontend-Seiten:
- `/dashboard/chat` - Chat-Hauptseite

---

## 📊 11. Berichte & Statistiken

### Implementierte Funktionen:
- ✅ **Tägliche Berichte** (`/api/reports/daily`)
- ✅ **Automatische Berichte** via Cron-Job (`/api/cron/daily-report`)
- ✅ **Dashboard-KPIs** (Heutige Termine, Diese Woche, Offene Aufgaben, Gesamtumsatz)
- ✅ **Umsatz-Statistiken** (`/api/stats/revenue`)
- ✅ **Mitarbeiter-Statistiken** (`/api/stats/employee`)
- ✅ **Finanz-Statistiken** (`/api/finance/stats`)

### Verbindungen:
```
Täglicher Bericht → Sammelt Daten aus:
  - Termine (Appointments)
  - Ausgaben (Expenses)
  - Umsatz (Revenue)
  - Mitarbeiter-Status (Employees)
  - Kunden-Statistiken (Customers)

Statistiken → Werden aus verschiedenen Modulen berechnet:
  - Umsatz aus Terminen
  - Ausgaben aus Expenses
  - Mitarbeiter-Leistung aus Terminen
```

### API-Endpunkte:
- `GET /api/reports/daily` - Täglicher Bericht
- `GET /api/stats/revenue` - Umsatz-Statistiken
- `GET /api/stats/employee` - Mitarbeiter-Statistiken
- `GET /api/finance/stats` - Finanz-Statistiken

### Frontend-Seiten:
- `/dashboard/reports` - Berichte-Seite
- `/dashboard` - Dashboard mit KPIs

---

## 👨‍💼 12. Admin-Funktionen

### Implementierte Funktionen:
- ✅ **Termin-Neuverteilung** (`/api/admin/reassignments`, `/api/appointments/[id]/reassign`)
- ✅ **Bulk-Neuverteilung** mehrerer Termine
- ✅ **Urlaubsanträge genehmigen/ablehnen** (`/api/employees/vacation/approve`)
- ✅ **Alle Daten sehen** (im Gegensatz zu Mitarbeitern)
- ✅ **Mitarbeiter verwalten**
- ✅ **Kunden verwalten**
- ✅ **Finanzen verwalten**
- ✅ **Inventar verwalten**
- ✅ **Chat-Channels verwalten**

### Verbindungen:
```
Admin → Kann alle Termine sehen (nicht nur eigene)
Admin → Kann Termine neu zuweisen (bei Krankheit)
Admin → Kann Urlaubsanträge genehmigen
Admin → Kann alle Mitarbeiter verwalten
Admin → Kann alle Kunden verwalten
Admin → Kann alle Finanzen sehen
Admin → Kann alle Aufgaben sehen
```

### API-Endpunkte:
- `GET /api/admin/reassignments` - Neuverteilungen auflisten
- `POST /api/admin/reassignments` - Bulk-Neuverteilung

### Frontend-Seiten:
- `/dashboard/admin` - Admin-Dashboard
- `/dashboard/admin/reassignments` - Termin-Neuverteilung

---

## 📱 13. PWA-Funktionalität

### Implementierte Funktionen:
- ✅ **Manifest.json** (`/api/manifest`)
- ✅ **Service Worker** (`/public/sw.js`)
- ✅ **Install-Prompt**
- ✅ **Offline-Funktionalität**
- ✅ **App-Icons** (alle Größen)
- ✅ **Apple Touch Icon**

### Verbindungen:
```
PWA → Lädt alle Module offline-fähig
PWA → Cache-Strategie für Assets
PWA → Network-First für API-Calls
```

### API-Endpunkte:
- `GET /api/manifest` - PWA-Manifest

---

## 🔄 Datenfluss-Diagramm

```
┌─────────────────┐
│   Registrierung │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Shop (Tenant)  │
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│   User (ADMIN)  │                  │ User (MITARBEITER)│
└────────┬────────┘                  └────────┬──────────┘
         │                                     │
         ├─────────────────────────────────────┤
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│   Employee      │                  │   Employee      │
└────────┬────────┘                  └────────┬────────┘
         │                                     │
         │                                     │
         ├─────────────────────────────────────┤
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│   Customer      │                  │   Appointment   │
└────────┬────────┘                  └────────┬────────┘
         │                                     │
         └──────────────┬──────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │    Calendar     │
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   Statistics   │
              └─────────────────┘

┌─────────────────┐
│     Task        │──────────┐
└────────┬────────┘          │
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ TaskComment     │  │   User          │
└─────────────────┘  └─────────────────┘

┌─────────────────┐
│   Expense       │──────────┐
└────────┬────────┘          │
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│RecurringExpense │  │   Employee      │
└─────────────────┘  └─────────────────┘

┌─────────────────┐
│   Message       │──────────┐
└────────┬────────┘          │
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ ChatChannel     │  │   User          │
└─────────────────┘  └─────────────────┘
```

---

## 📋 Zusammenfassung: Alle Verbindungen

### Zentrale Entitäten:
1. **Shop (Tenant)** - Basis für alle Daten
2. **User** - Benutzer mit Rolle (ADMIN/MITARBEITER)
3. **Employee** - Verknüpfung User ↔ Shop

### Hauptmodule und ihre Verbindungen:

**Kunden (Customer)**
- → Hat Termine (Appointment)
- → Erscheint in Statistiken
- → Wird im Kalender gefiltert

**Mitarbeiter (Employee)**
- → Hat Termine (Appointment)
- → Hat Arbeitszeiten (für Verfügbarkeitsprüfung)
- → Hat Urlaubsanträge (VacationRequest)
- → Hat Ausgaben (Expense)
- → Hat Daueraufträge (RecurringExpense für Gehälter)
- → Hat Zeiterfassung
- → Kann Aufgaben zugewiesen bekommen (Task)
- → Kann Chat-Nachrichten senden/empfangen (Message)

**Termine (Appointment)**
- → Gehört zu Kunde (Customer) - optional
- → Gehört zu Mitarbeiter (Employee) - optional
- → Wird im Kalender angezeigt
- → Preis wird zu Umsatz gezählt
- → Kann neu zugewiesen werden

**Aufgaben (Task)**
- → Wird Mitarbeiter zugewiesen (User)
- → Hat Kommentare (TaskComment)
- → Erscheint im Dashboard

**Ausgaben (Expense)**
- → Kann Mitarbeiter zugeordnet sein (Employee)
- → Kann aus Dauerauftrag generiert sein (RecurringExpense)
- → Wird in Finanz-Statistiken gezählt

**Chat (Message/Channel)**
- → Nachrichten zwischen Usern
- → Channels mit mehreren Mitgliedern
- → Channel-Mitgliedschaften (ChannelMember)

**Inventar (InventoryItem)**
- → Standalone, wird in Dashboard angezeigt

---

## 🎯 Wichtige Verbindungen im Detail

### 1. Termin-Erstellung:
```
User wählt Kunde → User wählt Mitarbeiter → System prüft Verfügbarkeit
→ Wenn verfügbar: Termin wird erstellt
→ Wenn nicht verfügbar: Admin kann Override verwenden
```

### 2. Verfügbarkeitsprüfung:
```
Termin-Erstellung → Prüft Employee.workHours → Prüft Employee.isSick
→ Prüft Employee.vacationRequests → Prüft bestehende Termine
→ Gibt Verfügbarkeit zurück
```

### 3. Termin-Neuverteilung:
```
Mitarbeiter wird krank → Termine werden NEEDS_REASSIGNMENT
→ Admin sieht Termine in Neuverteilungs-Seite
→ Admin wählt neuen Mitarbeiter → Termine werden neu zugewiesen
```

### 4. Finanz-Flow:
```
Termin hat Preis → Wird zu Umsatz gezählt
Dauerauftrag → Generiert automatisch Ausgaben (via Cron)
Gehalts-Dauerauftrag → Generiert Gehalts-Ausgaben für Mitarbeiter
Ausgaben + Umsatz → Werden in Finanz-Dashboard angezeigt
```

### 5. Statistiken:
```
Täglicher Cron-Job → Sammelt Daten aus allen Modulen
→ Erstellt DailyReport → Wird in Reports angezeigt
Dashboard-KPIs → Lädt Daten live aus verschiedenen Modulen
```

---

## ✅ Status: Alle Funktionen sind implementiert und verbunden!

Die App ist vollständig funktionsfähig mit allen Modulen und deren Verbindungen.

