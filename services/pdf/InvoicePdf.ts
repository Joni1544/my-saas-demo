/**
 * Invoice PDF Generator Service
 * Generiert PDF aus Rechnung mit Template
 */
import { invoiceService } from '../invoice/InvoiceService'
import { invoiceTemplateService } from '../invoice/InvoiceTemplateService'

export interface InvoicePdfOptions {
  invoiceId: string
  tenantId: string
}

class InvoicePdfService {
  /**
   * PDF aus Rechnung generieren
   * Gibt HTML zurück, das später zu PDF konvertiert werden kann
   */
  async generateInvoiceHtml(invoiceId: string, tenantId: string): Promise<string> {
    try {
      const invoice = await invoiceService.getInvoice(invoiceId, tenantId)
      if (!invoice) {
        throw new Error('Rechnung nicht gefunden')
      }

      // Hole Template (oder Standard-Template)
      const template = invoice.templateId
        ? await invoiceTemplateService.getTemplate(invoice.templateId, tenantId)
        : await invoiceTemplateService.getDefaultTemplate(tenantId)

      if (!template) {
        throw new Error('Template nicht gefunden')
      }

      // Generiere HTML
      return this.renderInvoiceHtml(invoice, template)
    } catch (error) {
      console.error('[InvoicePdfService] Error generating PDF:', error)
      throw error
    }
  }

  /**
   * HTML rendern
   */
  private renderInvoiceHtml(invoice: any, template: any): string {
    const primaryColor = template.primaryColor || '#3B82F6'
    const secondaryColor = template.secondaryColor || '#1E40AF'
    const layoutType = template.layoutType || 'modern'

    // Parse Items
    const items = invoice.items ? JSON.parse(invoice.items as string) : []

    // Berechne Gesamtbetrag
    const totalAmount = items.length > 0
      ? items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      : Number(invoice.amount)

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rechnung ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      line-height: 1.6;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
    }
    .header {
      background: ${primaryColor};
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      margin-bottom: 30px;
    }
    .header img {
      max-height: 60px;
      margin-bottom: 15px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .header-text {
      font-size: 14px;
      opacity: 0.9;
    }
    .invoice-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .info-section h3 {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .info-section p {
      font-size: 16px;
      color: #1f2937;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      border-bottom: 2px solid #e5e7eb;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .total-section {
      background: ${secondaryColor};
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: right;
    }
    .total-section .total-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .total-section .total-amount {
      font-size: 32px;
      font-weight: bold;
    }
    .description {
      margin-top: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    @media print {
      .invoice-container {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      ${template.logoUrl ? `<img src="${template.logoUrl}" alt="Logo" />` : ''}
      <h1>${template.headerText || 'Rechnung'}</h1>
      ${template.headerText ? `<p class="header-text">${template.headerText}</p>` : ''}
    </div>

    <div class="invoice-info">
      <div class="info-section">
        <h3>Rechnungsnummer</h3>
        <p>${invoice.invoiceNumber}</p>
        <h3 style="margin-top: 20px;">Datum</h3>
        <p>${new Date(invoice.createdAt).toLocaleDateString('de-DE')}</p>
        ${invoice.dueDate ? `
        <h3 style="margin-top: 20px;">Fälligkeitsdatum</h3>
        <p>${new Date(invoice.dueDate).toLocaleDateString('de-DE')}</p>
        ` : ''}
      </div>
      <div class="info-section">
        ${invoice.customer ? `
        <h3>Rechnungsempfänger</h3>
        <p>${invoice.customer.firstName} ${invoice.customer.lastName}</p>
        ${invoice.customer.address ? `<p style="margin-top: 5px;">${invoice.customer.address}</p>` : ''}
        ` : ''}
      </div>
    </div>

    ${items.length > 0 ? `
    <table class="items-table">
      <thead>
        <tr>
          <th>Beschreibung</th>
          <th style="text-align: right;">Betrag</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any) => `
        <tr>
          <td>${item.description || ''}</td>
          <td style="text-align: right;">${Number(item.amount || 0).toFixed(2)} €</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <div class="total-section">
      <div class="total-label">Gesamtbetrag</div>
      <div class="total-amount">${totalAmount.toFixed(2)} €</div>
    </div>

    ${invoice.description || invoice.aiDraftText ? `
    <div class="description">
      ${invoice.description || invoice.aiDraftText}
    </div>
    ` : ''}

    ${template.footerText ? `
    <div class="footer">
      ${template.footerText}
    </div>
    ` : ''}
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * PDF generieren (würde Puppeteer oder ähnliches verwenden)
   * Für jetzt: Gibt HTML zurück
   */
  async generatePdf(invoiceId: string, tenantId: string): Promise<Buffer> {
    const html = await this.generateInvoiceHtml(invoiceId, tenantId)
    
    // TODO: HTML zu PDF konvertieren mit Puppeteer oder ähnlichem
    // Für jetzt: Dummy-Implementierung
    return Buffer.from(html, 'utf-8')
  }
}

// Singleton-Instanz
export const invoicePdfService = new InvoicePdfService()

