/**
 * Invoice Templates Page
 * Liste aller Templates
 */
'use client'

import TemplateList from '@/components/invoices/templates/TemplateList'

export default function InvoiceTemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TemplateList />
      </div>
    </div>
  )
}

