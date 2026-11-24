/**
 * lms_backend#1306, volet front : le mécanisme Laravel de réinitialisation est mort. Aucun jeton n'a jamais pu y être
 * délivré, et `password_reset_tokens` contient 0 ligne en prod (mesure de la superviseure, lecture seule, 19/11).
 * Depuis lms_backend#808, la réinitialisation d'une école autonome passe par le jeton à usage unique de
 * `/activation/{jeton}`. Le front cesse d'appeler `POST /auth/reset-password` AVANT que le back ne la retire.
 * Retrait net, sans redirection : aucun lien n'a jamais circulé, `/reset-password` tombe sur la page 404.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/api', () => ({
  default: { post: vi.fn(), get: vi.fn() },
  auth: { getUser: () => null, isAuthenticated: () => false, getActiveInstitutions: vi.fn().mockResolvedValue([]) },
}))

import { coreRoutes } from '@/router/routes/core.routes'
import { fallbackRoutes } from '@/router/routes/fallback.routes'
import { endpoints } from '@/services/endpoints'
import { passwordResetService } from '@/services/passwordReset'
import { usePasswordReset } from '@/composables/usePasswordReset'

const RACINE = process.cwd()
const SRC = resolve(RACINE, 'src')

function fichiersSrc() {
  const trouves = []
  const parcourir = (dossier) => {
    for (const entree of readdirSync(dossier)) {
      const chemin = join(dossier, entree)
      if (statSync(chemin).isDirectory()) {
        if (entree !== '__tests__') parcourir(chemin)
        continue
      }
      if (/\.(js|vue)$/.test(entree)) trouves.push(relative(SRC, chemin).replace(/\\/g, '/'))
    }
  }
  parcourir(SRC)
  return trouves
}

describe('lms_backend#1306 — la route /reset-password n’existe plus', () => {
  it('coreRoutes ne la déclare plus ; le mot de passe oublié et l’activation restent', () => {
    const chemins = coreRoutes.map((r) => r.path)
    expect(chemins).not.toContain('/reset-password')
    expect(chemins).toEqual(expect.arrayContaining(['/forgot-password', '/activation/:token']))
  })

  it('le routeur la résout vers la page 404 publique (NotFound), sans redirection', () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...coreRoutes, ...fallbackRoutes] })
    const cible = router.resolve('/reset-password?token=fictif&email=a%40b.test')
    expect(cible.name).toBe('NotFound')
    expect(cible.redirectedFrom).toBeUndefined()
  })

  it('la vue ResetPassword.vue est supprimée', () => {
    expect(existsSync(join(SRC, 'views/ResetPassword.vue'))).toBe(false)
  })
})

describe('lms_backend#1306 — le front n’appelle plus POST /auth/reset-password', () => {
  it('ni endpoints, ni service, ni composable n’exposent resetPassword ; la demande de lien reste', () => {
    expect('resetPassword' in endpoints.auth).toBe(false)
    expect(endpoints.auth.forgotPassword).toBe('/auth/forgot-password')
    expect('resetPassword' in passwordResetService).toBe(false)
    expect(typeof passwordResetService.requestLink).toBe('function')
    const api = usePasswordReset()
    expect('resetPassword' in api).toBe(false)
    expect(typeof api.requestLink).toBe('function')
  })

  it('aucun fichier de src ne nomme la route d’API retirée', () => {
    const fichiers = fichiersSrc()
    expect(fichiers.length).toBeGreaterThan(100)
    expect(fichiers.filter((f) => readFileSync(join(SRC, f), 'utf8').includes('/auth/reset-password'))).toEqual([])
  })

  it('la dette de contrat rétrécit : la baseline ne porte plus POST /auth/reset-password', () => {
    const baseline = JSON.parse(readFileSync(join(RACINE, '.api-contract-baseline.json'), 'utf8'))
    expect(baseline.length).toBeGreaterThan(0)
    expect(baseline).not.toContain('POST /auth/reset-password')
  })
})
