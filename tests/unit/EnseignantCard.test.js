/**
 * Test de rendu EnseignantCard (#G1 ≤300) : affichage du nom/email, comptage
 * matières/classes, tags conditionnels et émission de `view` au clic.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EnseignantCard from '@/components/admin/EnseignantCard.vue'

const enseignant = {
  id: 1,
  nom: 'Zoé',
  prenom: 'Prof',
  email: 'zoe@e.com',
  telephone: '0102030405',
  klassci_id: 'K-42',
  matieres: [{ id: 11, classes: [{ id: 100 }, { id: 101 }] }],
}

describe('EnseignantCard (#G1)', () => {
  it('affiche le nom, l\'email et les comptages', () => {
    const w = mount(EnseignantCard, { props: { enseignant } })
    expect(w.find('.enseignant-name').text()).toBe('Zoé Prof')
    expect(w.find('.enseignant-email').text()).toBe('zoe@e.com')
    const values = w.findAll('.detail-value').map(n => n.text())
    expect(values).toEqual(['1', '2', '0102030405', 'K-42'])
  })

  it('affiche les tags matières et classes (pluriel)', () => {
    const w = mount(EnseignantCard, { props: { enseignant } })
    expect(w.find('.tag-matiere').text()).toBe('1 matière')
    expect(w.find('.tag-classe').text()).toBe('2 classes')
  })

  it('émet view avec l\'enseignant au clic sur la carte', async () => {
    const w = mount(EnseignantCard, { props: { enseignant } })
    await w.find('.enseignant-card').trigger('click')
    expect(w.emitted('view')[0][0]).toMatchObject({ id: 1, nom: 'Zoé' })
  })

  it('masque téléphone/KLASSCI ID et tags quand absents/vides', () => {
    const w = mount(EnseignantCard, {
      props: { enseignant: { id: 2, nom: 'Sans', prenom: 'Cours', matieres: [] } },
    })
    expect(w.findAll('.detail-row')).toHaveLength(2) // matières + classes uniquement
    expect(w.find('.tag-matiere').exists()).toBe(false)
    expect(w.find('.tag-classe').exists()).toBe(false)
  })
})
