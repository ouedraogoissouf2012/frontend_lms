/**
 * Garde-fou (#295) : `index.html` ne doit JAMAIS ré-introduire une ressource
 * EXTERNE. Le self-hosting des icônes (#279) a retiré les CDN Font Awesome /
 * Google Fonts ; ce ratchet (façon garde couleurs #161) échoue si un `<link>`
 * ou un `<script>` vers un hôte http(s) réapparaît dans le document.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// Vitest s'exécute depuis la racine du projet (cwd = racine de la config).
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

describe('index.html — aucune ressource externe (garde #295)', () => {
  it('aucun href/src absolu vers un hôte http(s) (CDN)', () => {
    const external = html.match(/\b(?:href|src)\s*=\s*["']https?:\/\/[^"']+/gi) || []
    expect(external).toEqual([])
  })
})
