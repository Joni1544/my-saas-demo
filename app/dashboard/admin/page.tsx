/**
 * Admin Dashboard
 * Übersicht für Administratoren: Mitarbeiter, Einladungen, Statistiken
 */
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import InvitationsList from '@/components/InvitationsList'
import EmployeesList from '@/components/EmployeesList'
import ReassignmentsBox from '@/components/ReassignmentsBox'

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  if (!session.user.tenantId) {
    redirect('/dashboard')
  }

  // Shop-Name aus DB holen
  const shop = await prisma.shop.findFirst({
    where: { tenantId: session.user.tenantId },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          {shop && (
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{shop.name}</h1>
          )}
          <div className="text-sm text-gray-500 mb-6">Admin Dashboard</div>
          <p className="text-gray-600">
            Verwalten Sie Mitarbeiter, Einladungen und Firmeneinstellungen
          </p>
        </div>

        {/* Reassignments Box */}
        <div className="mb-6">
          <ReassignmentsBox />
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

