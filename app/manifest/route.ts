/**
 * Dynamic Manifest Route
 * Gibt Manifest basierend auf Tenant zurück
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getManifestForTenant } from '@/lib/branding'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const manifest = await getManifestForTenant(session?.user?.tenantId || null)

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Fehler beim Laden des Manifests:', error)
    // Fallback zu Default-Manifest
    return NextResponse.json(
      {
        name: 'FuerstFlow',
        short_name: 'FFlow',
        description: 'FuerstFlow – Das moderne Verwaltungs- und Termin-System für Studios, Salons & Teams.',
        start_url: '/',
        display: 'standalone',
        theme_color: '#4F46E5',
      },
      {
        headers: {
          'Content-Type': 'application/manifest+json',
        },
      }
    )
  }
}

