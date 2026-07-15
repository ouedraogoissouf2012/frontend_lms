// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import viteConfig from '../../vite.config.js'

describe('vite config — console production guard (#15)', () => {
  it('retire les logs non essentiels du build sans supprimer warn/error', () => {
    expect(viteConfig.esbuild?.pure).toEqual([
      'console.log',
      'console.info',
      'console.debug',
    ])
    expect(viteConfig.esbuild?.pure).not.toContain('console.warn')
    expect(viteConfig.esbuild?.pure).not.toContain('console.error')
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
