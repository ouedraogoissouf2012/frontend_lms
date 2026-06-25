/**
 * Test de montage de QuestionsConfigForm (H1) : rend la config et lie les champs
 * au modèle `configuration` partagé (v-model).
 */
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { describe, it, expect } from 'vitest'
import QuestionsConfigForm from '@/components/evaluations/QuestionsConfigForm.vue'

describe('QuestionsConfigForm (H1) — montage', () => {
  it('monte et lie la durée au modèle partagé', async () => {
    const configuration = reactive({ duree_minutes: 60, max_attempts: 1, shuffle_questions: false, show_results: false })
    const w = mount(QuestionsConfigForm, { props: { configuration } })
    expect(w.text()).toContain('Configuration')
    await w.find('input[type="number"]').setValue(90)
    expect(configuration.duree_minutes).toBe(90)
  })

  it('coche "Mélanger les questions" met à jour le modèle', async () => {
    const configuration = reactive({ duree_minutes: 60, max_attempts: 1, shuffle_questions: false, show_results: false })
    const w = mount(QuestionsConfigForm, { props: { configuration } })
    await w.find('input[type="checkbox"]').setValue(true)
    expect(configuration.shuffle_questions).toBe(true)
  })
})
