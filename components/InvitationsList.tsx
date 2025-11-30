/**
 * Invitations List Component
 * Zeigt alle Einladungen an (nur Admin)
 */
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Invitation {
  id: string
  email: string | null
  token: string
  role: string
  expiresAt: string
  used: boolean
  usedAt: string | null
  usedBy: {
    id: string
    name: string | null
    email: string
  } | null
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  shopName: string
  inviteLink: string
  createdAt: string
}

export default function InvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [includeUsed, setIncludeUsed] = useState(false)

  useEffect(() => {
    fetchInvitations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeUsed])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations?includeUsed=${includeUsed}`)
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Einladung wirklich löschen?')) return

    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchInvitations()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    }
  }

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    alert('Link in Zwischenablage kopiert!')
  }

  if (loading) {
    return <p className="text-gray-500">Lade Einladungen...</p>
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Einladungen</h3>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeUsed}
            onChange={(e) => setIncludeUsed(e.target.checked)}
            className="rounded border-gray-300"
          />
          Verwendete anzeigen
        </label>
      </div>

      {invitations.length === 0 ? (
        <p className="text-gray-500">Keine Einladungen gefunden</p>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className={`rounded-lg border p-4 ${
                inv.used
                  ? 'border-gray-200 bg-gray-50'
                  : new Date(inv.expiresAt) < new Date()
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {inv.email || 'Keine Email'}
                    </p>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        inv.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {inv.role === 'ADMIN' ? 'Admin' : 'Mitarbeiter'}
                    </span>
                    {inv.used && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                        Verwendet
                      </span>
                    )}
                    {!inv.used && new Date(inv.expiresAt) < new Date() && (
                      <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        Abgelaufen
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Erstellt von: {inv.createdBy.name || inv.createdBy.email}
                  </p>
                  {inv.used && inv.usedBy && (
                    <p className="mt-1 text-sm text-gray-600">
                      Verwendet von: {inv.usedBy.name || inv.usedBy.email}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Gültig bis: {format(new Date(inv.expiresAt), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  {!inv.used && (
                    <button
                      onClick={() => copyLink(inv.inviteLink)}
                      className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Link kopieren
                    </button>
                  )}
                  {!inv.used && (
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

