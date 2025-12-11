# 📋 FuerstFlow - Alle API-Operationen

## 📍 Wo finde ich die Operationen?

Alle API-Operationen befinden sich im Ordner: **`/app/api/`**

Die Services (Business-Logik) befinden sich im Ordner: **`/services/`**

---

## 🔐 Authentifizierung & Benutzer

**Ordner:** `/app/api/auth/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/auth/register` | POST | Neuen Benutzer und Shop registrieren |
| `/api/auth/[...nextauth]` | POST/GET | NextAuth Handler (Login, Logout, Session) |
| `/api/auth/validate` | GET | Session validieren |

**Services:**
- Keine speziellen Services (NextAuth übernimmt)

---

## 👥 Kundenverwaltung (CRM)

**Ordner:** `/app/api/customers/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/customers` | GET | Alle Kunden auflisten (mit Filter, Suche, Tags) |
| `/api/customers` | POST | Neuen Kunden erstellen |
| `/api/customers/[id]` | GET | Einzelnen Kunden abrufen |
| `/api/customers/[id]` | PUT | Kunden aktualisieren |
| `/api/customers/[id]` | DELETE | Kunden archivieren |
| `/api/customers/[id]/payments` | GET | Zahlungen eines Kunden abrufen |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 👨‍💼 Mitarbeiterverwaltung

**Ordner:** `/app/api/employees/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/employees` | GET | Alle Mitarbeiter auflisten |
| `/api/employees` | POST | Neuen Mitarbeiter erstellen |
| `/api/employees/[id]` | GET | Einzelnen Mitarbeiter abrufen |
| `/api/employees/[id]` | PUT | Mitarbeiter aktualisieren |
| `/api/employees/[id]/password` | PUT | Passwort ändern |
| `/api/employees/invite` | POST | Mitarbeiter einladen |
| `/api/employees/sick` | POST | Krankmeldung erstellen |
| `/api/employees/vacation/request` | POST | Urlaubsantrag erstellen |
| `/api/employees/vacation/list` | GET | Urlaubsanträge auflisten |
| `/api/employees/vacation/approve` | POST | Urlaubsantrag genehmigen/ablehnen |
| `/api/employees/profile` | GET/PUT | Mitarbeiter-Profil abrufen/aktualisieren |
| `/api/employees/profile/avatar` | POST | Avatar hochladen |
| `/api/employees/availability-calendar` | GET | Verfügbarkeitskalender abrufen |
| `/api/employees/check-availability` | POST | Verfügbarkeit prüfen |
| `/api/employees/times` | GET | Arbeitszeiten abrufen |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 📅 Terminverwaltung

**Ordner:** `/app/api/appointments/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/appointments` | GET | Alle Termine auflisten (gefiltert nach Tenant/Rolle) |
| `/api/appointments` | POST | Neuen Termin erstellen |
| `/api/appointments/[id]` | GET | Einzelnen Termin abrufen |
| `/api/appointments/[id]` | PUT | Termin aktualisieren |
| `/api/appointments/[id]` | DELETE | Termin löschen |
| `/api/appointments/[id]/reassign` | POST | Termin neu zuweisen |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## ✅ Aufgabenverwaltung

**Ordner:** `/app/api/tasks/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/tasks` | GET | Alle Aufgaben auflisten |
| `/api/tasks` | POST | Neue Aufgabe erstellen |
| `/api/tasks/[id]` | GET | Einzelne Aufgabe abrufen |
| `/api/tasks/[id]` | PUT | Aufgabe aktualisieren |
| `/api/tasks/[id]` | DELETE | Aufgabe löschen |
| `/api/tasks/[id]/comments` | GET | Kommentare einer Aufgabe abrufen |
| `/api/tasks/[id]/comments` | POST | Kommentar hinzufügen |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 💳 Zahlungen (Payment System)

**Ordner:** `/app/api/payments/`

