/**
 * Test de rendu de ClassePlanningTab (#H9). Trame hebdomadaire de la classe.
 *
 * Forme RÉELLE de /lms/classes/{id} -> data.emploi_temps_semaine, mesurée sur
 * la classe 1 : `jour` et `salle` vivent sous `programmation`, PAS à la racine
 * de la séance. Le composant lisait `seance.jour` (racine, toujours absent) et
 * `seance.salle` (racine, absent alors que `programmation.salle` porte une
 * vraie valeur) -> colonne Jour vide et Salle affichant "N/A" sur une donnée
 * pourtant présente.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClassePlanningTab from '@/components/classes/ClassePlanningTab.vue'

const SEANCE_MESUREE = {
  id: 349,
  matiere: { id: 1, nom: 'Marketing digital', code: 'ID2345', couleur: '#00fbff' },
  programmation: {
    date: '2026-09-02',
    jour: '3',
    heure_debut: '2026-09-03T14:30:00.000000Z',
    heure_fin: '2026-09-03T17:00:00.000000Z',
    salle: 'VISIBLO'
  }
}

function ligne(wrapper) {
  return wrapper.findAll('tbody td').map((td) => td.text())
}

describe('ClassePlanningTab (#H9)', () => {
  it('affiche le jour en toutes lettres depuis programmation.jour', () => {
    const w = mount(ClassePlanningTab, { props: { emploiTemps: [SEANCE_MESUREE] } })
    expect(ligne(w)[0]).toBe('Mercredi')
  })

  it('affiche la salle depuis programmation.salle, pas depuis la racine', () => {
    const w = mount(ClassePlanningTab, { props: { emploiTemps: [SEANCE_MESUREE] } })
    expect(ligne(w)[4]).toBe('VISIBLO')
  })

  it('affiche N/A pour un enseignant reellement absent du payload', () => {
    const w = mount(ClassePlanningTab, { props: { emploiTemps: [SEANCE_MESUREE] } })
    expect(ligne(w)[3]).toBe('N/A')
  })

  it('affiche N/A pour une salle reellement absente, sans planter', () => {
    const sansSalle = { ...SEANCE_MESUREE, programmation: { ...SEANCE_MESUREE.programmation, salle: null } }
    const w = mount(ClassePlanningTab, { props: { emploiTemps: [sansSalle] } })
    expect(ligne(w)[4]).toBe('N/A')
  })

  it('affiche N/A pour un jour absent ou hors plage, jamais un jour invente', () => {
    const sansJour = { ...SEANCE_MESUREE, programmation: { ...SEANCE_MESUREE.programmation, jour: null } }
    const w = mount(ClassePlanningTab, { props: { emploiTemps: [sansJour] } })
    expect(ligne(w)[0]).toBe('N/A')
  })
})
