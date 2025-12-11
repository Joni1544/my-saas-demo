/**
 * Invoice Template Service für FuerstFlow
 * Verwaltung von Rechnungstemplates
 */
import { prisma } from '@/lib/prisma'

export interface CreateTemplateData {
  tenantId: string
  name: string
  description?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  layoutType?: string
  headerText?: string
  footerText?: string
  defaultItems?: Array<{ description: string; amount: number }>
  isDefault?: boolean
}

export interface UpdateTemplateData {
  name?: string
  description?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  layoutType?: string
  headerText?: string
  footerText?: string
  defaultItems?: Array<{ description: string; amount: number }>
  isDefault?: boolean
}

class InvoiceTemplateService {
  /**
   * Template erstellen
   */
  async createTemplate(data: CreateTemplateData) {
    try {
      // Wenn als Standard markiert, entferne Standard von anderen Templates
      if (data.isDefault) {
        await prisma.invoiceTemplate.updateMany({
          where: {
            tenantId: data.tenantId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        })
      }

      const template = await prisma.invoiceTemplate.create({
        data: {
          tenantId: data.tenantId,
          name: data.name,
          description: data.description || null,
          logoUrl: data.logoUrl || null,
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#1E40AF',
          layoutType: data.layoutType || 'modern',
          headerText: data.headerText || null,
          footerText: data.footerText || null,
          defaultItems: data.defaultItems ? JSON.stringify(data.defaultItems) : null,
          isDefault: data.isDefault || false,
        },
      })

      return template
    } catch (error) {
      console.error('[InvoiceTemplateService] Error creating template:', error)
      throw error
    }
  }

  /**
   * Templates auflisten
   */
  async listTemplates(tenantId: string) {
    try {
      const templates = await prisma.invoiceTemplate.findMany({
        where: {
          tenantId,
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      })

      return templates.map((template) => ({
        ...template,
        defaultItems: template.defaultItems ? JSON.parse(template.defaultItems as string) : null,
      }))
    } catch (error) {
      console.error('[InvoiceTemplateService] Error listing templates:', error)
      throw error
    }
  }

  /**
   * Template abrufen
   */
  async getTemplate(templateId: string, tenantId: string) {
    try {
      const template = await prisma.invoiceTemplate.findFirst({
        where: {
          id: templateId,
          tenantId,
        },
      })

      if (!template) {
        return null
      }

      return {
        ...template,
        defaultItems: template.defaultItems ? JSON.parse(template.defaultItems as string) : null,
      }
    } catch (error) {
      console.error('[InvoiceTemplateService] Error getting template:', error)
      throw error
    }
  }

  /**
   * Standard-Template abrufen
   */
  async getDefaultTemplate(tenantId: string) {
    try {
      const template = await prisma.invoiceTemplate.findFirst({
        where: {
          tenantId,
          isDefault: true,
        },
      })

      if (!template) {
        // Erstelle Standard-Template falls keines existiert
        return await this.createDefaultTemplate(tenantId)
      }

      return {
        ...template,
        defaultItems: template.defaultItems ? JSON.parse(template.defaultItems as string) : null,
      }
    } catch (error) {
      console.error('[InvoiceTemplateService] Error getting default template:', error)
      throw error
    }
  }

  /**
   * Standard-Template erstellen
   */
  private async createDefaultTemplate(tenantId: string) {
    return await this.createTemplate({
      tenantId,
      name: 'Standard-Template',
      description: 'Standard-Rechnungstemplate',
      layoutType: 'modern',
      isDefault: true,
    })
  }

  /**
   * Template aktualisieren
   */
  async updateTemplate(templateId: string, tenantId: string, data: UpdateTemplateData) {
    try {
      // Wenn als Standard markiert, entferne Standard von anderen Templates
      if (data.isDefault) {
        await prisma.invoiceTemplate.updateMany({
          where: {
            tenantId,
            isDefault: true,
            id: {
              not: templateId,
            },
          },
          data: {
            isDefault: false,
          },
        })
      }

      const template = await prisma.invoiceTemplate.update({
        where: {
          id: templateId,
          tenantId,
        },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
          ...(data.primaryColor && { primaryColor: data.primaryColor }),
          ...(data.secondaryColor && { secondaryColor: data.secondaryColor }),
          ...(data.layoutType && { layoutType: data.layoutType }),
          ...(data.headerText !== undefined && { headerText: data.headerText }),
          ...(data.footerText !== undefined && { footerText: data.footerText }),
          ...(data.defaultItems && { defaultItems: JSON.stringify(data.defaultItems) }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      })

      return {
        ...template,
        defaultItems: template.defaultItems ? JSON.parse(template.defaultItems as string) : null,
      }
    } catch (error) {
      console.error('[InvoiceTemplateService] Error updating template:', error)
      throw error
    }
  }

  /**
   * Template löschen
   */
  async deleteTemplate(templateId: string, tenantId: string) {
    try {
      await prisma.invoiceTemplate.delete({
        where: {
          id: templateId,
          tenantId,
        },
      })
    } catch (error) {
      console.error('[InvoiceTemplateService] Error deleting template:', error)
      throw error
    }
  }
}

// Singleton-Instanz
export const invoiceTemplateService = new InvoiceTemplateService()

