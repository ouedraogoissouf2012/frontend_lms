/**
 * Onglet Étudiants du détail d'une classe.
 *
 * La colonne « Nom » restait VIDE alors que matricule et email s'affichaient :
 * le gabarit lisait `etudiant.nom`, une clé que le payload ne porte pas. Forme
 * réelle de `/lms/classes/{id}` → `data.etudiants`, mesurée sur la classe 1 :
 *
 *   { id, matricule, nom_complet, email, telephone, photo_url }
 *
 * Le nom vit donc sous `nom_complet`. `getFullName` (utils/formatters) gère déjà
 * cette forme — et la documente explicitement — mais n'était pas utilisé ici.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClasseEtudiantsTab from '@/components/classes/ClasseEtudiantsTab.vue'

/** Deux entrées reproduisant fidèlement le payload observé. */
const ETUDIANTS = [
  {
    id: 2,
    matricule: 'tugj2233',
    nom_complet: 'Issouf Ouedraogo',
    email: 'issouf.ouedraogo@esbtp.edu',
    telephone: '44210112',
    photo_url: null,
  },
  {
    id: 3,
    matricule: '12047923AB',
    nom_complet: 'MARCEL OUEDRAOGO',
    email: 'marcel.ouedraogo@esbtp.edu',
    telephone: '0708055896',
    photo_url: null,
  },
]

const monter = (etudiants = ETUDIANTS) => mount(ClasseEtudiantsTab, { props: { etudiants } })

describe('ClasseEtudiantsTab', () => {
  it('affiche le nom de chaque etudiant', () => {
    const w = monter()

    expect(w.text()).toContain('Issouf Ouedraogo')
    expect(w.text()).toContain('MARCEL OUEDRAOGO')
  })

  it('place le nom dans SA colonne, entre matricule et email', () => {
    // Vérifier la seule présence du texte ne dirait pas s'il atterrit dans la
    // bonne cellule : c'est l'ordre des colonnes que lit l'utilisateur.
    const cellules = monter().findAll('tbody tr')[0].findAll('td').map((td) => td.text())

    expect(cellules[0]).toBe('tugj2233')
    expect(cellules[1]).toBe('Issouf Ouedraogo')
    expect(cellules[2]).toBe('issouf.ouedraogo@esbtp.edu')
  })

  it('accepte aussi les formes prenom/nom et name', () => {
    // Le roster n'est pas la seule source possible : d'autres payloads portent
    // `name`, ou le couple `prenom`/`nom`. Le helper canonique couvre les trois.
    const w = monter([
      { id: 1, matricule: 'A1', prenom: 'Ada', nom: 'Lovelace', email: 'ada@e.com' },
      { id: 2, matricule: 'A2', name: 'Alan Turing', email: 'alan@e.com' },
    ])

    expect(w.text()).toContain('Ada Lovelace')
    expect(w.text()).toContain('Alan Turing')
  })

  it('laisse la cellule vide plutot que d afficher un nom invente', () => {
    const w = monter([{ id: 9, matricule: 'Z9', email: 'z@e.com' }])
    const cellules = w.findAll('tbody tr')[0].findAll('td').map((td) => td.text())

    // Aucune source de nom : on n'invente ni « N/A » ni l'email en guise de nom.
    expect(cellules[1]).toBe('')
  })

  it('affiche l etat vide quand la classe n a aucun etudiant', () => {
    expect(monter([]).text()).toContain('Aucun étudiant inscrit')
  })
})
