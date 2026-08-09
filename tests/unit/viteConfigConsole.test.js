// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import viteConfig from '../../vite.config.js'

describe('vite config — console production guard (#15, révisé #234)', () => {
  it('retire TOUS les console.* du build prod (sécurité #234)', () => {
    // #234 : l'intercepteur pose Authorization = Bearer … → l'objet erreur axios
    // porte le token. Garder console.error/warn en prod le fuyait. La décision #15
    // (garder warn/error pour le diagnostic) est donc RÉVISÉE : on les strippe au
    // build (les erreurs à surfacer passent par errorHandler.logError / un toast),
    // complété par un no-op runtime dans main.js (appels dynamiques + dépendances).
    expect(viteConfig.esbuild?.pure).toEqual([
      'console.log',
      'console.info',
      'console.debug',
      'console.error',
      'console.warn',
    ])
  })

  it('ne laisse pas de log non essentiel dans le worker public copié tel quel', () => {
    const worker = readFileSync(new URL('../../public/heartbeat-worker.js', import.meta.url), 'utf8')

    expect(worker).not.toMatch(/console\.(log|info|debug)\s*\(/)
    expect(worker).toMatch(/console\.error\s*\(/)
  })

  it('proxyfie API et storage en développement pour éviter les CORS locaux', () => {
    expect(viteConfig.server?.proxy?.['/api']?.target).toBe('http://localhost:8000')
    expect(viteConfig.server?.proxy?.['/storage']?.target).toBe('http://localhost:8000')
  })
})
