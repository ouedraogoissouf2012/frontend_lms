// @vitest-environment node
/**
 * #654 — l'outil E2E du catalogue local (e2e/parcours-catalogue.mjs). Copié seul en CI : ses libellés d'écran sont
 * recopiés, leur égalité avec les composants est verrouillée ici. Ses jugements sont purs.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DONNEES_CATALOGUE, ETAPES_CATALOGUE, ETIQUETTES, jugerAbsence, jugerMatiere, jugerRattachement, jugerVueEnseignant } from '../../e2e/parcours-catalogue.mjs'

const lire = (f) => readFileSync(resolve(process.cwd(), f), 'utf8')
// #660 : les libellés du formulaire de matière vivent dans useMatiereCreation (partagés avec la modification).
const COMPOSANTS = ['src/components/admin/MatiereCreation.vue', 'src/composables/useMatiereCreation.js', 'src/components/classes/ProgrammeRattachement.vue', 'src/components/admin/EnrolmentCodeCard.vue'].map(lire).join('\n')
const d = DONNEES_CATALOGUE
const liste = (matieres) => ({ statut: 200, corps: { success: true, data: { matieres } } })
const fiche = (programme) => ({ statut: 200, corps: { success: true, data: { matieres_disponibles: programme } } })

describe('#654 — l’outil parle la langue de l’écran', () => {
  it('chaque libellé recopié par l’outil est celui d’un composant', () => {
    for (const texte of Object.values(ETIQUETTES)) expect(COMPOSANTS).toContain(`'${texte}'`)
  })

  it('trois étapes chaînées : créer la matière, la rattacher, l’enseignant la voit', () => {
    expect(ETAPES_CATALOGUE.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['creer-matiere', 'admin', []], ['rattacher', 'admin', ['creer-matiere']], ['vue-enseignant', 'enseignant', ['rattacher']],
    ])
  })

  it('le registre des parcours fonctionnels joue cette fonction, avec le dossier de sortie', () => {
    const registre = lire('e2e/parcours-fonctionnels.mjs')
    expect(registre).toContain("import { ETAPES_CATALOGUE, DONNEES_CATALOGUE } from './parcours-catalogue.mjs'")
    expect(registre).toMatch(/const ctx = \{ pages, base: BASE, sortie, jeu,/)
  })
})

describe('#654 — juger', () => {
  it('école KLASSCI : l’absence ne vaut preuve que sur un écran CHARGÉ', () => {
    expect(jugerAbsence({ charge: true, formulaires: 0 }, 'x')).toMatchObject({ confirme: true })
    expect(jugerAbsence({ charge: true, formulaires: 1 }, 'x').ecart).toMatch(/offert/)
    expect(jugerAbsence({ charge: false, formulaires: 0 }, 'x').ecart).toMatch(/chargé/)
  })

  it('la matière : 201, annonce, ligne, et l’API au bon coefficient', () => {
    const ok = { statut: 201, annonce: `Matière « ${d.matiere.libelle} » créée`, ligne: d.matiere.libelle, api: liste([{ id: 9, nom: d.matiere.libelle, coefficient: 3 }]) }
    expect(jugerMatiere(ok, d.matiere)).toMatchObject({ confirme: true })
    expect(jugerMatiere({ ...ok, api: liste([{ id: 9, nom: d.matiere.libelle, coefficient: 1 }]) }, d.matiere).ecart).toMatch(/coefficient/)
    expect(jugerMatiere({ ...ok, ligne: null }, d.matiere).ecart).toMatch(/liste/)
    expect(jugerMatiere({ ...ok, statut: 422 }, d.matiere).ecart).toMatch(/422/)
  })

  it('le rattachement : la fiche ET l’API portent la matière avec SON enseignant', () => {
    const ok = { statut: 201, ligne: `${d.matiere.libelle} E2E-PHY 3 ${d.enseignant}`, api: fiche([{ id: 9, nom: d.matiere.libelle, enseignants: [{ id: 2, nom: d.enseignant }] }]) }
    expect(jugerRattachement(ok, d)).toMatchObject({ confirme: true })
    expect(jugerRattachement({ ...ok, ligne: d.matiere.libelle }, d).ecart).toMatch(/fiche relue/)
    expect(jugerRattachement({ ...ok, api: fiche([{ id: 9, nom: d.matiere.libelle, enseignants: [] }]) }, d).ecart).toMatch(/enseignant/)
  })

  it('la vue de l’enseignant : sa carte, ou un écart', () => {
    expect(jugerVueEnseignant({ carte: true }, d)).toMatchObject({ confirme: true })
    expect(jugerVueEnseignant({ carte: false }, d).confirme).toBe(false)
  })
})
