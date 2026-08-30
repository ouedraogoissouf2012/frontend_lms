/**
 * Tests de la configuration de navigation déclarative (#104 / N1).
 *
 * Contrat de FIDÉLITÉ : la sortie de `filterSectionsByRole(NAV_SECTIONS, role)` doit
 * reproduire EXACTEMENT (libellés, routes, ordre) le `menuSections` codé en dur dans
 * `src/components/layout/Sidebar.vue` (138-344) pour chaque rôle. Les attendus ci-dessous
 * sont recopiés à la main depuis ce source — toute divergence est un bug de la config.
 *
 * Couvre : admin, teacher, student, coordinateur (DoD), plus supradmin, alias backend,
 * fail-secure, immuabilité de la source, et filtrage récursif des `children`.
 */
import { describe, it, expect, vi } from 'vitest'

// useNavigation importe `auth` depuis @/services/api (axios + store) ; on le remplace
// par un faux léger — le composable est testé via `user` injecté, jamais via getUser.
vi.mock('@/services/api', () => ({ auth: { getUser: () => null } }))

import { NAV_SECTIONS } from '@/constants/navigation'
import { filterSectionsByRole, useNavigation } from '@/composables/useNavigation'

/** Réduit une liste d'items à ses couples [label, to] dans l'ordre — pour comparaison. */
const shape = (sections) => sections.map((s) => [s.label, s.to])

// Attendus recopiés du Sidebar source, dans l'ordre d'empilement, par rôle.
const EXPECTED = {
  etudiant: [
    ['Dashboard', '/student/dashboard'],
    ['Mes Cours', '/student/courses'],
    ['Emploi du Temps', '/student/schedule'],
    ['Évaluations', '/student/evaluations-list'],
    ['Mes Notes', '/student/grades'],
    ['Forum', '/forum'],
    ['Paramètres', '/student/settings'],
  ],
  enseignant: [
    ['Dashboard', '/teacher/dashboard'],
    ['Emploi du Temps', '/teacher/schedule'],
    ['Mon Espace', '/teacher/hub'],
    ['Évaluations', '/teacher/evaluations'],
    ['Forum', '/forum'],
    ['Historique', '/attendance/seances'],
    ['Paramètres', '/teacher/settings'],
  ],
  coordinateur: [
    ['Dashboard', '/admin/dashboard'],
    ['Évaluations', '/coordinateur/evaluations'],
    ['Espace Admin', '/admin/hub'],
    ['Résultats', '/admin/evaluations/results'],
    ['Séances & Visio', '/coordinateur/seances'],
    ['Forum', '/forum'],
    ['Historique', '/attendance/seances'],
    ['Paramètres', '/admin/settings'],
  ],
  admin: [
    ['Dashboard', '/admin/dashboard'],
    ['Utilisateurs', '/admin/users'],
    ['Classes', '/admin/classes'],
    ['Matières', '/admin/matieres'],
    ['Enseignants', '/admin/enseignants'],
    ['Séances', '/admin/seances'],
    ['Visioconférences', '/admin/visioconferences'],
    ['Résultats Évaluations', '/admin/evaluations/results'],
    ['Statistiques', '/admin/stats'],
    ['Forum', '/forum'],
    ['Historique', '/attendance/seances'],
    ['Paramètres', '/admin/settings'],
  ],
  supradmin: [
    ['Institutions', '/admin/institutions'],
  ],
}

describe('NAV_SECTIONS — filtrage par rôle reproduit le Sidebar source', () => {
  for (const [role, expected] of Object.entries(EXPECTED)) {
    it(`rôle ${role} : libellés, routes et ordre identiques`, () => {
      const got = filterSectionsByRole(NAV_SECTIONS, { role })
      expect(shape(got)).toEqual(expected)
    })
  }

  it('chaque item conservé porte une icône non vide (parité Sidebar)', () => {
    const got = filterSectionsByRole(NAV_SECTIONS, { role: 'admin' })
    expect(got.every((s) => typeof s.icon === 'string' && s.icon.length > 0)).toBe(true)
  })
})

