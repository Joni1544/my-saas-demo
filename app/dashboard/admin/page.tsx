/**
 * Admin Dashboard
 * Übersicht für Administratoren: Mitarbeiter, Einladungen, Statistiken
 */
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import InvitationsList from '@/components/InvitationsList'
import EmployeesList from '@/components/EmployeesList'

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie Mitarbeiter, Einladungen und Firmeneinstellungen
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Mitarbeiter */}
          <div>
            <EmployeesList />
          </div>

          {/* Einladungen */}
          <div>
            <InvitationsList />
          </div>
        </div>
      </div>
    </div>
  )
}

