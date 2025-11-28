/**
 * Startseite
 * Leitet zu Login oder Dashboard weiter
 */
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()


  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Multi-Tenant SaaS System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Willkommen! Bitte melden Sie sich an oder erstellen Sie ein neues Konto.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Anmelden
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Registrieren
          </Link>
        </div>
      </div>
    </div>
  )
}

