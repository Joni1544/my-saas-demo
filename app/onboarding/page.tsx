/**
 * Onboarding-Seite
 * Mitarbeiter aktiviert sein Konto mit Name und Passwort
 */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { inputBase } from '@/lib/inputStyles'

interface EmployeeData {
  id: string
  email: string
  name: string | null
  role: string
  shopName: string
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [employee, setEmployee] = useState<EmployeeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (token) {
      validateToken()
    } else {
      setError('Kein Token gefunden')
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const validateToken = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/onboarding/validate?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ungültiger Token')
        return
      }

      // Prüfe ob Passwort bereits gesetzt ist
      if (data.employee.hasPassword) {
        // Passwort bereits gesetzt → direkt zum Login
        router.push('/login?message=Passwort wurde bereits gesetzt. Bitte loggen Sie sich ein.')
        return
      }

      setEmployee(data.employee)
      if (data.employee.name) {
        setFormData(prev => ({ ...prev, name: data.employee.name }))
      }
    } catch (err) {
      console.error('Fehler:', err)
      setError('Fehler beim Validieren des Tokens')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: formData.name,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Fehler beim Aktivieren des Kontos')
        return
      }

      // Erfolgreich → zum Login
      router.push('/login?onboarded=true')
    } catch (err) {
      console.error('Fehler:', err)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Lade...</p>
        </div>
      </div>
    )
  }

  if (error && !employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Fehler</h2>
            <p className="mt-4 text-red-600">{error}</p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Zum Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Konto aktivieren
          </h2>
          {employee && (
            <div className="mt-4 rounded-md bg-indigo-50 p-4">
              <p className="text-center text-sm text-indigo-800">
                <strong>Willkommen bei {employee.shopName}!</strong>
                <br />
                Bitte vervollständigen Sie Ihr Profil.
              </p>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Ihr Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="Ihr vollständiger Name"
              />
            </div>

            {employee && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={employee.email}
                  disabled
                  className={`mt-1 ${inputBase} bg-gray-100 cursor-not-allowed`}
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="Mindestens 8 Zeichen"
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Passwort bestätigen <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="Passwort wiederholen"
                minLength={8}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {submitting ? 'Wird aktiviert...' : 'Konto aktivieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Lade...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}

