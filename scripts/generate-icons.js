/**
 * Icon Generator Script
 * Generiert PNG-Icons aus Logo-Bild in verschiedenen Größen
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Requirements: sharp (npm install sharp)
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [192, 256, 384, 512, 180, 32] // 180 für apple-touch-icon, 32 für favicon
const inputLogo = path.join(__dirname, '../public/logo.png')
const outputDir = path.join(__dirname, '../public/icons')

// Erstelle icons-Verzeichnis falls nicht vorhanden
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

async function generateIcons() {
  console.log('🎨 Generiere Icons aus Logo...')
  
  try {
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}.png`)
      
      await sharp(inputLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath)
      
      console.log(`✅ Icon ${size}x${size} erstellt: ${outputPath}`)
    }

    // Favicon (32x32)
    const faviconPath = path.join(__dirname, '../public/favicon.ico')
    await sharp(inputLogo)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'))
    
    // Apple Touch Icon (180x180)
    const appleIconPath = path.join(__dirname, '../public/apple-touch-icon.png')
    await sharp(inputLogo)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(appleIconPath)
    
    console.log('✅ Apple Touch Icon erstellt')
    
    // Icon.png (Standard) - Kopiere direkt das Logo
    const iconPath = path.join(__dirname, '../public/icon.png')
    await sharp(inputLogo)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(iconPath)
    
    console.log('✅ Standard Icon erstellt')
    
    console.log('\n✨ Alle Icons erfolgreich generiert!')
  } catch (error) {
    console.error('❌ Fehler beim Generieren der Icons:', error)
    console.log('\n💡 Tipp: Installiere sharp mit: npm install sharp')
    process.exit(1)
  }
}

generateIcons()

