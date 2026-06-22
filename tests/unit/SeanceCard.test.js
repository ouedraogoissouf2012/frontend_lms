/**
 * Test de montage du sous-composant de présentation SeanceCard (G7).
 * Vérifie qu'il monte sans erreur, affiche la matière, le bon état d'action
 * selon l'absence de visio, et émet les intentions d'action attendues.
 * Composant feuille : aucun service/store/router, formatters réels.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SeanceCard from '@/components/seances/SeanceCard.vue'

const baseSeance = {
  id: 42,
  matiere: { nom: 'Mathématiques', code: 'MATH101' },
  classe: { nom: '6e A' },
  salle: 'B12',
  programmation: { date: '2026-06-20', heure_debut: '2026-06-20T08:00:00', heure_fin: '2026-06-20T10:00:00' }
}

describe('SeanceCard (G7) — montage', () => {
  it('monte sans erreur et affiche la matière', () => {
    const w = mount(SeanceCard, { props: { seance: baseSeance } })
    expect(w.find('.seance-card').exists()).toBe(true)
    expect(w.text()).toContain('Mathématiques')
    expect(w.text()).toContain('6e A')
  })

  it('sans visio : propose l\'activation et émet "activate" au clic', async () => {
    const w = mount(SeanceCard, { props: { seance: baseSeance } })
    expect(w.find('.action-none').exists()).toBe(true)
    await w.find('.action-none button').trigger('click')
    expect(w.emitted('activate')[0]).toEqual([baseSeance])
  })

  it('visio active : affiche EN DIRECT et émet "join"', async () => {
    const seance = { ...baseSeance, visio: { enabled: true, status: 'active', room_id: 'r1', participants_count: 3 } }
    const w = mount(SeanceCard, { props: { seance } })
    expect(w.text()).toContain('EN DIRECT')
    await w.find('.btn-success').trigger('click')
    expect(w.emitted('join')[0]).toEqual([seance])
  })
})
