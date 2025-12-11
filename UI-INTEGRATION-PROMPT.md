# 🎨 UI-INTEGRATION PROMPT – FuerstFlow Premium Features ins Interface einbinden

## Ziel:
Integriere alle neu erstellten Premium-Features vollständig ins User Interface:
- Zahlungssystem
- Rechnungssystem mit Templates
- KI-Usage & Billing
- Mahnwesen (Reminders)
- Automation & Autopilot

**⚠️ WICHTIG: Keine bestehenden Dateien überschreiben, nur erweitern!**

---

## 1️⃣ NAVIGATION ERWEITERN (`components/Navbar.tsx`)

**Aktueller Stand:** Navigation zeigt nur alte Menüpunkte

**Erforderliche Änderungen:**

### Admin Navigation erweitern:
```typescript
const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Berichte', href: '/dashboard/reports' },
  { name: 'Finanzen', href: '/dashboard/finance' },
  { name: 'Zahlungen', href: '/dashboard/payments' }, // ✅ NEU
  { name: 'Rechnungen', href: '/dashboard/invoices' }, // ✅ NEU (falls noch nicht vorhanden)
  { name: 'Mahnungen', href: '/dashboard/reminders' }, // ✅ NEU
  { name: 'KI-Usage', href: '/dashboard/ai-usage' }, // ✅ NEU
  { name: 'Automation', href: '/dashboard/automation/payments' }, // ✅ NEU
  { name: 'Mitarbeiter', href: '/dashboard/employees' },
  { name: 'Inventar', href: '/dashboard/inventory' },
  { name: 'Termine', href: '/dashboard/appointments' },
  { name: 'Kalender', href: '/dashboard/calendar' },
  { name: 'Kunden', href: '/dashboard/customers' },
  { name: 'Aufgaben', href: '/dashboard/tasks' },
  { name: 'Chat', href: '/dashboard/chat' },
  { name: 'Admin', href: '/dashboard/admin' },
]
```

**Icons hinzufügen (optional):**
- 💳 Zahlungen
- 📄 Rechnungen
- 📬 Mahnungen
- 🤖 KI-Usage
- ⚙️ Automation

---

## 2️⃣ QUICK ACTIONS ERWEITERN (`components/QuickActions.tsx`)

**Aktueller Stand:** Zeigt nur Basis-Aktionen

**Neue Actions hinzufügen:**

```typescript
const allActions = [
  // ... bestehende Actions ...
  {
    title: 'Neue Rechnung',
    href: '/dashboard/invoices/new',
    icon: '📄',
    color: 'bg-orange-600 hover:bg-orange-700',
    adminOnly: true,
  },
  {
    title: 'Zahlung erfassen',
    href: '/dashboard/payments/pos',
    icon: '💳',
    color: 'bg-green-600 hover:bg-green-700',
    adminOnly: true,
  },
  {
    title: 'Rechnungs-Template',
    href: '/dashboard/invoices/templates',
    icon: '🎨',
    color: 'bg-purple-600 hover:bg-purple-700',
    adminOnly: true,
  },
]
```

---

## 3️⃣ DASHBOARD HAUPTSEITE ERWEITERN (`app/dashboard/page.tsx`)

**Neue Widgets hinzufügen:**

### Option A: Neue Sektion "Premium Features"
```tsx
{/* Premium Features Übersicht */}
{session.user.role === 'ADMIN' && (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Premium Features</h2>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Link href="/dashboard/payments" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
        <div className="text-2xl mb-2">💳</div>
        <div className="font-semibold">Zahlungen</div>
        <div className="text-sm text-gray-500">Übersicht & POS</div>
      </Link>
      <Link href="/dashboard/invoices" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
        <div className="text-2xl mb-2">📄</div>
        <div className="font-semibold">Rechnungen</div>
        <div className="text-sm text-gray-500">Erstellen & Verwalten</div>
      </Link>
      <Link href="/dashboard/reminders" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
        <div className="text-2xl mb-2">📬</div>
        <div className="font-semibold">Mahnungen</div>
        <div className="text-sm text-gray-500">Überfällige Rechnungen</div>
      </Link>
      <Link href="/dashboard/ai-usage" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
        <div className="text-2xl mb-2">🤖</div>
        <div className="font-semibold">KI-Usage</div>
        <div className="text-sm text-gray-500">Verbrauch & Kosten</div>
      </Link>
    </div>
  </div>
)}
```

