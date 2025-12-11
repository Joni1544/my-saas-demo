/**
 * Invoice Service für FuerstFlow
 * Verwaltung von Rechnungen
 */
import { prisma } from '@/lib/prisma'
import { paymentService } from '../payment/PaymentService'

export interface CreateInvoiceData {
  tenantId: string
  customerId?: string
  employeeId?: string
  appointmentId?: string
  amount: number
  currency?: string
  description?: string
  items?: Array<{ description: string; amount: number }>
  dueDate?: Date
}

class InvoiceService {
  /**
   * Rechnung erstellen
   */
  async createInvoice(data: CreateInvoiceData & { templateId?: string; aiDraftText?: string }) {
    try {
      // Generiere Rechnungsnummer
      const invoiceNumber = await this.generateInvoiceNumber(data.tenantId)

      const invoice = await prisma.invoice.create({
        data: {
          tenantId: data.tenantId,
          customerId: data.customerId || null,
          employeeId: data.employeeId || null,
          templateId: data.templateId || null,
          invoiceNumber,
          amount: data.amount,
          currency: data.currency || 'EUR',
          status: 'PENDING',
          dueDate: data.dueDate || null,
          description: data.description || null,
          aiDraftText: data.aiDraftText || null,
          items: data.items ? JSON.stringify(data.items) : null,
        },
      })

      return invoice
    } catch (error) {
      console.error('[InvoiceService] Error creating invoice:', error)
      throw error
    }
  }

  /**
   * Rechnungsnummer generieren
   * Format: ${prefix}-${year}-${counter}
   */
  async generateInvoiceNumber(tenantId: string, prefix: string = 'RE'): Promise<string> {
    const year = new Date().getFullYear()
    const count = await prisma.invoice.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    })

    const number = String(count + 1).padStart(4, '0')
    return `${prefix}-${year}-${number}`
  }

  /**
   * Zahlung mit Rechnung verknüpfen
   */
  async linkPaymentToInvoice(paymentId: string, invoiceId: string) {
    try {
      return await paymentService.linkPaymentToInvoice(paymentId, invoiceId)
    } catch (error) {
      console.error('[InvoiceService] Error linking payment to invoice:', error)
      throw error
    }
  }

  /**
   * Rechnung abrufen
   */
  async getInvoice(invoiceId: string, tenantId: string) {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          tenantId,
        },
        include: {
          customer: true,
          employee: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      return invoice
    } catch (error) {
      console.error('[InvoiceService] Error getting invoice:', error)
      throw error
    }
  }

  /**
   * Rechnungen auflisten
   */
  async listInvoices(tenantId: string, filters?: {
    status?: string
    customerId?: string
  }) {
    try {
      const where: {
        tenantId: string
        status?: string
        customerId?: string
      } = {
        tenantId,
      }

      if (filters?.status) {
        where.status = filters.status as any
      }
      if (filters?.customerId) {
        where.customerId = filters.customerId
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          payments: {
            where: {
              status: 'PAID',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return invoices
    } catch (error) {
      console.error('[InvoiceService] Error listing invoices:', error)
      throw error
    }
  }
}

// Singleton-Instanz
export const invoiceService = new InvoiceService()

