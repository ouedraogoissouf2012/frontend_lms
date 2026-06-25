/**
 * Test de rendu GradesStatsCards (#H10 ≤300) : affichage de la moyenne générale,
 * des totaux matières/évaluations, du taux de réussite et de la meilleure note.
 * Présentation pure : aucune logique, on vérifie le mapping props → texte/classe.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import GradesStatsCards from '@/components/student/GradesStatsCards.vue'

const baseProps = {
  moyenneGenerale: 14,
  totalMatieres: 3,
  totalEvaluations: 12,
  statsReussite: { total: 12, reussies: 9, taux: 75 },
  statsMeilleureNote: 18,
  meilleureMatiere: 'Mathématiques',
}

const mountCards = (props = {}) =>
  mount(GradesStatsCards, { props: { ...baseProps, ...props } })

describe('GradesStatsCards (#H10)', () => {
  it('affiche la moyenne générale sur /20', () => {
    const w = mountCards()
    expect(w.find('.moyenne-card .stat-value').text()).toBe('14/20')
  })

  it('applique la classe couleur de la moyenne via getMoyenneClass', () => {
    // 14 → note-good (palier ≥14) sur la valeur ET la barre de progression
    const w = mountCards({ moyenneGenerale: 14 })
    expect(w.find('.moyenne-card .stat-value').classes()).toContain('note-good')
    expect(w.find('.moyenne-card .progress-fill').classes()).toContain('note-good')
  })

  it('affiche les totaux matières et évaluations', () => {
    const w = mountCards()
    const text = w.text()
    expect(text).toContain('3')
    expect(text).toContain('12 évaluations')
  })

  it('affiche le taux de réussite et le détail réussies/total', () => {
    const w = mountCards()
    const text = w.text()
    expect(text).toContain('75%')
    expect(text).toContain('9/12 éval.')
  })

  it('affiche la meilleure note et la matière associée', () => {
    const w = mountCards()
    const text = w.text()
    expect(text).toContain('18/20')
    expect(text).toContain('Mathématiques')
  })

  it('masque la meilleure matière quand elle est absente', () => {
    const w = mountCards({ meilleureMatiere: '' })
    // 4 cartes mais une seule a .stat-detail caché → 2 détails restants
    expect(w.text()).not.toContain('Mathématiques')
  })
})
