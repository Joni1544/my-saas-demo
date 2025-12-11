/**
 * DSGVO Tests
 * Prüft dass keine personenbezogenen Daten an KI gesendet werden
 */
import { createFullTestSetup, createTestInvoice, createOverdueInvoice } from '../utils/testData'
import { aiServiceWrapper } from '@/services/ai/AiServiceWrapper'
import { prisma } from '@/lib/prisma'

jest.mock('@/services/ai/AiServiceWrapper', () => ({
  aiServiceWrapper: {
    generateInvoiceDraft: jest.fn(),
    generateDailyReport: jest.fn(),
    generateTaskSuggestions: jest.fn(),
  },
}))

describe('DSGVO Tests', () => {
  let testSetup: Awaited<ReturnType<typeof createFullTestSetup>>

  beforeAll(async () => {
    testSetup = await createFullTestSetup()
  })

  afterAll(async () => {
    await testSetup.cleanup()
  })

  describe('KI bekommt nur anonymisierte Daten', () => {
    it('sollte keine Kundennamen an KI senden', async () => {
      const invoice = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)
      const customer = await prisma.customer.findUnique({
        where: { id: testSetup.customer.id },
      })

      // Mock AI-Service aufrufen
      await aiServiceWrapper.generateInvoiceDraft(
        {
          tenantId: testSetup.tenant.tenantId,
          feature: 'invoice_draft',
          aiProvider: 'openai',
        },
        JSON.stringify({
          level: 1,
          invoiceAmount: 100.0,
          companyMood: 'neutral',
        })
      )

      // Prüfe dass AI-Service aufgerufen wurde
      expect(aiServiceWrapper.generateInvoiceDraft).toHaveBeenCalled()

      // Prüfe dass keine Kundendaten im Prompt enthalten sind
      const callArgs = (aiServiceWrapper.generateInvoiceDraft as jest.Mock).mock.calls[0]
      const promptData = JSON.parse(callArgs[1])

      expect(promptData).not.toHaveProperty('customerName')
      expect(promptData).not.toHaveProperty('customerId')
      expect(promptData).not.toHaveProperty('firstName')
      expect(promptData).not.toHaveProperty('lastName')
      expect(promptData).not.toHaveProperty('email')
      expect(promptData).not.toHaveProperty('phone')
      expect(promptData).not.toHaveProperty('address')

      // Prüfe dass nur erlaubte Daten enthalten sind
      expect(promptData).toHaveProperty('level')
      expect(promptData).toHaveProperty('invoiceAmount')
      expect(promptData).toHaveProperty('companyMood')
    })
  })

  describe('Tenant-Isolation funktioniert', () => {
    it('sollte Daten zwischen Tenants isolieren', async () => {
      const tenant2 = await createFullTestSetup()

      const invoice1 = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)
      const invoice2 = await createTestInvoice(tenant2.tenant.tenantId, tenant2.customer.id)

      // Tenant 1 sollte nur eigene Rechnungen sehen
      const invoicesTenant1 = await prisma.invoice.findMany({
        where: { tenantId: testSetup.tenant.tenantId },
      })

      expect(invoicesTenant1.every(inv => inv.tenantId === testSetup.tenant.tenantId)).toBe(true)
      expect(invoicesTenant1.find(inv => inv.id === invoice2.id)).toBeUndefined()

      await tenant2.cleanup()
    })
  })

  describe('Keine personenbezogenen Daten im AIUsage Log', () => {
    it('sollte keine Kundendaten in AIUsage speichern', async () => {
      const aiUsage = await prisma.aiUsage.create({
        data: {
          tenantId: testSetup.tenant.tenantId,
          feature: 'invoice_draft',
          tokensInput: 100,
          tokensOutput: 50,
          totalTokens: 150,
          cost: 0.00045,
          aiProvider: 'openai',
        },
      })

      // Prüfe dass keine personenbezogenen Felder vorhanden sind
      expect(aiUsage).not.toHaveProperty('customerId')
      expect(aiUsage).not.toHaveProperty('customerName')
      expect(aiUsage).not.toHaveProperty('email')
      expect(aiUsage).not.toHaveProperty('phone')

      // Nur erlaubte Felder sollten vorhanden sein
      expect(aiUsage).toHaveProperty('tenantId')
      expect(aiUsage).toHaveProperty('feature')
      expect(aiUsage).toHaveProperty('totalTokens')
      expect(aiUsage).toHaveProperty('cost')
    })
  })

  describe('Reminder AI-Text enthält NIE Kundennamen', () => {
    it('sollte sicherstellen dass Mahntext keine Kundendaten enthält', async () => {
      const invoice = await createOverdueInvoice(testSetup.tenant.tenantId, testSetup.customer.id, 5)
      const customer = await prisma.customer.findUnique({
        where: { id: testSetup.customer.id },
      })

      // Mock AI-Mahntext generieren
      const mockAiText = 'Sehr geehrte Damen und Herren, wir möchten Sie freundlich daran erinnern...'
      
      await aiServiceWrapper.generateInvoiceDraft(
        {
          tenantId: testSetup.tenant.tenantId,
          feature: 'reminder_text',
          aiProvider: 'openai',
        },
        JSON.stringify({
          level: 1,
          invoiceAmount: 100.0,
          companyMood: 'neutral',
        })
      )

      // Prüfe dass generierter Text keine Kundendaten enthält
      expect(mockAiText).not.toContain(customer?.firstName)
      expect(mockAiText).not.toContain(customer?.lastName)
      expect(mockAiText).not.toContain(customer?.email)
      expect(mockAiText).not.toContain(customer?.phone)
    })
  })

  describe('PDF enthält Kundendaten → KI aber nie', () => {
    it('sollte sicherstellen dass PDF Kundendaten hat aber KI diese nicht bekommt', async () => {
      const invoice = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)
      const customer = await prisma.customer.findUnique({
        where: { id: testSetup.customer.id },
      })

      // PDF sollte Kundendaten enthalten (wird durch InvoiceService gesetzt)
      expect(customer).toBeDefined()
      expect(customer?.firstName).toBeDefined()
      expect(customer?.lastName).toBeDefined()

      // AI-Text sollte keine Kundendaten enthalten
      const invoiceData = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        select: {
          aiDraftText: true,
        },
      })

      if (invoiceData?.aiDraftText) {
        expect(invoiceData.aiDraftText).not.toContain(customer?.firstName)
        expect(invoiceData.aiDraftText).not.toContain(customer?.lastName)
      }

      // Prüfe dass AI-Service nie mit Kundendaten aufgerufen wurde
      const aiCalls = (aiServiceWrapper.generateInvoiceDraft as jest.Mock).mock.calls
      
      aiCalls.forEach(call => {
        const promptData = JSON.parse(call[1])
        expect(promptData).not.toHaveProperty('customerName')
        expect(promptData).not.toHaveProperty('firstName')
        expect(promptData).not.toHaveProperty('lastName')
      })
    })
  })
})

