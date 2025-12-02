/**
 * Dashboard-Seite
 * Hauptübersicht mit Statistiken, Quick Actions und Kalender
 */
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardStats from '@/components/DashboardStats'
import Calendar from '@/components/Calendar'
import QuickActions from '@/components/QuickActions'
import UpcomingAppointments from '@/components/UpcomingAppointments'
import ExpenseStats from '@/components/ExpenseStats'

export default async function DashboardPage() {
  const session = await auth()

  if (!session || !session.user.tenantId) {
    redirect('/login')
  }

  // Shop-Name aus DB holen
  const shop = await prisma.shop.findFirst({
    where: { tenantId: session.user.tenantId },
  })


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions role={session.user.role} />
        </div>

        {/* Statistiken */}
        <div className="mb-6">
          <DashboardStats />
        </div>

        {/* Finanzen & Ausgaben (nur für Admin) */}
        {session.user.role === 'ADMIN' && (
          <div className="mb-6">
            <ExpenseStats />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Nächste Termine */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Nächste Termine
              </h2>
              <p className="text-sm text-gray-500">Ihre kommenden Termine</p>
            </div>
            <UpcomingAppointments />
          </div>

          {/* Kalender */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Kalender
              </h2>
              <p className="text-sm text-gray-500">Monatsübersicht</p>
            </div>
            <Calendar />
          </div>
        </div>
      </div>
    </div>
  )
}

