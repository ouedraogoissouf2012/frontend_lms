/**
 * lms_backend#1147 (PR back #1150) : une leçon dont du temps est écrit passe `in_progress` côté serveur, même à 0 %.
 * Le badge de progression se déduisait du SEUL pourcentage (`lessonService.getProgressBadge`) : 0 % disait
 * « Non commencé » à côté de « 10min », l'incohérence même que le back vient de corriger. Le badge suit
 * désormais l'ÉTAT du serveur : `in_progress` n'est jamais « Non commencé », `completed` est toujours « Terminé ».
 * Sans état (ancienne réponse), le pourcentage décide, comme avant.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))

import lessonService from '@/services/lesson'
import LessonProgress from '@/components/lessons/LessonProgress.vue'

describe('lms_backend#1147 — le badge d’une leçon suit son état serveur', () => {
  it('commencée sans pourcentage (du temps écrit) : « Débuté », jamais « Non commencé »', () => {
    expect(lessonService.getProgressBadge(0, 'in_progress').text).toBe('Débuté')
  })

  it('terminée côté serveur : « Terminé », quel que soit le pourcentage reçu', () => {
    expect(lessonService.getProgressBadge(40, 'completed').text).toBe('Terminé')
  })

  it('non commencée, ou sans état : le pourcentage décide, comme avant', () => {
    expect(lessonService.getProgressBadge(0, 'not_started').text).toBe('Non commencé')
    expect(lessonService.getProgressBadge(0).text).toBe('Non commencé')
    expect(lessonService.getProgressBadge(50, 'in_progress').text).toBe('En cours')
    expect(lessonService.getProgressBadge(100).text).toBe('Terminé')
  })

  it('à l’écran : 10 min passées à 0 % disent « Débuté » à côté du temps', () => {
    const w = mount(LessonProgress, {
      props: { progress: { status: 'in_progress', progress_percentage: 0, time_spent_minutes: 10 } },
    })
    expect(w.text()).toContain('Débuté')
    expect(w.text()).not.toContain('Non commencé')
    expect(w.text()).toContain('10min')
  })
})
