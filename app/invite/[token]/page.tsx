/**
 * Invite-Seite
 * Zeigt Einladungsdetails und leitet zur Registrierung weiter
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface InvitationData {
  id: string
  email: string | null
  role: string
  shopName: string
  shopId: string
  tenantId: string
  createdBy: string
  expiresAt: string
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      validateInvitation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const validateInvitation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/validate?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ungültiger Einladungslink')
        return
      }

      setInvitation(data.invitation)
    } catch (err) {
      console.error('Fehler beim Validieren:', err)
      setError('Fehler beim Laden der Einladung')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    // Weiterleitung zur Registrierung mit Token
    router.push(`/register?invite=${token}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
          <p className="text-gray-600">Lade Einladung...</p>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Einladung ungültig</h2>
            <p className="mb-6 text-gray-600">{error || 'Diese Einladung konnte nicht gefunden werden.'}</p>
            <Link
              href="/login"
              className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Sie wurden eingeladen!</h2>
          <p className="mb-6 text-gray-600">
            Sie wurden von <strong>{invitation.createdBy}</strong> eingeladen, bei{' '}
            <strong>{invitation.shopName}</strong> als{' '}
            <strong>{invitation.role === 'ADMIN' ? 'Administrator' : 'Mitarbeiter'}</strong> zu arbeiten.
          </p>

          {invitation.email && (
            <div className="mb-6 rounded-md bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                <strong>Eingeladene Email:</strong> {invitation.email}
              </p>
            </div>
          )}

          <div className="mb-6 space-y-2 text-sm text-gray-500">
            <p>• Diese Einladung ist gültig bis: {new Date(invitation.expiresAt).toLocaleDateString('de-DE')}</p>
            <p>• Nach der Registrierung erhalten Sie automatisch Zugang zum System</p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Konto erstellen
          </button>

          <p className="mt-4 text-sm text-gray-500">
            Bereits ein Konto?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

