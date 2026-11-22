// Parcours fonctionnel du MOT DE PASSE OUBLIÉ (#613, lms_backend#808) : un anonyme demande un lien depuis l'écran, pour
// l'adresse d'un compte de l'école, puis pour une adresse inconnue. Chaque demande est relue sur la réponse du serveur
// (son motif) ET sur l'écran (le texte du front, sans promesse d'envoi).
//
// Le motif attendu suit l'école : KLASSCI → `mot_de_passe_klassci` ; école autonome → `reinitialisation_indisponible`,
// car le canal de courriel n'est pas posé en CI (MAIL_MAILER=log, e2e.yml), comme en prod aujourd'hui.
// LIMITE DÉCLARÉE : `lien_envoye` (canal posé, un lien part) n'est jugé que par Vitest ; aucun courriel en CI.
import { ATTENTE, appel, bouton, refusServeur } from './gestes.mjs'

export const DONNEES_MOT_DE_PASSE = Object.freeze({ adresseInconnue: 'inconnu.613@e2e.test' })

// Les textes du catalogue du front (src/constants/errorMessages.js), recopiés : l'outil est copié seul en CI.
// Leur égalité avec le catalogue est verrouillée par tests/unit/e2eParcoursMotDePasse.test.js.
export const TEXTES_ATTENDUS = Object.freeze({
  mot_de_passe_klassci: 'Votre mot de passe est celui de KLASSCI : réinitialisez-le depuis KLASSCI.',
  reinitialisation_indisponible: 'La réinitialisation du mot de passe en ligne n’est pas encore disponible. Adressez-vous à votre établissement.',
})

/** Une promesse d'envoi déjà faite (« un courriel a été envoyé », « vous est envoyé »). */
export const PROMESSE_D_ENVOI = /(?:a été|est) envoyée?/i

export const motifAttendu = (ecole) => (ecole === 'klassci' ? 'mot_de_passe_klassci' : 'reinitialisation_indisponible')

/**
 * La demande relue : HTTP 200, le motif de l'école, son texte du front à l'écran, aucune promesse d'envoi.
 * @param {{ statut: number, corps: any, ecran: string }} lecture
 */
export function jugerDemande({ statut, corps, ecran }, ecole, quoi) {
  if (statut !== 200) return { confirme: false, ecart: `POST /auth/forgot-password rend HTTP ${statut}, 200 attendu` }
  const motif = motifAttendu(ecole)
  if (corps?.reason !== motif) return { confirme: false, ecart: `motif rendu « ${corps?.reason ?? 'absent'} », « ${motif} » attendu` }
  const promesse = String(ecran).match(PROMESSE_D_ENVOI)?.[0]
  if (promesse) return { confirme: false, ecart: `l’écran promet un envoi (« ${promesse} »)` }
  if (!String(ecran).includes(TEXTES_ATTENDUS[motif])) return { confirme: false, ecart: `l’écran n’affiche pas le texte du motif « ${motif} »` }
  return { confirme: true, preuve: `${quoi} : motif ${motif}, son texte du front affiché, aucune promesse d’envoi` }
}

/** Demande un lien par l'écran (établissement, adresse, « Envoyer le lien ») ; range la réponse dans `ctx.etat`. */
async function demander(ctx, adresse, cle) {
  const page = ctx.pages.anonyme
  await page.goto(`${ctx.base}/forgot-password`, { waitUntil: 'domcontentloaded' })
  await page.locator(`#institution option[value="${ctx.jeu.slug}"]`).waitFor({ state: 'attached', timeout: ATTENTE })
  await page.selectOption('#institution', ctx.jeu.slug)
  await page.fill('#email', adresse)
  const reponse = appel(page, 'POST', '/auth/forgot-password')
  await bouton(page, 'Envoyer le lien').click()
  const refus = await refusServeur(page, reponse, 'la demande de lien')
  const r = await reponse
  ctx.etat[cle] = { statut: r.status(), corps: await r.json().catch(() => null) }
  return refus ?? {}
}

/** L'écran après la demande : le texte de la page entière (une promesse d'envoi ne se cache nulle part). */
async function relire(ctx, cle, quoi) {
  const ecran = await ctx.pages.anonyme.locator('body').innerText()
  return jugerDemande({ ...ctx.etat[cle], ecran }, ctx.jeu.ecole, quoi)
}

export const ETAPES_MOT_DE_PASSE = Object.freeze([
  {
    cle: 'demander', compte: 'anonyme', libelle: 'demander un lien pour le compte de l’enseignant', requiert: [],
    action: (ctx) => demander(ctx, ctx.jeu.comptes.enseignant, 'connue'),
    relecture: (ctx) => relire(ctx, 'connue', 'adresse d’un compte'),
  },
  {
    // La réponse ne dit pas si l'adresse est inscrite : la même pour une adresse inconnue.
    cle: 'inconnue', compte: 'anonyme', libelle: 'demander un lien pour une adresse inconnue (même réponse)', requiert: ['demander'],
    action: (ctx) => demander(ctx, ctx.donnees.adresseInconnue, 'inconnue'),
    relecture: (ctx) => relire(ctx, 'inconnue', 'adresse inconnue'),
  },
])
