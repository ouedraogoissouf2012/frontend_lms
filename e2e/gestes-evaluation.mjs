// Les gestes du parcours du DEVOIR (PR 3), par l'interface : l'évaluation se crée, reçoit sa question de dissertation,
// se publie ; l'élève la passe ; l'enseignant la corrige. Les deux écoles : dans l'école KLASSCI, le devoir est la
// version EN LIGNE d'une évaluation programmée (« Créer version en ligne » sur sa carte).
//
// Sélecteurs : textes visibles, libellés et placeholders. Structurels, déclarés (#563) : la carte d'une évaluation
// (`.evaluation-card`, sans rôle), une fenêtre modale (`.modal-container`, sans `role="dialog"`), le type d'une
// question (`select` sans libellé) et les points d'une copie (`input[name^="points-"]`).
import { ATTENTE, bouton, nomDeBouton, appel, refusServeur } from './gestes.mjs'

export const carteEvaluation = (page, titre) => page.locator('.evaluation-card').filter({ hasText: titre })
const modale = (page, texte) => page.locator('.modal-container').filter({ hasText: texte })

/** Une confirmation (ConfirmDialog, ou la modale de remise) : la modale qui porte le message, puis son bouton. */
export async function confirmer(page, message, texteBouton = 'Confirmer') {
  await modale(page, message).getByRole('button', { name: nomDeBouton(texteBouton) }).first().click()
}

async function attendreRendu(page) {
  await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
}

/** La liste de l'enseignant, et la carte de l'évaluation. Une carte absente est un défaut du produit. */
export async function carteEnseignant({ pages, base }, titre) {
  const page = pages.enseignant
  await page.goto(`${base}/teacher/evaluations`, { waitUntil: 'domcontentloaded' })
  await attendreRendu(page)
  const carte = carteEvaluation(page, titre)
  await carte.first().waitFor({ timeout: ATTENTE }).catch(() => {})
  return (await carte.count()) ? { carte: carte.first() } : { rouge: `l’évaluation « ${titre} » n’apparaît pas dans la liste de l’enseignant` }
}

