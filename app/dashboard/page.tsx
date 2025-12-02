/**
 * Dashboard-Seite
 * Modernisierte Hauptübersicht mit KPIs, Quick Actions, Finanzen und Kalender
 */
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardKPIs from '@/components/DashboardKPIs'
import Calendar from '@/components/Calendar'
import QuickActions from '@/components/QuickActions'
import UpcomingAppointments from '@/components/UpcomingAppointments'
import FinanceOverview from '@/components/FinanceOverview'

export default async function DashboardPage() {
  const session = await auth()

  if (!session || !session.user.tenantId) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions role={session.user.role} />
        </div>

        {/* KPI-Übersicht */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Übersicht</h2>
          </div>
          <DashboardKPIs />
        </div>

        {/* Finanzen-Kurzübersicht (nur für Admin) */}
        {session.user.role === 'ADMIN' && (
          <div className="mb-8">
            <FinanceOverview />
          </div>
        )}

        {/* Nächste Termine & Kalender */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Nächste Termine */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">Nächste Termine</h3>
              <p className="text-xs text-gray-500 mt-1">Ihre kommenden Termine</p>
            </div>
            <UpcomingAppointments />
          </div>

          {/* Kalender */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">Kalender</h3>
              <p className="text-xs text-gray-500 mt-1">Monatsübersicht</p>
            </div>
            <Calendar />
          </div>
        </div>
      </div>
    </div>
  )
}

