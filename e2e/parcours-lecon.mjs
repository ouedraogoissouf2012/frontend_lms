// Parcours fonctionnel de la LEÇON (PR 1) : l'enseignant la crée, y ajoute un chapitre, la modifie et la publie ;
// l'élève de la classe l'ouvre et termine le chapitre ; l'enseignant la supprime. Chaque étape est relue.
//
// Les sélecteurs passent par les textes VISIBLES et les placeholders : les formulaires de leçon et de chapitre
// n'ont pas de libellés associés (#563). Deux sélecteurs sont structurels, et déclarés : la carte d'une leçon
// (`.lesson-card`, sans rôle) et l'éditeur de contenu (`[contenteditable]`, sans rôle ni nom).
import { lireApi } from './fonctionnels.mjs'

export const AUCUN_CHEMIN_MODIFICATION = 'aucun chemin d’interface ne modifie le titre ni la description'
export const CONFIRMATION_SUPPRESSION = 'Êtes-vous sûr de vouloir supprimer cette leçon ?'
const ATTENTE = 20000

// Les données fictives du parcours. Aucun mot d'énumération (« published ») : il serait lu comme un texte brut.
export const DONNEES_LECON = Object.freeze({
  titre: 'Lecon parcours, les proportions',
  titreModifie: 'Lecon parcours, les proportions (revue)',
  description: 'Une lecon fictive du parcours fonctionnel.',
  chapitre: 'Chapitre parcours, la regle de trois',
  contenu: 'Un contenu fictif du parcours fonctionnel.',
})

// ─── Les jugements des relectures (purs, testés) ─────────────────────────────────────────────

const lu = ({ statut }, chemin) => (statut === 200 ? null : `GET ${chemin} rend HTTP ${statut}`)

/** La leçon relue porte le titre saisi et le statut attendu. */
export function jugerLecon(lecture, id, { titre, statut }) {
  const ecart = lu(lecture, `/lessons/${id}`)
  if (ecart) return { confirme: false, ecart }
  const d = lecture.corps?.data ?? {}
  if (d.title !== titre) return { confirme: false, ecart: `titre relu « ${d.title} », « ${titre} » attendu` }
  if (d.status !== statut) return { confirme: false, ecart: `statut relu « ${d.status} », « ${statut} » attendu` }
  return { confirme: true, preuve: `leçon ${id} relue : « ${titre} », statut ${statut}, classe ${d.classe_id ?? '?'}` }
}

/**
 * La leçon créée est dans la classe de l'élève. Le formulaire ne fait pas choisir la classe : il prend la 1ʳᵉ de
 * `classes_concernees` (buildLessonPayload). Référence : la classe de la leçon PUBLIÉE du jeu, que l'élève voit
 * (même espace d'ids que la leçon créée, y compris dans l'école KLASSCI).
 */
export function jugerClasse(lecon, reference, id, referenceId) {
  const ecart = lu(lecon, `/lessons/${id}`) ?? lu(reference, `/lessons/${referenceId}`)
  if (ecart) return { confirme: false, ecart }
  const classe = lecon.corps?.data?.classe_id
  const attendue = reference.corps?.data?.classe_id
  if (attendue == null) return { confirme: false, ecart: `la leçon publiée du jeu (${referenceId}) n’a pas de classe relue` }
  return classe === attendue ? { confirme: true, preuve: `leçon ${id} dans la classe ${classe}, celle de l’élève` }
    : { confirme: false, ecart: `leçon créée dans la classe ${classe}, l’élève est dans la classe ${attendue} : le formulaire ne fait pas choisir la classe` }
}

/** Le chapitre saisi est listé dans la leçon ; rend son id. */
export function jugerChapitre(lecture, id, titre) {
  const ecart = lu(lecture, `/lessons/${id}/chapters`)
  if (ecart) return { confirme: false, ecart }
  const chapitre = (Array.isArray(lecture.corps?.data) ? lecture.corps.data : []).find((c) => c.title === titre)
  return chapitre ? { confirme: true, id: chapitre.id, preuve: `chapitre ${chapitre.id} listé dans la leçon ${id}` }
    : { confirme: false, ecart: `aucun chapitre « ${titre} » dans GET /lessons/${id}/chapters` }
}

/** « Modifier » doit mener à un champ qui porte le titre de la leçon (#564). */
export function jugerModification(champDuTitre, url) {
  if (!champDuTitre) return { rouge: `${AUCUN_CHEMIN_MODIFICATION} : « Modifier » ouvre ${url.pathname}${url.search}, sans champ qui porte le titre (Refs #564)` }
  return { nonTeste: 'un champ porte désormais le titre : l’étape est à compléter avec sa correction (#564)' }
}

