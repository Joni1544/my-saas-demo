/**
 * Client-Side Providers
 * Wrapper für NextAuth SessionProvider
 */
'use client'

import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}

