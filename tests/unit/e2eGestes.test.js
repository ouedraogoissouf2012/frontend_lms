/**
 * Les gestes communs des parcours fonctionnels. Un bouton se trouve par son texte visible ; une icône entre dans
 * son nom accessible : le caractère d'une police d'icônes (Font Awesome, E2E 43759530997 : «  Modifier »
 * introuvable par son nom exact) ou la ligature d'une icône Material, avant ou APRÈS le texte (« save
 * Enregistrer », « Suivant arrow_forward »).
 */
import { describe, it, expect } from 'vitest'
import { nomDeBouton, lu } from '../../e2e/gestes.mjs'

describe('gestes — un bouton par son texte visible', () => {
  it('une icône Font Awesome avant le texte', () => {
    expect(nomDeBouton('Modifier').test(' Modifier')).toBe(true)
    expect(nomDeBouton('Supprimer').test('Supprimer')).toBe(true)
  })

  it('une ligature Material avant ou après le texte', () => {
    expect(nomDeBouton('Enregistrer').test('save Enregistrer')).toBe(true)
    expect(nomDeBouton('Suivant').test('Suivant arrow_forward')).toBe(true)
    expect(nomDeBouton('Creer un quiz').test('add Creer un quiz')).toBe(true)
  })

  it('« Publier » ne prend ni « Dépublier » ni un texte plus long', () => {
    expect(nomDeBouton('Publier').test(' Dépublier')).toBe(false)
    expect(nomDeBouton('Publier').test('Publier la leçon')).toBe(false)
    expect(nomDeBouton('Modifier').test('edit Modifier le quiz')).toBe(false)
  })

  it('un texte avec un caractère spécial de regex est pris tel quel', () => {
    expect(nomDeBouton('+ Ajouter un chapitre').test('+ Ajouter un chapitre')).toBe(true)
    expect(nomDeBouton('+ Ajouter un chapitre').test('++ Ajouter un chapitre')).toBe(false)
  })
})

describe('gestes — une lecture d’API', () => {
  it('200 : aucun écart ; sinon l’écart est nommé', () => {
    expect(lu({ statut: 200 }, '/x')).toBeNull()
    expect(lu({ statut: 403 }, '/x')).toBe('GET /x rend HTTP 403')
  })
})
