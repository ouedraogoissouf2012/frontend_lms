/**
 * Fenêtre « Générer un rapport » : chaque type n'envoie QUE les filtres que le
 * serveur accepte (spec #991 : RapportPresencesInput, RapportNotesInput,
 * RapportActiviteInput), et l'avancement est annoncé dans une région présente
 * dès l'ouverture.
 *
 * Retirés : « Matière » (aucune route ne l'accepte : le serveur l'ignorait),
 * « Classe » (le catalogue fournissait un id KLASSCI là où le serveur attend un
 * id LOCAL : le filtre visait une AUTRE classe — D41) et « Type d'activité »
 * (`activity_type` est accepté par le serveur mais sans effet sur le contenu,
 * spec #991 : le choix est retiré jusqu'à ce que le serveur l'applique).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const generer = vi.fn()
const annuler = vi.fn()
const etat = ref('repos')
const error = ref(null)
vi.mock('@/composables/useReportGeneration', () => ({
  useReportGeneration: () => ({ etat, error, generer: (...a) => generer(...a), annuler: (...a) => annuler(...a) }),
}))
vi.mock('@/composables/useToast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import GenerateReportModal from '@/components/modals/GenerateReportModal.vue'
import { filtresDuRapport } from '@/constants/reports'

const STUBS = {
  Modal: { props: ['modelValue'], template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>' },
}

async function ouvrir() {
  const w = mount(GenerateReportModal, { props: { modelValue: false }, global: { stubs: STUBS } })
  await w.setProps({ modelValue: true })
  await flushPromises()
  return w
}
const boutonGenerer = (w) => w.findAll('button').find((b) => /Générer/.test(b.text()))

beforeEach(() => {
  generer.mockReset().mockResolvedValue(undefined)
  annuler.mockReset()
  etat.value = 'repos'
  error.value = null
})

describe('GenerateReportModal — filtres envoyés', () => {
  it('ni « Classe », ni « Matière », ni « Type d’activité » ne sont proposés, quel que soit le type', async () => {
    const w = await ouvrir()
    for (const type of ['attendance', 'grades', 'activity']) {
      await w.get('select[name="type"]').setValue(type)
      expect(w.text()).not.toMatch(/Classe|Matière|Type d'activité/)
      expect(w.find('[name="activity_type"]').exists()).toBe(false)
    }
  })

  it('présences : seulement la période', async () => {
    const w = await ouvrir()
    await w.get('select[name="type"]').setValue('attendance')
    await w.get('input[name="date_start"]').setValue('2026-10-01')
    await w.get('input[name="date_end"]').setValue('2026-10-30')
    await boutonGenerer(w).trigger('click')
    expect(generer).toHaveBeenCalledWith('attendance', { date_start: '2026-10-01', date_end: '2026-10-30' })
  })

  it('activité : seulement la période (le type d’activité serait sans effet)', async () => {
    const w = await ouvrir()
    await w.get('select[name="type"]').setValue('activity')
    await w.get('input[name="date_start"]').setValue('2026-10-01')
    await w.get('input[name="date_end"]').setValue('2026-10-30')
    await boutonGenerer(w).trigger('click')
    expect(generer).toHaveBeenCalledWith('activity', { date_start: '2026-10-01', date_end: '2026-10-30' })
  })

  it('un `activity_type` resté dans un formulaire n’est jamais envoyé', () => {
    const formulaire = { date_start: '2026-10-01', activity_type: 'login' }
    expect(filtresDuRapport('activity', formulaire)).toEqual({ date_start: '2026-10-01' })
  })
})

describe('GenerateReportModal — avancement annoncé', () => {
  it('la région d’état est présente dès l’ouverture, puis dit où en est le rapport', async () => {
    const w = await ouvrir()
    const region = w.get('[role="status"]')
    expect(region.text()).toBe('')
    etat.value = 'generation'
    await flushPromises()
    expect(w.get('[role="status"]').text()).toMatch(/Génération en cours/)
  })

  it('l’erreur s’affiche dans une alerte présente dès l’ouverture', async () => {
    const w = await ouvrir()
    expect(w.get('[role="alert"]').text()).toBe('')
    error.value = 'La génération du rapport a échoué.'
    await flushPromises()
    expect(w.get('[role="alert"]').text()).toBe('La génération du rapport a échoué.')
  })

  it('fermer la fenêtre arrête le suivi', async () => {
    const w = await ouvrir()
    await w.setProps({ modelValue: false })
    await flushPromises()
    expect(annuler).toHaveBeenCalled()
  })
})
