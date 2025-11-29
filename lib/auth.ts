console.log("AUTH OPTIONS LOADED")

import bcrypt from "bcryptjs"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 AUTHORIZE CALLED with email:", credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          throw new Error("Email und Passwort sind erforderlich")
        }

        console.log("🔍 Looking up user in database...")
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          console.log("❌ User not found")
          throw new Error("Ungültige Anmeldedaten")
        }

        console.log("🔑 Comparing password...")
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        
        if (!isValid) {
          console.log("❌ Invalid password")
          throw new Error("Ungültige Anmeldedaten")
        }

        console.log("✅ User authorized:", user.email)
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId
        }
      }
    })
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      console.log("🔄 JWT CALLBACK - user:", !!user, "token.id:", token.id)
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        console.log("✅ JWT updated with user data:", { id: user.id, role: user.role })
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      console.log("📋 SESSION CALLBACK - token.id:", token.id)
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "ADMIN" | "MITARBEITER"
        session.user.tenantId = token.tenantId as string | null
        console.log("✅ Session updated with user data")
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.log("Provider IDs:", authOptions.providers.map((p: any) => p.id))
console.log("✅ AuthOptions configured with", authOptions.providers.length, "provider(s)")

// NextAuth v5: Exportiere auth für Server-Side-Usage
// WICHTIG: Handler werden in route.ts exportiert, nicht hier!
export const { auth, signIn, signOut } = NextAuth(authOptions)

console.log("✅ NextAuth auth function exported for server-side usage")