### Option B: Erweitere DashboardKPIs um Premium-Metriken
- Offene Rechnungen
- Überfällige Rechnungen
- Zahlungen heute
- KI-Verbrauch diesen Monat

---

## 4️⃣ FINANZ-DASHBOARD ERWEITERN (`app/dashboard/finance/page.tsx`)

**Neue Sektionen hinzufügen:**

### Zahlungsarten-Analyse (bereits implementiert, aber prüfen ob verlinkt)
- Chart: Verteilung Zahlungsarten
- Chart: Zahlungen pro Tag
- Chart: Umsatz pro Zahlungsart

**Link zu Zahlungen-Dashboard:**
```tsx
<Link href="/dashboard/payments" className="text-indigo-600 hover:text-indigo-800">
  → Zu allen Zahlungen
</Link>
```

---

## 5️⃣ KUNDEN-DETAILSEITE ERWEITERN (`app/dashboard/customers/[id]/page.tsx`)

**Prüfen ob bereits integriert:**
- ✅ `CustomerPaymentsSection` sollte bereits eingebunden sein
- Falls nicht: Import hinzufügen und Komponente rendern

---

## 6️⃣ RECHNUNGS-DETAILSEITE ERWEITERN (`app/dashboard/invoices/[id]/page.tsx`)

**Prüfen ob bereits integriert:**
- ✅ Zahlungen-Sektion sollte vorhanden sein
- ✅ Mahnungen-Sektion sollte vorhanden sein
- ✅ Template-Auswahl sollte vorhanden sein

**Falls nicht vorhanden, hinzufügen:**
- Button "Zahlung erfassen" → öffnet `RecordPaymentDialog`
- Button "Payment Link erstellen" → öffnet Modal mit Link
- Button "Stripe Terminal starten" → öffnet Terminal-Dialog
- Sektion "Mahnungen" mit Level-Anzeige und Liste

---

## 7️⃣ NEUE SEITEN VERLINKEN

**Prüfe ob alle Seiten existieren und verlinkt sind:**

### Zahlungen:
- `/dashboard/payments` → Liste aller Zahlungen ✅
- `/dashboard/payments/pos` → POS-System ✅

### Rechnungen:
- `/dashboard/invoices` → Liste aller Rechnungen (prüfen ob existiert)
- `/dashboard/invoices/new` → Neue Rechnung erstellen ✅
- `/dashboard/invoices/[id]` → Rechnungs-Details ✅
- `/dashboard/invoices/templates` → Template-Liste ✅
- `/dashboard/invoices/templates/new` → Neues Template ✅
- `/dashboard/invoices/templates/[id]` → Template bearbeiten ✅

### Mahnungen:
- `/dashboard/reminders` → Mahnungen-Übersicht ✅

### KI-Usage:
- `/dashboard/ai-usage` → KI-Usage Dashboard ✅
- `/dashboard/ai-usage/billing` → KI-Abrechnung ✅

### Automation:
- `/dashboard/automation/payments` → Payment-Automation ✅

---

## 8️⃣ BREADCRUMBS HINZUFÜGEN (Optional)

**Für bessere Navigation in neuen Bereichen:**

Erstelle Komponente `components/Breadcrumbs.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  
  // ... Breadcrumb-Logik ...
}
```

**Verwende in:**
- `/dashboard/invoices/templates/[id]`
- `/dashboard/invoices/[id]`
- `/dashboard/payments/pos`

---

## 9️⃣ MOBILE NAVIGATION ERWEITERN

**Falls Mobile-Menü vorhanden:**
- Alle neuen Menüpunkte hinzufügen
- Icons für bessere Erkennbarkeit

---

## 🔟 DASHBOARD-WIDGETS FÜR PREMIUM FEATURES

**Erstelle neue Widget-Komponenten:**

