/**
 * NextAuth API Route Handler
 * Verarbeitet alle Authentication-Requests
 * NextAuth v5 kompatibel
 */
import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"

// NextAuth v5: handlers exportieren
const { handlers } = NextAuth(authOptions)

export const { GET, POST } = handlers
