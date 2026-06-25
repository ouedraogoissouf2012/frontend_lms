/**
 * Test de montage de EvaluationInfoForm (H1) : rend les options matières/classes
 * et lie les champs au modèle `evaluation` partagé (mutation visible côté parent).
 */
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { describe, it, expect } from 'vitest'
import EvaluationInfoForm from '@/components/evaluations/EvaluationInfoForm.vue'

function mountForm() {
  const evaluation = reactive({
    klassci_matiere_id: '', klassci_classe_id: '', titre: '', description: '',
    date_evaluation: '', duree_minutes: 60, coefficient: 1, bareme: 20,
    shuffle_questions: false, show_results: false, allow_retake: false
  })
  const w = mount(EvaluationInfoForm, {
    props: { evaluation, matieres: [{ id: 1, name: 'Maths' }], classes: [{ id: 2, libelle: '6e A' }] }
  })
  return { w, evaluation }
}

describe('EvaluationInfoForm (H1) — montage', () => {
  it('monte et affiche les options matière/classe', () => {
    const { w } = mountForm()
    expect(w.text()).toContain('Informations générales')
    expect(w.html()).toContain('Maths')
    expect(w.html()).toContain('6e A')
  })

  it('le titre est lié au modèle partagé (v-model)', async () => {
    const { w, evaluation } = mountForm()
    const input = w.find('input[type="text"]')
    await input.setValue('Mon éval')
    expect(evaluation.titre).toBe('Mon éval')
  })
})
