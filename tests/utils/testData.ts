/**
 * Testdaten-Generator für FuerstFlow Tests
 * Erstellt isolierte Testdaten pro Tenant
 */
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Helper: Konvertiert tenantId (Shop.tenantId) zu shopId (Shop.id)
 */
async function getShopIdByTenantId(tenantId: string): Promise<string> {
  const shop = await prisma.shop.findUnique({
    where: { tenantId },
    select: { id: true },
  })
  
  if (!shop) {
    throw new Error(`Shop with tenantId ${tenantId} not found`)
  }
  
  return shop.id
}

export interface TestTenant {
  tenantId: string
  shopId: string
}

export interface TestUser {
  id: string
  email: string
  tenantId: string
}

export interface TestCustomer {
  id: string
  tenantId: string
}

export interface TestInvoice {
  id: string
  tenantId: string
  invoiceNumber: string
}

export interface TestPayment {
  id: string
  tenantId: string
}

export interface TestTemplate {
  id: string
  tenantId: string
}

export interface TestReminder {
  id: string
  tenantId: string
  invoiceId: string
}

/**
 * Erstellt einen Test-Tenant (Shop)
 */
export async function createTestTenant(name: string = 'Test Company'): Promise<TestTenant> {
  const tenantId = `test-tenant-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  const shop = await prisma.shop.create({
    data: {
      tenantId,
      name,
      email: `test-${Date.now()}@example.com`,
      phone: '+491234567890',
      address: 'Teststraße 123, 12345 Teststadt',
    },
  })

  return {
    tenantId: shop.tenantId,
    shopId: shop.id,
  }
}

/**
 * Erstellt einen Test-User
 */
export async function createTestUser(
  shopId: string, // Shop.id (nicht tenantId!)
  email: string = `test-${Date.now()}@example.com`,
  role: 'ADMIN' | 'MITARBEITER' = 'ADMIN'
): Promise<TestUser> {
  const hashedPassword = await hash('testpassword123', 10)

  // Hole Shop um tenantId zu bekommen
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
  })

  if (!shop) {
    throw new Error(`Shop with id ${shopId} not found`)
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Test User',
      role,
      tenantId: shopId, // Verweist auf Shop.id
    },
  })

  return {
    id: user.id,
    email: user.email,
    tenantId: shop.tenantId, // Verwende Shop.tenantId für Rückgabe
  }
}

/**
 * Erstellt einen Test-Kunden
 * WICHTIG: tenantId muss Shop.id sein (nicht Shop.tenantId!)
 */
export async function createTestCustomer(
  shopId: string, // Shop.id (nicht tenantId!)
  firstName: string = 'Max',
  lastName: string = 'Mustermann'
): Promise<TestCustomer> {
  // Hole Shop um tenantId zu bekommen
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
  })

  if (!shop) {
    throw new Error(`Shop with id ${shopId} not found`)
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId: shopId, // Verweist auf Shop.id (Foreign Key)
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: '+491234567890',
      address: 'Kundenstraße 456, 12345 Teststadt',
    },
  })

  return {
    id: customer.id,
    tenantId: shop.tenantId, // Verwende Shop.tenantId für Rückgabe
  }
}

/**
 * Erstellt einen Test-Mitarbeiter
 * WICHTIG: tenantId kann Shop.id oder Shop.tenantId sein - wird automatisch erkannt
 */
export async function createTestEmployee(
  tenantIdOrShopId: string,
  userId: string
): Promise<{ id: string; tenantId: string }> {
  // Prüfe ob es Shop.id oder Shop.tenantId ist
  let shopId: string
  let shopTenantId: string
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: tenantIdOrShopId },
    })
    
    if (shop) {
      shopId = shop.id
      shopTenantId = shop.tenantId
    } else {
      shopId = await getShopIdByTenantId(tenantIdOrShopId)
      shopTenantId = tenantIdOrShopId
    }
  } catch {
    shopId = tenantIdOrShopId
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { tenantId: true },
    })
    shopTenantId = shop?.tenantId || tenantIdOrShopId
  }

  const employee = await prisma.employee.create({
    data: {
      tenantId: shopId, // Verweist auf Shop.id (Foreign Key)
      userId,
      position: 'Test Position',
      color: '#3B82F6',
      isActive: true,
      active: true,
    },
  })

  return {
    id: employee.id,
    tenantId: shopTenantId, // Verwende Shop.tenantId für Rückgabe
  }
}

/**
 * Erstellt eine Test-Rechnung
 * WICHTIG: tenantId kann Shop.id oder Shop.tenantId sein - wird automatisch erkannt
 */
export async function createTestInvoice(
  tenantIdOrShopId: string,
  customerId?: string,
  amount: number = 100.0,
  dueDate?: Date
): Promise<TestInvoice> {
  // Prüfe ob es Shop.id oder Shop.tenantId ist
  let shopId: string
  let shopTenantId: string
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: tenantIdOrShopId },
    })
    
    if (shop) {
      shopId = shop.id
      shopTenantId = shop.tenantId
    } else {
      shopId = await getShopIdByTenantId(tenantIdOrShopId)
      shopTenantId = tenantIdOrShopId
    }
  } catch {
    shopId = tenantIdOrShopId
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { tenantId: true },
    })
    shopTenantId = shop?.tenantId || tenantIdOrShopId
  }

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: shopId, // Verweist auf Shop.id (Foreign Key)
      customerId: customerId || null,
      invoiceNumber: `TEST-${Date.now()}`,
      amount,
      currency: 'EUR',
      status: 'PENDING',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Tage in der Zukunft
      reminderLevel: 0,
    },
  })

  return {
    id: invoice.id,
    tenantId: shopTenantId, // Verwende Shop.tenantId für Rückgabe
    invoiceNumber: invoice.invoiceNumber,
  }
}

/**
 * Erstellt eine überfällige Test-Rechnung
 * WICHTIG: tenantId kann Shop.id oder Shop.tenantId sein - wird automatisch erkannt
 */
export async function createOverdueInvoice(
  tenantIdOrShopId: string,
  customerId?: string,
  daysOverdue: number = 5
): Promise<TestInvoice> {
  // Prüfe ob es Shop.id oder Shop.tenantId ist
  let shopId: string
  let shopTenantId: string
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: tenantIdOrShopId },
    })
    
    if (shop) {
      shopId = shop.id
      shopTenantId = shop.tenantId
    } else {
      shopId = await getShopIdByTenantId(tenantIdOrShopId)
      shopTenantId = tenantIdOrShopId
    }
  } catch {
    shopId = tenantIdOrShopId
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { tenantId: true },
    })
    shopTenantId = shop?.tenantId || tenantIdOrShopId
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() - daysOverdue)

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: shopId, // Verweist auf Shop.id (Foreign Key)
      customerId: customerId || null,
      invoiceNumber: `OVERDUE-${Date.now()}`,
      amount: 150.0,
      currency: 'EUR',
      status: 'OVERDUE',
      dueDate,
      reminderLevel: 0,
    },
  })

  return {
    id: invoice.id,
    tenantId: shopTenantId, // Verwende Shop.tenantId für Rückgabe
    invoiceNumber: invoice.invoiceNumber,
  }
}

/**
 * Erstellt eine Test-Zahlung
 */
export async function createTestPayment(
  tenantIdOrShopId: string,
  invoiceId?: string,
  customerId?: string,
  amount: number = 100.0,
  method: 'STRIPE_CARD' | 'CASH' | 'BANK_TRANSFER' = 'STRIPE_CARD',
  status: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING'
): Promise<TestPayment> {
  // Prüfe ob es Shop.id oder Shop.tenantId ist
  let shopId: string
  let shopTenantId: string
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: tenantIdOrShopId },
    })
    
    if (shop) {
      shopId = shop.id
      shopTenantId = shop.tenantId
    } else {
      shopId = await getShopIdByTenantId(tenantIdOrShopId)
      shopTenantId = tenantIdOrShopId
    }
  } catch {
    shopId = tenantIdOrShopId
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { tenantId: true },
    })
    shopTenantId = shop?.tenantId || tenantIdOrShopId
  }

  const payment = await prisma.payment.create({
    data: {
      tenantId: shopId, // Verweist auf Shop.id
      invoiceId: invoiceId || null,
      customerId: customerId || null,
      amount,
      currency: 'EUR',
      method,
      status,
      paidAt: status === 'PAID' ? new Date() : null,
    },
  })

  return {
    id: payment.id,
    tenantId: shopTenantId, // Verwende Shop.tenantId für Rückgabe
  }
}

/**
 * Erstellt ein Test-Template
 * WICHTIG: tenantId kann Shop.id oder Shop.tenantId sein - wird automatisch erkannt
 */
export async function createTestTemplate(
  tenantIdOrShopId: string,
  name: string = 'Test Template'
): Promise<TestTemplate> {
  // Prüfe ob es Shop.id oder Shop.tenantId ist
  let shopId: string
  let shopTenantId: string
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: tenantIdOrShopId },
    })
    
    if (shop) {
      shopId = shop.id
      shopTenantId = shop.tenantId
    } else {
      shopId = await getShopIdByTenantId(tenantIdOrShopId)
      shopTenantId = tenantIdOrShopId
    }
  } catch {
    shopId = tenantIdOrShopId
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { tenantId: true },
    })
    shopTenantId = shop?.tenantId || tenantIdOrShopId
  }

  const template = await prisma.invoiceTemplate.create({
    data: {
      tenantId: shopId, // Verweist auf Shop.id (Foreign Key)
      name,
      description: 'Test Template Description',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      layoutType: 'modern',
      headerText: 'Test Header',
      footerText: 'Test Footer',
      isDefault: false,
    },
  })

  return {
    id: template.id,
    tenantId: shopTenantId, // Verwende Shop.tenantId für Rückgabe
  }
}

/**
 * Erstellt eine Test-Mahnung
 * WICHTIG: tenantId kann Shop.id oder Shop.tenantId sein - wird automatisch erkannt
 */
export async function createTestReminder(
  tenantIdOrShopId: string,
  invoiceId: string,
  level: number = 1,
  status: 'PENDING' | 'SENT' | 'FAILED' = 'PENDING'
): Promise<TestReminder> {
  // Prüfe ob es Shop.id oder Shop.tenantId ist
  let shopId: string
  let shopTenantId: string
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: tenantIdOrShopId },
    })
    
    if (shop) {
      shopId = shop.id
      shopTenantId = shop.tenantId
    } else {
      shopId = await getShopIdByTenantId(tenantIdOrShopId)
      shopTenantId = tenantIdOrShopId
    }
  } catch {
    shopId = tenantIdOrShopId
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { tenantId: true },
    })
    shopTenantId = shop?.tenantId || tenantIdOrShopId
  }

  const reminder = await prisma.invoiceReminder.create({
    data: {
      tenantId: shopId, // Verweist auf Shop.id (Foreign Key)
      invoiceId,
      level,
      status,
      method: 'manual',
      aiText: level === 2 ? 'Test AI Text' : null,
    },
  })

  return {
    id: reminder.id,
    tenantId: shopTenantId, // Verwende Shop.tenantId für Rückgabe
    invoiceId: reminder.invoiceId,
  }
}

/**
 * Bereinigt alle Testdaten für einen Tenant
 */
export async function cleanupTestData(tenantId: string): Promise<void> {
  try {
    // Hole Shop um shopId zu bekommen
    const shop = await prisma.shop.findUnique({
      where: { tenantId },
      select: { id: true },
    })

    if (shop) {
      // Lösche in der richtigen Reihenfolge (wegen Foreign Keys)
      await prisma.invoiceReminder.deleteMany({ where: { tenantId } })
      await prisma.payment.deleteMany({ where: { tenantId } })
      await prisma.invoice.deleteMany({ where: { tenantId } })
      await prisma.invoiceTemplate.deleteMany({ where: { tenantId } })
      await prisma.aiUsage.deleteMany({ where: { tenantId } })
      await prisma.aiBilling.deleteMany({ where: { tenantId } })
      await prisma.appointment.deleteMany({ where: { tenantId: { contains: tenantId } } })
      await prisma.task.deleteMany({ where: { tenantId } })
      await prisma.customer.deleteMany({ where: { tenantId } })
      await prisma.employee.deleteMany({ where: { tenantId } })
      
      // User löschen - muss über Shop.id erfolgen (Foreign Key)
      await prisma.user.deleteMany({ where: { tenantId: shop.id } })
      
      // Shop zuletzt löschen
      await prisma.shop.deleteMany({ where: { tenantId } })
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error)
  }
}

/**
 * Erstellt einen vollständigen Test-Setup (Tenant + User + Customer)
 */
export async function createFullTestSetup() {
  const tenant = await createTestTenant()
  const user = await createTestUser(tenant.shopId) // Verwende shopId statt tenantId
  const customer = await createTestCustomer(tenant.shopId) // Verwende shopId statt tenantId
  
  return {
    tenant,
    user,
    customer,
    cleanup: async () => {
      await cleanupTestData(tenant.tenantId)
    },
  }
}

