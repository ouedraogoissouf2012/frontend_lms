/**
 * Tests de montage des sous-composants présentationnels SeanceCardHeader et
 * SeanceCardInfo (#H6 ≤300). Composants feuilles, formatters réels.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SeanceCardHeader from '@/components/seances/SeanceCardHeader.vue'
import SeanceCardInfo from '@/components/seances/SeanceCardInfo.vue'

describe('SeanceCardHeader (#H6)', () => {
  it('affiche le nom et le code de la matière', () => {
    const seance = { matiere: { nom: 'Physique', code: 'PHY1' } }
    const w = mount(SeanceCardHeader, { props: { seance } })
    expect(w.text()).toContain('Physique')
    expect(w.text()).toContain('Code: PHY1')
  })

  it('repli si matière absente, badge "EN DIRECT" si visio active', () => {
    const seance = { visio: { status: 'active' } }
    const w = mount(SeanceCardHeader, { props: { seance } })
    expect(w.text()).toContain('Matière non définie')
    expect(w.find('.status-active').exists()).toBe(true)
    expect(w.text()).toContain('EN DIRECT')
  })
})

describe('SeanceCardInfo (#H6)', () => {
  it('affiche classe, salle et replis N/A', () => {
    const seance = { classe: { nom: '5e B' }, salle: 'A3', programmation: {} }
    const w = mount(SeanceCardInfo, { props: { seance } })
    expect(w.text()).toContain('5e B')
    expect(w.text()).toContain('A3')
    // date/heure absentes → repli 'N/A' du formatter
    expect(w.text()).toContain('N/A')
  })
})
