/**
 * Lecture honnête : la liste des matières d'un enseignant ne change jamais une mesure absente (null) en
 * 0. Dans une école créée depuis le LMS, heures, taux et séances ne sont pas suivis : rien n'est
 * inventé (ni « 0h », ni « 0% »).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EnseignantMatieresList from '@/components/admin/EnseignantMatieresList.vue'

const rendre = (matiere) => mount(EnseignantMatieresList, { props: { matieres: [{ id: 1, nom: 'Maths', ...matiere }] } })

describe('EnseignantMatieresList — null reste inconnu', () => {
  it('heures et taux null : ni « 0h » ni « 0% »', () => {
    const t = rendre({ heures_prevues: null, heures_effectuees: null, taux_realisation: null }).text()
    expect(t).not.toMatch(/0h/)
    expect(t).not.toMatch(/0%/)
  })

  it('heures mesurées, taux absent : les heures, et le taux dit « — »', () => {
    const t = rendre({ heures_prevues: 20, heures_effectuees: 5, taux_realisation: null }).text()
    expect(t).toContain('5h / 20h')
    expect(t).not.toMatch(/0%/)
    expect(t).toContain('—')
  })

  it('valeurs mesurées : affichées comme avant', () => {
    const t = rendre({ heures_prevues: 20, heures_effectuees: 10, taux_realisation: 50 }).text()
    expect(t).toContain('10h / 20h')
    expect(t).toContain('50%')
  })
})
