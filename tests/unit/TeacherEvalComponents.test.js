/**
 * Tests de montage des sous-composants de TeacherEvaluations (H1) : filtres,
 * stats, état vide et modale de création.
 */
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { describe, it, expect } from 'vitest'
import TeacherEvalFilters from '@/components/evaluations/TeacherEvalFilters.vue'
import TeacherEvalStats from '@/components/evaluations/TeacherEvalStats.vue'
import TeacherEvalEmptyState from '@/components/evaluations/TeacherEvalEmptyState.vue'
import TeacherEvalCreateModal from '@/components/evaluations/TeacherEvalCreateModal.vue'

describe('TeacherEvalFilters (H1)', () => {
  const base = () => ({
    filters: reactive({ classe_id: '', matiere_id: '', statut: '' }),
    classes: [{ id: 1, name: 'A' }],
    matieres: [{ id: 2, nom: 'Maths' }],
    expiredWithoutOnlineCount: 0,
    hideExpired: true
  })

  it('émet "apply" au changement d\'un filtre (v-model conserve le type)', async () => {
    const props = base()
    const w = mount(TeacherEvalFilters, { props })
    const select = w.findAll('select')[0]
    await select.setValue('1')
    expect(w.emitted('apply')).toBeTruthy()
    expect(props.filters.classe_id).toBe(1) // type numérique préservé via v-model
  })

  it('émet "reset" au clic sur Réinitialiser', async () => {
    const w = mount(TeacherEvalFilters, { props: base() })
    await w.find('.btn-reset').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })

  it('affiche la barre des expirées et émet update:hideExpired', async () => {
    const w = mount(TeacherEvalFilters, { props: { ...base(), expiredWithoutOnlineCount: 2, hideExpired: false } })
    expect(w.find('.expired-cleanup-bar').exists()).toBe(true)
    await w.find('.btn-hide-expired').trigger('click')
    expect(w.emitted('update:hideExpired')[0]).toEqual([true])
  })
})

describe('TeacherEvalStats (H1)', () => {
  it('affiche les 4 statistiques', () => {
    const w = mount(TeacherEvalStats, {
      props: { stats: { total: 10, enCours: 2, terminees: 5, avecVersionEnLigne: 3 } }
    })
    expect(w.findAll('.stat-card').length).toBe(4)
    expect(w.text()).toContain('10')
    expect(w.text()).toContain('En ligne')
  })
})

describe('TeacherEvalEmptyState (H1)', () => {
  it('message + bouton selon la présence de filtres', async () => {
    const noF = mount(TeacherEvalEmptyState, { props: { hasFilters: false } })
    expect(noF.text()).toContain('Vos évaluations apparaîtront ici')
    expect(noF.find('.btn-empty').exists()).toBe(false)
    const withF = mount(TeacherEvalEmptyState, { props: { hasFilters: true } })
    expect(withF.text()).toContain('Aucune évaluation ne correspond')
    await withF.find('.btn-empty').trigger('click')
    expect(withF.emitted('reset')).toBeTruthy()
  })
})

describe('TeacherEvalCreateModal (H1)', () => {
  const form = () => reactive({ type: 'qcm', duree_minutes: 60, description: '' })

  it('masqué quand show=false', () => {
    const w = mount(TeacherEvalCreateModal, { props: { show: false, evaluation: null, onlineForm: form(), creating: false } })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('affiché : émet submit (form) et close (Annuler)', async () => {
    const w = mount(TeacherEvalCreateModal, {
      props: { show: true, evaluation: { titre: 'X' }, onlineForm: form(), creating: false }
    })
    expect(w.find('.modal-overlay').exists()).toBe(true)
    await w.find('form').trigger('submit')
    expect(w.emitted('submit')).toBeTruthy()
    await w.find('.btn-cancel').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
