/**
 * Jest Configuration für FuerstFlow Tests
 */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Pfad zur Next.js App
  dir: './',
})

const customJestConfig = {
  // Test-Umgebung
  testEnvironment: 'jest-environment-node',
  
  // Setup-Dateien
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  
  // Globals aktivieren
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  
  // Module-Pfade
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Test-Patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx',
    '**/__tests__/**/*.test.ts',
  ],
  
  // Coverage-Einstellungen
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'events/**/*.{ts,tsx}',
    'automation/**/*.{ts,tsx}',
    'autopilot/**/*.{ts,tsx}',
    'payments/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  
  // Coverage-Schwellenwerte
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },
  
  // Ignorierte Pfade
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
  ],
  
  // Timeout
  testTimeout: 30000,
  maxWorkers: 1, // Führe Tests sequenziell aus um Datenbank-Konflikte zu vermeiden
  
  // Verbose Output
  verbose: true,
}

module.exports = createJestConfig(customJestConfig)

