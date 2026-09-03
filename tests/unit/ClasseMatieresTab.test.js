/**
 * Test de rendu de ClasseMatieresTab (#H9). Affiche la table et emet
 * view-matiere au clic sur Voir details.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClasseMatieresTab from '@/components/classes/ClasseMatieresTab.vue'

describe('ClasseMatieresTab (#H9)', () => {
  it('affiche un message quand vide', () => {
    const w = mount(ClasseMatieresTab, { props: { matieres: [] } })
    expect(w.text()).toContain('Aucune matière disponible')
  })

  it('rend une ligne par matiere et emet view-matiere', async () => {
    const w = mount(ClasseMatieresTab, { props: { matieres: [{ id: 3, nom: 'Maths', code: 'MAT', coefficient: 2 }] } })
    expect(w.find('table').exists()).toBe(true)
    expect(w.text()).toContain('Maths')
    await w.find('button').trigger('click')
    expect(w.emitted('view-matiere')[0]).toEqual([3])
  })

  describe('colonne Enseignants — affichee seulement si la donnee existe', () => {
    /**
     * Forme REELLE de /lms/classes/{id} -> data.matieres_disponibles :
     * { id, nom, code, coefficient, couleur, heures, source }. Aucune cle
     * d'enseignant. La colonne affichait pourtant « Non assigne » sur chaque
     * ligne : une affirmation sans mesure, potentiellement fausse.
     */
    const SANS_ENSEIGNANTS = [
      { id: 3, nom: 'Anglais', code: 'ID5356', coefficient: 1, source: 'catalogue_global' },
      { id: 1, nom: 'Marketing digital', code: 'ID2345', coefficient: 1, source: 'catalogue_global' },
    ]

    const AVEC_ENSEIGNANTS = [
      { id: 3, nom: 'Anglais', code: 'ID5356', coefficient: 1, enseignants: [{ nom: 'BEDE ABEL' }] },
    ]

    const entetes = (matieres) =>
      mount(ClasseMatieresTab, { props: { matieres } }).findAll('th').map((th) => th.text())

    it('masque la colonne quand aucune matiere ne porte d enseignant', () => {
      const th = entetes(SANS_ENSEIGNANTS)

      expect(th).toEqual(['Matière', 'Code', 'Coefficient', 'Actions'])
      expect(th).not.toContain('Enseignants')
    })

    it('n affirme plus « Non assigne » sans donnee', () => {
      const w = mount(ClasseMatieresTab, { props: { matieres: SANS_ENSEIGNANTS } })

      // « Non assigne » se lit comme un fait : « cette matiere n'a pas
      // d'enseignant ». Or la source ne dit rien a ce sujet.
      expect(w.text()).not.toContain('Non assigné')
    })

    it('affiche la colonne des que la donnee est presente', () => {
      const w = mount(ClasseMatieresTab, { props: { matieres: AVEC_ENSEIGNANTS } })

      expect(entetes(AVEC_ENSEIGNANTS)).toContain('Enseignants')
      expect(w.text()).toContain('BEDE ABEL')
    })

    it('garde une cellule vide pour une matiere sans enseignant parmi d autres', () => {
      // Colonne affichee (une matiere la porte), mais on n'invente rien pour
      // celles qui ne l'ont pas.
      const w = mount(ClasseMatieresTab, {
        props: { matieres: [...AVEC_ENSEIGNANTS, { id: 9, nom: 'Algo', code: 'A1', coefficient: 1 }] },
      })
      const lignes = w.findAll('tbody tr')

      expect(lignes[1].findAll('td')[3].text()).toBe('')
    })
  })
})
