/**
 * #707 — la période en cours filtre, par défaut, les écrans Classes et Séances de la gestion, par le VRAI client HTTP
 * (`api.js`, ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 *
 * - Les périodes viennent de `GET /training-sessions` (toutes les pages) ; la période marquée `en_cours` (lms#1651)
 *   est le choix par défaut ; sans elle, « Toutes les périodes » : rien n'est inventé.
 * - Une classe porte sa période (`periode: {id, libelle} | null`, lms#1785) ; une séance est retenue par sa classe.
 * - Sans période lisible (école sans période, ou refus), le filtre ne s'affiche pas.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useFiltreDePeriode, TOUTES } from '@/composables/useFiltreDePeriode'
import FiltreDePeriode from '@/components/admin/FiltreDePeriode.vue'

const page = (data, last = 1) => ({ success: true, data, meta: { current_page: 1, last_page: last } })
const S1 = { id: 3, libelle: 'Semestre 1', status: 'publiee', en_cours: false }
const S2 = { id: 4, libelle: 'Semestre 2', status: 'publiee', en_cours: true }
let adaptateurOrigine
let envois

function servir(repondre) {
  api.defaults.adapter = async (config) => {
    envois.push({ methode: config.method, url: config.url, params: config.params })
    const [status, data] = repondre(config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  envois = []
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('useFiltreDePeriode (vrai client HTTP)', () => {
  it('lit toutes les pages et choisit par défaut la période en cours', async () => {
    servir((config) => [200, config.params.page === 1 ? page([S1], 2) : page([S2], 2)])
    const f = useFiltreDePeriode()
    await f.charger()
    expect(envois.map((e) => [e.url, e.params.page])).toEqual([['/training-sessions', 1], ['/training-sessions', 2]])
    expect(f.periodes.value.map((p) => p.id)).toEqual([3, 4])
    expect(f.choix.value).toBe(4)
  })

  it('sans période en cours, aucun filtre par défaut', async () => {
    servir(() => [200, page([S1])])
    const f = useFiltreDePeriode()
    await f.charger()
    expect(f.choix.value).toBe(TOUTES)
  })

  it('un refus laisse les écrans sans filtre, jamais vides', async () => {
    servir(() => [403, { success: false, message: 'refus' }])
    const f = useFiltreDePeriode()
    await f.charger()
    expect([f.periodes.value, f.choix.value]).toEqual([[], TOUTES])
    expect(f.classeRetenue({ id: 1, periode: null })).toBe(true)
  })

  it('retient les classes de la période choisie, puis toutes sur demande', async () => {
    servir(() => [200, page([S1, S2])])
    const f = useFiltreDePeriode()
    await f.charger()
    const classes = [{ id: 1, periode: { id: 4, libelle: 'S2' } }, { id: 2, periode: { id: 3, libelle: 'S1' } }, { id: 9, periode: null }]
    expect(classes.filter(f.classeRetenue).map((c) => c.id)).toEqual([1])
    f.choix.value = TOUTES
    expect(classes.filter(f.classeRetenue).map((c) => c.id)).toEqual([1, 2, 9])
  })

  it('retient les séances par leur classe', async () => {
    servir(() => [200, page([S2])])
    const f = useFiltreDePeriode()
    await f.charger()
    const classes = [{ id: 1, periode: { id: 4, libelle: 'S2' } }, { id: 2, periode: null }]
    const seances = [{ id: 10, classe_id: 1 }, { id: 11, classe_id: 2 }, { id: 12, classe_id: null }]
    expect(f.seancesRetenues(seances, classes).map((s) => s.id)).toEqual([10])
  })
})

describe('le sélecteur et les écrans', () => {
  it('le sélecteur se cache sans période, et propose « Toutes » et chaque période', () => {
    expect(mount(FiltreDePeriode, { props: { periodes: [], modelValue: TOUTES } }).find('select').exists()).toBe(false)
    const options = mount(FiltreDePeriode, { props: { periodes: [S1, S2], modelValue: 4 } }).findAll('option').map((o) => o.text())
    expect(options).toEqual(['Toutes les périodes', 'Semestre 1', 'Semestre 2 (en cours)'])
  })

  for (const [vue, liste] of [['AdminClasses', 'classesAffichees'], ['AdminSeances', 'seancesAffichees']]) {
    it(`${vue} monte le filtre et affiche la liste filtrée`, () => {
      const source = readFileSync(resolve(process.cwd(), `src/views/admin/${vue}.vue`), 'utf-8')
      expect(source).toMatch(/<FiltreDePeriode[\s\S]*?v-model="choix"/)
      expect(source).toContain(liste)
    })
  }
})
