/**
 * View Mode Helper
 * Hilft beim Ermitteln des aktuellen Ansichtsmodus (Admin oder Mitarbeiter)
 */

/**
 * Ermittelt den effektiven Role für die Ansicht
 * Wenn Admin im Mitarbeiter-Modus ist, wird MITARBEITER zurückgegeben
 */
export function getEffectiveRole(userRole: string, viewMode?: 'admin' | 'employee'): string {
  if (userRole === 'ADMIN' && viewMode === 'employee') {
    return 'MITARBEITER'
  }
  return userRole
}

