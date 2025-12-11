/**
 * Payment Service für FuerstFlow
 * Zentrale Verwaltung aller Zahlungen
 */
import { prisma } from '@/lib/prisma'
import { eventBus } from '@/events/EventBus'

export interface CreatePaymentData {
  tenantId: string
  invoiceId?: string
  customerId?: string
  employeeId?: string
  amount: number
  currency?: string
  method: 'STRIPE_CARD' | 'STRIPE_TERMINAL' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'PAYPAL' | 'BANK_TRANSFER' | 'CASH'
  transactionId?: string
  reference?: string
}

export interface PaymentResult {
  payment: {
    id: string
    amount: number
    currency: string
    method: string
    status: string
    transactionId?: string | null
    reference?: string | null
    paidAt?: Date | null
    createdAt: Date
  }
}

class PaymentService {
  /**
   * Zahlung erstellen
   * WICHTIG: tenantId kann Shop.id oder Shop.tenantId sein - wird automatisch erkannt
   */
  async createPayment(data: CreatePaymentData): Promise<PaymentResult> {
    try {
      // Konvertiere tenantId (Shop.tenantId) zu shopId (Shop.id) falls nötig
      let shopId: string = data.tenantId
      
      // Prüfe ob es Shop.id oder Shop.tenantId ist
      const shop = await prisma.shop.findUnique({
        where: { id: data.tenantId },
      })
      
      if (!shop) {
        // Versuche als Shop.tenantId zu verwenden
        const shopByTenantId = await prisma.shop.findUnique({
          where: { tenantId: data.tenantId },
        })
        if (shopByTenantId) {
          shopId = shopByTenantId.id
        }
      }

      const payment = await prisma.payment.create({
        data: {
          tenantId: shopId, // Verweist auf Shop.id (Foreign Key)
          invoiceId: data.invoiceId || null,
          customerId: data.customerId || null,
          employeeId: data.employeeId || null,
          amount: data.amount,
          currency: data.currency || 'EUR',
          method: data.method,
          status: 'PENDING',
          transactionId: data.transactionId || null,
          reference: data.reference || null,
        },
      })

      // Event emitieren
      eventBus.emit('payment.created', {
        tenantId: data.tenantId,
        paymentId: payment.id,
        amount: data.amount,
        method: data.method,
        invoiceId: data.invoiceId,
        customerId: data.customerId,
        timestamp: new Date(),
      })

      return {
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          transactionId: payment.transactionId,
          reference: payment.reference,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        },
      }
    } catch (error) {
      console.error('[PaymentService] Error creating payment:', error)
      throw error
    }
  }

  /**
   * Zahlung als bezahlt markieren
   */
  async markPaymentPaid(paymentId: string, paidAt?: Date): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidAt: paidAt || new Date(),
        },
        include: {
          invoice: true,
          customer: true,
        },
      })

      // Event emitieren
      eventBus.emit('payment.paid', {
        tenantId: payment.tenantId,
        paymentId: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        invoiceId: payment.invoiceId || undefined,
        customerId: payment.customerId || undefined,
        timestamp: new Date(),
      })

      // Prüfe ob Rechnung vollständig bezahlt ist
      if (payment.invoiceId) {
        await this.checkInvoicePaymentStatus(payment.invoiceId, payment.tenantId)
      }

      return {
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          transactionId: payment.transactionId,
          reference: payment.reference,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        },
      }
    } catch (error) {
      console.error('[PaymentService] Error marking payment as paid:', error)
      throw error
    }
  }

  /**
   * Zahlung als fehlgeschlagen markieren
   */
  async markPaymentFailed(paymentId: string): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
        },
        include: {
          invoice: true,
          customer: true,
        },
      })

      // Event emitieren
      eventBus.emit('payment.failed', {
        tenantId: payment.tenantId,
        paymentId: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        invoiceId: payment.invoiceId || undefined,
        customerId: payment.customerId || undefined,
        timestamp: new Date(),
      })

      return {
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          transactionId: payment.transactionId,
          reference: payment.reference,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        },
      }
    } catch (error) {
      console.error('[PaymentService] Error marking payment as failed:', error)
      throw error
    }
  }

  /**
   * Zahlung zurückerstatten
   */
  async refundPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
        },
        include: {
          invoice: true,
        },
      })

      // Event emitieren
      eventBus.emit('payment.refunded', {
        tenantId: payment.tenantId,
        paymentId: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        invoiceId: payment.invoiceId || undefined,
        timestamp: new Date(),
      })

      // Prüfe Rechnungsstatus erneut
      if (payment.invoiceId) {
        await this.checkInvoicePaymentStatus(payment.invoiceId, payment.tenantId)
      }

      return {
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          transactionId: payment.transactionId,
          reference: payment.reference,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        },
      }
    } catch (error) {
      console.error('[PaymentService] Error refunding payment:', error)
      throw error
    }
  }

  /**
   * Rechnungszahlungsstatus prüfen und aktualisieren
   */
  private async checkInvoicePaymentStatus(invoiceId: string, tenantId: string): Promise<void> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: {
            where: {
              status: 'PAID',
            },
          },
        },
      })

      if (!invoice) {
        return
      }

      const totalPaid = invoice.payments.reduce((sum, payment) => {
        return sum + Number(payment.amount)
      }, 0)

      const invoiceAmount = Number(invoice.amount)
      const isFullyPaid = totalPaid >= invoiceAmount

      // Aktualisiere Rechnungsstatus
      if (isFullyPaid && invoice.status !== 'PAID') {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            reminderLevel: 0, // Stoppe Mahnungen
          },
        })

        // Stoppe Mahnungen
        const { reminderService } = await import('../invoice/ReminderService')
        await reminderService.stopReminders(invoiceId)

        // Event emitieren
        eventBus.emit('invoice.paid', {
          tenantId,
          invoiceId: invoice.id,
          amount: invoiceAmount,
          customerId: invoice.customerId || undefined,
          timestamp: new Date(),
        })
      } else if (!isFullyPaid && invoice.status === 'PAID') {
        // Rechnung wurde teilweise zurückerstattet
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PENDING',
            paidAt: null,
          },
        })
      }
    } catch (error) {
      console.error('[PaymentService] Error checking invoice payment status:', error)
    }
  }

  /**
   * Zahlung mit Rechnung verknüpfen
   */
  async linkPaymentToInvoice(paymentId: string, invoiceId: string): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          invoiceId,
        },
        include: {
          invoice: true,
        },
      })

      // Prüfe Rechnungsstatus
      if (payment.invoiceId) {
        await this.checkInvoicePaymentStatus(payment.invoiceId, payment.tenantId)
      }

      return {
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          transactionId: payment.transactionId,
          reference: payment.reference,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        },
      }
    } catch (error) {
      console.error('[PaymentService] Error linking payment to invoice:', error)
      throw error
    }
  }

  /**
   * Zahlungen auflisten
   * WICHTIG: tenantId kann Shop.id oder Shop.tenantId sein - wird automatisch erkannt
   */
  async listPayments(tenantIdOrShopId: string, filters?: {
    status?: string
    method?: string
    customerId?: string
    invoiceId?: string
  }) {
    try {
      // Konvertiere tenantId (Shop.tenantId) zu shopId (Shop.id) falls nötig
      let shopId: string = tenantIdOrShopId
      
      const shop = await prisma.shop.findUnique({
        where: { id: tenantIdOrShopId },
      })
      
      if (!shop) {
        // Versuche als Shop.tenantId zu verwenden
        const shopByTenantId = await prisma.shop.findUnique({
          where: { tenantId: tenantIdOrShopId },
        })
        if (shopByTenantId) {
          shopId = shopByTenantId.id
        }
      }

      const where: {
        tenantId: string
        status?: string
        method?: string
        customerId?: string
        invoiceId?: string
      } = {
        tenantId: shopId, // Verweist auf Shop.id (Foreign Key)
      }

      if (filters?.status) {
        where.status = filters.status as any
      }
      if (filters?.method) {
        where.method = filters.method as any
      }
      if (filters?.customerId) {
        where.customerId = filters.customerId
      }
      if (filters?.invoiceId) {
        where.invoiceId = filters.invoiceId
      }

      const payments = await prisma.payment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return payments
    } catch (error) {
      console.error('[PaymentService] Error listing payments:', error)
      throw error
    }
  }

  /**
   * Einzelne Zahlung abrufen
   * WICHTIG: tenantId kann Shop.id oder Shop.tenantId sein - wird automatisch erkannt
   */
  async getPayment(paymentId: string, tenantIdOrShopId: string) {
    try {
      // Konvertiere tenantId (Shop.tenantId) zu shopId (Shop.id) falls nötig
      let shopId: string = tenantIdOrShopId
      
      const shop = await prisma.shop.findUnique({
        where: { id: tenantIdOrShopId },
      })
      
      if (!shop) {
        // Versuche als Shop.tenantId zu verwenden
        const shopByTenantId = await prisma.shop.findUnique({
          where: { tenantId: tenantIdOrShopId },
        })
        if (shopByTenantId) {
          shopId = shopByTenantId.id
        }
      }

      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          tenantId: shopId, // Verweist auf Shop.id (Foreign Key)
        },
        include: {
          customer: true,
          invoice: true,
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
        },
      })

      return payment
    } catch (error) {
      console.error('[PaymentService] Error getting payment:', error)
      throw error
    }
  }
}

// Singleton-Instanz
export const paymentService = new PaymentService()