/** L'élève a terminé le chapitre ET la leçon (deux tables : chapter_progress et lesson_progress). */
export function jugerProgression(chapitres, lecon, id, chapitreId) {
  const ecart = lu(chapitres, `/lessons/${id}/chapter-progress`) ?? lu(lecon, `/lessons/${id}/progress`)
  if (ecart) return { confirme: false, ecart }
  const p = chapitres.corps?.data ?? {}
  const c = (p.chapters ?? []).find((x) => x.chapter_id === chapitreId)
  if (c?.is_completed !== true) return { confirme: false, ecart: `chapitre ${chapitreId} relu non terminé (is_completed ${c?.is_completed})` }
  if (p.percentage !== 100) return { confirme: false, ecart: `progression relue ${p.percentage} %, 100 % attendus` }
  const statut = lecon.corps?.data?.status
  if (statut !== 'completed') return { confirme: false, ecart: `chapitre terminé, mais la leçon relue est « ${statut} », « completed » attendu` }
  return { confirme: true, preuve: `chapitre ${chapitreId} terminé (100 %), leçon ${id} « completed »` }
}

/** La leçon supprimée a DISPARU : 404 à la lecture, et absente de sa matière. */
export function jugerSuppression(lecture, matiere, id, matiereId) {
  if (lecture.statut !== 200) return { confirme: false, ecart: `GET /lessons/${id} rend HTTP ${lecture.statut}, 404 attendu` }
  const ecart = lu(matiere, `/lms/matieres/${matiereId}`)
  if (ecart) return { confirme: false, ecart }
  const lecons = matiere.corps?.data?.lessons ?? []
  if (lecons.some((l) => l.id === id)) return { confirme: false, ecart: `la leçon ${id} est encore listée dans sa matière` }
  return { confirme: true, preuve: `leçon ${id} : 404, et absente de la matière ${matiereId}` }
}

// ─── Les gestes, par l'interface ─────────────────────────────────────────────────────────────

/** Ce que l'écran dit (régions alert/status, notifications de la matière), pour nommer un refus. */
async function ditLEcran(page) {
  const textes = [
    ...(await page.locator('[role="alert"], [role="status"]').allInnerTexts().catch(() => [])),
    ...(await page.getByText(/^Erreur lors de/).allInnerTexts().catch(() => [])),
  ].map((t) => t.trim()).filter(Boolean)
  return textes.length ? `« ${textes.join(' | ').slice(0, 200)} »` : 'aucun message affiché'
}

/**
 * Un bouton par son texte visible. Une icône de police (`<i class="fa …">`) ajoute son caractère au nom
 * accessible (« \uf040 Modifier ») : le texte doit FINIR le nom, précédé au plus de ce caractère et d'un espace.
 * « Publier » ne prend donc pas « Dépublier ».
 */
export const nomDeBouton = (texte) => new RegExp(`^(\\S\\s+)?${texte}$`)
const bouton = (lieu, texte) => lieu.getByRole('button', { name: nomDeBouton(texte) })

/** L'attente d'un appel, posée AVANT le geste. Marquée gérée : un geste qui échoue ne laisse pas de rejet orphelin. */
function appel(page, methode, chemin) {
  const attente = page.waitForResponse((r) => r.request().method() === methode && new URL(r.url()).pathname === `/api${chemin}`, { timeout: ATTENTE })
  attente.catch(() => {})
  return attente
}

async function refusServeur(page, reponse, quoi) {
  const r = await reponse
  return r.status() >= 400 ? { rouge: `${quoi} refusé par le serveur (HTTP ${r.status()}) : ${await ditLEcran(page)}` } : null
}

