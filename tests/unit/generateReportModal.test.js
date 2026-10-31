/**
 * Fenêtre « Générer un rapport » : chaque type n'envoie QUE les filtres que le
 * serveur accepte (spec #991 : RapportPresencesInput, RapportNotesInput,
 * RapportActiviteInput), et l'avancement est annoncé dans une région présente
 * dès l'ouverture.
 *
 * Retirés : « Matière » (aucune route ne l'accepte : le serveur l'ignorait) et
 * « Classe » (le catalogue fournissait un id KLASSCI là où le serveur attend un
 * id LOCAL : le filtre visait une AUTRE classe — D41).
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
  it('ni « Classe » ni « Matière » ne sont proposés, quel que soit le type', async () => {
    const w = await ouvrir()
    for (const type of ['attendance', 'grades', 'activity']) {
      await w.get('select[name="type"]').setValue(type)
      expect(w.text()).not.toMatch(/Classe|Matière/)
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

  it('activité : le type d’activité choisi est envoyé', async () => {
    const w = await ouvrir()
    await w.get('select[name="type"]').setValue('activity')
    await w.get('select[name="activity_type"]').setValue('login')
    await boutonGenerer(w).trigger('click')
    expect(generer.mock.calls[0][0]).toBe('activity')
    expect(generer.mock.calls[0][1].activity_type).toBe('login')
  })

  it('un filtre choisi puis masqué par un changement de type n’est PAS envoyé', async () => {
    const w = await ouvrir()
    await w.get('select[name="type"]').setValue('activity')
    await w.get('select[name="activity_type"]').setValue('grading')
    await w.get('select[name="type"]').setValue('grades')
    await boutonGenerer(w).trigger('click')
    expect(generer.mock.calls[0][0]).toBe('grades')
    expect(generer.mock.calls[0][1]).not.toHaveProperty('activity_type')
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
