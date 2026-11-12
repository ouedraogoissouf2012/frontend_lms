/**
 * La clé du cache des matières de l'enseignant est VERSIONNÉE (lot « création d'une séance ») :
 * avant B-source, ses cartes ne portaient pas `source`. Relue après le déploiement, une telle entrée
 * cacherait le bouton « Nouvelle séance » (D3) pendant toute la vie du cache. Une ancienne entrée
 * n'est donc jamais relue : l'API l'est. Une seule constante, partagée par les trois composables.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ getMatieres: vi.fn(), getMyTeachingSeances: vi.fn(), store: {} }))
vi.mock('@/services/lms', () => ({
  lmsService: { getMyTeachingSeances: (...a) => h.getMyTeachingSeances(...a) },
}))
vi.mock('@/services/klassci', () => ({ klassciService: { getMatieres: (...a) => h.getMatieres(...a) } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ currentUser: { id: 1, role: 'enseignant', name: 'X' } }) }))
vi.mock('@/composables/useToast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/composables/useTrackedVisioJoin', () => ({ useTrackedVisioJoin: () => ({ joinTrackedVisio: vi.fn() }) }))
vi.mock('@/services/cache', () => ({
  readCache: (k) => (k in h.store ? h.store[k] : null),
  writeCache: (k, v) => { h.store[k] = v },
  clearCache: (k) => { delete h.store[k] },
}))

import { useTeacherSeances } from '@/composables/useTeacherSeances'
import { TEACHER_MATIERES_CACHE } from '@/constants/cacheKeys'

const ANCIENNE = [{ id: 5, nom: 'Maths', classes: [] }]
const NOUVELLE = [{ id: 5, nom: 'Maths', classes: [{ id: 11, nom: '6e A' }], source: 'lms_local' }]

async function monter() {
  let api
  mount(defineComponent({ setup() { api = useTeacherSeances(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  h.store = {}
  h.getMatieres.mockReset()
  h.getMyTeachingSeances.mockReset()
  h.getMyTeachingSeances.mockResolvedValue({ success: true, data: [] })
})

describe('cache des matières de l’enseignant — clé versionnée', () => {
  it('la clé n’est plus « teacher_matieres »', () => {
    expect(TEACHER_MATIERES_CACHE).not.toBe('teacher_matieres')
  })

  it('une ANCIENNE entrée (sans source) n’est pas relue : l’API l’est, sous la nouvelle clé', async () => {
    h.store.teacher_matieres = ANCIENNE
    h.getMatieres.mockResolvedValue(NOUVELLE)
    const c = await monter()
    expect(h.getMatieres).toHaveBeenCalledTimes(1)
    expect(c.matieres.value).toEqual(NOUVELLE)
    expect(h.store[TEACHER_MATIERES_CACHE]).toEqual(NOUVELLE)
  })

  it('une entrée sous la nouvelle clé reste servie (le cache marche toujours)', async () => {
    h.store[TEACHER_MATIERES_CACHE] = NOUVELLE
    const c = await monter()
    expect(h.getMatieres).not.toHaveBeenCalled()
    expect(c.matieres.value).toEqual(NOUVELLE)
  })

  it('aucun composable ne lit encore la clé littérale d’avant', () => {
    for (const f of ['useTeacherSeances', 'useTeacherLessons', 'useTeacherEvaluations']) {
      const source = readFileSync(resolve(process.cwd(), `src/composables/${f}.js`), 'utf-8')
      expect(source, f).not.toMatch(/['"`]teacher_matieres['"`]/)
      expect(source, f).toContain('TEACHER_MATIERES_CACHE')
    }
  })
})
