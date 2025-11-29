/**
 * NextAuth v5 API Route Handler
 * WICHTIG: NextAuth direkt hier initialisieren mit authOptions
 */
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

console.log("🚀 NextAuth route handler loaded")
console.log("📦 AuthOptions loaded:", !!authOptions)
console.log("📦 Providers count:", authOptions.providers?.length || 0)

// NextAuth v5: Initialisiere NextAuth mit authOptions
const auth = NextAuth(authOptions)

console.log("✅ NextAuth initialized")
console.log("📦 Handlers available:", !!auth.handlers, "GET:", !!auth.handlers?.GET, "POST:", !!auth.handlers?.POST)

// Exportiere Handler
export const { GET, POST } = auth.handlers

// WICHTIG: Force dynamic rendering für NextAuth
export const dynamic = "force-dynamic"
