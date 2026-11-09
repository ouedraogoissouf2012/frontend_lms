/**
 * Écrans de classes de l'admin d'école : une valeur NON MESURÉE se lit « — », jamais 0 ni 30.
 *
 * Constat (09/11/2026) : la carte de /admin/classes et le widget « Classes » de
 * /admin/dashboard affichaient « 0/30 » ou « 0/0 » pour une classe dont ni l'effectif ni la
 * capacité n'étaient connus. Le 30 était inventé (getClassCapacity), le 0 aussi (`|| 0`).
 * Un vrai zéro mesuré reste « 0 ». Même règle que la carte de classe de l'enseignant.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, it, expect, vi } from 'vitest'

const h = vi.hoisted(() => ({
  readCache: vi.fn(),
  writeCache: vi.fn(),
  getClasses: vi.fn(),
  getMatieres: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/cache', () => ({ readCache: h.readCache, writeCache: h.writeCache }))
vi.mock('@/services/klassci', () => ({
  klassciService: { getClasses: h.getClasses, getMatieres: h.getMatieres },
}))

import { useAdminClasses } from '@/composables/useAdminClasses'
import ClassCard from '@/components/admin/ClassCard.vue'
import ClassesStatsCards from '@/components/admin/ClassesStatsCards.vue'
import DashboardClasses from '@/components/dashboard/DashboardClasses.vue'

async function charger() {
  let api
  mount(defineComponent({ setup() { api = useAdminClasses(); return () => null } }))
  await flushPromises()
  return api
}

const MESUREE = { id: 1, name: '6e A', is_active: true, places_occupees: 2, effectif_max: 40, matieres: [{ id: 9 }] }
const MUETTE = { id: 2, name: '5e B', is_active: true }

beforeEach(() => {
  h.readCache.mockReset().mockReturnValue(null)
  h.writeCache.mockReset()
  h.getClasses.mockReset().mockResolvedValue([MESUREE, MUETTE])
  h.getMatieres.mockReset().mockRejectedValue(new Error('matières indisponibles'))
})

describe('useAdminClasses — le résumé d’une classe ne fabrique aucun chiffre', () => {
  it('capacité absente → null, jamais le 30 inventé', async () => {
    const c = await charger()
    expect(c.classes.value[1].places_totales).toBeNull()
    expect(c.classes.value[0].places_totales).toBe(40)
  })

  it('effectif absent → null ; matières non mesurables → null', async () => {
    const c = await charger()
    expect(c.classes.value[1].places_occupees).toBeNull()
    expect(c.classes.value[1].nb_matieres).toBeNull()
    expect(c.classes.value[0].places_occupees).toBe(2)
    expect(c.classes.value[0].nb_matieres).toBe(1)
  })

  it('total des étudiants : null si UNE classe n’est pas mesurée (un total partiel mentirait)', async () => {
    const c = await charger()
    expect(c.stats.value.totalEtudiants).toBeNull()
  })

  it('total des étudiants : la somme quand toutes les classes sont mesurées, vrai zéro compris', async () => {
    h.getClasses.mockResolvedValue([MESUREE, { ...MUETTE, etudiants_count: 0 }])
    const c = await charger()
    expect(c.stats.value.totalEtudiants).toBe(2)
  })

  it('le cache d’avant (qui portait le 30 inventé) n’est plus relu', async () => {
    await charger()
    expect(h.readCache).not.toHaveBeenCalledWith('admin_classes_v3')
  })
})

describe('useAdminClasses — une classe au statut inconnu (is_active null)', () => {
  const INCONNUE = { id: 3, name: '4e C', is_active: null }

  beforeEach(() => {
    h.getClasses.mockResolvedValue([MESUREE, { ...MUETTE, is_active: false }, INCONNUE])
  })

  it('reste visible sans filtre de statut, et comptée dans le total', async () => {
    const c = await charger()
    expect(c.filteredClasses.value.map((x) => x.id)).toContain(3)
    expect(c.stats.value.total).toBe(3)
  })

  it('n’apparaît ni dans « Actives » ni dans « Inactives »', async () => {
    const c = await charger()
    c.filters.value.statut = 'active'
    expect(c.filteredClasses.value.map((x) => x.id)).toEqual([1])
    c.filters.value.statut = 'inactive'
    expect(c.filteredClasses.value.map((x) => x.id)).toEqual([2])
  })

  it('n’est pas comptée active', async () => {
    const c = await charger()
    expect(c.stats.value.actives).toBe(1)
  })
})

describe('rendu : « — » pour une valeur absente, le nombre pour une valeur mesurée', () => {
  const stats = (w) => w.findAll('.stat-value').map((v) => v.text())

  it('ClassCard : « —/— » et « — » pour une classe muette', () => {
    const w = mount(ClassCard, { props: { classe: { ...MUETTE, places_occupees: null, places_totales: null, nb_matieres: null } } })
    expect(stats(w)).toEqual(['—/—', '—'])
  })

  it('ClassCard : un vrai zéro reste « 0 », une capacité inconnue reste « — »', () => {
    const w = mount(ClassCard, { props: { classe: { ...MUETTE, places_occupees: 0, places_totales: null, nb_matieres: 0 } } })
    expect(stats(w)).toEqual(['0/—', '0'])
  })

  it('ClassesStatsCards : total des étudiants non mesuré → « — »', () => {
    const w = mount(ClassesStatsCards, { props: { stats: { total: 2, totalEtudiants: null, totalMatieres: 0, actives: 1 } } })
    expect(stats(w)).toEqual(['2', '—', '0', '1'])
  })

  it('DashboardClasses (/admin/dashboard) : mesure la charge utile brute, « — » à défaut', () => {
    const w = mount(DashboardClasses, { props: { classes: [MESUREE, MUETTE, { id: 4, name: '3e D', etudiants_count: 0 }] } })
    expect(w.findAll('.class-capacity span').map((s) => s.text())).toEqual(['2/40', '—/—', '0/—'])
  })
})