### Basis-Operationen

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/payments/create` | POST | Zahlung erstellen |
| `/api/payments/list` | GET | Zahlungen auflisten (mit Filtern) |
| `/api/payments/[id]` | GET | Einzelne Zahlung abrufen |
| `/api/payments/mark-paid` | POST | Als bezahlt markieren |
| `/api/payments/mark-failed` | POST | Als fehlgeschlagen markieren |
| `/api/payments/link` | POST | Zahlung mit Rechnung verknüpfen |
| `/api/payments/search` | GET | Zahlungen durchsuchen |
| `/api/payments/stats` | GET | Zahlungsstatistiken |

### Stripe Integration

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/payments/stripe/intent` | POST | Payment Intent erstellen |
| `/api/payments/stripe/terminal` | POST | Terminal Payment erstellen |
| `/api/payments/webhook` | POST | Stripe Webhook-Verarbeitung |

### PayPal Integration

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/payments/paypal/create-order` | POST | PayPal Order erstellen |
| `/api/payments/paypal/webhook` | POST | PayPal Webhook-Verarbeitung |

### Legacy

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/payments/create-intent` | POST | Payment Intent erstellen (Legacy) |

**Services:**
- `/services/payment/PaymentService.ts` - Haupt-Payment-Service
- `/services/payment/BankMatchingService.ts` - Automatisches Matching von Banküberweisungen
- `/payments/stripe.ts` - Stripe SDK Integration
- `/payments/paypal.ts` - PayPal SDK Integration

---

## 🧾 Rechnungen (Invoices)

**Ordner:** `/app/api/invoices/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/invoices` | GET | Alle Rechnungen auflisten |
| `/api/invoices` | POST | Neue Rechnung erstellen |
| `/api/invoices/[id]` | GET | Einzelne Rechnung abrufen |
| `/api/invoices/[id]` | PUT | Rechnung aktualisieren |
| `/api/invoices/[id]/pdf` | GET | Rechnung als PDF generieren |
| `/api/invoices/reminders` | GET | Rechnungserinnerungen auflisten |
| `/api/invoices/reminders` | POST | Rechnungserinnerung erstellen |
| `/api/invoices/reminders/[id]` | GET/PUT/DELETE | Rechnungserinnerung verwalten |
| `/api/invoices/reminders/stats` | GET | Statistiken zu Erinnerungen |

**Services:**
- `/services/invoice/InvoiceService.ts` - Haupt-Invoice-Service
- `/services/invoice/InvoiceTemplateService.ts` - Rechnungsvorlagen
- `/services/invoice/ReminderService.ts` - Rechnungserinnerungen
- `/services/pdf/InvoicePdf.ts` - PDF-Generierung

---

## 📄 Rechnungsvorlagen

**Ordner:** `/app/api/invoice-templates/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/invoice-templates` | GET | Alle Vorlagen auflisten |
| `/api/invoice-templates` | POST | Neue Vorlage erstellen |
| `/api/invoice-templates/[id]` | GET | Einzelne Vorlage abrufen |
| `/api/invoice-templates/[id]` | PUT | Vorlage aktualisieren |
| `/api/invoice-templates/[id]` | DELETE | Vorlage löschen |

**Services:**
- `/services/invoice/InvoiceTemplateService.ts`

---

## 🤖 KI-Operationen (AI)

**Ordner:** `/app/api/ai/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/ai/invoice-text` | POST | Rechnungstext generieren |
| `/api/ai/invoice-draft` | POST | Rechnungsentwurf generieren |
| `/api/ai/daily-report` | POST | Tagesbericht generieren |
| `/api/ai/task-suggestions` | POST | Aufgaben-Vorschläge generieren |
| `/api/ai/reminder-text` | POST | Erinnerungstext generieren |

**Services:**
- `/services/ai/AiService.ts` - Haupt-KI-Service
- `/services/ai/AiAdapter.ts` - KI-Adapter (Dummy oder echte KI)
- `/services/ai/AiServiceWrapper.ts` - Service-Wrapper
- `/services/ai/AiAnalyst.ts` - KI-Analyst für Berichte
- `/services/ai/ReminderTextService.ts` - Erinnerungstext-Service

---

## 📊 KI-Nutzung & Billing

**Ordner:** `/app/api/ai-usage/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/ai-usage` | GET | KI-Nutzung auflisten |
| `/api/ai-usage/stats` | GET | KI-Nutzungsstatistiken |
| `/api/ai-usage/monthly` | GET | Monatliche KI-Nutzung |
| `/api/ai-usage/recalculate` | POST | KI-Nutzung neu berechnen |
| `/api/ai-usage/billing` | GET | Billing-Informationen |
| `/api/ai-usage/billing/current` | GET | Aktuelles Billing |

