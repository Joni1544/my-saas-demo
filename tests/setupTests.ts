/**
 * Jest Setup für FuerstFlow Tests
 */
import { PrismaClient } from '@prisma/client'

// Mock-Umgebungsvariablen
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-key'
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// Prisma Client für Tests - direkt initialisieren
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Globale Mocks - verwende globalThis statt global
if (typeof globalThis !== 'undefined') {
  (globalThis as any).prisma = prisma
}

// Export für Tests
export { prisma }
