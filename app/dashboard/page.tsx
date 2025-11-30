/**
 * Dashboard-Seite
 * Hauptübersicht mit Statistiken, Quick Actions und Kalender
 */
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardStats from '@/components/DashboardStats'
import Calendar from '@/components/Calendar'
import QuickActions from '@/components/QuickActions'
import UpcomingAppointments from '@/components/UpcomingAppointments'
import ExpenseStats from '@/components/ExpenseStats'

export default async function DashboardPage() {
  const session = await auth();
  console.log("SERVER SESSION:", session);

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Willkommen, {session.user.name || session.user.email}!
          </h1>
          <p className="mt-2 text-gray-600">
            Rolle: {session.user.role === 'ADMIN' ? 'Administrator' : 'Mitarbeiter'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions role={session.user.role} />
        </div>

            {/* Statistiken */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Übersicht
              </h2>
              <DashboardStats />
            </div>

            {/* Finanzen & Ausgaben (nur für Admin) */}
            {session.user.role === 'ADMIN' && (
              <div className="mb-8">
                <ExpenseStats />
              </div>
            )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Nächste Termine */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Nächste Termine
            </h2>
            <UpcomingAppointments />
          </div>

          {/* Kalender */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Kalender
            </h2>
            <Calendar />
          </div>
        </div>
      </div>
    </div>
  )
}

