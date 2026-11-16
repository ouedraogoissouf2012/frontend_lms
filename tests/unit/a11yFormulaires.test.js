/**
 * #563 : des formulaires sans nom accessible, et des modales qui ne se déclarent pas comme dialogues. Un lecteur
 * d'écran annonçait des champs sans nom ; un test ne pouvait pas les trouver par leur libellé.
 * - `Modal.vue` (toutes les modales) : `role="dialog"`, `aria-modal`, et nommée par son titre (`aria-labelledby`) ;
 * - l'éditeur de contenu (TipTap) : une zone de saisie multiligne nommée ;
 * - `ChapterEditForm` : le titre du chapitre nommé, « Type de contenu » associé à son choix.
 * (La modale de leçon : #572. `LessonFormModal` : retirée par #572.)
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Modal from '@/components/ui/Modal.vue'
import ChapterEditForm from '@/components/lessons/ChapterEditForm.vue'
import { attributsEditeur } from '@/composables/useTipTapEditor'

describe('#563 — Modal.vue se déclare comme dialogue', () => {
  it('avec un titre : role dialog, aria-modal, nommée par son titre', () => {
    const w = mount(Modal, { props: { modelValue: true, title: 'Nouvelle séance' } })
    const dialogue = w.find('[role="dialog"]')
    expect(dialogue.exists()).toBe(true)
    expect(dialogue.attributes('aria-modal')).toBe('true')
    const id = dialogue.attributes('aria-labelledby')
    expect(w.find(`#${id}`).text()).toBe('Nouvelle séance')
  })

  it('deux modales : deux ids de titre distincts', () => {
    const a = mount(Modal, { props: { modelValue: true, title: 'A' } }).find('[role="dialog"]').attributes('aria-labelledby')
    const b = mount(Modal, { props: { modelValue: true, title: 'B' } }).find('[role="dialog"]').attributes('aria-labelledby')
    expect(a).not.toBe(b)
  })

  it('sans titre : toujours un dialogue, sans nom inventé', () => {
    const dialogue = mount(Modal, { props: { modelValue: true } }).find('[role="dialog"]')
    expect(dialogue.exists()).toBe(true)
    expect(dialogue.attributes('aria-labelledby')).toBeUndefined()
  })
})

describe('#563 — l’éditeur de contenu est une zone de saisie nommée', () => {
  it('role textbox, multiligne, nommée', () => {
    expect(attributsEditeur('Contenu du chapitre')).toMatchObject({ role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Contenu du chapitre' })
  })

  it('sa classe de mise en forme est gardée', () => {
    expect(attributsEditeur('x').class).toBe('prose prose-sm max-w-none focus:outline-none')
  })
})

describe('#563 — le formulaire du chapitre nomme ses champs', () => {
  const monter = (chapter) => mount(ChapterEditForm, { props: { chapter: { title: '', content_type: 'text', ...chapter } } })

  it('le titre du chapitre a un nom accessible', () => {
    expect(monter({ id: 7 }).find('input[placeholder="saisissez le titre"]').attributes('aria-label')).toBe('Titre du chapitre')
  })

  it('« Type de contenu » est associé à son choix, avec un id propre à chaque chapitre', () => {
    const w = monter({ id: 7 })
    const id = w.find('select').attributes('id')
    expect(w.find(`label[for="${id}"]`).text()).toBe('Type de contenu')
    expect(monter({ tempId: 3 }).find('select').attributes('id')).not.toBe(id)
  })
})
