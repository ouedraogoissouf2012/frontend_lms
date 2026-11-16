// Parcours fonctionnel de la LEÇON (PR 1) : l'enseignant la crée, y ajoute un chapitre, la modifie et la publie ;
// l'élève de la classe l'ouvre et termine le chapitre ; l'enseignant la supprime. Chaque étape est relue.
//
// Les sélecteurs passent par les rôles et les libellés (#563, #572) : la modale de leçon est un `dialog` nommé par son
// titre, ses champs se trouvent par leurs libellés, le titre d'un chapitre par son nom accessible. Restent
// structurels, déclarés : la carte d'une leçon (`.lesson-card`, sans rôle) et l'éditeur de contenu (`[contenteditable]`).
import { lireApi } from './fonctionnels.mjs'
import { ATTENTE, bouton, nomDeBouton, ditLEcran, appel, refusServeur, lu, formulaireDeChapitre } from './gestes.mjs'

export const AUCUN_CHEMIN_MODIFICATION = 'aucun chemin d’interface ne modifie le titre ni la description'
export const CONFIRMATION_SUPPRESSION = 'Êtes-vous sûr de vouloir supprimer cette leçon ?'

// Les données fictives du parcours. Aucun mot d'énumération (« published ») : il serait lu comme un texte brut.
export const DONNEES_LECON = Object.freeze({
  titre: 'Lecon parcours, les proportions',
  titreModifie: 'Lecon parcours, les proportions (revue)',
  description: 'Une lecon fictive du parcours fonctionnel.',
  chapitre: 'Chapitre parcours, la regle de trois',
  contenu: 'Un contenu fictif du parcours fonctionnel.',
})

// ─── Les jugements des relectures (purs, testés) ─────────────────────────────────────────────

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
  return null // un champ porte le titre : la modification se joue, puis se relit
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
  if (lecture.statut !== 404) return { confirme: false, ecart: `GET /lessons/${id} rend HTTP ${lecture.statut}, 404 attendu` }
  const ecart = lu(matiere, `/lms/matieres/${matiereId}`)
  if (ecart) return { confirme: false, ecart }
  const lecons = matiere.corps?.data?.lessons ?? []
  if (lecons.some((l) => l.id === id)) return { confirme: false, ecart: `la leçon ${id} est encore listée dans sa matière` }
  return { confirme: true, preuve: `leçon ${id} : 404, et absente de la matière ${matiereId}` }
}

// ─── Les gestes, par l'interface (e2e/gestes.mjs) ─────────────────────────────────────────────

/**
 * Le choix de la classe (#572, back #1103) quand le formulaire en propose plusieurs sans présélection : celle de
 * l'élève, lue sur la leçon PUBLIÉE du jeu qu'il voit (même espace d'ids, LOCAUX, que la liste du formulaire).
 * Sans champ Classe (avant #572) ou avec une classe déjà choisie, rien à faire. Rend un NON TESTÉ nommé, ou null.
 */
async function choisirLaClasse(page, jeu) {
  const champ = page.locator('#lecon-classe')
  if (!(await champ.count()) || (await champ.inputValue()) !== '') return null
  const reference = jeu.lecons?.publiee
  if (!reference) return { nonTeste: 'plusieurs classes et aucune leçon de référence pour choisir celle de l’élève' }
  const classe = (await lireApi(page, `/lessons/${reference}`)).corps?.data?.classe_id
  if (classe == null) return { nonTeste: `la classe de la leçon de référence ${reference} n’est pas relue` }
  await champ.selectOption(String(classe))
  return null
}

/** L'écran de la matière, et la carte de la leçon du parcours. Une carte absente est un défaut du produit. */
export async function carteDansLaMatiere({ pages, base, jeu, donnees }) {
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
      // La modale de création, nommée par son titre, et ses champs par leurs libellés (#563, #572).
      const creation = page.getByRole('dialog', { name: 'Créer une nouvelle leçon' })
      await creation.getByLabel('Titre de la leçon').fill(donnees.titre)
      await creation.getByLabel('Description').fill(donnees.description)
      // #572 : la matière a PLUSIEURS classes, aucune n'est présélectionnée (voulu) : on choisit celle de l'élève.
      const choix = await choisirLaClasse(page, jeu)
      if (choix) return choix
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
      await (await formulaireDeChapitre(page)).fill(donnees.chapitre)
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
      await bouton(carte, 'Modifier').click()
      // Navigation côté client ou modale : `networkidle` est déjà atteint, il n'attendrait rien (#565). On attend,
      // jusqu'à 20 s, un champ qui porte le titre (la modale de #572, ou tout autre chemin d'édition).
      const champ = await page.waitForFunction((t) => [...document.querySelectorAll('input, textarea')].some((e) => e.value === t),
        ctx.donnees.titre, { timeout: ATTENTE }).then(() => true, () => false)
      const absent = jugerModification(champ, new URL(page.url()))
      if (absent) return absent
      // Le champ du titre : on le change, puis « Enregistrer » (PUT). Les étapes suivantes lisent le titre COURANT.
      const modale = page.getByRole('dialog', { name: 'Modifier la leçon' })
      await modale.getByLabel('Titre de la leçon').fill(ctx.donnees.titreModifie)
      const reponse = appel(page, 'PUT', `/lessons/${ctx.etat.lecon}`)
      await bouton(modale, 'Enregistrer').click()
      const refus = await refusServeur(page, reponse, 'la modification de la leçon')
      if (!refus) ctx.etat.titre = ctx.donnees.titreModifie
      return refus ?? {}
    },
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
    // Le titre COURANT : modifié par l'étape « modifier » quand elle a réussi.
    relecture: async ({ pages, donnees, etat }) => jugerLecon(await lireApi(pages.enseignant, `/lessons/${etat.lecon}`), etat.lecon, { titre: etat.titre ?? donnees.titre, statut: 'published' }),
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
      // Attendre le RENDU du bouton, jamais le compter à l'instant (E2E 43798868511 : un faux ROUGE ; #565).
      const bouton = await page.getByRole('button', { name: 'Marquer comme terminé' }).first().waitFor({ timeout: ATTENTE }).then(() => true, () => false)
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
