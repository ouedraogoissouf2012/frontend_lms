/**
 * Menu et capacités (#391) : un lien vers un écran gardé par une capacité serveur
 * (`meta.capacite`) n'apparaît que si la capacité est accordée. Sans cela, une école
 * reliée à KLASSCI verrait un lien mort (la garde de route le renverrait ailleurs).
 * Le menu ne lit AUCUN mode : il lit la capacité publiée par le serveur.
 */
import { describe, it, expect } from 'vitest'
import { filterSectionsByRole } from '@/composables/useNavigation'
import { NAV_SECTIONS } from '@/constants/navigation'

const SECTIONS = [
  { label: 'Libre', to: '/a', roles: ['admin'] },
  { label: 'Gardé', to: '/b', roles: ['admin'], capacite: 'peutInscrireLocalement' },
]

describe('filterSectionsByRole — capacités (#391)', () => {
  it('sans capacité accordée, l’entrée gardée disparaît', () => {
    expect(filterSectionsByRole(SECTIONS, 'admin', {}).map((i) => i.label)).toEqual(['Libre'])
  })

  it('capacité accordée : l’entrée gardée apparaît', () => {
    expect(filterSectionsByRole(SECTIONS, 'admin', { peutInscrireLocalement: true }).map((i) => i.label)).toEqual(['Libre', 'Gardé'])
  })

  it('sans troisième argument, fail-secure : aucune entrée gardée', () => {
    expect(filterSectionsByRole(SECTIONS, 'admin').map((i) => i.label)).toEqual(['Libre'])
  })

  it('le rôle reste exigé même avec la capacité', () => {
    expect(filterSectionsByRole(SECTIONS, 'etudiant', { peutInscrireLocalement: true })).toEqual([])
  })
})

describe('NAV_SECTIONS — entrées du code d’inscription (#391)', () => {
  const entree = (to) => NAV_SECTIONS.find((i) => i.to === to)

  it('« Codes d’inscription » : personnel, gardé par la capacité', () => {
    expect(entree('/admin/enrolment-codes')).toMatchObject({ capacite: 'peutInscrireLocalement' })
    expect(filterSectionsByRole(NAV_SECTIONS, 'coordinateur', { peutInscrireLocalement: true }).some((i) => i.to === '/admin/enrolment-codes')).toBe(true)
    expect(filterSectionsByRole(NAV_SECTIONS, 'coordinateur', {}).some((i) => i.to === '/admin/enrolment-codes')).toBe(false)
  })

  it('« Rejoindre une classe » : élève, gardé par la capacité', () => {
    expect(entree('/student/rejoindre')).toMatchObject({ capacite: 'peutInscrireLocalement' })
    expect(filterSectionsByRole(NAV_SECTIONS, 'etudiant', { peutInscrireLocalement: true }).some((i) => i.to === '/student/rejoindre')).toBe(true)
    expect(filterSectionsByRole(NAV_SECTIONS, 'etudiant', {}).some((i) => i.to === '/student/rejoindre')).toBe(false)
  })
})
