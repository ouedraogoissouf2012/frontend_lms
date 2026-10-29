/**
 * TrainingPeriodCard (#391) : une période et SES seuls boutons de transition (table de
 * l'ADR-845-01). « Publier » sans date de début est désactivé, avec sa raison écrite :
 * le 422 du serveur n'est pas atteignable depuis l'écran.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TrainingPeriodCard from '@/components/admin/TrainingPeriodCard.vue'

const periode = (status, extra = {}) => ({
  id: 4, libelle: 'Promo 2026', status, phase: 'a_venir', program_id: 1, starts_on: '2026-11-02', ends_on: null, ...extra,
})
const libelles = (w) => w.findAll('button.transition-btn').map((b) => b.text())

describe('TrainingPeriodCard (#391)', () => {
  it('affiche libellé, statut et phase', () => {
    const w = mount(TrainingPeriodCard, { props: { periode: periode('brouillon') } })
    expect(w.text()).toContain('Promo 2026')
    expect(w.text()).toContain('Brouillon')
    expect(w.text()).toContain('À venir')
  })

  it.each([
    ['brouillon', ['Publier', 'Annuler']],
    ['publiee', ['Annuler', 'Clôturer']],
    ['cloturee', ['Archiver']],
    ['annulee', ['Archiver']],
    ['archivee', []],
  ])('%s → boutons %o', (status, attendu) => {
    expect(libelles(mount(TrainingPeriodCard, { props: { periode: periode(status) } }))).toEqual(attendu)
  })

  it('« Publier » sans date de début : désactivé, raison affichée', () => {
    const w = mount(TrainingPeriodCard, { props: { periode: periode('brouillon', { starts_on: null }) } })
    const publier = w.findAll('button.transition-btn').find((b) => b.text() === 'Publier')
    expect(publier.attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Ajoutez une date de début pour publier.')
  })

  it('émet transition avec l’action au clic', async () => {
    const w = mount(TrainingPeriodCard, { props: { periode: periode('publiee') } })
    await w.findAll('button.transition-btn').find((b) => b.text() === 'Clôturer').trigger('click')
    expect(w.emitted('transition')).toEqual([['cloturer']])
  })

  it('désactive tous les boutons pendant une opération', () => {
    const w = mount(TrainingPeriodCard, { props: { periode: periode('brouillon'), busy: true } })
    expect(w.findAll('button.transition-btn').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })
})
