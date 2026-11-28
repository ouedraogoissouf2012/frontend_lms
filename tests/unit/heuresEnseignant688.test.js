/**
 * #688 (écran de lms_backend#1682, PR #1793) — les heures de l'enseignant, tirées de la visio, par le VRAI client HTTP
 * (`api.js`, ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 *
 * Contrat serveur :
 * - `GET /lms/mes-heures?mois=AAAA-MM` → `{ mois, depuis, seances: [{ seance_id, titre, date_seance, statut, minutes }],
 *   totaux: { minutes, comptees, non_comptees } }` ;
 * - `GET /lms/heures-enseignants?du&au[&enseignant_id&classe_id&matiere_id]` → `{ du, au, depuis, enseignants: [...] }` ;
 *   `format=csv` rend l'export.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useMesHeures } from '@/composables/useMesHeures'
import { useHeuresEnseignants } from '@/composables/useHeuresEnseignants'
import { dureeLisible, libelleStatutHeures } from '@/constants/heures'
import HeuresDuMoisCard from '@/components/teacher/HeuresDuMoisCard.vue'
import { teacherRoutes } from '@/router/routes/teacher.routes'
import { adminRoutes } from '@/router/routes/admin.routes'
import { NAV_SECTIONS } from '@/constants/navigation'

const MES_HEURES = {
  success: true,
  data: {
    mois: '2026-12',
    depuis: '2026-11-20',
    seances: [
      { seance_id: 7, titre: 'Algèbre', date_seance: '2026-12-01T08:00:00+00:00', statut: 'comptee', minutes: 120 },
      { seance_id: 8, titre: 'Physique', date_seance: '2026-12-02T08:00:00+00:00', statut: 'visio_non_demarree', minutes: 0 },
    ],
    totaux: { minutes: 150, comptees: 1, non_comptees: 1 },
  },
}
const RAPPORT = {
  success: true,
  data: { du: '2026-12-01', au: '2026-12-31', depuis: '2026-11-20', enseignants: [{ enseignant_id: 4, nom: 'Awa', seances: 3, comptees: 2, minutes: 240 }] },
}
let adaptateurOrigine
let envois

function servir(repondre) {
  api.defaults.adapter = async (config) => {
    envois.push({ url: config.url, params: config.params, config })
    const [status, data] = repondre(config)
    const corps = data instanceof Blob ? data : JSON.stringify(data)
    const response = { status, statusText: '', data: corps, headers: { 'content-type': data instanceof Blob ? data.type : 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-12-15T12:00:00'))
  adaptateurOrigine = api.defaults.adapter
  envois = []
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('libellés', () => {
  it('une durée se lit en heures et minutes', () => {
    expect([0, 45, 60, 150, 240].map(dureeLisible)).toEqual(['0 h', '0 h 45', '1 h', '2 h 30', '4 h'])
  })

  it('chaque statut a son libellé', () => {
    expect(['comptee', 'visio_non_demarree', 'auteur_inconnu', 'demarree_par_un_autre', 'visio_non_terminee'].map(libelleStatutHeures)).toEqual([
      'Comptée', 'Visio non démarrée', 'Avant le relevé', 'Démarrée par un autre compte', 'Visio non terminée',
    ])
  })
})

describe('useMesHeures (vrai client HTTP)', () => {
  it('lit le mois en cours par défaut, puis un autre mois', async () => {
    servir(() => [200, MES_HEURES])
    const h = useMesHeures()
    await h.charger()
    expect(envois[0].url).toMatch(/\/lms\/mes-heures$/)
    expect(envois[0].params).toEqual({ mois: '2026-12' })
    expect([h.totaux.value.minutes, h.depuis.value, h.seances.value.length]).toEqual([150, '2026-11-20', 2])
    h.mois.value = '2026-11'
    await h.charger()
    expect(envois[1].params).toEqual({ mois: '2026-11' })
  })

  it('le bloc du tableau de bord dit les heures du mois et depuis quand on compte', async () => {
    servir(() => [200, MES_HEURES])
    const carte = mount(HeuresDuMoisCard, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } })
    await flushPromises()
    expect(carte.text()).toContain('2 h 30')
    expect(carte.text()).toContain('depuis le 20/11/2026')
  })
})

describe('useHeuresEnseignants (vrai client HTTP)', () => {
  it('lit le mois en cours par défaut, sans filtre vide', async () => {
    servir(() => [200, RAPPORT])
    const r = useHeuresEnseignants()
    await r.charger()
    expect(envois[0].url).toMatch(/\/lms\/heures-enseignants$/)
    expect(envois[0].params).toEqual({ du: '2026-12-01', au: '2026-12-31' })
    expect(r.enseignants.value.map((e) => [e.enseignant_id, e.minutes])).toEqual([[4, 240]])
  })

  it('envoie les filtres posés', async () => {
    servir(() => [200, RAPPORT])
    const r = useHeuresEnseignants()
    r.filtres.value.enseignant_id = 4
    r.filtres.value.classe_id = 9
    await r.charger()
    expect(envois[0].params).toEqual({ du: '2026-12-01', au: '2026-12-31', enseignant_id: 4, classe_id: 9 })
  })

  it('exporte le CSV par le client authentifié, en binaire', async () => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:csv')
    globalThis.URL.revokeObjectURL = vi.fn()
    servir(() => [200, new Blob(['enseignant_id;nom'], { type: 'text/csv' })])
    const r = useHeuresEnseignants()
    expect(await r.exporter()).toBe(true)
    expect(envois[0].params).toEqual({ du: '2026-12-01', au: '2026-12-31', format: 'csv' })
    expect(envois[0].config.responseType).toBe('blob')
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })
})

describe('routes et navigation', () => {
  it('« Mes heures » et « Heures des enseignants » sont gardées par la liste locale', () => {
    expect(teacherRoutes.find((r) => r.path === '/teacher/heures')?.meta).toMatchObject({ capacite: 'peutInscrireLocalement' })
    expect(adminRoutes.find((r) => r.path === '/admin/heures-enseignants')?.meta).toMatchObject({
      roles: ['superAdmin', 'admin', 'coordinateur'], capacite: 'peutInscrireLocalement',
    })
    for (const to of ['/teacher/heures', '/admin/heures-enseignants']) {
      expect(NAV_SECTIONS.find((n) => n.to === to)).toMatchObject({ capacite: 'peutInscrireLocalement' })
    }
  })
})
