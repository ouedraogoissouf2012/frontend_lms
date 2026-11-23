// Parcours fonctionnel de la CRÉATION D'UNE CLASSE (#632) : l'admin d'une école autonome crée une classe par le
// formulaire « Nouvelle classe » de l'écran « Classes et codes d'inscription », puis tente le MÊME code une seconde
// fois. Chaque geste est relu à l'écran ET dans `GET /classes` (le serveur fait foi).
//   - école LMS : la classe créée apparaît (avec sa capacité) ; le code en double est refusé par un 422
//     `class_code_already_used` (lms_backend#1521), dit par le texte du front RELIÉ au champ du code, sans
//     seconde classe ;
//   - école KLASSCI : l'écran est fermé (capacité `peutInscrireLocalement`) : NON TESTÉ, déclaré.
import { ATTENTE, appel, bouton, refusServeur } from './gestes.mjs'
import { lireApi } from './fonctionnels.mjs'

export const DONNEES_CREATION = Object.freeze({ libelle: 'Classe creee E2E 632', doublon: 'Classe doublon E2E 632', code: 'E2E-632', capacite: 20 })
const ECRAN = '/admin/enrolment-codes'

// Le texte du catalogue du front (src/constants/errorMessages.js, `classeCodeDejaEmploye`), recopié : l'outil est
// copié seul en CI. Son égalité avec le catalogue est verrouillée par tests/unit/e2eParcoursCreationClasse.test.js.
export const TEXTE_CODE_DEJA_EMPLOYE = 'Ce code est déjà employé par une autre classe de votre établissement : choisissez-en un autre, ou laissez-le vide.'

const nonTesteKlassci = { nonTeste: 'sans objet : en école KLASSCI, les classes viennent de KLASSCI ; l’écran des classes locales est fermé (peutInscrireLocalement)' }
const lignesDe = (corps) => (Array.isArray(corps?.data) ? corps.data : [])

/** La classe créée relue : sa carte à l'écran (avec sa capacité), et sa ligne dans `GET /classes`. */
export function jugerCreation({ statut, carte, api }, { libelle, code, capacite }) {
  if (statut !== 201) return { confirme: false, ecart: `POST /classes rend HTTP ${statut}, 201 attendu` }
  if (!carte) return { confirme: false, ecart: 'la classe créée n’apparaît pas à l’écran rechargé' }
  if (!carte.includes(`Capacité : ${capacite} élèves`)) return { confirme: false, ecart: `la carte ne dit pas « Capacité : ${capacite} élèves » : « ${carte.slice(0, 120)} »` }
  if (api.statut !== 200) return { confirme: false, ecart: `GET /classes rend HTTP ${api.statut}` }
  const ligne = lignesDe(api.corps).find((c) => c?.libelle === libelle)
  if (!ligne) return { confirme: false, ecart: 'GET /classes ne porte pas la classe créée' }
  if (ligne.code !== code || ligne.effectif !== capacite) return { confirme: false, ecart: `GET /classes porte code ${JSON.stringify(ligne.code)} et effectif ${JSON.stringify(ligne.effectif)}` }
  return { confirme: true, preuve: `carte rechargée « ${libelle} », capacité ${capacite} ; GET /classes : code ${code}, effectif ${capacite}` }
}

/** Le code en double relu : 422, le texte du front relié au champ du code, et aucune seconde classe. */
export function jugerDoublon({ statut, decritCode, invalide, api }, { doublon }) {
  if (statut !== 422) return { confirme: false, ecart: `le même code une seconde fois rend HTTP ${statut}, 422 attendu (lms_backend#1521)` }
  if (!String(decritCode).includes(TEXTE_CODE_DEJA_EMPLOYE)) return { confirme: false, ecart: `le champ du code n’est pas décrit par le texte du front : « ${String(decritCode).slice(0, 120)} »` }
  if (invalide !== 'true') return { confirme: false, ecart: 'le champ du code n’est pas marqué invalide (aria-invalid)' }
  if (api.statut !== 200) return { confirme: false, ecart: `GET /classes rend HTTP ${api.statut}` }
  if (lignesDe(api.corps).some((c) => c?.libelle === doublon)) return { confirme: false, ecart: 'une seconde classe a été créée avec le même code' }
  return { confirme: true, preuve: 'HTTP 422 ; texte du front relié au champ du code (aria-invalid) ; aucune seconde classe' }
}

async function ecran(page, base) {
  await page.goto(`${base}${ECRAN}`, { waitUntil: 'domcontentloaded' })
  await page.locator('form.classe-creation').waitFor({ state: 'visible', timeout: ATTENTE })
}

/** Remplit le formulaire et envoie ; rend la réponse de `POST /classes`. */
async function creer(page, { libelle, code, capacite }) {
  const form = page.locator('form.classe-creation')
  await form.getByLabel('Libellé', { exact: true }).fill(libelle)
  await form.getByLabel('Code (facultatif)', { exact: true }).fill(code)
  await form.getByLabel('Capacité (facultative)', { exact: true }).fill(String(capacite ?? ''))
  const reponse = appel(page, 'POST', '/classes')
  await bouton(form, 'Créer la classe').click()
  return reponse
}

const lireClasses = (page) => lireApi(page, '/classes?per_page=100')

export const ETAPES_CREATION = Object.freeze([
  {
    cle: 'creer', compte: 'admin', libelle: 'créer une classe par le formulaire « Nouvelle classe »', requiert: [],
    action: async (ctx) => {
      if (ctx.jeu.ecole === 'klassci') return nonTesteKlassci
      const page = ctx.pages.admin
      await ecran(page, ctx.base)
      const reponse = creer(page, ctx.donnees)
      const refus = await refusServeur(page, reponse, 'la création de la classe')
      if (refus) return refus
      ctx.etat.creer = { statut: (await reponse).status() }
      return {}
    },
    relecture: async (ctx) => {
      const page = ctx.pages.admin
      await ecran(page, ctx.base)
      const carte = page.locator('.code-card').filter({ has: page.getByRole('heading', { name: ctx.donnees.libelle, exact: true }) })
      await carte.waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
      return jugerCreation({ ...ctx.etat.creer, carte: (await carte.count()) ? await carte.innerText() : null, api: await lireClasses(page) }, ctx.donnees)
    },
  },
  {
    cle: 'doublon', compte: 'admin', libelle: 'le même code une seconde fois : refusé, dit sous le champ', requiert: ['creer'],
    action: async (ctx) => {
      const page = ctx.pages.admin
      await ecran(page, ctx.base)
      // Le 422 est ATTENDU : ce n'est pas un refus du produit, c'est la relecture qui le juge.
      ctx.etat.doublon = { statut: (await creer(page, { ...ctx.donnees, libelle: ctx.donnees.doublon })).status() }
      return {}
    },
    relecture: async (ctx) => {
      const page = ctx.pages.admin
      const code = page.locator('form.classe-creation').getByLabel('Code (facultatif)', { exact: true })
      await page.waitForFunction(() => document.querySelector('form.classe-creation [data-champ="code"]')?.getAttribute('aria-invalid') === 'true', null, { timeout: ATTENTE }).catch(() => {})
      const ids = ((await code.getAttribute('aria-describedby')) ?? '').split(/\s+/).filter(Boolean)
      const textes = await Promise.all(ids.map((id) => page.locator(`[id="${id}"]`).innerText().catch(() => '')))
      return jugerDoublon({ ...ctx.etat.doublon, decritCode: textes.join(' '), invalide: await code.getAttribute('aria-invalid'), api: await lireClasses(page) }, ctx.donnees)
    },
  },
])
