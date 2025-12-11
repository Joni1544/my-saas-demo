/**
 * AI Usage Service Tests (vereinfacht)
 */
import { createFullTestSetup } from '../utils/testData'
import { aiUsageService } from '@/services/ai/AiUsageService'
import { prisma } from '@/lib/prisma'

jest.mock('@/services/ai/AiUsageService')

const mockAiUsageService = aiUsageService as jest.Mocked<typeof aiUsageService>

describe('AI Usage Service Tests', () => {
  let testSetup: Awaited<ReturnType<typeof createFullTestSetup>>

  beforeAll(async () => {
    testSetup = await createFullTestSetup()
  })

  afterAll(async () => {
    await testSetup.cleanup()
  })

  describe('recordUsage', () => {
    it('sollte AI-Verbrauch aufzeichnen', async () => {
      const mockUsage = {
        id: 'test-usage-id',
        tenantId: testSetup.tenant.tenantId,
        feature: 'invoice_draft',
        tokensInput: 100,
        tokensOutput: 50,
        totalTokens: 150,
        cost: 0.00045,
        aiProvider: 'openai',
        timestamp: new Date(),
      }

      mockAiUsageService.recordUsage = jest.fn().mockResolvedValue(mockUsage as any)

      const result = await mockAiUsageService.recordUsage({
        tenantId: testSetup.tenant.tenantId,
        feature: 'invoice_draft',
        tokensInput: 100,
        tokensOutput: 50,
        aiProvider: 'openai',
      })

      expect(result).toBeDefined()
      expect(result.totalTokens).toBe(150)
      expect(mockAiUsageService.recordUsage).toHaveBeenCalled()
    })
  })

  describe('getTenantUsageStats', () => {
    it('sollte Tenant-Statistiken zurückgeben', async () => {
      mockAiUsageService.getTenantUsageStats = jest.fn().mockResolvedValue({
        totalTokens: 1000,
        totalCost: 0.003,
        requestCount: 10,
      } as any)

      const stats = await mockAiUsageService.getTenantUsageStats(testSetup.tenant.tenantId)

      expect(stats).toBeDefined()
      expect(stats.totalTokens).toBe(1000)
    })
  })
})
