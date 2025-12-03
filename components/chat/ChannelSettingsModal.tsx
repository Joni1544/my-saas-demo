/**
 * Channel Settings Modal
 * Erlaubt Bearbeitung von Channel-Name, Beschreibung und Mitgliedern
 */
'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Plus } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
}

interface Member {
  id: string
  user: User
  joinedAt: string
}

interface Channel {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  members: Member[]
}

interface ChannelSettingsModalProps {
  isOpen: boolean
  channel: Channel | null
  allUsers: User[]
  currentUserId: string | undefined
  onClose: () => void
  onUpdate: () => void
}

export default function ChannelSettingsModal({
  isOpen,
  channel,
  allUsers,
  currentUserId,
  onClose,
  onUpdate,
}: ChannelSettingsModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (channel) {
      setName(channel.name)
      setDescription(channel.description || '')
    }
  }, [channel])

  if (!isOpen || !channel) return null

  const availableUsers = allUsers.filter(
    (user) => !channel.members.some((m) => m.user.id === user.id) && user.id !== currentUserId
  )

  const handleSave = async () => {
    if (!channel) return

    setLoading(true)
    try {
      const response = await fetch(`/api/chat/channels/${channel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

      if (response.ok) {
        onUpdate()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!channel || !selectedUserId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/chat/channels/${channel.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      if (response.ok) {
        setSelectedUserId('')
        setShowAddMember(false)
        onUpdate()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Hinzufügen')
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Hinzufügen')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!channel) return

    if (!confirm('Mitglied wirklich entfernen?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/chat/channels/${channel.id}/members?userId=${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onUpdate()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Entfernen')
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Entfernen')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChannel = async () => {
    if (!channel) return

    if (!confirm('Channel wirklich löschen? Alle Nachrichten gehen verloren.')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/chat/channels/${channel.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onUpdate()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Channel-Einstellungen</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={channel.isSystem}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
              aria-label="Channel-Name"
            />
            {channel.isSystem && (
              <p className="mt-1 text-xs text-gray-500">System-Channels können nicht umbenannt werden</p>
            )}
          </div>

          {/* Beschreibung */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Beschreibung des Channels..."
              aria-label="Beschreibung"
            />
          </div>

          {/* Mitglieder */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Mitglieder</label>
              {channel.isSystem ? (
                <span className="text-xs text-gray-500">Alle aktiven Mitarbeiter sind automatisch Mitglied</span>
              ) : (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  <Plus className="h-4 w-4" />
                  Hinzufügen
                </button>
              )}
            </div>

            {/* Add Member Form - nur für normale Channels */}
            {!channel.isSystem && showAddMember && availableUsers.length > 0 && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-label="Mitarbeiter auswählen"
                >
                  <option value="">Mitarbeiter auswählen...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUserId || loading}
                    className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Hinzufügen
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMember(false)
                      setSelectedUserId('')
                    }}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {/* Members */}
            <div className="space-y-2">
              {channel.members.map((member) => {
                const userName = member.user.name || member.user.email.split('@')[0]
                const initials = userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    {/* Teamchat-Mitglieder können nicht entfernt werden */}
                    {!channel.isSystem && member.user.id !== currentUserId && (
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
                        disabled={loading}
                        className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`${userName} entfernen`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {channel.isSystem && (
                      <span className="text-xs text-gray-400">System-Channel</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Delete Channel */}
          {!channel.isSystem && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleDeleteChannel}
                disabled={loading}
                className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                Channel löschen
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

