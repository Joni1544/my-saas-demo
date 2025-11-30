/**
 * Invite Modal Component
 * Modal zum Erstellen einer neuen Einladung
 */
'use client'

import { useState } from 'react'
import { inputBase } from '@/lib/inputStyles'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function InviteModal({ isOpen, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'MITARBEITER' | 'ADMIN'>('MITARBEITER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Fehler beim Erstellen der Einladung')
        return
      }

      setSuccess('Einladung erfolgreich erstellt!')
      setInviteLink(data.invitation.inviteLink)
      setEmail('')
      onSuccess()
    } catch (err) {
      console.error('Fehler:', err)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      alert('Link in Zwischenablage kopiert!')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Mitarbeiter einladen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Schließen"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-800">{success}</p>
            {inviteLink && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-1">Einladungslink:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    aria-label="Einladungslink"
                    className={`flex-1 ${inputBase} text-sm`}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
                  >
                    Kopieren
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email-Adresse *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 ${inputBase}`}
                placeholder="mitarbeiter@example.com"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rolle *
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'MITARBEITER' | 'ADMIN')}
                className={`mt-1 ${inputBase}`}
              >
                <option value="MITARBEITER">Mitarbeiter</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Wird erstellt...' : 'Einladung erstellen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

