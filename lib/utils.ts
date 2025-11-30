/**
 * Utility Functions
 * Wiederverwendbare Hilfsfunktionen
 */

/**
 * Formatiert den Benutzernamen aus Name oder E-Mail
 * @param name - Benutzername (kann null sein)
 * @param email - E-Mail-Adresse
 * @returns Formatierter Benutzername
 */
export function getUserName(name: string | null | undefined, email: string): string {
  if (name && name.trim()) {
    return name.trim()
  }
  
  // Fallback: Teil der E-Mail vor dem @, schön formatiert
  const emailPart = email.split('@')[0]
  // Ersetze Punkte und Unterstriche durch Leerzeichen und kapitalisiere
  return emailPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Gibt die Begrüßung basierend auf der Uhrzeit zurück
 * @returns Begrüßungstext
 */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}

