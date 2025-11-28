/**
 * NextAuth API Route Handler
 * Verarbeitet alle Authentication-Requests
 */
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

