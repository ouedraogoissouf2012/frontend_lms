import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { useAuthStore } from '@/stores/auth'
import { navigationGuard } from '@/router/guards'
import { teacherRoutes } from '@/router/routes/teacher.routes'

/**
 * #334 / #805 — cacher la carte ne ferme pas la route.
 *
 * #401 a retiré la carte du hub quand le serveur n'accorde pas la capacité.
 * Mais on atteint toujours l'écran par l'URL, et le serveur y répond 403
 * (#816). L'utilisateur ouvrait donc un écran mort.
 *
 * La garde LIT la capacité, elle ne la calcule pas : aucune notion de mode
 * d'établissement n'entre dans le routeur.
 */
describe('capacité exigée par une route', () => {
  const routeImport = {
    path: '/teacher/import',
    name: 'TeacherImport',
    meta: { requiresAuth: true, roles: ['enseignant'], capacite: 'peutInscrireLocalement' },
  }

  const avecCapacite = (accordee) => {
    setActivePinia(createPinia())
    useAuthStore().setSession(
      { user: { id: 1, role: 'enseignant' }, token: 't' },
      { peut_inscrire_localement: accordee },
    )
  }

  beforeEach(() => sessionStorage.clear())

  it('la route d import declare la capacite qu elle exige', () => {
    const route = teacherRoutes.find((r) => r.path === '/teacher/import')

    expect(route).toBeDefined()
    expect(route.meta.capacite).toBe('peutInscrireLocalement')
  })

  it('laisse passer quand le serveur l a accordee', () => {
    avecCapacite(true)
    let destination = 'non-appele'
    navigationGuard(routeImport, { path: '/teacher/hub' }, (arg) => { destination = arg })

    expect(destination).toBeUndefined()
  })

  it('detourne quand elle manque, au lieu d ouvrir un ecran mort', () => {
    avecCapacite(false)
    let destination = 'non-appele'
    navigationGuard(routeImport, { path: '/teacher/hub' }, (arg) => { destination = arg })

    expect(destination).toBeTruthy()
    expect(destination).not.toBe('/teacher/import')
  })

  it('n affecte pas les routes qui n en declarent aucune', () => {
    avecCapacite(false)
    let destination = 'non-appele'
    navigationGuard(
      { path: '/teacher/classes', meta: { requiresAuth: true, roles: ['enseignant'] } },
      { path: '/teacher/hub' },
      (arg) => { destination = arg },
    )

    expect(destination).toBeUndefined()
  })

  it('le routeur ne cite jamais le mode d etablissement', () => {
    for (const f of ['src/router/guards.js', 'src/router/routes/teacher.routes.js']) {
      expect(readFileSync(f, 'utf8')).not.toMatch(/klassci_api_url|['"]standalone['"]|\.mode\b/)
    }
  })
})
