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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default async function DashboardPage() {
  const session = await auth();
  console.log("SERVER SESSION:", session);

  if (!session) {
    redirect('/login')
  }

  // Shop-Name aus DB holen
  const shop = await prisma.shop.findFirst({
    where: { tenantId: session.user.tenantId },
  })

  const userName = session.user.name || 'Benutzer'
  const shopName = shop?.name || null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="inline-block rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-1 mb-4">
            <div className="rounded-xl bg-white px-6 py-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-gray-600 text-lg">
                {shopName ? (
              <>Hier ist dein Überblick für <span className="font-semibold text-gray-900">{shopName}</span></>
            ) : (
              <span className="text-red-500 font-medium">Kein Studio zugewiesen</span>
            )}
              </p>
            </div>
          </div>
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

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Nächste Termine */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Nächste Termine
              </h2>
              <p className="text-gray-600">Ihre kommenden Termine</p>
            </div>
            <UpcomingAppointments />
          </div>

          {/* Kalender */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Kalender
              </h2>
              <p className="text-gray-600">Monatsübersicht</p>
            </div>
            <Calendar />
          </div>
        </div>
      </div>
    </div>
  )
}

