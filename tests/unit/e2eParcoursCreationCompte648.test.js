/**
 * #648 : le parcours E2E de la création d'un compte (e2e/parcours-creation-compte.mjs). L'outil est copié SEUL en CI :
 * ses libellés d'écran sont recopiés, et leur égalité avec le composant est verrouillée ici. Ses jugements sont purs.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DONNEES_COMPTE, ETIQUETTES, ETAPES_COMPTE, cheminRelecture, jugerCreation, jugerConnexion } from '../../e2e/parcours-creation-compte.mjs'

const vue = readFileSync(resolve(process.cwd(), 'src/components/admin/CompteCreation.vue'), 'utf8')
const registre = readFileSync(resolve(process.cwd(), 'e2e/parcours-fonctionnels.mjs'), 'utf8')
const ens = DONNEES_COMPTE.enseignant
const eleve = DONNEES_COMPTE.etudiant
// La forme MESURÉE de GET /admin/users (UserListPresenter::paginated, lms) : les lignes sont dans `data.data`.
const page = (lignes) => ({ statut: 200, corps: { success: true, data: { data: lignes, current_page: 1, per_page: 100, total: lignes.length, last_page: 1 } } })
const ligneApi = (d, extra = {}) => page([{ id: 40, name: d.nom, email: d.courriel, role: d.role, klassci_id: null, created_at: null, ...extra }])

describe('#648 — l’outil parle la langue de l’écran', () => {
  it('chaque libellé recopié par l’outil est celui du composant', () => {
    for (const texte of Object.values(ETIQUETTES)) expect(vue).toContain(`'${texte}'`)
  })

  it('les quatre étapes, dans l’ordre : créer l’enseignant, créer l’élève, puis chacun se connecte', () => {
    expect(ETAPES_COMPTE.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['creer-enseignant', 'admin', []], ['creer-eleve', 'admin', []],
      ['connexion-enseignant', 'anonyme', ['creer-enseignant']], ['connexion-eleve', 'anonyme', ['creer-eleve']],
    ])
  })

  it('le registre des parcours fonctionnels joue cette fonction', () => {
    expect(registre).toContain("import { ETAPES_COMPTE, DONNEES_COMPTE } from './parcours-creation-compte.mjs'")
    expect(registre).toMatch(/\{ fonction: 'création d’un compte', etapes: ETAPES_COMPTE, donnees: DONNEES_COMPTE \}/)
  })
})

describe('#648 — juger la création', () => {
  it('la recherche relue vise le courriel (`q`), sans dépendre de la pagination', () => {
    expect(cheminRelecture(ens)).toBe(`/admin/users?q=${encodeURIComponent(ens.courriel)}&per_page=100`)
  })

  it('enseignant : 201, sa ligne à l’écran (liste des enseignants de l’école), et GET /admin/users au bon rôle', () => {
    expect(jugerCreation({ statut: 201, annonce: `Compte « ${ens.nom} » créé`, ligneEcran: `${ens.nom} ${ens.courriel}`, api: ligneApi(ens) }, ens))
      .toMatchObject({ confirme: true })
  })

  it('élève : SANS classe, il n’est pas encore dans la liste (bâtie des classes) ; l’annonce et l’API font foi', () => {
    expect(jugerCreation({ statut: 201, annonce: `Compte « ${eleve.nom} » créé`, ligneEcran: null, api: ligneApi(eleve) }, eleve))
      .toMatchObject({ confirme: true })
  })

  it.each([
    ['HTTP 422', { statut: 422 }, /HTTP 422/],
    ['annonce absente', { annonce: '' }, /annonce/],
    ['enseignant absent de la liste', { ligneEcran: null }, /liste/],
    ['GET /admin/users en panne', { api: { statut: 500, corps: null } }, /HTTP 500/],
    ['compte absent de GET /admin/users', { api: page([]) }, /ne porte pas/],
    ['mauvais rôle', { api: ligneApi(ens, { role: 'etudiant' }) }, /rôle/],
  ])('enseignant, %s : écart', (_, surcharge, motif) => {
    const base = { statut: 201, annonce: `Compte « ${ens.nom} » créé`, ligneEcran: `${ens.nom} ${ens.courriel}`, api: ligneApi(ens) }
    const r = jugerCreation({ ...base, ...surcharge }, ens)
    expect(r.confirme).toBe(false)
    expect(r.ecart).toMatch(motif)
  })
})

describe('#648 — juger la connexion du compte créé', () => {
  it('connecté et arrivé sur SON tableau de bord : confirmé', () => {
    expect(jugerConnexion({ connecte: true, alerte: '', chemin: '/teacher/dashboard' }, ens)).toMatchObject({ confirme: true })
    expect(jugerConnexion({ connecte: true, alerte: '', chemin: '/student/dashboard' }, eleve)).toMatchObject({ confirme: true })
  })

  it('refusé : l’alerte de l’écran est rapportée ; arrivé ailleurs : écart', () => {
    expect(jugerConnexion({ connecte: false, alerte: 'Identifiants invalides', chemin: '/login' }, ens).ecart).toMatch(/Identifiants invalides/)
    expect(jugerConnexion({ connecte: true, alerte: '', chemin: '/student/dashboard' }, ens).ecart).toMatch(/\/student\/dashboard/)
  })
})
