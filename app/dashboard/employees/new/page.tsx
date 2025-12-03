/**
 * Neuer Mitarbeiter - Formular
 * WICHTIG: Mitarbeiter kann nur aus bestehenden Usern erstellt werden
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { selectBase } from '@/lib/inputStyles'

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

export default function NewEmployeePage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    position: '',
    color: '#3B82F6',
    isActive: true,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Hole alle Users des Tenants (müsste eine API Route geben)
      // Für jetzt: Verwende einen einfachen Ansatz
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId) {
      alert('Bitte wählen Sie einen User aus')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Erstellen')
      }

      const data = await response.json()
      
      // Prüfe ob User bereits ein Passwort hat
      const selectedUser = users.find(u => u.id === formData.userId)
      if (selectedUser) {
        // Versuche automatisch einen Einladungslink zu erstellen, wenn User noch kein Passwort hat
        try {
          const inviteResponse = await fetch('/api/employees/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: data.employee.id,
              email: selectedUser.email,
            }),
          })
          
          if (inviteResponse.ok) {
            const inviteData = await inviteResponse.json()
            // Zeige Einladungslink in einem Dialog
            const shouldCopy = confirm(
              `Mitarbeiter erfolgreich erstellt!\n\nEinladungslink:\n${inviteData.inviteLink}\n\nMöchten Sie den Link kopieren?`
            )
            if (shouldCopy) {
              navigator.clipboard.writeText(inviteData.inviteLink)
              alert('Link wurde in die Zwischenablage kopiert!')
            }
          }
        } catch (inviteError) {
          // Ignoriere Fehler beim Erstellen des Links - User hat möglicherweise bereits ein Passwort
          console.log('Einladungslink konnte nicht erstellt werden (User hat möglicherweise bereits ein Passwort)')
        }
      }
      
      router.push(`/dashboard/employees/${data.employee.id}`)
    } catch (error: unknown) {
      console.error('Fehler:', error)
      alert((error instanceof Error ? error.message : 'Fehler beim Erstellen des Mitarbeiters'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/employees"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Neuer Mitarbeiter</h1>
          <p className="mt-2 text-sm text-gray-600">
            Wählen Sie einen bestehenden User aus, um ihn als Mitarbeiter hinzuzufügen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              User auswählen <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className={`mt-1 ${selectBase}`}
            >
              <option value="">Bitte wählen...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} ({user.role})
                </option>
              ))}
            </select>
            {users.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">
                Keine verfügbaren Users. Bitte erstellen Sie zuerst einen User.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="z.B. Friseur, Masseur..."
              className={`mt-1 ${selectBase}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Kalender-Farbe</label>
            <div className="mt-1 flex items-center gap-3">
              <div
                className="h-12 w-12 rounded border-2 border-gray-300"
                style={{ backgroundColor: formData.color }}
              />
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-12 w-24 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Mitarbeiter ist aktiv
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Link
              href="/dashboard/employees"
              className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-300"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.userId}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Wird erstellt...' : 'Mitarbeiter erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

