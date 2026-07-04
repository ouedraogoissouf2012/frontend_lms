import { describe, it, expect } from 'vitest'
import { safeUrl } from '../safeUrl'

/**
 * Edge cases de durcissement URL (anti javascript:/data: XSS).
 * Cible : les :href/:src alimentés par des données utilisateur.
 */
describe('safeUrl — schémas dangereux (rejet → fallback)', () => {
  it('rejette javascript:', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#')
  })

  it('rejette javascript: quelle que soit la casse', () => {
    expect(safeUrl('JavaScript:alert(1)')).toBe('#')
    expect(safeUrl('JAVASCRIPT:alert(1)')).toBe('#')
  })

  it('rejette l’évasion par tabulation "java\\tscript:"', () => {
    expect(safeUrl('java\tscript:alert(1)')).toBe('#')
  })

  it('rejette l’évasion par saut de ligne et retour chariot', () => {
    expect(safeUrl('java\nscript:alert(1)')).toBe('#')
    expect(safeUrl('java\rscript:alert(1)')).toBe('#')
  })

  it('rejette l’évasion par octet nul et caractères de contrôle', () => {
    expect(safeUrl('java' + String.fromCharCode(0) + 'script:alert(1)')).toBe('#')
    expect(safeUrl(String.fromCharCode(1) + 'javascript:alert(1)')).toBe('#')
  })

  it('rejette les espaces de bord autour d’un schéma dangereux', () => {
    expect(safeUrl('   javascript:alert(1)   ')).toBe('#')
  })

  it('rejette data:, vbscript:, blob:, file:', () => {
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('#')
    expect(safeUrl('vbscript:msgbox(1)')).toBe('#')
    expect(safeUrl('blob:http://x/1234')).toBe('#')
    expect(safeUrl('file:///etc/passwd')).toBe('#')
  })
})

describe('safeUrl — entrées invalides (fail-secure)', () => {
  it('renvoie le fallback pour non-string', () => {
    expect(safeUrl(null)).toBe('#')
    expect(safeUrl(undefined)).toBe('#')
    expect(safeUrl(42)).toBe('#')
    expect(safeUrl({})).toBe('#')
    expect(safeUrl(['javascript:alert(1)'])).toBe('#')
  })

  it('renvoie le fallback pour chaîne vide / espaces', () => {
    expect(safeUrl('')).toBe('#')
    expect(safeUrl('   ')).toBe('#')
  })

  it('respecte un fallback personnalisé', () => {
    expect(safeUrl('javascript:alert(1)', { fallback: '/blocked' })).toBe('/blocked')
    expect(safeUrl(null, { fallback: 'about:blank' })).toBe('about:blank')
  })
})

describe('safeUrl — URLs légitimes (préservées/normalisées)', () => {
  it('accepte https absolu', () => {
    expect(safeUrl('https://example.com/cours/1')).toBe('https://example.com/cours/1')
  })

  it('accepte http et normalise via URL', () => {
    expect(safeUrl('http://example.com')).toBe('http://example.com/')
  })

  it('normalise la casse du host (protocole en minuscule)', () => {
    const out = safeUrl('HTTPS://Example.COM/X')
    expect(out.startsWith('https://')).toBe(true)
    expect(out).toContain('example.com')
  })

  it('accepte mailto: et tel:', () => {
    expect(safeUrl('mailto:prof@ecole.bf')).toBe('mailto:prof@ecole.bf')
    expect(safeUrl('tel:+22670000000')).toBe('tel:+22670000000')
  })

  it('résout les URLs scheme-relative vers http(s) (schéma sûr)', () => {
    const out = safeUrl('//cdn.example.com/asset.png')
    expect(out.startsWith('http')).toBe(true)
    expect(out).toContain('cdn.example.com')
  })

  it('résout un chemin relatif sur l’origine (schéma sûr)', () => {
    const out = safeUrl('/lessons/42')
    expect(out.startsWith('http')).toBe(true)
    expect(out.endsWith('/lessons/42')).toBe(true)
  })
})
