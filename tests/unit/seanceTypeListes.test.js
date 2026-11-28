/**
 * #675 (lms_backend#1668) — le type sur les listes de séances des trois écrans :
 * - gestion et coordinateur : le filtre `type` part au serveur (`GET /lms/seances/upcoming?type=`), par le VRAI
 *   client HTTP ; une liste filtrée ne sert ni n'écrit le cache de la liste non filtrée ;
 * - enseignant : sa liste se filtre côté écran (`filterSeances`), sur `type_seance` de la carte ;
 * - chaque carte dit le type par `SeanceTypeBadge` ; une séance sans type n'affiche rien.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { filterSeances } from '@/utils/seances'
import { useCoordinatorSeances } from '@/composables/useCoordinatorSeances'
import { useAdminSeances } from '@/composables/useAdminSeances'
import SeanceTypeBadge from '@/components/seances/SeanceTypeBadge.vue'
import SeancesFilters from '@/components/admin/SeancesFilters.vue'
import CoordinatorSeanceFilters from '@/components/seances/CoordinatorSeanceFilters.vue'
import TeacherSeancesFilters from '@/components/seances/TeacherSeancesFilters.vue'

let adaptateurOrigine
let requetes

function servir() {
  api.defaults.adapter = async (config) => {
    requetes.push({ url: config.url, params: config.params ?? {} })
    const corps = { success: true, data: [], meta: {} }
    return { status: 200, statusText: '', data: JSON.stringify(corps), headers: { 'content-type': 'application/json' }, config }
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  servir()
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('filtre de type', () => {
  it('enseignant : ne garde que les cartes du type choisi ; une carte sans type ne passe pas', () => {
    const cartes = [{ id: 1, type_seance: 'td' }, { id: 2, type_seance: 'cm' }, { id: 3, type_seance: null }]
    expect(filterSeances(cartes, { type: 'td' }).map((s) => s.id)).toEqual([1])
    expect(filterSeances(cartes, { type: '' }).map((s) => s.id)).toEqual([1, 2, 3])
  })

  it('coordinateur : le type part au serveur', async () => {
    const c = useCoordinatorSeances()
    c.filters.type = 'td'
    await c.loadSeances()
    const upcoming = requetes.filter((r) => /\/lms\/seances\/upcoming$/.test(r.url))
    expect(upcoming.at(-1).params).toMatchObject({ type: 'td' })
  })

  it('gestion : le type part au serveur', async () => {
    const g = useAdminSeances()
    g.filters.value.type = 'tp'
    await g.loadSeances()
    const upcoming = requetes.filter((r) => /\/lms\/seances\/upcoming$/.test(r.url))
    expect(upcoming.at(-1).params).toMatchObject({ type: 'tp' })
  })

  it.each([
    ['gestion', SeancesFilters],
    ['coordinateur', CoordinatorSeanceFilters],
    ['enseignant', TeacherSeancesFilters],
  ])('%s : le sélecteur de type propose « Tous » et les six types', (_ecran, Composant) => {
    const w = mount(Composant)
    const options = w.get('select[name="type"]').findAll('option')
    expect(options).toHaveLength(7)
    expect(options[0].attributes('value')).toBe('')
  })
})

describe('SeanceTypeBadge', () => {
  it('dit le libellé du type ; sans type, rien', () => {
    expect(mount(SeanceTypeBadge, { props: { type: 'travail_personnel' } }).text()).toBe('Travail personnel')
    expect(mount(SeanceTypeBadge, { props: { type: null } }).html()).not.toContain('seance-type-badge')
  })
})
