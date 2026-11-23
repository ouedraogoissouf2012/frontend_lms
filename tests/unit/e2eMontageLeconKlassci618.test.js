/**
 * #618 : le montage de l'école KLASSCI ne créait plus ses leçons (POST /lessons 403, 15 ROUGE au parcours des écrans).
 * Depuis lms_backend#1266, `StoreLessonRequest::authorize` n'accepte que l'id LOCAL de la classe ; le montage envoyait
 * l'id KLASSCI (EVALUATION.classe, 9101). Il lit désormais les ids locaux sur la page de la matière
 * (`GET /lms/matieres/{id}` : `classes_concernees`, `matiere_id_local`), le chemin du produit (#749, #740). Une
 * lecture absente est un manque nommé, jamais un id deviné.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { idsLocauxDeLecon } from '../../e2e/klassci-ecole/idsLocaux.mjs'
import { CLASSES, EVALUATION } from '../../e2e/klassci-ecole/jeu.mjs'

const NOM = CLASSES.find((c) => c.id === EVALUATION.classe).name
const page = (champs = {}) => ({
  matiere: { id: EVALUATION.matiere }, matiere_id_local: 4,
  classes_concernees: [{ id: 2, nom: 'Classe K2 E2E' }, { id: 1, nom: NOM }], ...champs,
})

describe('#618 — les ids LOCAUX de la leçon, lus sur la page de la matière', () => {
  it('la classe désignée par son nom, et la matière locale', () => {
    expect(idsLocauxDeLecon(page(), NOM, EVALUATION.matiere)).toEqual({ classe_id: 1, matiere_id: 4 })
  })

  it('jamais l’id KLASSCI : 9101 n’est pas un id de classes_concernees', () => {
    expect(idsLocauxDeLecon(page(), NOM, EVALUATION.matiere).classe_id).not.toBe(EVALUATION.classe)
  })

  it('matière non miroitée (matiere_id_local null) : la matière est omise, comme le front', () => {
    expect(idsLocauxDeLecon(page({ matiere_id_local: null }), NOM, EVALUATION.matiere)).toEqual({ classe_id: 1 })
  })

  it('classe absente, ambiguë ou page illisible : un manque NOMMÉ, jamais un id deviné', () => {
    expect(idsLocauxDeLecon(page({ classes_concernees: [{ id: 2, nom: 'Classe K2 E2E' }] }), NOM, 9201))
      .toEqual({ manque: `classe « ${NOM} » absente de classes_concernees de la matière 9201` })
    expect(idsLocauxDeLecon(page({ classes_concernees: [{ id: 1, nom: NOM }, { id: 3, nom: NOM }] }), NOM, 9201))
      .toEqual({ manque: `classe « ${NOM} » en 2 exemplaires dans classes_concernees de la matière 9201` })
    expect(idsLocauxDeLecon(null, NOM, 9201)).toEqual({ manque: 'page de la matière 9201 sans classes_concernees' })
  })
})

describe('#618 — le montage passe par la page de la matière', () => {
  const source = readFileSync(resolve(process.cwd(), 'e2e/ecole-klassci-evaluation.mjs'), 'utf8')

  it('il lit GET /lms/matieres/{id} avant de créer les leçons', () => {
    expect(source).toMatch(/'GET', `\/lms\/matieres\/\$\{EVALUATION\.matiere\}`/)
    expect(source).toMatch(/idsLocauxDeLecon\(/)
  })

  it('il n’envoie plus l’id KLASSCI de la classe', () => {
    // `klassci_classe_id` (création de l'évaluation) est légitime : seul un `classe_id` nu porterait l'id KLASSCI.
    expect(source).not.toMatch(/(?<!\w)classe_id: EVALUATION\.classe/)
    expect(source).toMatch(/klassci_classe_id: EVALUATION\.classe/)
  })
})
