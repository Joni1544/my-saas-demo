/**
 * Event Types für FuerstFlow Event-Bus
 * Alle Event-Namen werden hier zentral definiert
 */

export type EventName =
  // Customer Events
  | 'customer.created'
  | 'customer.updated'
  | 'customer.archived'
  
  // Appointment Events
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'appointment.completed'
  | 'appointment.rescheduled'
  
  // Employee Events
  | 'employee.created'
  | 'employee.updated'
  | 'employee.sick'
  | 'employee.vacation'
  | 'employee.available'
  
  // Task Events
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'task.overdue'
  
  // Invoice Events
  | 'invoice.created'
  | 'invoice.overdue'
  | 'invoice.paid'
  
  // Payment Events
  | 'payment.created'
  | 'payment.paid'
  | 'payment.failed'
  | 'payment.refunded'
  
  // Inventory Events
  | 'inventory.low'
  | 'inventory.updated'
  
  // Expense Events
  | 'expense.created'
  | 'expense.recurring_generated'
  
  // System Events
  | 'system.daily_report_generated'
  | 'system.automation_triggered'

/**
 * Event Payload Types
 */
export interface BaseEventPayload {
  tenantId: string
  timestamp: Date
  userId?: string
}

export interface CustomerCreatedPayload extends BaseEventPayload {
  customerId: string
  customerName: string
}

export interface AppointmentCreatedPayload extends BaseEventPayload {
  appointmentId: string
  customerId?: string
  employeeId?: string
  startTime: Date
  endTime: Date
}

export interface AppointmentUpdatedPayload extends BaseEventPayload {
  appointmentId: string
  changes: Record<string, unknown>
}

export interface AppointmentCancelledPayload extends BaseEventPayload {
  appointmentId: string
  reason?: string
}

export interface EmployeeSickPayload extends BaseEventPayload {
  employeeId: string
  employeeName: string
  returnDate?: Date
}

export interface EmployeeVacationPayload extends BaseEventPayload {
  employeeId: string
  employeeName: string
  startDate: Date
  endDate: Date
}

export interface TaskCreatedPayload extends BaseEventPayload {
  taskId: string
  assignedTo?: string
  priority: string
  deadline?: Date
}

export interface TaskOverduePayload extends BaseEventPayload {
  taskId: string
  assignedTo?: string
  deadline: Date
}

export interface InvoiceOverduePayload extends BaseEventPayload {
  invoiceId: string
  customerId: string
  amount: number
  dueDate: Date
}

export interface InvoicePaidPayload extends BaseEventPayload {
  invoiceId: string
  amount: number
  customerId?: string
}

export interface InventoryLowPayload extends BaseEventPayload {
  itemId: string
  itemName: string
  currentQuantity: number
  minThreshold: number
}

export interface PaymentCreatedPayload extends BaseEventPayload {
  paymentId: string
  amount: number
  method: string
  invoiceId?: string
  customerId?: string
}

export interface PaymentPaidPayload extends BaseEventPayload {
  paymentId: string
  amount: number
  method: string
  invoiceId?: string
  customerId?: string
}

export interface PaymentFailedPayload extends BaseEventPayload {
  paymentId: string
  amount: number
  method: string
  invoiceId?: string
  customerId?: string
}

export interface PaymentRefundedPayload extends BaseEventPayload {
  paymentId: string
  amount: number
  method: string
  invoiceId?: string
}

export interface AiUsageRecordedPayload extends BaseEventPayload {
  usageId: string
  feature: string
  totalTokens: number
  cost: number
  aiProvider: string
}

export interface InvoiceReminderCreatedPayload extends BaseEventPayload {
  invoiceId: string
  reminderId: string
  level: number
}

export interface InvoiceReminderSentPayload extends BaseEventPayload {
  invoiceId: string
  reminderId: string
  level: number
}

export interface InvoiceReminderFailedPayload extends BaseEventPayload {
  invoiceId: string
  reminderId: string
  level: number
}

export interface InvoiceReminderEscalatedPayload extends BaseEventPayload {
  invoiceId: string
  level: number
}

export interface InvoiceReminderStoppedPayload extends BaseEventPayload {
  invoiceId: string
}

export type EventPayload =
  | CustomerCreatedPayload
  | AppointmentCreatedPayload
  | AppointmentUpdatedPayload
  | AppointmentCancelledPayload
  | EmployeeSickPayload
  | EmployeeVacationPayload
  | TaskCreatedPayload
  | TaskOverduePayload
  | InvoiceOverduePayload
  | InvoicePaidPayload
  | InventoryLowPayload
  | PaymentCreatedPayload
  | PaymentPaidPayload
  | PaymentFailedPayload
  | PaymentRefundedPayload
  | AiUsageRecordedPayload
  | InvoiceReminderCreatedPayload
  | InvoiceReminderSentPayload
  | InvoiceReminderFailedPayload
  | InvoiceReminderEscalatedPayload
  | InvoiceReminderStoppedPayload
  | BaseEventPayload

