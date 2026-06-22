/**
 * Test de RENDU de ClassCard (#G1 décompo — extrait d'AdminClasses).
 * Affiche nom, badges filière/niveau, statut actif, stats ; émet view au clic Détails.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClassCard from '@/components/admin/ClassCard.vue'

const classe = {
  id: 1, name: '6e A',
  filiere: { code: 'SCI', name: 'Sciences', nom: 'Sciences' },
  niveau: { code: '6E', nom: 'Sixième' },
  is_active: true, places_occupees: 20, places_totales: 30, nb_matieres: 8,
}

const mountCard = (props = {}) => mount(ClassCard, { props: { classe, ...props } })

describe('ClassCard (#G1) — rendu', () => {
  it('affiche le nom, les badges et le statut actif', () => {
    const w = mountCard()
    expect(w.find('.class-name').text()).toBe('6e A')
    expect(w.find('.badge-filiere').text()).toContain('SCI')
    expect(w.find('.badge-niveau').text()).toContain('6E')
    expect(w.find('.active-badge').exists()).toBe(true)
  })

  it('affiche les stats (places, matières)', () => {
    const w = mountCard()
    expect(w.html()).toContain('20/30')
    expect(w.html()).toContain('8')
  })

  it('masque le badge actif quand is_active est faux', () => {
    const w = mountCard({ classe: { ...classe, is_active: false } })
    expect(w.find('.active-badge').exists()).toBe(false)
  })

  it('émet view avec la classe au clic sur Détails', async () => {
    const w = mountCard()
    await w.find('.btn-action').trigger('click')
    expect(w.emitted('view')[0][0]).toMatchObject({ id: 1, name: '6e A' })
  })
})
