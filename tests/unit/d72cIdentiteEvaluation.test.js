/**
 * D72-c, D-c1 : l'identité d'une évaluation (classe, matière, enseignant) se lit sur les champs À PLAT,
 * `klassci_* ?? local`, jamais sur les objets imbriqués. Contrat E1 (`EvaluationRecord`,
 * openapi.yaml) : dans une école KLASSCI, `klassci_classe_id`/`klassci_matiere_id` sont remplis et
 * `classe_id`/`matiere_id` nuls ; dans une école LMS, l'inverse. L'objet imbriqué `classe.id` change de
 * sens selon la route (nul ou local dans la liste du personnel, local chez l'élève) : le lire, c'est deviner.
 */
import { describe, it, expect } from 'vitest'
import { idClasse, idMatiere, idEnseignant } from '@/utils/identiteEvaluation'

describe('utils/identiteEvaluation — une règle par famille', () => {
  it('1. évaluation KLASSCI : les champs klassci_* font l’identité', () => {
    const e = { klassci_classe_id: 5, classe_id: null, klassci_matiere_id: 7, matiere_id: null }
    expect(idClasse(e)).toBe('5')
    expect(idMatiere(e)).toBe('7')
  })

  it('2. évaluation locale : les ids locaux font l’identité', () => {
    const e = { klassci_classe_id: null, classe_id: 9, klassci_matiere_id: null, matiere_id: 3 }
    expect(idClasse(e)).toBe('9')
    expect(idMatiere(e)).toBe('3')
  })

  it('3. enseignant d’une école KLASSCI depuis D72 (les deux remplis) : KLASSCI passe d’abord', () => {
    expect(idEnseignant({ klassci_enseignant_id: 10, enseignant_id: 77 })).toBe('10')
  })

  it('4. enseignant local : l’auteur (users.id)', () => {
    expect(idEnseignant({ klassci_enseignant_id: null, enseignant_id: 77 })).toBe('77')
  })

  it('5. les deux remplis (impossible selon E1) : la règle reste déterministe', () => {
    const e = { klassci_classe_id: 5, classe_id: 9, klassci_matiere_id: 7, matiere_id: 3 }
    for (let i = 0; i < 3; i++) {
      expect(idClasse(e)).toBe('5')
      expect(idMatiere(e)).toBe('7')
    }
  })

  it('6. aucun des deux : chaîne vide', () => {
    expect(idClasse({})).toBe('')
    expect(idMatiere({ klassci_matiere_id: null, matiere_id: null })).toBe('')
    expect(idEnseignant({})).toBe('')
  })

  it('7. les objets imbriqués sont ignorés', () => {
    const e = {
      klassci_classe_id: null, classe_id: null, classe: { id: 3 },
      klassci_matiere_id: null, matiere_id: null, matiere: { id: 4 },
      klassci_enseignant_id: null, enseignant_id: null, enseignant: { id: 5 },
    }
    expect(idClasse(e)).toBe('')
    expect(idMatiere(e)).toBe('')
    expect(idEnseignant(e)).toBe('')
  })

  it('8. le module ne mute pas l’évaluation', () => {
    const e = Object.freeze({ klassci_classe_id: null, classe_id: 9, matiere_id: 3, enseignant_id: 77 })
    expect(() => [idClasse(e), idMatiere(e), idEnseignant(e)]).not.toThrow()
    expect(e).toEqual({ klassci_classe_id: null, classe_id: 9, matiere_id: 3, enseignant_id: 77 })
  })
})
