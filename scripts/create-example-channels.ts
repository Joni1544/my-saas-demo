/**
 * Script zum Erstellen von Beispiel-Channels
 * Führt: npx tsx scripts/create-example-channels.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Erstelle Beispiel-Channels...')

  // Hole alle Shops
  const shops = await prisma.shop.findMany()

  for (const shop of shops) {
    // Prüfe ob bereits Channels existieren
    const existingChannels = await prisma.chatChannel.findMany({
      where: { tenantId: shop.id },
    })

    if (existingChannels.length > 0) {
      console.log(`Shop "${shop.name}" hat bereits Channels. Überspringe...`)
      continue
    }

    // Erstelle Beispiel-Channels
    const channels = await Promise.all([
      prisma.chatChannel.create({
        data: {
          name: 'Team',
          tenantId: shop.id,
        },
      }),
      prisma.chatChannel.create({
        data: {
          name: 'Allgemein',
          tenantId: shop.id,
        },
      }),
    ])

    console.log(`✓ Channels für "${shop.name}" erstellt:`, channels.map((c) => c.name).join(', '))
  }

  console.log('Fertig!')
}

main()
  .catch((e) => {
    console.error('Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

