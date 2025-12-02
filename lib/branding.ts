/**
 * Multi-Tenant Branding Funktionen
 * Ermöglicht pro Firma individuelles Branding ohne neue Deployments
 */

interface BrandingConfig {
  name: string
  shortName: string
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
  iconUrl?: string
  themeColor?: string
}

// Default Branding (FuerstFlow)
const DEFAULT_BRANDING: BrandingConfig = {
  name: 'FuerstFlow',
  shortName: 'FFlow',
  primaryColor: '#4F46E5',
  secondaryColor: '#6366F1',
  logoUrl: '/logo.png',
  iconUrl: '/icons/icon-512.png',
  themeColor: '#4F46E5',
}

// Cache für Branding-Konfigurationen
const brandingCache = new Map<string, BrandingConfig>()

/**
 * Hole Branding-Konfiguration für einen Tenant
 * 
 * @param tenantId - Die Tenant-ID
 * @returns Branding-Konfiguration
 */
export async function getBrandingForTenant(tenantId: string | null | undefined): Promise<BrandingConfig> {
  if (!tenantId) {
    return DEFAULT_BRANDING
  }

  // Prüfe Cache
  if (brandingCache.has(tenantId)) {
    return brandingCache.get(tenantId)!
  }

  try {
    // TODO: Später aus Datenbank laden
    // const shop = await prisma.shop.findUnique({
    //   where: { id: tenantId },
    //   select: {
    //     name: true,
    //     branding: true, // JSON-Feld mit Branding-Daten
    //   },
    // })
    
    // if (shop?.branding) {
    //   const customBranding = {
    //     ...DEFAULT_BRANDING,
    //     ...JSON.parse(shop.branding),
    //     name: shop.name || DEFAULT_BRANDING.name,
    //   }
    //   brandingCache.set(tenantId, customBranding)
    //   return customBranding
    // }

    // Für jetzt: Default zurückgeben
    brandingCache.set(tenantId, DEFAULT_BRANDING)
    return DEFAULT_BRANDING
  } catch (error) {
    console.error('Fehler beim Laden des Brandings:', error)
    return DEFAULT_BRANDING
  }
}

/**
 * Setze Branding für einen Tenant
 * 
 * @param tenantId - Die Tenant-ID
 * @param branding - Die Branding-Konfiguration
 */
export async function setBrandingForTenant(
  tenantId: string,
  branding: Partial<BrandingConfig>
): Promise<void> {
  try {
    // TODO: Später in Datenbank speichern
    // await prisma.shop.update({
    //   where: { id: tenantId },
    //   data: {
    //     branding: JSON.stringify({
    //       ...DEFAULT_BRANDING,
    //       ...branding,
    //     }),
    //   },
    // })

    // Cache aktualisieren
    const updatedBranding = {
      ...DEFAULT_BRANDING,
      ...branding,
    }
    brandingCache.set(tenantId, updatedBranding)
  } catch (error) {
    console.error('Fehler beim Speichern des Brandings:', error)
    throw error
  }
}

/**
 * Generiere dynamisches Manifest für einen Tenant
 * 
 * @param tenantId - Die Tenant-ID
 * @returns Manifest-Objekt
 */
export async function getManifestForTenant(tenantId: string | null | undefined) {
  const branding = await getBrandingForTenant(tenantId)

  return {
    name: branding.name,
    short_name: branding.shortName,
    description: `${branding.name} – Das moderne Verwaltungs- und Termin-System für Studios, Salons & Teams.`,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: branding.themeColor || branding.primaryColor,
    icons: [
      {
        src: branding.iconUrl || '/icons/icon-192.png',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'any maskable',
      },
      {
        src: branding.iconUrl || '/icons/icon-256.png',
        type: 'image/png',
        sizes: '256x256',
        purpose: 'any maskable',
      },
      {
        src: branding.iconUrl || '/icons/icon-384.png',
        type: 'image/png',
        sizes: '384x384',
        purpose: 'any maskable',
      },
      {
        src: branding.iconUrl || '/icons/icon-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'any maskable',
      },
    ],
  }
}

