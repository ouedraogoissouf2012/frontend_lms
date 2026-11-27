// Parcours fonctionnel du CATALOGUE LOCAL (#654) : l'admin d'une école autonome crée une MATIÈRE (« Nouvelle matière »,
// `/admin/matieres`), la rattache au PROGRAMME d'une classe avec son enseignant (« Ouvrir la classe » depuis « Classes et
// codes d'inscription », puis « Rattacher une matière » sur la fiche), et cet enseignant la voit dans « Mes Matières ».
// Chaque geste est relu à l'écran ET par l'API (le serveur fait foi) ; captures en clair et en sombre.
//
// École KLASSCI : les matières et les programmes viennent de KLASSCI. Ce n'est pas « non testé » : l'ABSENCE des deux
// formulaires est le comportement attendu, et elle est prouvée (capacité `peutGererCatalogueLocal`).
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { ATTENTE, appel, bouton, refusServeur } from './gestes.mjs'
import { lireApi } from './fonctionnels.mjs'

export const DONNEES_CATALOGUE = Object.freeze({
  matiere: Object.freeze({ libelle: 'Physique E2E 654', code: 'E2E-PHY', coefficient: 3, credit: 2 }),
  classe: '5e B E2E',
  enseignant: 'Enseignant Un E2E',
  dossier: 'captures/catalogue-654',
})

// Les libellés des composants (MatiereCreation.vue, ProgrammeRattachement.vue, EnrolmentCodeCard.vue), recopiés : l'outil
// est copié seul en CI. Leur égalité est verrouillée par tests/unit/e2eCatalogue654.test.js.
export const ETIQUETTES = Object.freeze({
  libelle: 'Libellé', code: 'Code (facultatif)', coefficient: 'Coefficient', credit: 'Crédit', creerMatiere: 'Créer la matière',
  matiere: 'Matière', enseignant: 'Enseignant', rattacher: 'Rattacher', ouvrir: 'Ouvrir la classe',
})

const FORM_MATIERE = 'form.matiere-creation'
const FORM_PROGRAMME = 'form.programme-rattachement'

/** École KLASSCI : le formulaire est ABSENT de l'écran chargé. */
export function jugerAbsence({ charge, formulaires }, quoi) {
  if (!charge) return { confirme: false, ecart: `l’écran de ${quoi} ne s’est pas chargé : l’absence du formulaire ne prouverait rien` }
  if (formulaires !== 0) return { confirme: false, ecart: `le formulaire de ${quoi} est offert dans une école dont le catalogue vient de KLASSCI` }
  return { confirme: true, preuve: `écran chargé, aucun formulaire de ${quoi} (catalogue tenu par KLASSCI)` }
}

const matieresDe = (corps) => (Array.isArray(corps?.data?.matieres) ? corps.data.matieres : [])

/** La matière créée : 201, l'annonce, sa ligne dans la liste relue, et `GET /admin/matieres` (coefficient compris). */
export function jugerMatiere({ statut, annonce, ligne, api }, d) {
  if (statut !== 201) return { confirme: false, ecart: `POST /matieres rend HTTP ${statut}, 201 attendu` }
  if (!String(annonce ?? '').includes(d.libelle)) return { confirme: false, ecart: `l’annonce ne nomme pas la matière : « ${String(annonce ?? '').slice(0, 120)} »` }
  if (!ligne) return { confirme: false, ecart: 'la matière créée n’apparaît pas dans la liste rechargée' }
  if (api.statut !== 200) return { confirme: false, ecart: `GET /admin/matieres rend HTTP ${api.statut}` }
  const m = matieresDe(api.corps).find((x) => x?.nom === d.libelle)
  if (!m) return { confirme: false, ecart: 'GET /admin/matieres ne porte pas la matière créée' }
  if (m.coefficient !== d.coefficient) return { confirme: false, ecart: `GET /admin/matieres porte le coefficient ${JSON.stringify(m.coefficient)}, ${d.coefficient} attendu` }
  return { confirme: true, preuve: `HTTP 201 ; sa ligne dans la liste rechargée ; GET /admin/matieres : « ${d.libelle} », coefficient ${d.coefficient}` }
}

