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
              className={`rounded-lg border p-3 ${
                inv.used
                  ? 'border-gray-200 bg-gray-50'
                  : new Date(inv.expiresAt) < new Date()
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate">
                      {inv.email || 'Keine Email'}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        inv.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {inv.role === 'ADMIN' ? 'Admin' : 'Mitarbeiter'}
                    </span>
                    {inv.used && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 border border-gray-200">
                        Verwendet
                      </span>
                    )}
                    {!inv.used && new Date(inv.expiresAt) < new Date() && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 border border-yellow-200">
                        Abgelaufen
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Erstellt: {inv.createdBy.name || inv.createdBy.email} • Gültig bis: {format(new Date(inv.expiresAt), 'dd.MM.yyyy')}
                  </p>
                  {inv.used && inv.usedBy && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verwendet von: {inv.usedBy.name || inv.usedBy.email}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex gap-2">
                  {!inv.used && (
                    <button
                      onClick={() => copyLink(inv.inviteLink)}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      📋 Kopieren
                    </button>
                  )}
                  {!inv.used && (
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
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