/** L'écran de la matière, et la carte de la leçon du parcours. Une carte absente est un défaut du produit. */
async function carteDansLaMatiere({ pages, base, jeu, donnees }) {
  const page = pages.enseignant
  await page.goto(`${base}/matieres/${jeu.matieres[0]}`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
  const carte = page.locator('.lesson-card').filter({ hasText: donnees.titre })
  await carte.first().waitFor({ timeout: 10000 }).catch(() => {})
  return (await carte.count()) ? { carte: carte.first() }
    : { rouge: `la leçon « ${donnees.titre} » n’apparaît pas dans sa matière (/matieres/${jeu.matieres[0]})` }
}

// ─── Les étapes : action, relecture, et ce qu'elles requièrent ───────────────────────────────

export const ETAPES_LECON = Object.freeze([
  {
    cle: 'creer', compte: 'enseignant', libelle: 'créer la leçon (depuis la matière)', requiert: [],
    async action({ pages, base, jeu, donnees, etat }) {
      const page = pages.enseignant
      await page.goto(`${base}/matieres/${jeu.matieres[0]}`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
      await page.getByRole('button', { name: /^(Nouvelle leçon|Créer ma première leçon)$/ }).first().click()
      await page.getByPlaceholder('Ex: Introduction aux boucles').fill(donnees.titre)
      await page.getByPlaceholder('Décrivez brièvement le contenu de cette leçon...').fill(donnees.description)
      await page.getByRole('button', { name: 'Créer la leçon' }).click()
      const arrive = await page.waitForURL(/\/teacher\/lessons\/\d+\/chapters/, { timeout: ATTENTE }).then(() => true, () => false)
      if (!arrive) return { rouge: `la création n’aboutit pas (resté sur ${new URL(page.url()).pathname}) : ${await ditLEcran(page)}` }
      etat.lecon = Number(new URL(page.url()).pathname.match(/lessons\/(\d+)/)[1])
      return {}
    },
    relecture: async ({ pages, donnees, etat }) => jugerLecon(await lireApi(pages.enseignant, `/lessons/${etat.lecon}`), etat.lecon, { titre: donnees.titre, statut: 'draft' }),
  },
  {
    // Aucun geste : l'étape relit la classe que la CRÉATION a choisie sans la demander.
    cle: 'classe', compte: 'enseignant', libelle: 'la leçon est créée dans la classe de l’élève', requiert: ['creer'],
    action: async ({ jeu }) => (jeu.lecons?.publiee ? {} : { nonTeste: 'aucune leçon publiée de référence dans le jeu' }),
    relecture: async ({ pages, jeu, etat }) => jugerClasse(
      await lireApi(pages.enseignant, `/lessons/${etat.lecon}`),
      await lireApi(pages.enseignant, `/lessons/${jeu.lecons.publiee}`), etat.lecon, jeu.lecons.publiee),
  },
  {
    cle: 'chapitre', compte: 'enseignant', libelle: 'ajouter un chapitre', requiert: ['creer'],
    async action({ pages, donnees, etat }) {
      const page = pages.enseignant
      await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
      const titre = page.getByPlaceholder('saisissez le titre')
      // Sans chapitre, le formulaire du premier s'ouvre seul ; sinon « + Ajouter un chapitre ».
      if (!(await titre.count())) await page.getByRole('button', { name: '+ Ajouter un chapitre' }).click()
      await titre.first().fill(donnees.chapitre)
      await page.locator('[contenteditable="true"]').first().click()
      await page.keyboard.type(donnees.contenu)
      const reponse = appel(page, 'POST', `/lessons/${etat.lecon}/chapters`)
      await page.getByRole('button', { name: 'Créer', exact: true }).click()
      return (await refusServeur(page, reponse, 'le chapitre')) ?? {}
    },
    async relecture({ pages, donnees, etat }) {
      const jugement = jugerChapitre(await lireApi(pages.enseignant, `/lessons/${etat.lecon}/chapters`), etat.lecon, donnees.chapitre)
      etat.chapitre = jugement.id
      return jugement
    },
  },
  {
    cle: 'modifier', compte: 'enseignant', libelle: 'modifier le titre de la leçon', requiert: ['creer'],
    async action(ctx) {
      const { carte, rouge } = await carteDansLaMatiere(ctx)
      if (rouge) return { rouge }
      const page = ctx.pages.enseignant
      const avant = page.url()
      await bouton(carte, 'Modifier').click()
      // Navigation côté client : `networkidle` est DÉJÀ atteint pour ce document, il n'attendrait rien
      // (E2E 43762204617 lisait encore /matieres/:id). On attend que l'URL change, puis un champ du titre.
      await page.waitForURL((u) => u.href !== avant, { timeout: ATTENTE }).catch(() => {})
      const champ = await page.waitForFunction((t) => [...document.querySelectorAll('input, textarea')].some((e) => e.value === t),
        ctx.donnees.titre, { timeout: ATTENTE }).then(() => true, () => false)
      return jugerModification(champ, new URL(page.url()))
    },
    // Jouée seulement quand un champ du titre existera (#564) : la leçon relue doit porter le titre modifié.
    relecture: async ({ pages, donnees, etat }) => jugerLecon(await lireApi(pages.enseignant, `/lessons/${etat.lecon}`), etat.lecon, { titre: donnees.titreModifie, statut: 'draft' }),
  },
  {
    cle: 'publier', compte: 'enseignant', libelle: 'publier la leçon', requiert: ['creer'],
    async action(ctx) {
      const { carte, rouge } = await carteDansLaMatiere(ctx)
      if (rouge) return { rouge }
      const reponse = appel(ctx.pages.enseignant, 'POST', `/lessons/${ctx.etat.lecon}/publish`)
      await bouton(carte, 'Publier').click()
      return (await refusServeur(ctx.pages.enseignant, reponse, 'la publication')) ?? {}
    },
    relecture: async ({ pages, donnees, etat }) => jugerLecon(await lireApi(pages.enseignant, `/lessons/${etat.lecon}`), etat.lecon, { titre: donnees.titre, statut: 'published' }),
  },
  {
    cle: 'ouvrir', compte: 'etudiant', libelle: 'ouvrir la leçon publiée (Mes cours)', requiert: ['publier', 'chapitre', 'classe'],
    async action({ pages, base, donnees, etat }) {
      const page = pages.etudiant
      await page.goto(`${base}/student/courses`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
      const lien = page.getByRole('link', { name: `Voir le cours ${donnees.titre}` })
      if (!(await lien.count())) return { rouge: `la leçon publiée n’est pas dans « Mes cours » de l’élève : ${await ditLEcran(page)}` }
      await lien.first().click()
      const ouverte = await page.waitForURL(new RegExp(`/lessons/${etat.lecon}$`), { timeout: ATTENTE }).then(() => true, () => false)
      return ouverte ? {} : { rouge: `le lien n’ouvre pas la leçon (arrivé sur ${new URL(page.url()).pathname})` }
    },
    // L'écran suivant : la leçon ouverte montre le chapitre et le bouton qui le termine.
    async relecture({ pages, donnees }) {
      const page = pages.etudiant
      const chapitre = await page.getByText(donnees.chapitre).first().waitFor({ timeout: ATTENTE }).then(() => true, () => false)
      const bouton = await page.getByRole('button', { name: 'Marquer comme terminé' }).count()
      if (!chapitre) return { confirme: false, ecart: `le chapitre « ${donnees.chapitre} » n’est pas affiché dans la leçon ouverte` }
      return bouton ? { confirme: true, preuve: 'la leçon ouverte affiche le chapitre et « Marquer comme terminé »' }
        : { confirme: false, ecart: 'le bouton « Marquer comme terminé » est absent' }
    },
  },
  {
    cle: 'terminer', compte: 'etudiant', libelle: 'terminer le chapitre (et la leçon)', requiert: ['ouvrir'],
    async action({ pages, etat }) {
      const page = pages.etudiant
      const reponse = appel(page, 'POST', `/chapters/${etat.chapitre}/complete`)
      const lecon = appel(page, 'POST', `/lessons/${etat.lecon}/complete`).catch(() => null)
      await page.getByRole('button', { name: 'Marquer comme terminé' }).click()
      const refus = await refusServeur(page, reponse, 'la fin du chapitre')
      if (refus) return refus
      await lecon // le dernier chapitre termine la leçon ; la relecture juge, l'attente ne fait qu'ordonner
      return {}
    },
    relecture: async ({ pages, etat }) => jugerProgression(
      await lireApi(pages.etudiant, `/lessons/${etat.lecon}/chapter-progress`),
      await lireApi(pages.etudiant, `/lessons/${etat.lecon}/progress`), etat.lecon, etat.chapitre),
  },
  {
    cle: 'supprimer', compte: 'enseignant', libelle: 'supprimer la leçon', requiert: ['creer'],
    async action(ctx) {
      const { carte, rouge } = await carteDansLaMatiere(ctx)
      if (rouge) return { rouge }
      const page = ctx.pages.enseignant
      await bouton(carte, 'Supprimer').click()
      const reponse = appel(page, 'DELETE', `/lessons/${ctx.etat.lecon}`)
      // La confirmation est téléportée hors de #app : seuls ses ancêtres portent son message.
      await page.locator('div', { hasText: CONFIRMATION_SUPPRESSION }).getByRole('button', { name: nomDeBouton('Supprimer') }).first().click()
      return (await refusServeur(page, reponse, 'la suppression')) ?? {}
    },
    relecture: async ({ pages, jeu, etat }) => jugerSuppression(
      await lireApi(pages.enseignant, `/lessons/${etat.lecon}`),
      await lireApi(pages.enseignant, `/lms/matieres/${jeu.matieres[0]}`), etat.lecon, jeu.matieres[0]),
  },
])