**Services:**
- `/services/ai/AiUsageService.ts` - KI-Nutzungs-Tracking
- `/services/ai/AiBillingService.ts` - KI-Billing-Service

---

## 💰 Finanzen

**Ordner:** `/app/api/expenses/`, `/app/api/recurring-expenses/`, `/app/api/revenue/`, `/app/api/finance/`

### Ausgaben

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/expenses` | GET | Alle Ausgaben auflisten |
| `/api/expenses` | POST | Neue Ausgabe erstellen |
| `/api/expenses/[id]` | GET | Einzelne Ausgabe abrufen |
| `/api/expenses/[id]` | PUT | Ausgabe aktualisieren |
| `/api/expenses/[id]` | DELETE | Ausgabe löschen |
| `/api/expenses/generate-salary` | POST | Gehalts-Ausgaben generieren |
| `/api/expenses/generate-auto` | POST | Automatische Ausgaben generieren |

### Daueraufträge

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/recurring-expenses` | GET | Alle Daueraufträge auflisten |
| `/api/recurring-expenses` | POST | Neuen Dauerauftrag erstellen |
| `/api/recurring-expenses/[id]` | GET | Einzelnen Dauerauftrag abrufen |
| `/api/recurring-expenses/[id]` | PUT | Dauerauftrag aktualisieren |
| `/api/recurring-expenses/[id]` | DELETE | Dauerauftrag löschen |

### Umsatz & Statistiken

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/revenue` | GET | Umsatz abrufen |
| `/api/finance/stats` | GET | Finanzstatistiken |
| `/api/finances/timeseries` | GET | Zeitreihen-Daten für Finanzen |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 📦 Inventar

**Ordner:** `/app/api/inventory/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/inventory` | GET | Alle Inventar-Items auflisten |
| `/api/inventory` | POST | Neues Item erstellen |
| `/api/inventory/[id]` | GET | Einzelnes Item abrufen |
| `/api/inventory/[id]` | PUT | Item aktualisieren |
| `/api/inventory/[id]` | DELETE | Item löschen |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 💬 Chat-System

**Ordner:** `/app/api/chat/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/chat/channels` | GET | Alle Channels auflisten |
| `/api/chat/channels` | POST | Neuen Channel erstellen |
| `/api/chat/channels/[id]` | GET | Einzelnen Channel abrufen |
| `/api/chat/channels/[id]` | PUT | Channel aktualisieren |
| `/api/chat/channels/[id]` | DELETE | Channel löschen |
| `/api/chat/channels/[id]/members` | GET | Channel-Mitglieder abrufen |
| `/api/chat/channels/[id]/members` | POST | Mitglied hinzufügen |
| `/api/chat/messages` | GET | Nachrichten abrufen |
| `/api/chat/messages/[id]` | GET | Einzelne Nachricht abrufen |
| `/api/chat/send` | POST | Nachricht senden |
| `/api/chat/private` | GET | Private Nachrichten abrufen |
| `/api/chat/users` | GET | Chat-Benutzer auflisten |
| `/api/chat/members` | GET | Chat-Mitglieder auflisten |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 📊 Berichte & Statistiken

**Ordner:** `/app/api/reports/`, `/app/api/stats/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/reports/daily` | GET | Tagesbericht generieren |
| `/api/stats/revenue` | GET | Umsatzstatistiken |
| `/api/stats/employee` | GET | Mitarbeiterstatistiken |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 🔧 Admin-Funktionen

**Ordner:** `/app/api/admin/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/admin/reassignments` | GET | Alle Neuverteilungen auflisten |
| `/api/admin/reassignments` | POST | Bulk-Neuverteilung durchführen |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 🔔 Einladungen

**Ordner:** `/app/api/invitations/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/invitations` | GET | Alle Einladungen auflisten |
| `/api/invitations` | POST | Neue Einladung erstellen |
| `/api/invitations/create` | POST | Einladung erstellen (Alternative) |
| `/api/invitations/validate` | GET | Einladung validieren |
| `/api/invitations/[id]` | GET | Einzelne Einladung abrufen |
| `/api/invitations/[id]` | DELETE | Einladung löschen |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 🚀 Onboarding

**Ordner:** `/app/api/onboarding/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/onboarding/complete` | POST | Onboarding abschließen |
| `/api/onboarding/validate` | GET | Onboarding validieren |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## ⚙️ System & Health

**Ordner:** `/app/api/system/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/system/health` | GET | System-Gesundheit prüfen |

**Services:**
- `/services/system/HealthService.ts` - Health-Check Service

---

## 🔄 Cron-Jobs

**Ordner:** `/app/api/cron/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/cron/daily-report` | GET | Tagesbericht generieren (Cron) |
| `/api/cron/salary-expenses` | GET | Gehalts-Ausgaben generieren (Cron) |
| `/api/cron/recurring-expenses` | GET | Daueraufträge verarbeiten (Cron) |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 📱 PWA & Manifest

**Ordner:** `/app/api/manifest/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/manifest` | GET | PWA-Manifest generieren |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 👤 Benutzer

**Ordner:** `/app/api/users/`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/users` | GET | Benutzer auflisten |