describe('Réutilisation de la couche rôles (alias backend, fail-secure)', () => {
  it('accepte les alias backend (teacher → enseignant ; superAdmin → admin d\'école, #659)', () => {
    expect(shape(filterSectionsByRole(NAV_SECTIONS, 'teacher'))).toEqual(EXPECTED.enseignant)
    expect(shape(filterSectionsByRole(NAV_SECTIONS, 'superAdmin'))).toEqual(EXPECTED.admin)
  })

  it('mappe secretaire → coordinateur (divergence tracée #18-FE-1)', () => {
    expect(shape(filterSectionsByRole(NAV_SECTIONS, 'secretaire'))).toEqual(EXPECTED.coordinateur)
  })

  it('rôle inconnu / null / absent → aucune section (fail-secure)', () => {
    expect(filterSectionsByRole(NAV_SECTIONS, 'pirate')).toEqual([])
    expect(filterSectionsByRole(NAV_SECTIONS, null)).toEqual([])
    expect(filterSectionsByRole(NAV_SECTIONS, {})).toEqual([])
  })
})

describe('Immuabilité et isolation', () => {
  it('NAV_SECTIONS est gelé', () => {
    expect(Object.isFrozen(NAV_SECTIONS)).toBe(true)
  })

  it('retourne de nouveaux objets (pas de fuite de référence sur la source)', () => {
    const got = filterSectionsByRole(NAV_SECTIONS, { role: 'etudiant' })
    expect(got[0]).not.toBe(NAV_SECTIONS[0])
    got[0].label = 'MUTÉ'
    expect(NAV_SECTIONS[0].label).toBe('Dashboard')
  })

  it('entrée non-tableau → []', () => {
    expect(filterSectionsByRole(undefined, 'admin')).toEqual([])
    expect(filterSectionsByRole(null, 'admin')).toEqual([])
  })
})

describe('Filtrage récursif des children (évolutions #N2/#N3)', () => {
  const FIXTURE = [
    {
      label: 'Groupe', icon: 'fa-folder', roles: ['admin', 'enseignant'],
      children: [
        { label: 'Réservé admin', to: '/x', icon: 'fa-a', roles: ['admin'] },
        { label: 'Réservé prof', to: '/y', icon: 'fa-b', roles: ['enseignant'] },
      ],
    },
    {
      label: 'Groupe vide pour étudiant', icon: 'fa-folder', roles: ['admin', 'etudiant'],
      children: [{ label: 'admin only', to: '/z', icon: 'fa-c', roles: ['admin'] }],
    },
  ]

  it('ne conserve que les enfants autorisés', () => {
    const got = filterSectionsByRole(FIXTURE, 'enseignant')
    expect(got).toHaveLength(1)
    expect(shape(got[0].children)).toEqual([['Réservé prof', '/y']])
  })

  it('masque un groupe dont tous les enfants sont filtrés', () => {
    const got = filterSectionsByRole(FIXTURE, { role: 'etudiant' })
    // 'Groupe vide pour étudiant' visible par rôle mais sans enfant autorisé → retiré.
    expect(got).toEqual([])
  })
})

describe('useNavigation — enveloppe réactive', () => {
  it('expose un computed de sections filtrées pour un user injecté', () => {
    const { sections } = useNavigation({ user: { role: 'admin' } })
    expect(shape(sections.value)).toEqual(EXPECTED.admin)
  })

  it('accepte une config injectée (substituabilité / DIP)', () => {
    const { sections } = useNavigation({
      user: 'enseignant',
      sections: [{ label: 'X', to: '/x', icon: 'fa-x', roles: ['enseignant'] }],
    })
    expect(shape(sections.value)).toEqual([['X', '/x']])
  })

  it('user null injecté → aucune section', () => {
    const { sections } = useNavigation({ user: null })
    expect(sections.value).toEqual([])
  })
})
