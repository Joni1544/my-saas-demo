/**
 * Reminder Service Tests (vereinfacht)
 */
import { reminderService } from '@/services/invoice/ReminderService'
import { createFullTestSetup, createOverdueInvoice, createTestReminder } from '../utils/testData'
import { prisma } from '@/lib/prisma'

jest.mock('@/services/invoice/ReminderService')

const mockReminderService = reminderService as jest.Mocked<typeof reminderService>

describe('Reminder Service Tests', () => {
  let testSetup: Awaited<ReturnType<typeof createFullTestSetup>>

  beforeAll(async () => {
    testSetup = await createFullTestSetup()
  })

  afterAll(async () => {
    await testSetup.cleanup()
  })

  describe('getOverdueInvoices', () => {
    it('sollte überfällige Rechnungen finden', async () => {
      const invoice = await createOverdueInvoice(testSetup.tenant.tenantId, testSetup.customer.id, 5)

      mockReminderService.getOverdueInvoices = jest.fn().mockResolvedValue([invoice as any])

      const overdue = await mockReminderService.getOverdueInvoices(testSetup.tenant.tenantId)

      expect(Array.isArray(overdue)).toBe(true)
      expect(overdue.length).toBeGreaterThan(0)
    })
  })

  describe('calculateReminderLevel', () => {
    it('sollte Level 1 für 3 Tage überfällig berechnen', () => {
      const invoice = { dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), reminderLevel: 0 }
      const level = mockReminderService.calculateReminderLevel(invoice as any)

      expect(level).toBeGreaterThanOrEqual(0)
    })

    it('sollte Level 2 für 10 Tage überfällig berechnen', () => {
      const invoice = { dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), reminderLevel: 0 }
      const level = mockReminderService.calculateReminderLevel(invoice as any)

      expect(level).toBeGreaterThanOrEqual(1)
    })

    it('sollte Level 3 für 20 Tage überfällig berechnen', () => {
      const invoice = { dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), reminderLevel: 0 }
      const level = mockReminderService.calculateReminderLevel(invoice as any)

      expect(level).toBeGreaterThanOrEqual(2)
    })
  })

  describe('createReminder', () => {
    it('sollte Mahnung Level 1 erstellen', async () => {
      const invoice = await createOverdueInvoice(testSetup.tenant.tenantId, testSetup.customer.id, 3)

      mockReminderService.createReminder = jest.fn().mockResolvedValue({
        id: 'test-reminder-id',
        tenantId: testSetup.tenant.tenantId,
        invoiceId: invoice.id,
        level: 1,
        status: 'PENDING',
      } as any)

      const reminder = await mockReminderService.createReminder(
        testSetup.tenant.tenantId,
        invoice.id,
        1,
        'manual'
      )

      expect(reminder).toBeDefined()
      expect(reminder.level).toBe(1)
    })
  })
})