/** Le rattachement : 201, la fiche relue nomme matière ET enseignant, et `GET /lms/classes/local/{id}` le porte. */
export function jugerRattachement({ statut, ligne, api }, d) {
  if (statut !== 201) return { confirme: false, ecart: `POST /classes/{classe}/matieres rend HTTP ${statut}, 201 attendu` }
  if (!ligne || !ligne.includes(d.enseignant)) return { confirme: false, ecart: `la fiche relue ne montre pas « ${d.matiere.libelle} » avec « ${d.enseignant} » : « ${String(ligne ?? '').slice(0, 120)} »` }
  if (api.statut !== 200) return { confirme: false, ecart: `GET /lms/classes/local/{id} rend HTTP ${api.statut}` }
  const p = (Array.isArray(api.corps?.data?.matieres_disponibles) ? api.corps.data.matieres_disponibles : []).find((x) => x?.nom === d.matiere.libelle)
  if (!p) return { confirme: false, ecart: 'le programme relu par l’API ne porte pas la matière' }
  if (p.enseignants?.[0]?.nom !== d.enseignant) return { confirme: false, ecart: `le programme relu porte l’enseignant ${JSON.stringify(p.enseignants)}, « ${d.enseignant} » attendu` }
  return { confirme: true, preuve: `HTTP 201 ; fiche relue : « ${d.matiere.libelle} », ${d.enseignant} ; API : programme de la classe` }
}

/** L'enseignant désigné voit la matière dans « Mes Matières ». */
export function jugerVueEnseignant({ carte }, d) {
  if (!carte) return { confirme: false, ecart: `« ${d.matiere.libelle} » n’apparaît pas dans « Mes Matières » de ${d.enseignant}` }
  return { confirme: true, preuve: `« Mes Matières » de ${d.enseignant} porte « ${d.matiere.libelle} »` }
}

const basculer = (page, sombre) => page.evaluate((s) => {
  document.documentElement.classList.toggle('dark', s)
  document.documentElement.setAttribute('data-theme', s ? 'dark' : 'light')
}, sombre)

/** Capture la fenêtre en clair puis en sombre ; une panne de l'outil n'est jamais un verdict. */
async function capturer(page, ctx, nom) {
  const dossier = join(ctx.sortie, ctx.donnees.dossier)
  mkdirSync(dossier, { recursive: true })
  for (const [theme, sombre] of [['clair', false], ['sombre', true]]) {
    await basculer(page, sombre).catch(() => {})
    await page.waitForTimeout(300)
    await page.screenshot({ path: join(dossier, `${nom}_${theme}.png`) }).catch(() => {})
  }
  await basculer(page, false).catch(() => {})
}

async function compterFormulaires(page, selecteur, attendu) {
  const charge = await page.locator(attendu).first().waitFor({ state: 'visible', timeout: ATTENTE }).then(() => true, () => false)
  return { charge, formulaires: await page.locator(selecteur).count() }
}

