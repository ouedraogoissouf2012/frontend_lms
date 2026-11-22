// Parcours fonctionnel du LIEN D'ACTIVATION MORT (#614) : un anonyme ouvre `/activation/{jeton}` avec un jeton qui
// ne vaut plus, choisit un mot de passe et enregistre. Le serveur rend 410 (ActivationController : inconnu, consommé
// ou périmé, la MÊME réponse) ; l'écran doit dire le texte neutre du front, proposer « Mot de passe oublié » et
// retirer le formulaire. Deux jetons :
//   - un jeton inconnu (fictif) : les deux écoles ;
//   - le jeton DÉJÀ CONSOMMÉ par l'activation de l'admin d'école (e2e/ecole-lms.ps1, étape 3) : l'école LMS seule.
//     L'école KLASSCI ne remet aucun lien d'activation : NON TESTÉ déclaré, jamais un vert inventé.
import { ATTENTE, appel, bouton } from './gestes.mjs'

export const DONNEES_ACTIVATION = Object.freeze({ jetonInconnu: 'e2e-614-jeton-inconnu', motDePasse: 'Lien-mort-614' })

// Le texte du catalogue du front (src/constants/errorMessages.js, `gone`), recopié : l'outil est copié seul en CI.
// Son égalité avec le catalogue est verrouillée par tests/unit/e2eParcoursActivation.test.js.
export const TEXTE_LIEN_MORT = 'Ce lien n\'est pas valide ou a expiré. Demandez-en un nouveau à votre administrateur, ou depuis « Mot de passe oublié ».'

/**
 * Le lien mort relu : HTTP 410, le texte neutre à l'écran, le lien vers « Mot de passe oublié », plus de formulaire.
 * @param {{ statut: number, ecran: string, lienOublie: boolean, formulaire: boolean }} lecture
 */
export function jugerLienMort({ statut, ecran, lienOublie, formulaire }, quoi) {
  if (statut !== 410) return { confirme: false, ecart: `POST /activation rend HTTP ${statut}, 410 attendu` }
  if (!String(ecran).includes(TEXTE_LIEN_MORT)) return { confirme: false, ecart: 'l’écran n’affiche pas le texte neutre du lien mort' }
  if (!lienOublie) return { confirme: false, ecart: 'aucun lien vers « Mot de passe oublié » (/forgot-password) à l’écran' }
  if (formulaire) return { confirme: false, ecart: 'le formulaire reste affiché sous un lien mort' }
  return { confirme: true, preuve: `${quoi} : HTTP 410, texte neutre du front, lien vers « Mot de passe oublié », formulaire retiré` }
}

/** Ouvre le lien et enregistre un mot de passe fictif ; range le statut de `POST /activation` dans `ctx.etat`. */
async function ouvrir(ctx, jeton, cle) {
  const page = ctx.pages.anonyme
  await page.goto(`${ctx.base}/activation/${encodeURIComponent(jeton)}`, { waitUntil: 'domcontentloaded' })
  await page.locator('#password').waitFor({ state: 'visible', timeout: ATTENTE })
  await page.fill('#password', ctx.donnees.motDePasse)
  await page.fill('#password_confirmation', ctx.donnees.motDePasse)
  const reponse = appel(page, 'POST', '/activation')
  await bouton(page, 'Enregistrer').click()
  ctx.etat[cle] = { statut: (await reponse).status() }
  // Le 410 est ATTENDU ici : il n'est pas un refus du produit, c'est la relecture qui le juge.
  return {}
}

/** L'écran après l'envoi : le texte de la page entière, le lien « Mot de passe oublié », le formulaire. */
async function relire(ctx, cle, quoi) {
  const page = ctx.pages.anonyme
  const lien = page.locator('a[href="/forgot-password"]')
  await lien.waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
  return jugerLienMort({
    ...ctx.etat[cle],
    ecran: await page.locator('body').innerText(),
    lienOublie: await lien.isVisible(),
    formulaire: (await page.locator('#password').count()) > 0,
  }, quoi)
}

export const ETAPES_ACTIVATION = Object.freeze([
  {
    cle: 'inconnu', compte: 'anonyme', libelle: 'ouvrir un lien d’activation au jeton inconnu', requiert: [],
    action: (ctx) => ouvrir(ctx, ctx.donnees.jetonInconnu, 'inconnu'),
    relecture: (ctx) => relire(ctx, 'inconnu', 'jeton inconnu'),
  },
  {
    cle: 'consomme', compte: 'anonyme', libelle: 'rouvrir le lien d’activation déjà servi à l’admin d’école', requiert: [],
    action: (ctx) => (ctx.jeu.jeton_consomme
      ? ouvrir(ctx, ctx.jeu.jeton_consomme, 'consomme')
      : { nonTeste: 'aucun lien d’activation consommé dans le jeu de cette école (une école KLASSCI n’en remet pas)' }),
    relecture: (ctx) => relire(ctx, 'consomme', 'jeton déjà consommé'),
  },
])
