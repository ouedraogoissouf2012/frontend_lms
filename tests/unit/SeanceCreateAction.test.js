/**
 * SeanceCreateAction — le bouton « Nouvelle séance » et son dialogue, uniques, montés sur les trois
 * écrans de séances (enseignant, coordinateur, gestion). Caché sans catalogue local (D3). Le
 * dialogue DIT que la visio n'est pas encore possible pour une séance créée ici (D6, lot backend).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({ createSeance: vi.fn(), fetchTeacherMatieres: vi.fn() }))
vi.mock('@/services/lmsSeances', () => ({ lmsSeancesService: { createSeance: (...a) => m.createSeance(...a) } }))
vi.mock('@/services/teacherReferentials', () => ({ fetchTeacherMatieres: (...a) => m.fetchTeacherMatieres(...a) }))
vi.mock('@/services/cache', () => ({ clearCache: vi.fn(), clearCacheByPrefix: vi.fn() }))

import SeanceCreateAction from '@/components/seances/SeanceCreateAction.vue'

const LOCAL = [{ id: 5, nom: 'Maths', source: 'lms_local', classes: [{ id: 11, nom: '6e A' }] }]
const monter = (props = {}) => mount(SeanceCreateAction, { props, global: { stubs: { teleport: true } } })

beforeEach(() => {
  m.createSeance.mockReset()
  m.fetchTeacherMatieres.mockReset()
})

describe('SeanceCreateAction', () => {
  it('catalogue KLASSCI : aucun bouton', async () => {
    const w = monter({ matieres: [{ id: 1, nom: 'Maths', classes: [] }] })
    await flushPromises()
    expect(w.text()).not.toContain('Nouvelle séance')
  })

  it('sans liste fournie : charge le catalogue, et le bouton paraît s’il est local', async () => {
    m.fetchTeacherMatieres.mockResolvedValue(LOCAL)
    const w = monter()
    await flushPromises()
    expect(m.fetchTeacherMatieres).toHaveBeenCalledTimes(1)
    expect(w.find('button.btn-create').exists()).toBe(true)
  })

  it('le dialogue dit que la visio n’est pas encore possible ; une création réussie émet « created »', async () => {
    m.createSeance.mockResolvedValue({ id: 42 })
    const w = monter({ matieres: LOCAL })
    await flushPromises()
    await w.find('button.btn-create').trigger('click')
    expect(w.text()).toMatch(/visioconférence n.est pas encore disponible/i)
    await w.find('select[name="matiere"]').setValue('5')
    await w.find('select[name="classe"]').setValue('11')
    await w.find('input[name="titre"]').setValue('Révision')
    await w.find('input[name="debut"]').setValue('2026-11-13T08:30')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(m.createSeance).toHaveBeenCalledTimes(1)
    expect(w.emitted('created')?.[0]).toEqual([{ id: 42 }])
  })
})

describe('montée sur les trois écrans de séances', () => {
  for (const vue of ['src/views/TeacherSeances.vue', 'src/views/coordinateur/SeanceManagement.vue', 'src/views/admin/AdminSeances.vue']) {
    it(vue, () => {
      const source = readFileSync(resolve(process.cwd(), vue), 'utf-8')
      expect(source).toMatch(/<SeanceCreateAction[\s\S]*?@created=/)
    })
  }
})
