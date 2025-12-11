/**
 * Invoice Detail Page
 * Rechnungs-Detailseite mit Zahlungsbereich
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import PaymentCard from '@/components/payments/PaymentCard'
import PaymentTimeline from '@/components/payments/PaymentTimeline'
import RecordPaymentDialog from '@/components/payments/RecordPaymentDialog'
import ApplePayButton from '@/components/payments/ApplePayButton'
import GooglePayButton from '@/components/payments/GooglePayButton'
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge'
import TemplateSelector from '@/components/invoices/templates/TemplateSelector'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  dueDate: string | null
  paidAt: string | null
  reminderLevel: number
  description: string | null
  createdAt: string
  customer: {
    id: string
    firstName: string
    lastName: string
  } | null
  employee: {
    id: string
    user: {
      name: string | null
      email: string
    }
  } | null
  payments: Array<{
    id: string
    amount: number
    currency: string
    method: string
    status: string
    transactionId?: string | null
    reference?: string | null
    paidAt?: string | null
    createdAt: string
  }>
}

interface Reminder {
  id: string
  level: number
  status: string
  reminderDate: string
  method: string | null
  aiText: string | null
  createdAt: string
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [showPaymentLink, setShowPaymentLink] = useState(false)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null)
  const [loadingTerminal, setLoadingTerminal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showCreateReminder, setShowCreateReminder] = useState(false)
  const [generatingReminderText, setGeneratingReminderText] = useState(false)

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Rechnung')
      const data = await response.json()
      setInvoice(data.invoice)
      setSelectedTemplateId(data.invoice.templateId)
      
      // Lade Mahnungen
      fetchReminders(data.invoice.id)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReminders = async (invId: string) => {
    try {
      const response = await fetch(`/api/invoices/reminders?invoiceId=${invId}`)
      if (response.ok) {
        const data = await response.json()
        setReminders(data.reminders || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mahnungen:', error)
    }
  }

  const handleCreateReminder = async (level: number) => {
    try {
      setGeneratingReminderText(true)
      
      // Generiere KI-Mahntext
      let aiText: string | undefined
      try {
        const aiResponse = await fetch('/api/ai/reminder-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            invoiceAmount: invoice?.amount,
            companyMood: 'neutral',
          }),
        })
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          aiText = aiData.reminderText
        }
      } catch (error) {
        console.error('Fehler beim Generieren des Mahntexts:', error)
      }

      // Erstelle Mahnung
      const response = await fetch('/api/invoices/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice?.id,
          level,
          method: 'manual',
          aiText,
        }),
      })

      if (!response.ok) throw new Error('Fehler beim Erstellen der Mahnung')

      await fetchReminders(invoiceId)
      setShowCreateReminder(false)
      fetchInvoice()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Erstellen der Mahnung')
    } finally {
      setGeneratingReminderText(false)
    }
  }

  const calculateDaysOverdue = (dueDate: string | null) => {
    if (!dueDate) return 0
    const now = new Date()
    const days = Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  const handleCreatePaymentLink = async () => {
    try {
      const response = await fetch('/api/payments/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: invoice?.amount,
          currency: invoice?.currency,
          invoiceId: invoice?.id,
          customerId: invoice?.customer?.id,
          description: `Rechnung ${invoice?.invoiceNumber}`,
        }),
      })

      if (!response.ok) throw new Error('Fehler beim Erstellen des Payment Links')

      const data = await response.json()
      setPaymentLinkUrl(data.paymentLink.url)
      setShowPaymentLink(true)
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Erstellen des Payment Links')
    }
  }

  const handleStartTerminal = async () => {
    try {
      setLoadingTerminal(true)
      const response = await fetch('/api/payments/stripe/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: invoice?.amount,
          currency: invoice?.currency,
          invoiceId: invoice?.id,
          customerId: invoice?.customer?.id,
          description: `Rechnung ${invoice?.invoiceNumber}`,
        }),
      })

      if (!response.ok) throw new Error('Fehler beim Starten des Terminal Payments')

      const data = await response.json()
      alert(`Terminal Payment gestartet. Client Secret: ${data.paymentIntent.clientSecret}`)
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Starten des Terminal Payments')
    } finally {
      setLoadingTerminal(false)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount)
  }

  const totalPaid = invoice?.payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const remainingAmount = Number(invoice?.amount || 0) - totalPaid

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Lade Rechnung...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Rechnung nicht gefunden</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/invoices"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Rechnung {invoice.invoiceNumber}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <InvoiceStatusBadge status={invoice.status as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'} />
                {invoice.dueDate && (
                  <span className="text-sm text-gray-600">
                    Fällig: {format(new Date(invoice.dueDate), 'dd.MM.yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Hauptbereich */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rechnungsdetails */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Rechnungsdetails</h2>
                <div className="w-64">
                  <TemplateSelector
                    value={selectedTemplateId}
                    onChange={async (templateId) => {
                      setSelectedTemplateId(templateId)
                      // Aktualisiere Template in Rechnung
                      try {
                        const response = await fetch(`/api/invoices/${invoiceId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ templateId }),
                        })
                        if (response.ok) {
                          fetchInvoice()
                        }
                      } catch (error) {
                        console.error('Fehler:', error)
                      }
                    }}
                  />
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Betrag</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatAmount(Number(invoice.amount), invoice.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <InvoiceStatusBadge status={invoice.status as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'} />
                  </dd>
                </div>
                {invoice.customer && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Kunde</dt>
                    <dd className="mt-1 text-gray-900">
                      {invoice.customer.firstName} {invoice.customer.lastName}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Erstellt am</dt>
                  <dd className="mt-1 text-gray-900">
                    {format(new Date(invoice.createdAt), 'dd.MM.yyyy')}
                  </dd>
                </div>
                {invoice.paidAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Bezahlt am</dt>
                    <dd className="mt-1 text-gray-900">
                      {format(new Date(invoice.paidAt), 'dd.MM.yyyy')}
                    </dd>
                  </div>
                )}
              </dl>
              {invoice.description && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Beschreibung</dt>
                  <dd className="mt-1 text-gray-900">{invoice.description}</dd>
                </div>
              )}
            </div>

            {/* Zahlungsbereich */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">💳 Zahlungen</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRecordDialog(true)}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Zahlung erfassen
                  </button>
                  <button
                    onClick={handleCreatePaymentLink}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Payment Link erstellen
                  </button>
                  <button
                    onClick={handleStartTerminal}
                    disabled={loadingTerminal}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loadingTerminal ? 'Lädt...' : 'Terminal starten'}
                  </button>
                </div>
              </div>

              {/* Zahlungsübersicht */}
              <div className="mb-4 rounded-md bg-gray-50 p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Rechnungsbetrag</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatAmount(Number(invoice.amount), invoice.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bereits bezahlt</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatAmount(totalPaid, invoice.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Offen</p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatAmount(remainingAmount, invoice.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Zahlungsliste */}
              {invoice.payments.length === 0 ? (
                <p className="text-center text-gray-500">Noch keine Zahlungen erfasst</p>
              ) : (
                <PaymentTimeline
                  payments={invoice.payments.map((p) => ({
                    ...p,
                    createdAt: new Date(p.createdAt),
                    paidAt: p.paidAt ? new Date(p.paidAt) : null,
                  }))}
                />
              )}

              {/* Apple Pay / Google Pay Buttons */}
              {remainingAmount > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Schnellzahlung</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <ApplePayButton
                      amount={remainingAmount}
                      currency={invoice.currency}
                      onSuccess={() => {
                        fetchInvoice()
                        alert('Zahlung erfolgreich!')
                      }}
                    />
                    <GooglePayButton
                      amount={remainingAmount}
                      currency={invoice.currency}
                      onSuccess={() => {
                        fetchInvoice()
                        alert('Zahlung erfolgreich!')
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Schnellaktionen</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowRecordDialog(true)}
                  className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  💵 Barzahlung erfassen
                </button>
                <button
                  onClick={handleCreatePaymentLink}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  🔗 Zahlungslink erstellen
                </button>
                <button
                  onClick={handleStartTerminal}
                  disabled={loadingTerminal}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  🏧 Terminal starten
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={showRecordDialog}
        onClose={() => setShowRecordDialog(false)}
        invoiceId={invoice.id}
        customerId={invoice.customer?.id}
        amount={remainingAmount}
        currency={invoice.currency}
        onSuccess={() => {
          fetchInvoice()
          setShowRecordDialog(false)
        }}
      />

      {/* Payment Link Modal */}
      {showPaymentLink && paymentLinkUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Payment Link erstellt</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Link</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={paymentLinkUrl}
                  readOnly
                  className="block w-full rounded-l-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentLinkUrl)
                    alert('Link kopiert!')
                  }}
                  className="rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Kopieren
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPaymentLink(false)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

