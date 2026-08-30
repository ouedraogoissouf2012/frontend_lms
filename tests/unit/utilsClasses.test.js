/**
 * `classeLabel` — libellé affichable d'une classe KLASSCI.
 *
 * Défaut à l'origine de ce helper : `/proxy/classes` renvoie
 * `{id, name:'B2 COM', libelle:null, …}` — il n'y a PAS de champ `nom`. Le menu
 * déroulant de filtre lisait `c.nom` et rendait donc 17 options aux libellés
 * vides. Le repli correct (`name` → `libelle` → `nom`) existait déjà, dupliqué
 * dans cinq gabarits ; il est désormais défini une seule fois.
 *
 * Pourquoi PAS `displayName` de `utils/evaluationDisplay.js` (qui ratisse aussi
 * plusieurs champs) : il compose `nom + prenom` en PRIORITÉ 1 — sémantique de
 * personne, pas de classe — et n'offre aucun repli identifiant. Ce sont deux
 * concepts distincts ; les fusionner ferait un helper « à tout faire ».
 */
import { describe, it, expect } from 'vitest'
import { classeLabel } from '@/utils/classes'

describe('classeLabel', () => {
  it('lit `name`, la forme réellement renvoyée par /proxy/classes', () => {
    expect(classeLabel({ id: 1, name: 'B2 COM', libelle: null })).toBe('B2 COM')
  })

  it('retombe sur `libelle` puis sur `nom` (autres formes du dépôt)', () => {
    expect(classeLabel({ id: 2, libelle: 'B3 COM' })).toBe('B3 COM')
    expect(classeLabel({ id: 3, nom: '6e A' })).toBe('6e A')
  })

  it('ignore un `name` vide ou blanc au profit du repli suivant', () => {
    expect(classeLabel({ id: 4, name: '', libelle: 'Repli' })).toBe('Repli')
    expect(classeLabel({ id: 5, name: '   ', nom: 'Repli 2' })).toBe('Repli 2')
  })

  it('identifie la classe par son id quand aucun libellé n’existe', () => {
    // Mieux qu'une ligne vide : l'utilisateur peut au moins sélectionner l'entrée.
    expect(classeLabel({ id: 42 })).toBe('Classe 42')
    expect(classeLabel({ id: 0 })).toBe('Classe 0')
  })

  it('ne lève jamais et reste affichable sur une entrée invalide', () => {
    expect(classeLabel(null)).toBe('—')
    expect(classeLabel(undefined)).toBe('—')
    expect(classeLabel({})).toBe('—')
    expect(classeLabel('pas un objet')).toBe('—')
  })
})
