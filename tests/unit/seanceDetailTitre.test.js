/**
 * Détail d'une séance (`/seances/:id`) : l'enseignant ne voyait pas le titre qu'il a donné à sa séance
 * (E2E final de la nuit, run 43547270259, seul écran ROUGE). L'en-tête n'affichait que la matière, et la
 * projection du serveur ne posait pas de clé `titre` (lot back confié à Fille 1). Décision : `titre`,
 * nullable (nul pour une séance KLASSCI qui n'en a pas). L'en-tête montre le titre, sinon la matière
 * comme avant ; la matière passe en sous-titre quand le titre existe.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SeanceDetailsHeader from '@/components/seances/SeanceDetailsHeader.vue'

const base = { matiere: { nom: 'Maths' }, classe: { nom: '6e A' }, enseignant: { nom: 'Awa' }, programmation: { date: '2026-11-15' } }
const monter = (seance) => mount(SeanceDetailsHeader, { props: { seance } })

describe('SeanceDetailsHeader — le titre de la séance', () => {
  it('1. avec un titre : il est le titre de l’écran, la matière en sous-titre', () => {
    const w = monter({ ...base, titre: 'Fractions, séance E2E' })
    expect(w.find('h1').text()).toBe('Fractions, séance E2E')
    expect(w.find('[data-test="seance-matiere"]').text()).toBe('Maths')
  })

  it('2. sans titre (null, séance KLASSCI) : la matière, comme avant, sans sous-titre', () => {
    const w = monter({ ...base, titre: null })
    expect(w.find('h1').text()).toBe('Maths')
    expect(w.find('[data-test="seance-matiere"]').exists()).toBe(false)
  })

  it('3. ni titre ni matière : « Séance »', () => {
    expect(monter({ ...base, matiere: null }).find('h1').text()).toBe('Séance')
  })

  it('4. un titre vide ne remplace pas la matière', () => {
    expect(monter({ ...base, titre: '   ' }).find('h1').text()).toBe('Maths')
  })
})
