/**
 * Login-Seite
 * Authentifizierung mit Email und Passwort
 */
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log("🚀 LOGIN STARTED")
    console.log("📧 Email:", email)
    console.log("🔑 Password length:", password.length)

    try {
      console.log("📤 Calling signIn('credentials', ...)")
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      })

      console.log("📥 SIGNIN RESPONSE:", result)
      console.log("❓ Result error:", result?.error)
      console.log("❓ Result ok:", result?.ok)
      console.log("❓ Result status:", result?.status)
      console.log("❓ Result url:", result?.url)

      if (result?.error) {
        console.error("❌ Login failed with error:", result.error)
        setError("Ungültige Anmeldedaten")
      } else if (result?.ok) {
        console.log("✅ Login successful, redirecting to dashboard")
        router.push('/dashboard')
        router.refresh()
      } else {
        console.warn("⚠️ Unexpected result:", result)
        setError("Ein Fehler ist aufgetreten")
      }
    } catch (err) {
      console.error("💥 Login exception:", err)
      setError("Ungültige Anmeldedaten")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Anmelden
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Oder{' '}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              erstellen Sie ein neues Konto
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-t-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Email-Adresse"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-b-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Passwort"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

