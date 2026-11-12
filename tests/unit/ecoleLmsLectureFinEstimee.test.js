/**
 * Lecture honnête, point 7 (spec 3d à 25728cf8) : une fin ESTIMÉE (`heure_fin_estimee`, début + 2 h non
 * mesurée) ne s'affiche jamais comme un fait. Chaque écran qui montre une heure de fin le dit.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { finEstimee } from '@/utils/seanceStatut'
import CoordinatorSeanceCard from '@/components/seances/CoordinatorSeanceCard.vue'
import SeanceCardInfo from '@/components/seances/SeanceCardInfo.vue'
import ClasseUpcomingSeances from '@/components/classes/ClasseUpcomingSeances.vue'
import VisioGrid from '@/components/admin/VisioGrid.vue'

const PROG = { date: '2026-11-12', heure_debut: '2026-11-12T08:00:00Z', heure_fin: '2026-11-12T10:00:00Z' }
const seance = (estimee) => ({
  id: 1, matiere: { nom: 'M' }, classe: { nom: 'C' }, enseignant: { nom: 'E' }, visio_enabled: false,
  heure_fin_estimee: estimee, programmation: { ...PROG, heure_fin_estimee: estimee },
})
const stubs = { CoordinatorVisioPanel: true, VisioManager: true }

describe('finEstimee — le drapeau à la racine ou dans programmation', () => {
  it('vrai si l’un des deux le dit, faux sinon', () => {
    expect(finEstimee({ heure_fin_estimee: true })).toBe(true)
    expect(finEstimee({ programmation: { heure_fin_estimee: true } })).toBe(true)
    expect(finEstimee({ heure_fin_estimee: false })).toBe(false)
    expect(finEstimee(null)).toBe(false)
  })
})

describe('écrans de séances — « fin estimée » dite, jamais une fin estimée comme un fait', () => {
  for (const [nom, rendre] of [
    ['CoordinatorSeanceCard', (s) => mount(CoordinatorSeanceCard, { props: { seance: s }, global: { stubs } })],
    ['SeanceCardInfo', (s) => mount(SeanceCardInfo, { props: { seance: s }, global: { stubs } })],
    ['ClasseUpcomingSeances', (s) => mount(ClasseUpcomingSeances, { props: { seances: [s] }, global: { stubs } })],
  ]) {
    it(`${nom} : fin estimée → mention ; fin réelle → aucune`, () => {
      expect(rendre(seance(true)).text()).toMatch(/estimée/)
      expect(rendre(seance(false)).text()).not.toMatch(/estimée/)
    })
  }

  it('ClasseUpcomingSeances : une durée estimée n’est pas donnée en minutes', () => {
    const t = mount(ClasseUpcomingSeances, { props: { seances: [seance(true)] }, global: { stubs } }).text()
    expect(t).not.toMatch(/120 min/)
  })

  it('VisioGrid : la visio d’une séance à fin estimée le dit', () => {
    const rendre = (estimee) => mount(VisioGrid, {
      props: { visioconferences: [{ id: 1, matiere: 'M', classe: 'C', enseignant: 'E', status: 'scheduled', heure_fin_estimee: estimee, participants_count: null }],
        getStatusLabel: () => 'Planifiée', formatDate: () => 'd', formatTime: () => 't' },
    }).text()
    expect(rendre(true)).toMatch(/fin estimée/)
    expect(rendre(false)).not.toMatch(/fin estimée/)
  })
})
