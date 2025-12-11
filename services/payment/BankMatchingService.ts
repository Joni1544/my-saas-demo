/**
 * Bank Matching Service für FuerstFlow
 * Matcht Banküberweisungen mit offenen Rechnungen
 */
import { prisma } from '@/lib/prisma'
import { paymentService } from './PaymentService'

export interface BankTransferMatch {
  paymentId: string
  invoiceId: string
  confidence: number // 0-100
  matchReason: string
}

class BankMatchingService {
  /**
   * Banküberweisung anhand Referenz matchen
   */
  async matchByReference(reference: string, tenantId: string): Promise<BankTransferMatch[]> {
    try {
      const matches: BankTransferMatch[] = []

      // Suche nach Rechnungen mit passender Rechnungsnummer in der Referenz
      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: {
            in: ['PENDING', 'OVERDUE'],
          },
        },
      })

      for (const invoice of invoices) {
        if (reference.includes(invoice.invoiceNumber)) {
          // Finde passende Zahlung
          const payments = await prisma.payment.findMany({
            where: {
              tenantId,
              method: 'BANK_TRANSFER',
              status: 'PENDING',
              reference: {
                contains: reference,
              },
            },
          })

          for (const payment of payments) {
            matches.push({
              paymentId: payment.id,
              invoiceId: invoice.id,
              confidence: 90,
              matchReason: `Rechnungsnummer ${invoice.invoiceNumber} in Referenz gefunden`,
            })
          }
        }
      }

      return matches
    } catch (error) {
      console.error('[BankMatchingService] Error matching by reference:', error)
      throw error
    }
  }

  /**
   * Banküberweisung anhand Betrag matchen
   */
  async matchByAmount(amount: number, tenantId: string, tolerance: number = 0.01): Promise<BankTransferMatch[]> {
    try {
      const matches: BankTransferMatch[] = []

      // Suche nach Rechnungen mit passendem Betrag
      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: {
            in: ['PENDING', 'OVERDUE'],
        },
          amount: {
            gte: amount - tolerance,
            lte: amount + tolerance,
          },
        },
      })

      // Finde passende Zahlungen
      const payments = await prisma.payment.findMany({
        where: {
          tenantId,
          method: 'BANK_TRANSFER',
          status: 'PENDING',
          amount: {
            gte: amount - tolerance,
            lte: amount + tolerance,
          },
        },
      })

      for (const invoice of invoices) {
        for (const payment of payments) {
          const invoiceAmount = Number(invoice.amount)
          const paymentAmount = Number(payment.amount)
          
          if (Math.abs(invoiceAmount - paymentAmount) <= tolerance) {
            matches.push({
              paymentId: payment.id,
              invoiceId: invoice.id,
              confidence: 70,
              matchReason: `Betrag passt: ${paymentAmount}€ ≈ ${invoiceAmount}€`,
            })
          }
        }
      }

      return matches
    } catch (error) {
      console.error('[BankMatchingService] Error matching by amount:', error)
      throw error
    }
  }

  /**
   * Banküberweisung anhand Kunde matchen
   */
  async matchByCustomer(customerId: string, tenantId: string): Promise<BankTransferMatch[]> {
    try {
      const matches: BankTransferMatch[] = []

      // Suche nach offenen Rechnungen des Kunden
      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          customerId,
          status: {
            in: ['PENDING', 'OVERDUE'],
          },
        },
      })

      // Suche nach Zahlungen des Kunden
      const payments = await prisma.payment.findMany({
        where: {
          tenantId,
          customerId,
          method: 'BANK_TRANSFER',
          status: 'PENDING',
        },
      })

      for (const invoice of invoices) {
        const invoiceAmount = Number(invoice.amount)
        
        for (const payment of payments) {
          const paymentAmount = Number(payment.amount)
          
          // Prüfe ob Betrag passt
          if (Math.abs(invoiceAmount - paymentAmount) <= 0.01) {
            matches.push({
              paymentId: payment.id,
              invoiceId: invoice.id,
              confidence: 80,
              matchReason: `Kunde und Betrag passen: ${paymentAmount}€`,
            })
          }
        }
      }

      return matches
    } catch (error) {
      console.error('[BankMatchingService] Error matching by customer:', error)
      throw error
    }
  }

  /**
   * Automatisches Matching durchführen
   */
  async autoMatch(tenantId: string): Promise<BankTransferMatch[]> {
    try {
      const allMatches: BankTransferMatch[] = []

      // Hole alle offenen Banküberweisungen
      const bankPayments = await prisma.payment.findMany({
        where: {
          tenantId,
          method: 'BANK_TRANSFER',
          status: 'PENDING',
        },
      })

      for (const payment of bankPayments) {
        // Versuche verschiedene Matching-Strategien
        if (payment.reference) {
          const referenceMatches = await this.matchByReference(payment.reference, tenantId)
          allMatches.push(...referenceMatches)
        }

        const amountMatches = await this.matchByAmount(Number(payment.amount), tenantId)
        allMatches.push(...amountMatches)

        if (payment.customerId) {
          const customerMatches = await this.matchByCustomer(payment.customerId, tenantId)
          allMatches.push(...customerMatches)
        }
      }

      // Entferne Duplikate und sortiere nach Confidence
      const uniqueMatches = this.deduplicateMatches(allMatches)
      return uniqueMatches.sort((a, b) => b.confidence - a.confidence)
    } catch (error) {
      console.error('[BankMatchingService] Error in auto match:', error)
      throw error
    }
  }

  /**
   * Duplikate entfernen (bevorzuge höhere Confidence)
   */
  private deduplicateMatches(matches: BankTransferMatch[]): BankTransferMatch[] {
    const map = new Map<string, BankTransferMatch>()

    for (const match of matches) {
      const key = `${match.paymentId}-${match.invoiceId}`
      const existing = map.get(key)

      if (!existing || match.confidence > existing.confidence) {
        map.set(key, match)
      }
    }

    return Array.from(map.values())
  }

  /**
   * Match bestätigen und Payment mit Invoice verknüpfen
   */
  async confirmMatch(paymentId: string, invoiceId: string): Promise<void> {
    try {
      await paymentService.linkPaymentToInvoice(paymentId, invoiceId)
      await paymentService.markPaymentPaid(paymentId)
    } catch (error) {
      console.error('[BankMatchingService] Error confirming match:', error)
      throw error
    }
  }
}

// Singleton-Instanz
export const bankMatchingService = new BankMatchingService()

