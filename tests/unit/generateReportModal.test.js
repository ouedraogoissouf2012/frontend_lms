/**
 * Fenêtre « Générer un rapport » : chaque type n'envoie QUE les filtres que le
 * serveur accepte (spec #991 : RapportPresencesInput, RapportNotesInput,
 * RapportActiviteInput), et l'avancement est annoncé dans une région présente
 * dès l'ouverture.
 *
 * « Classe » revient pour les présences, par l'id LOCAL de
 * `GET /lms/classes/etablissement` (lms_backend#1709) : l'ancien filtre lisait le
 * catalogue KLASSCI, d'un autre espace d'ids (D41). Le service est remplacé ici ;
 * sa traversée du vrai client HTTP est dans `classesDeLEtablissementApiReelle.test.js`.
 *
 * Retirés : « Matière » (aucune route ne l'accepte : le serveur l'ignorait) et
 * « Type d'activité » (`activity_type` est accepté par le serveur mais sans effet
 * sur le contenu, spec #991 : le choix est retiré jusqu'à ce que le serveur
 * l'applique).
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
const listerClasses = vi.fn()
vi.mock('@/services/classesDeLEtablissement', () => ({
  listerClassesDeLEtablissement: (...a) => listerClasses(...a),
}))

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
  listerClasses.mockReset().mockResolvedValue([
    { id: 41, libelle: 'Terminale A' },
    { id: 42, libelle: 'Terminale B' },
  ])
  annuler.mockReset()
  etat.value = 'repos'
  error.value = null
})

describe('GenerateReportModal — filtres envoyés', () => {
  it('ni « Matière », ni « Type d’activité » ne sont proposés, quel que soit le type', async () => {
    const w = await ouvrir()
    for (const type of ['attendance', 'grades', 'activity']) {
      await w.get('select[name="type"]').setValue(type)
      expect(w.text()).not.toMatch(/Matière|Type d'activité/)
      expect(w.find('[name="activity_type"]').exists()).toBe(false)
    }
  })

  it('« Classe » n’est proposée qu’au rapport de présences, et les classes ne sont lues que pour lui', async () => {
    const w = await ouvrir()
    for (const type of ['grades', 'activity']) {
      await w.get('select[name="type"]').setValue(type)
      expect(w.find('select[name="classe_id"]').exists()).toBe(false)
    }
    expect(listerClasses).not.toHaveBeenCalled()

    await w.get('select[name="type"]').setValue('attendance')
    await flushPromises()
    const options = w.get('select[name="classe_id"]').findAll('option').map((o) => o.text())
    expect(options).toEqual(['Toutes les classes', 'Terminale A', 'Terminale B'])
    expect(listerClasses).toHaveBeenCalledTimes(1)
  })

  it('présences, une classe choisie : son id LOCAL part dans `classe_id`', async () => {
    const w = await ouvrir()
    await w.get('select[name="type"]').setValue('attendance')
    await flushPromises()
    await w.get('select[name="classe_id"]').setValue(42)
    await boutonGenerer(w).trigger('click')
    expect(generer).toHaveBeenCalledWith('attendance', expect.objectContaining({ classe_id: 42 }))
  })

  it('une classe choisie puis un autre type : `classe_id` ne part pas', async () => {
    const w = await ouvrir()
    await w.get('select[name="type"]').setValue('attendance')
    await flushPromises()
    await w.get('select[name="classe_id"]').setValue(42)
    await w.get('select[name="type"]').setValue('grades')
    await boutonGenerer(w).trigger('click')
    expect(generer.mock.calls[0][1]).not.toHaveProperty('classe_id')
  })

  it('les classes ne se chargent pas : le choix reste « Toutes les classes », l’écran le dit, le rapport part', async () => {
    listerClasses.mockRejectedValue(new Error('réseau'))
    const w = await ouvrir()
    await w.get('select[name="type"]').setValue('attendance')
    await flushPromises()
    expect(w.get('select[name="classe_id"]').attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Les classes n’ont pas pu être chargées')
    await boutonGenerer(w).trigger('click')
    expect(generer.mock.calls[0][1]).not.toHaveProperty('classe_id')
  })

  it('présences : seulement la période, sans classe choisie', async () => {
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