export const ETAPES_CATALOGUE = Object.freeze([
  {
    cle: 'creer-matiere', compte: 'admin', libelle: 'créer une matière par « Nouvelle matière » (coefficient, crédit)', requiert: [],
    action: async (ctx) => {
      const page = ctx.pages.admin
      await page.goto(`${ctx.base}/admin/matieres`, { waitUntil: 'domcontentloaded' })
      if (ctx.jeu.ecole === 'klassci') {
        ctx.etat.creer = { klassci: await compterFormulaires(page, FORM_MATIERE, 'h1') }
        return {}
      }
      const form = page.locator(FORM_MATIERE)
      await form.waitFor({ state: 'visible', timeout: ATTENTE })
      const d = ctx.donnees.matiere
      await form.getByLabel(ETIQUETTES.libelle, { exact: true }).fill(d.libelle)
      await form.getByLabel(ETIQUETTES.code, { exact: true }).fill(d.code)
      await form.getByLabel(ETIQUETTES.coefficient, { exact: true }).fill(String(d.coefficient))
      await form.getByLabel(ETIQUETTES.credit, { exact: true }).fill(String(d.credit))
      const reponse = appel(page, 'POST', '/matieres')
      await bouton(form, ETIQUETTES.creerMatiere).click()
      const refus = await refusServeur(page, reponse, 'la création de la matière')
      if (refus) return refus
      ctx.etat.creer = { statut: (await reponse).status() }
      return {}
    },
    relecture: async (ctx) => {
      if (ctx.etat.creer?.klassci) return jugerAbsence(ctx.etat.creer.klassci, '« Nouvelle matière »')
      const page = ctx.pages.admin
      const d = ctx.donnees.matiere
      const statut = page.locator(`${FORM_MATIERE} [role="status"]`)
      await statut.filter({ hasText: d.libelle }).waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
      const annonce = await statut.innerText().catch(() => '')
      const ligne = page.locator('tr').filter({ hasText: d.libelle })
      await ligne.first().waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
      await capturer(page, ctx, 'matiere-creee')
      return jugerMatiere({ ...ctx.etat.creer, annonce, ligne: (await ligne.count()) ? await ligne.first().innerText() : null, api: await lireApi(page, '/admin/matieres') }, d)
    },
  },
  {
    cle: 'rattacher', compte: 'admin', libelle: 'rattacher la matière au programme d’une classe, avec son enseignant', requiert: ['creer-matiere'],
    action: async (ctx) => {
      const page = ctx.pages.admin
      if (ctx.jeu.ecole === 'klassci') {
        await page.goto(`${ctx.base}/classes/${ctx.jeu.classes?.[0]}`, { waitUntil: 'domcontentloaded' })
        ctx.etat.rattacher = { klassci: await compterFormulaires(page, FORM_PROGRAMME, '.tabs-container') }
        return {}
      }
      await page.goto(`${ctx.base}/admin/enrolment-codes`, { waitUntil: 'domcontentloaded' })
      const carte = page.locator('.code-card').filter({ has: page.getByRole('heading', { name: ctx.donnees.classe, exact: true }) })
      await carte.getByRole('link', { name: ETIQUETTES.ouvrir }).click({ timeout: ATTENTE })
      await page.waitForURL(/\/classes\/local\/\d+/, { timeout: ATTENTE })
      const form = page.locator(FORM_PROGRAMME)
      await form.waitFor({ state: 'visible', timeout: ATTENTE })
      await form.getByLabel(ETIQUETTES.matiere, { exact: true }).selectOption({ label: ctx.donnees.matiere.libelle })
      await form.getByLabel(ETIQUETTES.enseignant, { exact: true }).selectOption({ label: ctx.donnees.enseignant })
      const classeId = new URL(page.url()).pathname.split('/').pop()
      const reponse = appel(page, 'POST', `/classes/${classeId}/matieres`)
      await bouton(form, ETIQUETTES.rattacher).click()
      const refus = await refusServeur(page, reponse, 'le rattachement de la matière')
      if (refus) return refus
      ctx.etat.rattacher = { statut: (await reponse).status(), classeId }
      return {}
    },
    relecture: async (ctx) => {
      if (ctx.etat.rattacher?.klassci) return jugerAbsence(ctx.etat.rattacher.klassci, '« Rattacher une matière »')
      const page = ctx.pages.admin
      await page.reload({ waitUntil: 'domcontentloaded' })
      const ligne = page.locator('tr').filter({ hasText: ctx.donnees.matiere.libelle })
      await ligne.first().waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
      await capturer(page, ctx, 'programme')
      return jugerRattachement({
        ...ctx.etat.rattacher,
        ligne: (await ligne.count()) ? await ligne.first().innerText() : null,
        api: await lireApi(page, `/lms/classes/local/${ctx.etat.rattacher.classeId}`),
      }, ctx.donnees)
    },
  },
  {
    cle: 'vue-enseignant', compte: 'enseignant', libelle: 'l’enseignant désigné voit la matière dans « Mes Matières »', requiert: ['rattacher'],
    action: async (ctx) => {
      if (ctx.jeu.ecole === 'klassci') return { nonTeste: 'sans objet : en école KLASSCI, le programme vient de KLASSCI (formulaires absents, prouvé aux étapes précédentes)' }
      const page = ctx.pages.enseignant
      await page.goto(`${ctx.base}/teacher/matieres`, { waitUntil: 'domcontentloaded' })
      return {}
    },
    relecture: async (ctx) => {
      const page = ctx.pages.enseignant
      const carte = page.getByRole('heading', { name: ctx.donnees.matiere.libelle })
      await carte.first().waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
      await capturer(page, ctx, 'mes-matieres')
      return jugerVueEnseignant({ carte: (await carte.count()) > 0 }, ctx.donnees)
    },
  },
])
