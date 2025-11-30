/**
 * Registrierungsseite
 * Erstellt neuen Benutzer und Shop (Tenant)
 */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface InvitationData {
  email: string | null
  role: string
  shopName: string
  shopId: string
  tenantId: string
  createdBy: string
}

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    shopName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validatingInvite, setValidatingInvite] = useState(false)

  useEffect(() => {
    if (inviteToken) {
      validateInvite()
    }
  }, [inviteToken])

  const validateInvite = async () => {
    try {
      setValidatingInvite(true)
      const response = await fetch(`/api/invitations/validate?token=${inviteToken}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ungültiger Einladungslink')
        return
      }

      setInvitation(data.invitation)
      // Setze Email voraus, wenn in Einladung vorhanden
      if (data.invitation.email) {
        setFormData(prev => ({
          ...prev,
          email: data.invitation.email,
        }))
      }
      // Shop-Name wird nicht benötigt bei Invite
      setFormData(prev => ({
        ...prev,
        shopName: data.invitation.shopName,
      }))
    } catch (err) {
      console.error('Fehler beim Validieren:', err)
      setError('Fehler beim Laden der Einladung')
    } finally {
      setValidatingInvite(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          inviteToken: inviteToken || undefined, // Füge Token hinzu, falls vorhanden
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registrierung fehlgeschlagen')
        return
      }

      // Nach erfolgreicher Registrierung zum Login weiterleiten
      router.push('/login?registered=true')
    } catch {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {invitation ? 'Konto erstellen' : 'Neues Konto erstellen'}
          </h2>
          {invitation ? (
            <div className="mt-4 rounded-md bg-indigo-50 p-4">
              <p className="text-center text-sm text-indigo-800">
                <strong>Sie wurden eingeladen!</strong>
                <br />
                Sie werden bei <strong>{invitation.shopName}</strong> als{' '}
                <strong>{invitation.role === 'ADMIN' ? 'Administrator' : 'Mitarbeiter'}</strong> arbeiten.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-center text-sm text-gray-600">
              Oder{' '}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                melden Sie sich an
              </Link>
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            {!invitation && (
              <div>
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                  Firmenname *
                </label>
                <input
                  id="shopName"
                  name="shopName"
                  type="text"
                  required={!invitation}
                  value={formData.shopName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Ihr Firmenname"
                />
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Ihr Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Ihr Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email-Adresse *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={!!invitation?.email} // Disable wenn Email aus Invite kommt
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm sm:leading-6"
                placeholder="ihre@email.de"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Mindestens 8 Zeichen"
                minLength={8}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Wird erstellt...' : 'Konto erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Lade...</p></div>}>
      <RegisterPageContent />
    </Suspense>
  )
}

