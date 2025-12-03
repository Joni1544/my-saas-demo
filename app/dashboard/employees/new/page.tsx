/**
 * Neuer Mitarbeiter - Formular
 * Unterstützt sowohl bestehende User als auch neue Account-Erstellung
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { selectBase, inputBase } from '@/lib/inputStyles'

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
  const [createMode, setCreateMode] = useState<'existing' | 'new'>('new')
  const [showCredentials, setShowCredentials] = useState(false)
  const [showInviteLink, setShowInviteLink] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [createdEmployeeId, setCreatedEmployeeId] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<{ email: string; password: string; loginUrl: string } | null>(null)
  const [formData, setFormData] = useState({
    userId: '',
    position: '',
    color: '#3B82F6',
    isActive: true,
    // Neue User-Felder
    name: '',
    email: '',
    role: 'MITARBEITER' as 'ADMIN' | 'MITARBEITER',
    password: '',
    confirmPassword: '',
    initialVacationDays: 25,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
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
    
    if (createMode === 'existing') {
      if (!formData.userId) {
        alert('Bitte wählen Sie einen User aus')
        return
      }
    } else {
      // Neue User-Validierung
      if (!formData.name || !formData.email) {
        alert('Bitte füllen Sie Name und Email aus')
        return
      }
      
      if (formData.password && formData.password.length < 8) {
        alert('Passwort muss mindestens 8 Zeichen lang sein')
        return
      }
      
      if (formData.password !== formData.confirmPassword) {
        alert('Passwörter stimmen nicht überein')
        return
      }
    }

    setLoading(true)
    try {
      let employeeId: string
      let employeeEmail: string
      
      if (createMode === 'new') {
        // Erstelle neuen User
        const userResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            password: formData.password || undefined,
            initialVacationDays: formData.initialVacationDays,
          }),
        })

        if (!userResponse.ok) {
          const error = await userResponse.json()
          throw new Error(error.error || 'Fehler beim Erstellen des Users')
        }

        const userData = await userResponse.json()
        
        // Wenn Employee erstellt wurde, aktualisiere ihn mit zusätzlichen Daten
        if (userData.employee) {
          employeeId = userData.employee.id
          employeeEmail = userData.user.email
          
          // Aktualisiere Employee mit Position, Farbe etc.
          const updateResponse = await fetch(`/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              position: formData.position,
              color: formData.color,
              isActive: formData.isActive,
            }),
          })
          
          if (!updateResponse.ok) {
            console.warn('Fehler beim Aktualisieren der Employee-Daten')
          }
          
          // Zeige Credentials falls Passwort gesetzt wurde
          if (userData.credentials) {
            setCredentials(userData.credentials)
            setShowCredentials(true)
            setCreatedEmployeeId(employeeId)
            return // Verhindere Navigation, damit Modal angezeigt wird
          }
          
          // Wenn kein Passwort gesetzt wurde, generiere automatisch Einladungslink
          if (!formData.password && employeeId) {
            try {
              const inviteResponse = await fetch('/api/employees/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  employeeId: employeeId,
                  email: userData.user.email,
                }),
              })
              
              if (inviteResponse.ok) {
                const inviteData = await inviteResponse.json()
                setInviteLink(inviteData.inviteLink)
                setShowInviteLink(true)
                setCreatedEmployeeId(employeeId)
                return // Verhindere Navigation, damit Modal angezeigt wird
              }
            } catch (error) {
              console.error('Fehler beim Generieren des Einladungslinks:', error)
            }
          }
        } else {
          // Wenn kein Employee erstellt wurde (z.B. bei ADMIN), erstelle ihn manuell
          const employeeResponse = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.user.id,
              position: formData.position,
              color: formData.color,
              isActive: formData.isActive,
            }),
          })
          
          if (!employeeResponse.ok) {
            throw new Error('Fehler beim Erstellen des Mitarbeiter-Profils')
          }
          
          const employeeData = await employeeResponse.json()
          employeeId = employeeData.employee.id
          employeeEmail = userData.user.email
        }
      } else {
        // Bestehender User
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: formData.userId,
            position: formData.position,
            color: formData.color,
            isActive: formData.isActive,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Fehler beim Erstellen')
        }

        const data = await response.json()
        employeeId = data.employee.id
        const selectedUser = users.find(u => u.id === formData.userId)
        employeeEmail = selectedUser?.email || ''
        
        // Versuche automatisch einen Einladungslink zu erstellen, wenn User noch kein Passwort hat
        try {
          const inviteResponse = await fetch('/api/employees/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: data.employee.id,
              email: employeeEmail,
            }),
          })
          
          if (inviteResponse.ok) {
            const inviteData = await inviteResponse.json()
            setInviteLink(inviteData.inviteLink)
            setShowInviteLink(true)
            setCreatedEmployeeId(employeeId)
            return // Verhindere Navigation, damit Modal angezeigt wird
          }
        } catch {
          // Ignoriere Fehler beim Erstellen des Links
          console.log('Einladungslink konnte nicht erstellt werden')
        }
      }
      
      if (!showCredentials && !showInviteLink) {
        router.push(`/dashboard/employees/${employeeId}`)
      }
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
            {createMode === 'existing' 
              ? 'Wählen Sie einen bestehenden User aus, um ihn als Mitarbeiter hinzuzufügen'
              : 'Erstellen Sie einen neuen Mitarbeiter-Account. Geben Sie Name und Email ein, um einen Einladungslink zu generieren.'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Erstellungsmodus:</span>
            <button
              type="button"
              onClick={() => setCreateMode('existing')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                createMode === 'existing'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bestehender User
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('new')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                createMode === 'new'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Neuer Account
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          {createMode === 'existing' ? (
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
                  Keine verfügbaren Users. Bitte erstellen Sie zuerst einen User oder wechseln Sie zum Modus &quot;Neuer Account&quot;.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Max Mustermann"
                    className={`mt-1 ${inputBase}`}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Der Name wird für Einladungen und Nachrichten verwendet
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="max@example.com"
                    className={`mt-1 ${inputBase}`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rolle <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MITARBEITER' })}
                  className={`mt-1 ${selectBase}`}
                >
                  <option value="MITARBEITER">Mitarbeiter</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Passwort (optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mindestens 8 Zeichen"
                    minLength={8}
                    className={`mt-1 ${inputBase}`}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Wenn leer gelassen, wird automatisch ein Einladungslink generiert, den Sie dem Mitarbeiter senden können
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Passwort wiederholen"
                    className={`mt-1 ${inputBase}`}
                  />
                </div>
              </div>
              
              {formData.role === 'MITARBEITER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Initiale Urlaubstage
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialVacationDays}
                    onChange={(e) => setFormData({ ...formData, initialVacationDays: parseInt(e.target.value) || 25 })}
                    className={`mt-1 ${inputBase}`}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="z.B. Friseur, Masseur..."
              className={`mt-1 ${inputBase}`}
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
              disabled={loading || (createMode === 'existing' && !formData.userId) || (createMode === 'new' && (!formData.name || !formData.email))}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Wird erstellt...' : createMode === 'new' ? 'Account erstellen' : 'Mitarbeiter erstellen'}
            </button>
          </div>
        </form>

        {/* Credentials Modal */}
        {showCredentials && credentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="rounded-lg bg-white p-6 shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ Mitarbeiter erfolgreich erstellt</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">Login-Daten:</p>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Email:</span> {credentials.email}</p>
                    <p><span className="font-semibold">Passwort:</span> {credentials.password}</p>
                    <p><span className="font-semibold">Login-URL:</span> {credentials.loginUrl}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const text = `Email: ${credentials.email}\nPasswort: ${credentials.password}\nLogin-URL: ${credentials.loginUrl}`
                      navigator.clipboard.writeText(text)
                      alert('Zugangsdaten wurden kopiert!')
                    }}
                    className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Kopieren
                  </button>
                  <button
                    onClick={() => {
                      setShowCredentials(false)
                      setCredentials(null)
                      if (createdEmployeeId) {
                        router.push(`/dashboard/employees/${createdEmployeeId}`)
                      } else {
                        router.push('/dashboard/employees')
                      }
                    }}
                    className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Link Modal */}
        {showInviteLink && inviteLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="rounded-lg bg-white p-6 shadow-xl max-w-lg w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Mitarbeiter erfolgreich erstellt</h3>
              <p className="text-sm text-gray-600 mb-4">
                Der Mitarbeiter <span className="font-semibold">{formData.name || formData.email}</span> wurde erstellt. 
                Senden Sie diesen Einladungslink, damit der Mitarbeiter sein Passwort setzen kann.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-2">📧 Einladungslink:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 rounded-md border border-green-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink)
                        alert('Einladungslink wurde kopiert!')
                      }}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 whitespace-nowrap"
                    >
                      Kopieren
                    </button>
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    ⏰ Dieser Link ist 7 Tage gültig
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Öffne Email-Client mit vorausgefüllter Nachricht
                      const subject = encodeURIComponent('Einladung zu FuerstFlow')
                      const body = encodeURIComponent(
                        `Hallo ${formData.name || ''},\n\n` +
                        `Sie wurden zu FuerstFlow eingeladen. Bitte klicken Sie auf den folgenden Link, um Ihr Passwort zu setzen:\n\n` +
                        `${inviteLink}\n\n` +
                        `Der Link ist 7 Tage gültig.\n\n` +
                        `Mit freundlichen Grüßen`
                      )
                      window.location.href = `mailto:${formData.email}?subject=${subject}&body=${body}`
                    }}
                    className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    📧 Per Email senden
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteLink(false)
                      setInviteLink(null)
                      if (createdEmployeeId) {
                        router.push(`/dashboard/employees/${createdEmployeeId}`)
                      } else {
                        router.push('/dashboard/employees')
                      }
                    }}
                    className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
