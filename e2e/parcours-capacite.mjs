// Parcours fonctionnel de la CAPACITÉ D'UNE CLASSE (#631, lms_backend#1358) : l'admin d'une école autonome la règle
// sur la carte de la classe, dans « Codes d'inscription », la seule liste de ses classes locales. Chaque geste est
// relu deux fois : l'écran rechargé, et `GET /classes` (le serveur fait foi).
//   - école LMS : régler 25, puis vider (« sans limite ») ;
//   - école KLASSCI : la capacité vient de KLASSCI ; l'écran « Codes d'inscription » est fermé (capacité
//     `peutInscrireLocalement`) et aucun « Modifier la capacité » n'est offert. Les gestes y sont NON TESTÉS, déclarés.
import { ATTENTE, appel, bouton, ditLEcran, refusServeur } from './gestes.mjs'
import { lireApi } from './fonctionnels.mjs'

export const DONNEES_CAPACITE = Object.freeze({ classe: '6e A E2E', nouvelle: 25 })

// Les libellés du front (src/composables/useClasseCapacite.js, `libelleCapacite`), recopiés : l'outil est copié seul
// en CI. Leur égalité avec le front est verrouillée par tests/unit/e2eParcoursCapacite.test.js.
export const libelleCapacite = (effectif) => (effectif === null ? 'Capacité : sans limite' : `Capacité : ${effectif} ${effectif === 1 ? 'élève' : 'élèves'}`)
export const MODIFIER = 'Modifier la capacité'
const ECRAN = '/admin/enrolment-codes'
const nonTesteKlassci = { nonTeste: 'sans objet : en école KLASSCI, la capacité vient de KLASSCI ; aucun geste à l’écran (vérifié par l’étape « fermé »)' }

/**
 * La capacité relue : l'écran rechargé dit `attendue`, et la ligne de `GET /classes` porte le même `effectif`.
 * @param {{ statut: number|null, ecran: string|null, api: { statut: number, effectif: unknown } }} lecture
 */
export function jugerCapacite({ statut, ecran, api }, attendue) {
  if (statut !== null && statut !== 200) return { confirme: false, ecart: `PUT /classes/{id}/capacite rend HTTP ${statut}, 200 attendu` }
  if (ecran !== libelleCapacite(attendue)) return { confirme: false, ecart: `l’écran rechargé dit « ${ecran ?? 'rien'} », « ${libelleCapacite(attendue)} » attendu` }
  if (api.statut !== 200) return { confirme: false, ecart: `GET /classes rend HTTP ${api.statut}` }
  if (api.effectif !== attendue) return { confirme: false, ecart: `GET /classes porte effectif ${JSON.stringify(api.effectif)}, ${JSON.stringify(attendue)} attendu` }
  return { confirme: true, preuve: `écran rechargé « ${ecran} », et GET /classes effectif ${JSON.stringify(attendue)}` }
}

/** L'école KLASSCI : ni l'écran des codes, ni un « Modifier la capacité » où que l'admin arrive. */
export function jugerFerme({ chemin, gestes }) {
  if (chemin === ECRAN) return { confirme: false, ecart: `« Codes d’inscription » (${ECRAN}) s’ouvre dans une école KLASSCI` }
  if (gestes > 0) return { confirme: false, ecart: `${gestes} « ${MODIFIER} » offert(s) dans une école KLASSCI` }
  return { confirme: true, preuve: `${ECRAN} ne s’ouvre pas (arrivée : ${chemin}), aucun « ${MODIFIER} »` }
}

const carte = (page, libelle) => page.locator('.code-card').filter({ has: page.getByRole('heading', { name: libelle, exact: true }) })

async function ouvrirEcran(page, base) {
  await page.goto(`${base}${ECRAN}`, { waitUntil: 'domcontentloaded' })
}

/** Ouvre le formulaire de la carte, saisit `saisie` et enregistre ; range le statut du PUT. */
async function regler(ctx, saisie, cle) {
  const page = ctx.pages.admin
  await ouvrirEcran(page, ctx.base)
  const c = carte(page, ctx.donnees.classe)
  await c.waitFor({ state: 'visible', timeout: ATTENTE })
  await bouton(c, MODIFIER).click()
  await c.getByLabel('Capacité (nombre d’élèves)').fill(saisie)
  const reponse = appel(page, 'PUT', /^\/api\/classes\/\d+\/capacite$/)
  await bouton(c, 'Enregistrer').click()
  const refus = await refusServeur(page, reponse, 'le réglage de la capacité')
  if (refus) return refus
  ctx.etat[cle] = { statut: (await reponse).status() }
  // Le formulaire se ferme sur un succès relu ; resté ouvert, l'écran a refusé.
  await bouton(c, MODIFIER).waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
  if (!(await bouton(c, MODIFIER).count())) return { rouge: `le formulaire reste ouvert après « Enregistrer » : ${await ditLEcran(page)}` }
  return {}
}

/** Relit après RECHARGEMENT : le libellé de la carte, et la ligne de la classe dans `GET /classes`. */
async function relire(ctx, cle, attendue) {
  const page = ctx.pages.admin
  await ouvrirEcran(page, ctx.base)
  const valeur = carte(page, ctx.donnees.classe).locator('.capacite-valeur')
  await valeur.waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
  const ecran = (await valeur.count()) ? (await valeur.innerText()).trim() : null
  const { statut, corps } = await lireApi(page, '/classes?per_page=100')
  const ligne = (Array.isArray(corps?.data) ? corps.data : []).find((c) => c?.libelle === ctx.donnees.classe)
  return jugerCapacite({ statut: ctx.etat[cle]?.statut ?? null, ecran, api: { statut, effectif: ligne ? ligne.effectif : 'classe absente' } }, attendue)
}

export const ETAPES_CAPACITE = Object.freeze([
  {
    cle: 'ferme', compte: 'admin', libelle: 'aucun réglage de la capacité offert en école KLASSCI', requiert: [],
    action: async (ctx) => {
      if (ctx.jeu.ecole !== 'klassci') return { nonTeste: 'sans objet : en école autonome, l’écran est ouvert (étapes suivantes)' }
      await ouvrirEcran(ctx.pages.admin, ctx.base)
      return {}
    },
    relecture: async (ctx) => {
      const page = ctx.pages.admin
      await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
      return jugerFerme({ chemin: new URL(page.url()).pathname, gestes: await bouton(page, MODIFIER).count() })
    },
  },
  {
    cle: 'regler', compte: 'admin', libelle: `régler la capacité de « ${DONNEES_CAPACITE.classe} » à ${DONNEES_CAPACITE.nouvelle}`, requiert: [],
    action: (ctx) => (ctx.jeu.ecole === 'klassci' ? nonTesteKlassci : regler(ctx, String(ctx.donnees.nouvelle), 'regler')),
    relecture: (ctx) => relire(ctx, 'regler', ctx.donnees.nouvelle),
  },
  {
    cle: 'vider', compte: 'admin', libelle: 'vider la capacité (sans limite)', requiert: ['regler'],
    action: (ctx) => regler(ctx, '', 'vider'),
    relecture: (ctx) => relire(ctx, 'vider', null),
  },
])
