/**
 * NextAuth v5 API Route Handler
 * WICHTIG: Import handlers direkt aus lib/auth.ts
 */
import { handlers } from "@/lib/auth"

console.log("🚀 NextAuth route handler loaded")
console.log("📦 Handlers available:", !!handlers, "GET:", !!handlers?.GET, "POST:", !!handlers?.POST)

export const { GET, POST } = handlers
