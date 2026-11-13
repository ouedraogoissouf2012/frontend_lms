/**
 * D72-c, L6 et L7 : noms affichés d'une évaluation (`utils/evaluationDisplay`).
 * - L6 : le repli « Matière #<id> » lit l'identité par `utils/identiteEvaluation` (avant : `klassci_*`
 *   seulement, donc « inconnue » pour une évaluation locale qui a pourtant un id).
 * - D-c2 : `matiere_name`, `subject_name`, `class_name` et `teacher` ne sont plus lus ; absents
 *   d'`EvaluationRecord` (openapi.yaml) et de la spec E2a.
 * - L7 / D-c3 : la forme des lignes `/proxy/*` d'une école KLASSCI est INDÉTERMINÉE (schéma ouvert,
 *   aucune fixture) ; `byId` garde donc ses clés, et ce test FIGE la règle de collision (déclaré).
 */
import { describe, it, expect } from 'vitest'
import { byId, matiereName, classeName, teacherName } from '@/utils/evaluationDisplay'

describe('evaluationDisplay — les deux familles d’ids (D72-c)', () => {
  it('19. L6 : sans nom, le repli #id suit la règle d’identité (locale comme KLASSCI)', () => {
    expect(matiereName({ klassci_matiere_id: null, matiere_id: 9 })).toBe('Matière #9')
    expect(matiereName({ klassci_matiere_id: 5, matiere_id: null })).toBe('Matière #5')
    expect(classeName({ klassci_classe_id: null, classe_id: 4 })).toBe('Classe #4')
    expect(teacherName({ klassci_enseignant_id: null, enseignant_id: 77 })).toBe('Enseignant #77')
  })

  it('20. D-c2 : les alias hors contrat ne sont plus lus', () => {
    expect(matiereName({ matiere_name: 'Maths' })).toBe('Matière inconnue')
    expect(matiereName({ subject_name: 'Maths' })).toBe('Matière inconnue')
    expect(classeName({ class_name: '6e A' })).toBe('Classe inconnue')
    expect(teacherName({ teacher: { nom: 'Awa' } })).toBe('Enseignant inconnu')
  })

  it('21. L7 / D-c3 : collision id local et klassci_id d’une autre ligne : la PREMIÈRE ligne gagne', () => {
    const a = { id: 5, nom: 'A' }
    const b = { id: 6, klassci_id: 5, nom: 'B' }
    const index = byId([a, b])
    expect(index.get('5')).toBe(a)
    expect(index.get('6')).toBe(b)
  })
})
