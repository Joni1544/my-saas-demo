/**
 * Setup Script für Prisma Client
 * Erstellt Symlink und package.json für korrekten Import
 */
const fs = require('fs');
const path = require('path');

const prismaClientPath = path.join(__dirname, '../node_modules/.prisma/client');
const targetPath = path.join(__dirname, '../node_modules/@prisma/client');

// Erstelle @prisma/client Verzeichnis falls nicht vorhanden
if (!fs.existsSync(targetPath)) {
  fs.mkdirSync(targetPath, { recursive: true });
}

// Erstelle package.json für @prisma/client
const packageJson = {
  name: '@prisma/client',
  version: '6.19.0',
  main: '../.prisma/client/client.ts',
  types: '../.prisma/client/client.ts',
};

fs.writeFileSync(
  path.join(targetPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Erstelle index.ts als Re-Export
const indexTs = `export * from '../.prisma/client/client';\nexport { PrismaClient } from '../.prisma/client/client';`;

fs.writeFileSync(path.join(targetPath, 'index.ts'), indexTs);

console.log('✅ Prisma Client Setup abgeschlossen');

