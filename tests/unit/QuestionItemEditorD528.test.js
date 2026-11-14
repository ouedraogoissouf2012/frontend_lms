/**
 * D528 dans l'éditeur d'une question : le changement de type passe par une ACTION (comme les coches),
 * et ce qui empêche d'enregistrer la question est dit par son alerte, quel que soit son type.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuestionItemEditor from '@/components/evaluations/QuestionItemEditor.vue'
import QuestionsEditorList from '@/components/evaluations/QuestionsEditorList.vue'

const question = (surcharge = {}) => ({ question: 'Q', type: 'qcm_multiple', points: 1, options: ['A', 'B'], correctes: [0, 1], correct_answers_text: '', ...surcharge })
const editeur = (q) => mount(QuestionItemEditor, { props: { question: q, index: 0 } })

// --- D528-1
describe('D528-1 — le type se change par une action, jamais en place', () => {
  it('choisir un type émet "change-type", sans modifier la question elle-même', async () => {
    const q = question()
    const w = editeur(q)
    await w.find('select').setValue('qcm')
    expect(w.emitted('change-type')[0]).toEqual(['qcm'])
    expect(q.type).toBe('qcm_multiple')
  })

  it('la liste relaie "change-type" avec l’indice de la question', async () => {
    const w = mount(QuestionsEditorList, { props: { questions: [question(), question()] } })
    await w.findAll('select')[1].setValue('vrai_faux')
    expect(w.emitted('change-type')[0]).toEqual([1, 'vrai_faux'])
  })

  it('une question dont les coches ont été retirées le dit', () => {
    const w = editeur(question({ type: 'qcm', correctes: [], bonneReponseAChoisir: true }))
    expect(w.find('[role="alert"]').text()).toBe("Cette question n'accepte qu'une bonne réponse : ses coches ont été retirées. Choisissez-la.")
  })
})