**Services:**
- Keine speziellen Services (direkt Prisma)

---

## 🎯 Premium Features (Event-Bus & Automation)

**Ordner:** `/events/`, `/automation/`, `/autopilot/`, `/services/context/`

### Event-Bus System

**Dateien:**
- `/events/EventBus.ts` - Queue-basierte Event-Verarbeitung
- `/events/types/EventTypes.ts` - Alle Event-Typen

**Operationen:**
- `subscribe(eventName, handler)` - Event abonnieren
- `emit(eventName, payload)` - Event emittieren

### Automation Engine

**Dateien:**
- `/automation/AutomationEngine.ts` - Automation-Engine
- `/automation/rules/defaultRules.ts` - Standard-Regeln

**Operationen:**
- Automatische Regel-Ausführung bei Events

### Autopilot Service

**Dateien:**
- `/autopilot/AutopilotService.ts` - Autopilot-Service

**Operationen:**
- Periodische Aufgaben (60-Minuten-Intervall)
- Automatische Aufgaben-Zuweisung
- Automatische Termin-Neuplanung

### Context Service

**Dateien:**
- `/services/context/ContextService.ts` - Kontext-Service

**Operationen:**
- `getTenantContext(tenantId)` - Tenant-Kontext
- `getCustomerContext(customerId)` - Kunden-Kontext
- `getAppointmentContext(appointmentId)` - Termin-Kontext
- `getEmployeeContext(employeeId)` - Mitarbeiter-Kontext
- `getFinanceContext(tenantId)` - Finanz-Kontext

---

## 📝 Zusammenfassung

### Gesamtanzahl API-Endpunkte: **~100+**

### Hauptkategorien:
1. ✅ Authentifizierung (3)
2. ✅ Kundenverwaltung (6)
3. ✅ Mitarbeiterverwaltung (13)
4. ✅ Terminverwaltung (5)
5. ✅ Aufgabenverwaltung (6)
6. ✅ Zahlungen (13)
7. ✅ Rechnungen (8)
8. ✅ Rechnungsvorlagen (5)
9. ✅ KI-Operationen (5)
10. ✅ KI-Nutzung & Billing (6)
11. ✅ Finanzen (11)
12. ✅ Inventar (5)
13. ✅ Chat-System (12)
14. ✅ Berichte & Statistiken (3)
15. ✅ Admin-Funktionen (2)
16. ✅ Einladungen (6)
17. ✅ Onboarding (2)
18. ✅ System & Health (1)
19. ✅ Cron-Jobs (3)
20. ✅ PWA & Manifest (1)
21. ✅ Benutzer (1)

### Services:
- PaymentService
- InvoiceService
- InvoiceTemplateService
- ReminderService
- BankMatchingService
- AiService
- AiUsageService
- AiBillingService
- ReminderTextService
- HealthService
- ContextService

---

## 🔍 Schnellzugriff

**Alle API-Routen:** `/app/api/`

**Alle Services:** `/services/`

**Event-System:** `/events/`

**Automation:** `/automation/`

**Autopilot:** `/autopilot/`

