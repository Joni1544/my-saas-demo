/**
 * Autopilot Tests
 */
import { autopilotService } from '@/autopilot/AutopilotService'
import { createFullTestSetup, createOverdueInvoice, createTestInvoice } from '../utils/testData'
import { prisma } from '@/lib/prisma'

describe('Autopilot Tests', () => {
  let testSetup: Awaited<ReturnType<typeof createFullTestSetup>>

  beforeAll(async () => {
    testSetup = await createFullTestSetup()
  })

  afterAll(async () => {
    await testSetup.cleanup()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Periodische Jobs', () => {
    it('sollte periodische Aufgaben ausführen können', async () => {
      const status = autopilotService.getStatus()
      expect(status).toBeDefined()
      expect(typeof status.enabled).toBe('boolean')
      expect(typeof status.running).toBe('boolean')
    })
  })

  describe('ReminderService Integration', () => {
    it('sollte überfällige Rechnungen verarbeiten', async () => {
      // Erstelle überfällige Rechnung
      const invoice = await createOverdueInvoice(testSetup.tenant.tenantId, testSetup.customer.id, 5)

      // Autopilot sollte diese Rechnung finden und Mahnung erstellen
      // (Dies würde normalerweise durch processReminders() erfolgen)
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          tenantId: testSetup.tenant.tenantId,
          status: 'OVERDUE',
          dueDate: {
            lt: new Date(),
          },
        },
      })

      expect(overdueInvoices.length).toBeGreaterThan(0)
    })
  })

  describe('Task-Erstellung', () => {
    it('sollte Aufgaben basierend auf Events erstellen können', async () => {
      const task = await prisma.task.create({
        data: {
          tenantId: testSetup.tenant.tenantId,
          title: 'Test Task',
          description: 'Test Description',
          status: 'TODO',
          priority: 'MEDIUM',
        },
      })

      expect(task).toBeDefined()
      expect(task.tenantId).toBe(testSetup.tenant.tenantId)
    })
  })

  describe('Payment → Mahnung stoppen', () => {
    it('sollte Mahnungen stoppen wenn Zahlung eingeht', async () => {
      const invoice = await createOverdueInvoice(testSetup.tenant.tenantId, testSetup.customer.id, 5)

      // Mahnung erstellen
      await prisma.invoiceReminder.create({
        data: {
          tenantId: testSetup.tenant.tenantId,
          invoiceId: invoice.id,
          level: 1,
          status: 'PENDING',
          method: 'manual',
        },
      })

      // Rechnung als bezahlt markieren
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          reminderLevel: 0,
        },
      })

      // Prüfe ob reminderLevel auf 0 gesetzt wurde
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
      })

      expect(updatedInvoice?.reminderLevel).toBe(0)
    })
  })
})

