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

import { lessonStatusLabel, lessonTypeLabel, lessonStatusBadge, lessonTypeBadge } from '@/utils/lessonStatus'
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

// Décision de la superviseure : les badges sont de la PRÉSENTATION ; ils quittent services/lesson
// (dont l'union avec #504 dépassait la garde de 300 lignes) pour rejoindre leurs libellés.
describe('badges de leçon : la même source que les libellés', () => {
  it('lessonStatusBadge : libellé partagé et sa classe ; inconnu → aucun badge (plus de « Brouillon » inventé)', () => {
    expect(lessonStatusBadge('published')).toEqual({ class: 'bg-green-100 text-green-700', text: 'Publiée' })
    expect(lessonStatusBadge('archived').text).toBe('Archivée')
    expect(lessonStatusBadge('zzz')).toBeNull()
    expect(lessonStatusBadge('toString')).toBeNull()
  })

  it('lessonTypeBadge : libellé, classe et icône ; inconnu → aucun badge (plus de « Cours » inventé)', () => {
    expect(lessonTypeBadge('tp')).toEqual({ class: 'bg-purple-100 text-purple-700', icon: 'fa-laptop', text: 'TP' })
    expect(lessonTypeBadge('zzz')).toBeNull()
  })

  it('une seule porte vers la règle : services/lesson ne les expose plus', () => {
    expect(lessonService.getStatusBadge).toBeUndefined()
    expect(lessonService.getTypeBadge).toBeUndefined()
  })
})