/** « YYYY-MM-DDTHH:mm » dans le fuseau du NAVIGATEUR, il y a 5 minutes : la fenêtre est ouverte. */
const ilYaCinqMinutes = (page) => page.evaluate(() => {
  const d = new Date(Date.now() - 5 * 60e3)
  const z = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`
})

/** L'id de l'évaluation créée, lu dans la réponse du serveur. */
async function idCree(page, reponse) {
  const refus = await refusServeur(page, reponse, 'la création de l’évaluation')
  if (refus) return refus
  const corps = await (await reponse).json().catch(() => null)
  return corps?.data?.id != null ? { id: corps.data.id } : { rouge: 'la création ne rend pas l’id de l’évaluation' }
}

/** École LMS : « Créer une évaluation », la modale de création locale (libellés associés). */
export async function creerLocale(ctx, ev) {
  const page = ctx.pages.enseignant
  await page.goto(`${ctx.base}/teacher/evaluations`, { waitUntil: 'domcontentloaded' })
  await attendreRendu(page)
  await bouton(page, 'Créer une évaluation').click()
  const m = modale(page, 'Nouvelle évaluation')
  await m.getByLabel('Matière', { exact: true }).selectOption(String(ctx.jeu.matieres[0]))
  await m.getByLabel('Classe', { exact: true }).selectOption(String(ctx.jeu.classes[0]))
  await m.getByLabel('Titre', { exact: true }).fill(ev.titre)
  await m.getByLabel('Date et heure', { exact: true }).fill(await ilYaCinqMinutes(page))
  await m.getByLabel('Durée (min)', { exact: true }).fill('240')
  await m.getByLabel('Barème', { exact: true }).fill('20')
  const reponse = appel(page, 'POST', '/evaluations')
  await m.getByRole('button', { name: 'Créer l’évaluation' }).click()
  return idCree(page, reponse)
}

/**
 * La carte d'une programmation SANS version en ligne. L'écran peut la ranger parmi les « expirées », masquées par
 * défaut, alors que sa fenêtre est ouverte (E2E 43787258943) : on passe par « Afficher », le chemin qu'il offre, et
 * on le DIT (`masquee`), pour que l'étape qui le juge le nomme.
 */
async function carteDeProgrammation(ctx, titre) {
  const trouvee = await carteEnseignant(ctx, titre)
  if (!trouvee.rouge) return { carte: trouvee.carte, masquee: false }
  const page = ctx.pages.enseignant
  if (!(await bouton(page, 'Afficher').count())) return trouvee
  await bouton(page, 'Afficher').click()
  const carte = carteEvaluation(page, titre)
  await carte.first().waitFor({ timeout: ATTENTE }).catch(() => {})
  return (await carte.count()) ? { carte: carte.first(), masquee: true } : trouvee
}

/** École KLASSCI : « Créer version en ligne » sur la carte de la programmation. Rend aussi l'URL d'arrivée (#570). */
export async function creerVersionEnLigne(ctx, ev) {
  const { carte, rouge, masquee } = await carteDeProgrammation(ctx, ev.titre)
  if (rouge) return { rouge }
  const page = ctx.pages.enseignant
  await bouton(carte, 'Créer version en ligne').click()
  const m = modale(page, 'Créer version en ligne')
  await m.locator('select', { has: page.locator('option[value="dissertation"]') }).selectOption('dissertation')
  await m.getByPlaceholder('60').fill('240')
  const avant = page.url()
  const reponse = appel(page, 'POST', '/evaluations')
  await bouton(m, 'Créer et ajouter des questions').click()
  const cree = await idCree(page, reponse)
  // Navigation côté client : on attend qu'elle ait lieu (ou non) avant de lire l'URL (#565).
  await page.waitForURL((u) => u.href !== avant, { timeout: 8000 }).catch(() => {})
  return { ...cree, arrivee: new URL(page.url()), masquee }
}

/** L'éditeur de la version en ligne, par « Modifier les questions » sur sa carte, chargé. */
export async function ouvrirEditeur(ctx, ev) {
  const { carte, rouge } = await carteEnseignant(ctx, ev.titre)
  if (rouge) return { rouge }
  const page = ctx.pages.enseignant
  const charge = appel(page, 'GET', `/evaluations/${ev.id}`)
  await bouton(carte, 'Modifier les questions').click()
  await page.waitForURL(/\/edit-questions/, { timeout: ATTENTE })
  await charge
  await attendreRendu(page)
  return {}
}

/** Enregistre l'éditeur ; un refus du serveur est rendu. */
export async function enregistrerEditeur(ctx, ev, quoi) {
  const page = ctx.pages.enseignant
  const reponse = appel(page, 'PUT', `/evaluations/${ev.id}`)
  await bouton(page, 'Enregistrer les modifications').click()
  return (await refusServeur(page, reponse, quoi)) ?? {}
}

/** Une question de DISSERTATION, et « Afficher les résultats immédiatement » (show_results). */
export async function ajouterDissertation(ctx, ev) {
  const ouvert = await ouvrirEditeur(ctx, ev)
  if (ouvert.rouge) return ouvert
  const page = ctx.pages.enseignant
  await bouton(page, 'Ajouter une question').click()
  await page.getByPlaceholder('Écrivez votre question...').last().fill(ev.question)
  await page.locator('select', { has: page.locator('option[value="dissertation"]') }).last().selectOption('dissertation')
  await page.getByLabel('Afficher les résultats immédiatement').check()
  return enregistrerEditeur(ctx, ev, 'l’enregistrement de la question')
}

/** « Publier » sur la carte, puis la confirmation. */
export async function publier(ctx, ev) {
  const { carte, rouge } = await carteEnseignant(ctx, ev.titre)
  if (rouge) return { rouge }
  const page = ctx.pages.enseignant
  const reponse = appel(page, 'POST', `/evaluations/${ev.id}/publish`)
  await bouton(carte, 'Publier').click()
  await confirmer(page, `Publier "${ev.titre}"`)
  return (await refusServeur(page, reponse, 'la publication')) ?? {}
}

/** L'élève : « Commencer l'évaluation » depuis sa liste, sa réponse, « Soumettre », la confirmation. */
export async function passer(ctx, ev) {
  const page = ctx.pages.etudiant
  await page.goto(`${ctx.base}/student/evaluations-list`, { waitUntil: 'domcontentloaded' })
  await attendreRendu(page)
  const carte = carteEvaluation(page, ev.titre)
  await carte.first().waitFor({ timeout: ATTENTE }).catch(() => {})
  if (!(await carte.count())) return { rouge: `l’évaluation « ${ev.titre} » n’apparaît pas dans la liste de l’élève` }
  const debut = appel(page, 'POST', `/evaluations/${ev.id}/start`)
  await bouton(carte.first(), 'Commencer l\'évaluation').click()
  const refus = await refusServeur(page, debut, 'le démarrage')
  if (refus) return refus
  await page.waitForURL(/\/take/, { timeout: ATTENTE })
  await page.getByPlaceholder('Votre réponse...').first().fill(ev.reponse)
  const remise = appel(page, 'POST', `/evaluations/${ev.id}/submit`)
  await bouton(page, 'Soumettre l\'évaluation').click()
  await confirmer(page, 'Confirmer la soumission')
  return (await refusServeur(page, remise, 'la remise')) ?? {}
}

/** L'enseignant : « Voir les notes », « Noter » la copie, ses points et son commentaire, « Enregistrer la note ». */
export async function corriger(ctx, ev) {
  const { carte, rouge } = await carteEnseignant(ctx, ev.titre)
  if (rouge) return { rouge }
  const page = ctx.pages.enseignant
  await bouton(carte, 'Voir les notes').click()
  await page.waitForURL(/\/corrections/, { timeout: ATTENTE })
  await bouton(page, 'Noter').first().click()
  await page.locator('input[name^="points-"]').first().fill(String(ev.points))
  await page.getByLabel(/Commentaire/).fill(ev.commentaire)
  const reponse = appel(page, 'POST', new RegExp(`^/api/evaluations/${ev.id}/submissions/\\d+/grade$`))
  await bouton(page, 'Enregistrer la note').click()
  return (await refusServeur(page, reponse, 'la note')) ?? {}
}
