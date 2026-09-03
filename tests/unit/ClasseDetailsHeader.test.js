/**
 * Test de rendu de ClasseDetailsHeader (#H9). Affiche titre + stats et emet back.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClasseDetailsHeader from '@/components/classes/ClasseDetailsHeader.vue'

describe('ClasseDetailsHeader (#H9)', () => {
  it('affiche le nom de la classe et les compteurs', () => {
    const w = mount(ClasseDetailsHeader, {
      props: { classe: { nom: '6e A' }, loading: false, etudiantsCount: 20, matieresCount: 8, evaluationsCount: 3 }
    })
    expect(w.find('.page-title').text()).toBe('6e A')
    const vals = w.findAll('.stat-value-header').map(v => v.text())
    expect(vals).toEqual(['20', '8', '3'])
  })

  it('masque les stats pendant le chargement', () => {
    const w = mount(ClasseDetailsHeader, { props: { classe: null, loading: true } })
    expect(w.find('.stats-grid-header').exists()).toBe(false)
  })

  it('emet back au clic sur Retour', async () => {
    const w = mount(ClasseDetailsHeader, { props: { classe: { nom: 'X' }, loading: false } })
    await w.find('.btn-retour').trigger('click')
    expect(w.emitted('back')).toBeTruthy()
  })

  describe('titre — forme reelle du payload', () => {
    const titre = (classe, loading = false) =>
      mount(ClasseDetailsHeader, { props: { classe, loading } }).find('.page-title').text()

    it('affiche le nom porte par `name`', () => {
      // Forme RÉELLE de /lms/classes/{id} → data.classe, mesurée sur la classe 1 :
      // { id, name: 'B2 COM', libelle: null, filiere, niveau, places_* }.
      // Le champ `nom` N'EXISTE PAS — d'où un titre bloqué sur « Chargement… »
      // en permanence, même une fois la classe chargée.
      expect(titre({ id: 1, name: 'B2 COM', libelle: null })).toBe('B2 COM')
    })

    it('accepte encore `libelle` et `nom` des autres sources', () => {
      expect(titre({ id: 2, libelle: 'B3 COM' })).toBe('B3 COM')
      expect(titre({ id: 3, nom: '6e A' })).toBe('6e A')
    })

    it('annonce le chargement tant que la classe n est pas arrivee', () => {
      expect(titre(null, true)).toBe('Chargement...')
    })

    it('ne reste pas en « Chargement… » quand le chargement est fini sans classe', () => {
      // Un chargement terminé sans classe est un échec, pas une attente :
      // laisser « Chargement… » ferait patienter devant un écran mort.
      expect(titre(null, false)).not.toBe('Chargement...')
    })
  })
})
