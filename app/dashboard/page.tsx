/**
 * Dashboard-Seite
 * Hauptübersicht mit Statistiken und Kalender
 */
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardStats from '@/components/DashboardStats'
import Calendar from '@/components/Calendar'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

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

        {/* Statistiken */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Übersicht
          </h2>
          <DashboardStats />
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
  )
}

