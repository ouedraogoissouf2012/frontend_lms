/**
 * Test de RENDU du sous-composant MatieresTable (#G1 ≤300).
 * Vérifie le montage, le rendu d'une ligne par matière, l'affichage des
 * filières/niveaux dérivés et l'émission de `view` au clic sur l'icône détails.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MatieresTable from '@/components/admin/MatieresTable.vue'

const MATIERES = [
  {
    id: 1, nom: 'Mathématiques', coefficient: 4, couleur: '#abc',
    combinaisons: [{ filiere: { nom: 'Scientifique' }, niveau: { nom: '6e' } }],
  },
  {
    id: 2, nom: 'Histoire', coefficient: 2,
    combinaisons: [],
  },
]

function mountTable(props = {}) {
  return mount(MatieresTable, {
    props: { matieres: MATIERES, ...props },
  })
}

describe('MatieresTable (#G1) — rendu', () => {
  it('monte sans erreur et rend une ligne par matière', () => {
    const w = mountTable()
    expect(w.find('.modern-table-container').exists()).toBe(true)
    expect(w.findAll('tbody tr')).toHaveLength(2)
    expect(w.html()).toContain('Mathématiques')
    expect(w.html()).toContain('Histoire')
  })

  it('affiche filières/niveaux dérivés et « - » quand absents', () => {
    const w = mountTable()
    expect(w.html()).toContain('Scientifique')
    expect(w.html()).toContain('6e')
    expect(w.findAll('.empty-value').length).toBeGreaterThan(0)
  })

  it('émet `view` avec la matière au clic sur l\'icône détails', async () => {
    const w = mountTable()
    await w.findAll('.icon-btn')[0].trigger('click')
    expect(w.emitted('view')).toBeTruthy()
    expect(w.emitted('view')[0][0].id).toBe(1)
  })
})
