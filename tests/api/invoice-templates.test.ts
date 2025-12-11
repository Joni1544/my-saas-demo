/**
 * Invoice Template Service Tests
 */
import { invoiceTemplateService } from '@/services/invoice/InvoiceTemplateService'
import { prisma } from '@/lib/prisma'
import { createFullTestSetup, createTestTemplate } from '../utils/testData'

describe('Invoice Template Service Tests', () => {
  let testSetup: Awaited<ReturnType<typeof createFullTestSetup>>

  beforeAll(async () => {
    testSetup = await createFullTestSetup()
  })

  afterAll(async () => {
    await testSetup.cleanup()
  })

  describe('createTemplate', () => {
    it('sollte ein Template erstellen', async () => {
      const template = await prisma.invoiceTemplate.create({
        data: {
          tenantId: testSetup.tenant.tenantId,
          name: 'Test Template',
          description: 'Test Description',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          layoutType: 'modern',
        },
      })

      expect(template).toBeDefined()
      expect(template.name).toBe('Test Template')
      expect(template.tenantId).toBe(testSetup.tenant.tenantId)
    })
  })

  describe('getTemplates', () => {
    it('sollte alle Templates zurückgeben', async () => {
      await createTestTemplate(testSetup.tenant.tenantId, 'Template 1')
      await createTestTemplate(testSetup.tenant.tenantId, 'Template 2')

      const templates = await prisma.invoiceTemplate.findMany({
        where: { tenantId: testSetup.tenant.tenantId },
      })

      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThanOrEqual(2)
    })
  })
})