### `components/PaymentOverview.tsx`
- Zeigt: Zahlungen heute, Umsatz heute, beliebteste Methode
- Link zu `/dashboard/payments`

### `components/InvoiceOverview.tsx`
- Zeigt: Offene Rechnungen, Überfällige, Gesamtbetrag
- Link zu `/dashboard/invoices`

### `components/ReminderOverview.tsx`
- Zeigt: Überfällige Rechnungen, Level-Verteilung
- Link zu `/dashboard/reminders`

### `components/AIUsageOverview.tsx`
- Zeigt: Verbrauch diesen Monat, Kosten, Top Features
- Link zu `/dashboard/ai-usage`

**Integriere in `app/dashboard/page.tsx`:**

```tsx
{/* Premium Features Widgets */}
{session.user.role === 'ADMIN' && (
  <div className="grid gap-6 lg:grid-cols-2 mb-8">
    <PaymentOverview />
    <InvoiceOverview />
    <ReminderOverview />
    <AIUsageOverview />
  </div>
)}
```

---

## 1️⃣1️⃣ FEHLENDE SEITEN ERSTELLEN

**Falls noch nicht vorhanden:**

### `/dashboard/invoices/page.tsx` (Liste aller Rechnungen)
- Tabelle mit: Rechnungsnummer, Kunde, Betrag, Status, Fälligkeitsdatum
- Filter: Status, Kunde, Datum
- Button "Neue Rechnung"
- Link zu Templates

---

## 1️⃣2️⃣ CONTEXT-MENÜS & DROPDOWNS

**In Tabellen hinzufügen:**

### Zahlungen-Tabelle (`/dashboard/payments/page.tsx`):
- Dropdown pro Zeile: "Details", "Stornieren", "Erstattung"

### Rechnungen-Tabelle (`/dashboard/invoices/page.tsx`):
- Dropdown pro Zeile: "Details", "PDF exportieren", "Zahlung erfassen", "Mahnung erstellen"

---

## 1️⃣3️⃣ NOTIFICATION-BADGES

**In Navigation hinzufügen:**

```tsx
{ name: 'Mahnungen', href: '/dashboard/reminders', badge: overdueCount },
{ name: 'Rechnungen', href: '/dashboard/invoices', badge: openInvoicesCount },
```

**Badge-Komponente:**
```tsx
{badge > 0 && (
  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
    {badge}
  </span>
)}
```

---

## ✅ CHECKLISTE FÜR CURSOR

- [ ] Navigation erweitert (`components/Navbar.tsx`)
- [ ] Quick Actions erweitert (`components/QuickActions.tsx`)
- [ ] Dashboard-Hauptseite erweitert (`app/dashboard/page.tsx`)
- [ ] Finanz-Dashboard verlinkt zu Zahlungen
- [ ] Kunden-Detailseite zeigt Zahlungen
- [ ] Rechnungs-Detailseite zeigt Zahlungen & Mahnungen
- [ ] Alle neuen Seiten sind erreichbar
- [ ] Mobile Navigation erweitert
- [ ] Dashboard-Widgets erstellt & integriert
- [ ] Fehlende Seiten erstellt (`/dashboard/invoices/page.tsx`)
- [ ] Notification-Badges hinzugefügt
- [ ] Breadcrumbs für tiefe Navigation
- [ ] Alle Links funktionieren
- [ ] Responsive Design geprüft

---

## 🎯 ERGEBNIS

Nach dieser Integration solltest du:
- ✅ Alle Premium-Features in der Navigation sehen
- ✅ Schnellzugriff über Quick Actions haben
- ✅ Übersichtliche Dashboard-Widgets sehen
- ✅ Alle neuen Seiten erreichen können
- ✅ Badges für wichtige Benachrichtigungen sehen

---

## 📝 HINWEISE FÜR CURSOR

1. **Keine bestehenden Dateien überschreiben** - nur erweitern
2. **Konsistentes Design** - nutze bestehende Tailwind-Klassen
3. **Responsive** - Mobile-First Approach
4. **Accessibility** - ARIA-Labels, Keyboard-Navigation
5. **Performance** - Lazy Loading für große Listen

---

**END OF PROMPT**

