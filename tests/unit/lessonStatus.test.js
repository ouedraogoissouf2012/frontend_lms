/**
 * Le statut et le type d'une leçon s'affichent en français, et jamais devinés.
 *
 * Constat E2E v3.1 (run 42728270345) : « Leçons récentes » de /dashboard écrivait `published` tel quel
 * (`{{ lesson.status }}`) pour admin, coordinateur, enseignant et élève. À côté, `{{ lesson.type }}` brut.
 * Lu dans le code, même famille : LessonInfoCard écrivait « Publiee » et rendait une leçon ARCHIVÉE
 * comme « Brouillon » ; trois tables en double rendaient un statut inconnu comme « Brouillon » et un
 * type inconnu comme « Cours » — des valeurs fabriquées.
 *
 * Règle (ARRÊT 1) : une seule source, `utils/lessonStatus.js`. Statuts et types de l'énumération du
 * serveur (`create_lessons_table` : draft/published/archived ; cours/tp/td/projet/autre). Une valeur
 * inconnue ou absente rend `''` : aucun badge, ni texte brut, ni valeur inventée.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/api', () => ({ default: {} }))

import { lessonStatusLabel, lessonTypeLabel } from '@/utils/lessonStatus'
import lessonService from '@/services/lesson'

describe('lessonStatusLabel / lessonTypeLabel', () => {
  it('les trois statuts du serveur, au féminin (« une leçon »)', () => {
    expect(['draft', 'published', 'archived'].map(lessonStatusLabel)).toEqual(['Brouillon', 'Publiée', 'Archivée'])
  })

  it('les cinq types du serveur', () => {
    expect(['cours', 'tp', 'td', 'projet', 'autre'].map(lessonTypeLabel)).toEqual(['Cours', 'TP', 'TD', 'Projet', 'Autre'])
  })

  it('inconnu, absent, ou nom hérité d’objet : rien (jamais le brut, jamais une valeur inventée)', () => {
    for (const v of ['zzz', 'PUBLISHED', '', null, undefined, 'toString', '__proto__', 'constructor']) {
      expect(lessonStatusLabel(v)).toBe('')
      expect(lessonTypeLabel(v)).toBe('')
    }
  })
})

describe('services/lesson : les badges disent la même chose', () => {
  it('getStatusBadge prend le libellé partagé ; inconnu → aucun badge (plus de « Brouillon » inventé)', () => {
    expect(lessonService.getStatusBadge('published').text).toBe('Publiée')
    expect(lessonService.getStatusBadge('archived').text).toBe('Archivée')
    expect(lessonService.getStatusBadge('zzz')).toBeNull()
  })

  it('getTypeBadge : inconnu → aucun badge (plus de « Cours » inventé)', () => {
    expect(lessonService.getTypeBadge('tp').text).toBe('TP')
    expect(lessonService.getTypeBadge('zzz')).toBeNull()
  })
})
