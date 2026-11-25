// Parcours fonctionnel de la CRÉATION D'UN COMPTE (#648) : l'admin d'une école autonome crée un ENSEIGNANT puis un
// ÉLÈVE par le formulaire « Nouvel utilisateur » de `/admin/users`, avec un mot de passe initial (aucun lien
// d'activation : contrat de POST /users) ; puis chacun se CONNECTE par l'écran de connexion, dans un navigateur neuf.
// Chaque création est relue à l'écran ET dans `GET /admin/users` (le serveur fait foi) :
//   - l'enseignant figure dans la liste (l'annuaire local liste tous les enseignants de l'école) ;
//   - l'élève, SANS classe, n'y figure pas encore (les élèves de la liste sont lus dans les classes) : l'annonce le
//     dit, et l'API le porte ;
//   - école KLASSCI : le formulaire est fermé (capacité `peutInscrireLocalement`) : NON TESTÉ, déclaré.
// Le mot de passe initial est celui du run (E2E_MOT_DE_PASSE, aléatoire et masqué), jamais écrit dans le dépôt.
import { ATTENTE, appel, bouton, refusServeur } from './gestes.mjs'
import { lireApi } from './fonctionnels.mjs'
import { connecter } from './connexion.mjs'

export const DONNEES_COMPTE = Object.freeze({
  enseignant: Object.freeze({ nom: 'Enseignant Trois E2E 648', courriel: 'ens3-648@e2e.test', role: 'enseignant', accueil: '/teacher/dashboard', dansLaListe: true }),
  etudiant: Object.freeze({ nom: 'Eleve Sept E2E 648', courriel: 'eleve7-648@e2e.test', role: 'etudiant', accueil: '/student/dashboard', dansLaListe: false }),
})

// Les libellés du composant (src/components/admin/CompteCreation.vue), recopiés : l'outil est copié seul en CI. Leur
// égalité est verrouillée par tests/unit/e2eParcoursCreationCompte648.test.js.
export const ETIQUETTES = Object.freeze({
  nom: 'Nom complet', courriel: 'Courriel', role: 'Rôle', motDePasse: 'Mot de passe initial',
  confirmation: 'Confirmer le mot de passe', bouton: 'Créer le compte',
})

const ECRAN = '/admin/users'
const RECHERCHE = 'Rechercher par nom, email ou matricule…'
const nonTesteKlassci = { nonTeste: 'sans objet : en école KLASSCI, les comptes viennent de KLASSCI ; le formulaire « Nouvel utilisateur » est fermé (peutInscrireLocalement)' }
// GET /admin/users est PAGINÉ (UserListPresenter::paginated, lms) : les lignes sont dans `data.data`.
const lignesDe = (corps) => (Array.isArray(corps?.data?.data) ? corps.data.data : [])

/** La relecture vise le courriel (`q`) : la pagination ne peut pas cacher le compte créé. */
export const cheminRelecture = (d) => `/admin/users?q=${encodeURIComponent(d.courriel)}&per_page=100`

/** La création relue : 201, l'annonce, la ligne à l'écran (enseignant seulement), et `GET /admin/users` au bon rôle. */
export function jugerCreation({ statut, annonce, ligneEcran, api }, d) {
  if (statut !== 201) return { confirme: false, ecart: `POST /users rend HTTP ${statut}, 201 attendu` }
  if (!String(annonce ?? '').includes(d.nom)) return { confirme: false, ecart: `l’annonce ne nomme pas le compte créé : « ${String(annonce ?? '').slice(0, 120)} »` }
  if (d.dansLaListe && !ligneEcran) return { confirme: false, ecart: 'le compte créé n’apparaît pas dans la liste rechargée' }
  if (api.statut !== 200) return { confirme: false, ecart: `GET /admin/users rend HTTP ${api.statut}` }
  const ligne = lignesDe(api.corps).find((u) => u?.email === d.courriel)
  if (!ligne) return { confirme: false, ecart: 'GET /admin/users ne porte pas le compte créé' }
  if (ligne.role !== d.role) return { confirme: false, ecart: `GET /admin/users porte le rôle ${JSON.stringify(ligne.role)}, ${d.role} attendu` }
  const ecran = d.dansLaListe ? 'sa ligne dans la liste rechargée' : 'annonce (sans classe, hors de la liste)'
  return { confirme: true, preuve: `HTTP 201 ; ${ecran} ; GET /admin/users : ${d.courriel}, rôle ${d.role}` }
}

