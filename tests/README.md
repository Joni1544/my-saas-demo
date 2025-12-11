# FuerstFlow Test Suite

Vollständiges Testsystem für alle Module von FuerstFlow.

## Struktur

```
tests/
├── api/                    # API-Tests
│   ├── payments.test.ts
│   ├── invoices.test.ts
│   ├── invoice-templates.test.ts
│   ├── ai-usage.test.ts
│   └── reminders.test.ts
├── events/                 # EventBus Tests
│   └── eventbus.test.ts
├── automation/             # Automation Engine Tests
│   └── automation-engine.test.ts
├── autopilot/              # Autopilot Tests
│   └── autopilot.test.ts
├── pdf/                    # PDF Tests
│   └── invoice-pdf.test.ts
├── privacy/                # DSGVO Tests
│   └── dsgvo.test.ts
├── utils/                  # Test-Utilities
│   └── testData.ts
├── setupTests.ts           # Jest Setup
└── README.md
```

## Installation

```bash
npm install --save-dev jest @types/jest jest-environment-node supertest @types/supertest
```

## Tests ausführen

```bash
# Alle Tests
npm test

# Watch Mode
npm run test:watch

# Mit Coverage
npm run test:coverage
```

## Test-Coverage

Ziel: **Mindestens 85% Coverage**

- ✅ Alle Services
- ✅ Alle API Routes
- ✅ Alle Events
- ✅ Alle Automation Rules
- ✅ Alle Reminder Logic

## Wichtige Features

### 1. Tenant-Isolation
Alle Tests sind tenant-isoliert. Jeder Test erstellt einen eigenen Tenant.

### 2. Mocking
- AI-Service wird gemockt (keine echten API-Aufrufe)
- Stripe wird gemockt
- PayPal wird gemockt
- PDF-Generierung wird gemockt

### 3. DSGVO-Compliance
Tests prüfen dass keine personenbezogenen Daten an KI gesendet werden.

### 4. Event-Testing
Alle Events werden getestet und ihre Handler verifiziert.

## Test-Kategorien

### API Tests
- Payment API
- Invoice API
- Invoice Template API
- AI Usage API
- Reminder API

### Integration Tests
- EventBus → Automation Engine
- Payment → Invoice → Reminder Flow
- Autopilot → ReminderService

### Unit Tests
- ReminderService
- PaymentService
- InvoiceService
- AIUsageService

### DSGVO Tests
- KI erhält keine Kundendaten
- Tenant-Isolation
- AIUsage Log enthält keine personenbezogenen Daten

## Best Practices

1. **Isolation**: Jeder Test erstellt eigene Testdaten
2. **Cleanup**: Nach jedem Test werden Daten bereinigt
3. **Mocking**: Externe Services werden gemockt
4. **Tenant-Safety**: Tests prüfen Tenant-Isolation
5. **DSGVO**: Tests verifizieren Datenschutz

## Beispiel-Test

```typescript
describe('Payment API Tests', () => {
  it('sollte eine Zahlung erstellen', async () => {
    const invoice = await createTestInvoice(tenantId, customerId)
    
    const response = await request(server)
      .post('/api/payments/create')
      .send({ invoiceId: invoice.id, amount: 100.0 })
      .expect(201)
    
    expect(response.body.payment).toBeDefined()
  })
})
```

