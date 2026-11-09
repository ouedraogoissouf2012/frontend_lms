/**
 * Extraction des routes du routeur pour l'E2E en CI (D110/D111).
 *
 * Le parcours écran par écran lit la liste ici, dans les vrais fichiers du routeur : elle
 * n'est jamais recopiée à la main. Dans la CI ordinaire, ce test vérifie seulement que la
 * liste est exploitable ; quand `E2E_ROUTES_OUT` est posé (job E2E), il l'écrit en JSON.
 */
import { writeFileSync } from 'node:fs'
import { describe, it, expect, vi } from 'vitest'

// Même précaution que routerRoutes.test.js : core.routes importe le service auth.
vi.mock('@/services/api', () => ({
  auth: { getUser: () => null, isAuthenticated: () => false }
}))

import { coreRoutes } from '@/router/routes/core.routes'
import { adminRoutes } from '@/router/routes/admin.routes'
import { teacherRoutes } from '@/router/routes/teacher.routes'
import { studentRoutes } from '@/router/routes/student.routes'
import { sharedRoutes } from '@/router/routes/shared.routes'
import { fallbackRoutes } from '@/router/routes/fallback.routes'
import { normalizeRole } from '@/constants/roles'

const ROLES_CANONIQUES = ['supradmin', 'admin', 'coordinateur', 'enseignant', 'etudiant']

/** Aplatit les routes (enfants compris) en écrans visitables : chemin complet, rôles, capacité. */
function ecrans(routes, parent = '') {
  return routes.flatMap((r) => {
    const chemin = r.path.startsWith('/') ? r.path : `${parent.replace(/\/$/, '')}/${r.path}`
    const meta = r.meta ?? {}
    const roles = Array.isArray(meta.roles)
      ? [...new Set(meta.roles.map((x) => normalizeRole(x)).filter((x) => ROLES_CANONIQUES.includes(x)))]
      : null
    const ici = {
      chemin,
      nom: r.name ?? null,
      redirection: r.redirect !== undefined,
      composant: typeof r.component === 'function' || typeof r.components === 'object',
      invite: meta.guest === true,
      authentifie: meta.requiresAuth === true,
      roles,
      capacite: meta.capacite ?? null,
    }
    return [ici, ...(r.children ? ecrans(r.children, chemin) : [])]
  })
}

describe('extraction des routes pour l’E2E', () => {
  const liste = ecrans([...coreRoutes, ...adminRoutes, ...teacherRoutes, ...studentRoutes, ...sharedRoutes, ...fallbackRoutes])

  it('donne une liste exploitable : chaque écran a un chemin, et les rôles connus sont canoniques', () => {
    expect(liste.length).toBeGreaterThan(50)
    for (const e of liste) {
      expect(e.chemin.startsWith('/')).toBe(true)
      if (e.roles) for (const role of e.roles) expect(ROLES_CANONIQUES).toContain(role)
    }
    if (process.env.E2E_ROUTES_OUT) writeFileSync(process.env.E2E_ROUTES_OUT, JSON.stringify(liste, null, 2))
  })
})