/** La connexion du compte créé : connecté, et arrivé sur SON tableau de bord. */
export function jugerConnexion({ connecte, alerte, chemin }, d) {
  if (!connecte) return { confirme: false, ecart: `connexion refusée : « ${alerte || 'aucun message'} »` }
  if (!String(chemin).startsWith(d.accueil)) return { confirme: false, ecart: `connecté, mais arrivé sur ${chemin}, ${d.accueil} attendu` }
  return { confirme: true, preuve: `connecté avec le mot de passe initial ; arrivé sur ${chemin}` }
}

async function ecran(page, base) {
  await page.goto(`${base}${ECRAN}`, { waitUntil: 'domcontentloaded' })
  await page.locator('form.compte-creation').waitFor({ state: 'visible', timeout: ATTENTE })
}

/** Remplit le formulaire et envoie ; rend la réponse de `POST /users`. */
async function creer(page, d, motDePasse) {
  const form = page.locator('form.compte-creation')
  await form.getByLabel(ETIQUETTES.nom, { exact: true }).fill(d.nom)
  await form.getByLabel(ETIQUETTES.courriel, { exact: true }).fill(d.courriel)
  await form.getByLabel(ETIQUETTES.role, { exact: true }).selectOption(d.role)
  await form.getByLabel(ETIQUETTES.motDePasse, { exact: true }).fill(motDePasse)
  await form.getByLabel(ETIQUETTES.confirmation, { exact: true }).fill(motDePasse)
  const reponse = appel(page, 'POST', '/users')
  await bouton(form, ETIQUETTES.bouton).click()
  return reponse
}

function etapeCreation(cle, quel, libelle) {
  return {
    cle, compte: 'admin', libelle, requiert: [],
    action: async (ctx) => {
      if (ctx.jeu.ecole === 'klassci') return nonTesteKlassci
      const page = ctx.pages.admin
      await ecran(page, ctx.base)
      const reponse = creer(page, ctx.donnees[quel], process.env.E2E_MOT_DE_PASSE)
      const refus = await refusServeur(page, reponse, `la création du compte ${quel}`)
      if (refus) return refus
      ctx.etat[cle] = { statut: (await reponse).status() }
      return {}
    },
    relecture: async (ctx) => {
      const page = ctx.pages.admin
      const d = ctx.donnees[quel]
      const statut = page.locator('form.compte-creation [role="status"]')
      await statut.filter({ hasText: d.nom }).waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
      const annonce = await statut.innerText().catch(() => '')
      await page.getByPlaceholder(RECHERCHE).fill(d.courriel)
      const ligne = page.locator('tr.user-row').filter({ hasText: d.courriel })
      if (d.dansLaListe) await ligne.first().waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
      const ligneEcran = (await ligne.count()) ? await ligne.first().innerText() : null
      return jugerCreation({ ...ctx.etat[cle], annonce, ligneEcran, api: await lireApi(page, cheminRelecture(d)) }, d)
    },
  }
}

function etapeConnexion(cle, quel, creation, libelle) {
  return {
    cle, compte: 'anonyme', libelle, requiert: [creation],
    action: async (ctx) => {
      // Un navigateur NEUF : aucune session de l'admin ni d'un autre compte ne s'y mêle.
      const contexte = await ctx.pages.anonyme.context().browser().newContext()
      const page = await contexte.newPage()
      try {
        const d = ctx.donnees[quel]
        const { connecte, alerte } = await connecter(page, ctx.base, d.courriel, process.env.E2E_MOT_DE_PASSE)
        // Quitter /login ne suffit pas : on attend l'arrivée sur le tableau de bord (la redirection passe par `/`).
        if (connecte) await page.waitForURL((u) => u.pathname.startsWith(d.accueil), { timeout: ATTENTE }).catch(() => {})
        ctx.etat[cle] = { connecte, alerte, chemin: new URL(page.url()).pathname }
      } finally {
        await contexte.close()
      }
      return {}
    },
    relecture: async (ctx) => jugerConnexion(ctx.etat[cle], ctx.donnees[quel]),
  }
}

export const ETAPES_COMPTE = Object.freeze([
  etapeCreation('creer-enseignant', 'enseignant', 'créer un enseignant par « Nouvel utilisateur » (mot de passe initial)'),
  etapeCreation('creer-eleve', 'etudiant', 'créer un élève par « Nouvel utilisateur » (mot de passe initial)'),
  etapeConnexion('connexion-enseignant', 'enseignant', 'creer-enseignant', 'l’enseignant créé se connecte (courriel, mot de passe initial)'),
  etapeConnexion('connexion-eleve', 'etudiant', 'creer-eleve', 'l’élève créé se connecte (courriel, mot de passe initial)'),
])
