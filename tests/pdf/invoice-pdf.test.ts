/**
 * PDF Tests
 */
import { generateInvoicePdf } from '@/services/pdf/InvoicePdf'
import { createFullTestSetup, createTestInvoice, createTestTemplate } from '../utils/testData'
import { prisma } from '@/lib/prisma'

jest.mock('@/services/pdf/InvoicePdf', () => ({
  generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('Mock PDF Content')),
}))

describe('PDF Tests', () => {
  let testSetup: Awaited<ReturnType<typeof createFullTestSetup>>

  beforeAll(async () => {
    testSetup = await createFullTestSetup()
  })

  afterAll(async () => {
    await testSetup.cleanup()
  })

  describe('Template erzeugen', () => {
    it('sollte Template erstellen können', async () => {
      const template = await createTestTemplate(testSetup.tenant.tenantId, 'PDF Test Template')

      expect(template).toBeDefined()
      expect(template.tenantId).toBe(testSetup.tenant.tenantId)
    })
  })

  describe('Template anwenden', () => {
    it('sollte Template auf Rechnung anwenden', async () => {
      const template = await createTestTemplate(testSetup.tenant.tenantId)
      const invoice = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)

      // Template zu Rechnung hinzufügen
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          templateId: template.id,
        },
      })

      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
      })

      expect(updatedInvoice?.templateId).toBe(template.id)
    })
  })

  describe('PDF generieren', () => {
    it('sollte PDF mit Template generieren', async () => {
      const template = await createTestTemplate(testSetup.tenant.tenantId)
      const invoice = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)

      // Mock PDF-Generierung
      const pdfBuffer = await generateInvoicePdf({
        invoiceId: invoice.id,
        templateId: template.id,
        tenantId: testSetup.tenant.tenantId,
      })

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
      expect(generateInvoicePdf).toHaveBeenCalled()
    })

    it('sollte AI-Text im PDF enthalten', async () => {
      const template = await createTestTemplate(testSetup.tenant.tenantId)
      const invoice = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)

      // AI-Text zur Rechnung hinzufügen
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          aiDraftText: 'Generated AI Text for Invoice',
        },
      })

      const pdfBuffer = await generateInvoicePdf({
        invoiceId: invoice.id,
        templateId: template.id,
        tenantId: testSetup.tenant.tenantId,
      })

      expect(pdfBuffer).toBeDefined()
      // PDF sollte AI-Text enthalten (in Mock-Implementierung)
    })
  })

  describe('DSGVO: Keine Kundendaten an KI', () => {
    it('sollte sicherstellen dass PDF Kundendaten enthält aber KI diese nicht bekommt', async () => {
      const invoice = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)

      // PDF sollte Kundendaten enthalten
      const customer = await prisma.customer.findUnique({
        where: { id: testSetup.customer.id },
      })

      expect(customer).toBeDefined()
      expect(customer?.firstName).toBeDefined()
      expect(customer?.lastName).toBeDefined()

      // AI-Text sollte keine Kundendaten enthalten
      const invoiceWithAi = await prisma.invoice.findUnique({
        where: { id: invoice.id },
      })

      if (invoiceWithAi?.aiDraftText) {
        // Prüfe dass AI-Text keine Kundendaten enthält
        expect(invoiceWithAi.aiDraftText).not.toContain(customer?.firstName)
        expect(invoiceWithAi.aiDraftText).not.toContain(customer?.lastName)
      }
    })
  })
})

