/**
 * NextAuth Type Definitions
 * Erweitert die Standard-Typen um role und tenantId
 */
import { Role } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: Role
      tenantId: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: Role
    tenantId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    tenantId: string | null
  }
}

