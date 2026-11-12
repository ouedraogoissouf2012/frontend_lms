/**
 * Lecture honnête : la grille des visios d'admin dit le nombre de participants quand il est connu (0
 * compris), et rien quand il ne l'est pas (null), au lieu de masquer tout nombre nul.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import VisioGrid from '@/components/admin/VisioGrid.vue'

const rendre = (visio) => mount(VisioGrid, {
  props: { visioconferences: [{ id: 1, matiere: 'M', classe: 'C', enseignant: 'E', status: 'scheduled', ...visio }],
    getStatusLabel: () => 'Planifiée', formatDate: () => 'd', formatTime: () => 't' },
})

describe('VisioGrid — participants', () => {
  it('0 connu : « 0 participant(s) » ; null : aucune ligne de participants', () => {
    expect(rendre({ participants_count: 0 }).text()).toContain('0 participant(s)')
    expect(rendre({ participants_count: null }).text()).not.toContain('participant(s)')
    expect(rendre({ participants_count: 3 }).text()).toContain('3 participant(s)')
  })
})
