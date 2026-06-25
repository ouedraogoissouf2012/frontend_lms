/**
 * Tests de montage des sous-composants présentationnels de SeanceManagement
 * (#H6) : header/bascule, filtres, carte, panneau visio, stats. Feuilles :
 * v-model + émissions, aucun service.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CoordinatorSeanceHeader from '@/components/seances/CoordinatorSeanceHeader.vue'
import CoordinatorSeanceFilters from '@/components/seances/CoordinatorSeanceFilters.vue'
import CoordinatorSeanceCard from '@/components/seances/CoordinatorSeanceCard.vue'
import CoordinatorVisioPanel from '@/components/seances/CoordinatorVisioPanel.vue'
import CoordinatorSeanceStats from '@/components/seances/CoordinatorSeanceStats.vue'

describe('CoordinatorSeanceHeader (#H6)', () => {
  it('bascule viewMode vers calendrier via v-model', async () => {
    const w = mount(CoordinatorSeanceHeader, { props: { viewMode: 'list' } })
    const calBtn = w.findAll('.toggle-btn').find(b => b.text().includes('Calendrier'))
    await calBtn.trigger('click')
    expect(w.emitted('update:viewMode').at(-1)).toEqual(['calendar'])
  })
})

describe('CoordinatorSeanceFilters (#H6)', () => {
  it('émet "change" au changement de période', async () => {
    const w = mount(CoordinatorSeanceFilters, {
      props: { enseignants: [{ id: 1, nom: 'Z', prenom: 'A' }], classes: [{ id: 2, nom: '6e' }] }
    })
    await w.findAll('select')[0].setValue(14)
    expect(w.emitted('change')).toBeTruthy()
  })
})

describe('CoordinatorSeanceCard (#H6)', () => {
  const seance = {
    id: 1,
    matiere: { nom: 'Maths' },
    classe: { nom: '6e A' },
    salle: 'B12',
    programmation: { date: '2026-06-20', heure_debut: '2026-06-20T08:00:00', heure_fin: '2026-06-20T10:00:00' },
    visio_enabled: false
  }

  it('affiche la matière et émet "toggle" au clic', async () => {
    const w = mount(CoordinatorSeanceCard, { props: { seance } })
    expect(w.text()).toContain('Maths')
    expect(w.text()).toContain('Activer visio')
    await w.find('.toggle-visio-btn').trigger('click')
    expect(w.emitted('toggle')[0]).toEqual([seance])
  })

  it('rend le panneau visio quand la visio est activée', () => {
    const w = mount(CoordinatorSeanceCard, {
      props: { seance: { ...seance, visio_enabled: true, visio_room_id: 'r1' } }
    })
    expect(w.find('.visio-panel').exists()).toBe(true)
  })
})

describe('CoordinatorVisioPanel (#H6)', () => {
  it('séance active : bouton Rejoindre émet "join"', async () => {
    const seance = { id: 1, visio_room_id: 'r1', visio_status: 'active' }
    const w = mount(CoordinatorVisioPanel, { props: { seance } })
    expect(w.find('.open-jitsi-btn').exists()).toBe(true)
    await w.find('.open-jitsi-btn').trigger('click')
    expect(w.emitted('join')[0]).toEqual([seance])
  })

  it('séance non active : message d\'attente, émet "show-participants"', async () => {
    const seance = { id: 1, visio_room_id: 'r1', visio_status: 'programmee' }
    const w = mount(CoordinatorVisioPanel, { props: { seance } })
    expect(w.find('.waiting-message').exists()).toBe(true)
    await w.find('.participants-btn').trigger('click')
    expect(w.emitted('show-participants')[0]).toEqual([seance])
  })
})

describe('CoordinatorSeanceStats (#H6)', () => {
  it('calcule total, visios activées et taux', () => {
    const seances = [
      { visio_enabled: true }, { visio_enabled: false }, { visio_enabled: true }, { visio_enabled: false }
    ]
    const w = mount(CoordinatorSeanceStats, { props: { seances } })
    const values = w.findAll('.stat-value').map(v => v.text())
    expect(values[0]).toBe('4')
    expect(values[1]).toBe('2')
    expect(values[2]).toBe('50%')
  })
})
