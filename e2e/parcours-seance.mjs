// Parcours fonctionnel de la SÉANCE et de la VISIO (PR 4) : la séance (créée dans l'école LMS, celle de KLASSCI
// sinon), sa visio activée, démarrée, rejointe par l'élève, terminée ; la séance modifiée (aucun chemin : ROUGE
// nommé, lms_backend#1121) et supprimée (école LMS). Chaque étape relue.
//
// LIMITE DÉCLARÉE : aucun serveur Jitsi en CI. On juge le JETON émis à l'élève (un JWT dont la salle vaut celle de la
// séance, signé par un secret fictif de la CI), le DOMAINE de la salle (le front la demande à `visio.example.test`)
// et sa présence relue ; jamais la vidéo.
import { lireApi } from './fonctionnels.mjs'
import { ATTENTE, bouton, appel, refusServeur, lu } from './gestes.mjs'
import { confirmer } from './gestes-evaluation.mjs'
import { creerSeance, detailSeance, heureAffichee, carteSeance, surLaCarte, rejoindre } from './gestes-seance.mjs'

export const AUCUN_CHEMIN_MODIFICATION_SEANCE = 'aucun chemin d’interface ne modifie une séance'
export const DOMAINE_JITSI = 'visio.example.test'
export const DONNEES_SEANCE = Object.freeze({ titre: 'Seance parcours, la visio' })

// ─── Les jugements des relectures (purs, testés) ─────────────────────────────────────────────

/** La séance relue (GET /lms/seances/{id}/details) ; rend son heure de début. */
export function jugerSeance(lecture, id, titre = null) {
  const ecart = lu(lecture, `/lms/seances/${id}/details`)
  if (ecart) return { confirme: false, ecart }
  const s = lecture.corps?.data?.seance ?? {}
  if (titre && s.titre !== titre) return { confirme: false, ecart: `titre relu « ${s.titre} », « ${titre} » attendu` }
  return { confirme: true, heure: s.programmation?.heure_debut ?? null, preuve: `séance ${id} relue${titre ? ` : « ${titre} »` : ''}` }
}

/** La visio relue : activée, au statut attendu, avec sa salle. Rend la salle. */
export function jugerVisio(lecture, id, statut) {
  const ecart = lu(lecture, `/lms/seances/${id}/details`)
  if (ecart) return { confirme: false, ecart }
  const v = lecture.corps?.data?.visio ?? {}
  if (v.enabled !== true) return { confirme: false, ecart: 'visio relue non activée' }
  if (v.status !== statut) return { confirme: false, ecart: `statut de la visio relu « ${v.status} », « ${statut} » attendu` }
  if (!v.room_id) return { confirme: false, ecart: 'aucune salle relue' }
  return { confirme: true, salle: v.room_id, preuve: `visio relue « ${statut} », salle ${v.room_id}` }
}

/** La charge utile d'un JWT (base64url), ou null. */
export function chargeDuJeton(jeton) {
  const morceaux = String(jeton ?? '').split('.')
  if (morceaux.length !== 3) return null
  try { return JSON.parse(Buffer.from(morceaux[1], 'base64url').toString('utf8')) } catch { return null }
}

/** L'élève est entré : un jeton pour LA salle, la salle demandée au domaine Jitsi, sa présence relue. */
export function jugerEntree(entree, salle, presences, emailEleve) {
  const join = entree?.join ?? {}
  const charge = chargeDuJeton(join.visio_token)
  if (!charge) return { confirme: false, ecart: `aucun jeton (JWT) émis à l’élève (visio_token : ${join.visio_token ?? 'absent'})` }
  if (charge.room !== salle) return { confirme: false, ecart: `le jeton ouvre la salle « ${charge.room} », « ${salle} » attendue` }
  if (join.visio_room_id !== salle) return { confirme: false, ecart: `salle rendue « ${join.visio_room_id} », « ${salle} » attendue` }
  if (!(entree.versJitsi ?? []).length) return { confirme: false, ecart: `le front n’a rien demandé au domaine Jitsi (${DOMAINE_JITSI})` }
  const ecart = lu(presences, '/lms/seances/{id}/attendances')
  if (ecart) return { confirme: false, ecart }
  // La liste est à la RACINE du corps (SeanceAttendancesQueryService : `{ success, statistics, attendances }`).
  const lignes = presences.corps?.attendances ?? []
  if (!lignes.some((a) => a.email === emailEleve)) return { confirme: false, ecart: 'la présence de l’élève n’est pas relue' }
  return { confirme: true, preuve: `jeton émis pour la salle ${salle}, salle demandée à ${DOMAINE_JITSI}, présence de l’élève relue (vidéo : limite déclarée)` }
}

/** La modification d'une séance : aucun bouton (lms_backend#1121), ou il faut l'écrire. */
export function jugerModificationSeance(boutonVu) {
  return boutonVu ? { nonTeste: 'un bouton modifie désormais la séance : l’étape est à compléter avec sa correction (lms_backend#1121)' }
    : { rouge: `${AUCUN_CHEMIN_MODIFICATION_SEANCE} : la carte n’offre aucun « Modifier » (Refs ouedraogoissouf2012/lms_backend#1121)` }
}

/** La séance supprimée a DISPARU : 404, et absente de la liste de l'enseignant. */
export function jugerSuppressionSeance(lecture, liste, id, message) {
  if (lecture.statut !== 404) return { confirme: false, ecart: `GET /lms/seances/${id}/details rend HTTP ${lecture.statut}, 404 attendu` }
  const ecart = lu(liste, '/lms/seances/my-teaching')
  if (ecart) return { confirme: false, ecart }
  const lignes = Array.isArray(liste.corps?.data) ? liste.corps.data : liste.corps?.data?.seances ?? []
  if (lignes.some((s) => s.id === id)) return { confirme: false, ecart: `la séance ${id} est encore listée` }
  const note = /null|undefined/.test(message ?? '') ? ` ; la confirmation disait « ${message} » (Refs #581)` : ''
  return { confirme: true, preuve: `séance ${id} : 404, et absente de la liste${note}` }
}

// ─── Les étapes ──────────────────────────────────────────────────────────────────────────────

const klassci = (ctx) => ctx.jeu.ecole === 'klassci'
const relireVisio = (statut) => async (ctx) => {
  const j = jugerVisio(await detailSeance(ctx, ctx.etat.id), ctx.etat.id, statut)
  if (j.salle) ctx.etat.salle = j.salle
  return j
}
const ETAPE = (cle, compte, libelle, requiert, action, relecture) => ({ cle, compte, libelle, requiert, action, relecture })

export const ETAPES_SEANCE = Object.freeze([
  ETAPE('seance', 'enseignant', 'créer la séance (école LMS) ; celle de KLASSCI sinon', [],
    async (ctx) => {
      if (klassci(ctx)) { ctx.etat.id = ctx.jeu.seance; return ctx.etat.id ? {} : { nonTeste: 'aucune séance KLASSCI dans le jeu' } }
      const cree = await creerSeance(ctx, ctx.donnees)
      if (cree.id != null) ctx.etat.id = cree.id
      return cree.rouge ? { rouge: cree.rouge } : {}
    },
    async (ctx) => {
      const j = jugerSeance(await detailSeance(ctx, ctx.etat.id), ctx.etat.id, klassci(ctx) ? null : ctx.donnees.titre)
      if (j.heure) ctx.etat.heure = await heureAffichee(ctx.pages.enseignant, j.heure)
      return j
    }),
  ETAPE('activer', 'enseignant', 'activer la visio', ['seance'],
    (ctx) => surLaCarte(ctx, 'Activer la visio', 'POST', `/lms/seances/${ctx.etat.id}/activate-visio`, 'l’activation de la visio'),
    relireVisio('programmee')),
  ETAPE('demarrer', 'enseignant', 'démarrer la visio', ['activer'],
    (ctx) => surLaCarte(ctx, 'Démarrer maintenant', 'POST', `/lms/seances/${ctx.etat.id}/start-visio`, 'le démarrage de la visio'),
    relireVisio('active')),
  ETAPE('rejoindre', 'etudiant', 'rejoindre la visio (jeton, salle, présence)', ['demarrer'],
    async (ctx) => {
      const entree = await rejoindre(ctx, ctx.etat.id)
      if (entree.rouge) return entree
      ctx.etat.entree = entree
      return {}
    },
    async (ctx) => jugerEntree(ctx.etat.entree, ctx.etat.salle,
      await lireApi(ctx.pages.enseignant, `/lms/seances/${ctx.etat.id}/attendances`), ctx.jeu.comptes.etudiant)),
  ETAPE('terminer', 'enseignant', 'terminer la visio', ['demarrer'],
    (ctx) => surLaCarte(ctx, /Terminer$/, 'POST', `/lms/seances/${ctx.etat.id}/end-visio`, 'la fin de la visio',
      { message: 'terminer cette visioconférence', bouton: 'Terminer' }),
    relireVisio('terminee')),
  ETAPE('modifier', 'enseignant', 'modifier la séance', ['seance'],
    async (ctx) => {
      const { carte, rouge } = await carteSeance(ctx)
      if (rouge) return { rouge }
      return jugerModificationSeance((await carte.getByRole('button', { name: /Modifier/ }).count()) > 0)
    },
    async () => ({ confirme: false, ecart: 'aucune modification jouée (lms_backend#1121)' })),
  ETAPE('supprimer', 'enseignant', 'supprimer la séance (école LMS)', ['seance'],
    async (ctx) => {
      if (klassci(ctx)) return { nonTeste: 'séance KLASSCI : elle vit dans KLASSCI, le LMS ne la supprime pas' }
      const page = ctx.pages.enseignant
      await page.goto(`${ctx.base}/attendance/seances`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
      const ligne = page.locator('tr').filter({ hasText: ctx.donnees.titre })
      await ligne.first().waitFor({ timeout: ATTENTE }).catch(() => {})
      if (!(await ligne.count())) return { rouge: `la séance « ${ctx.donnees.titre} » n’apparaît pas dans l’historique des séances` }
      await bouton(ligne.first(), 'Supprimer').click()
      const modale = page.getByRole('dialog').filter({ hasText: 'supprimer la séance' })
      ctx.etat.messageSuppression = (await modale.first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
      const reponse = appel(page, 'DELETE', `/lms/seances/${ctx.etat.id}`)
      await confirmer(page, 'supprimer la séance', 'Supprimer')
      return (await refusServeur(page, reponse, 'la suppression')) ?? {}
    },
    async (ctx) => jugerSuppressionSeance(await detailSeance(ctx, ctx.etat.id),
      await lireApi(ctx.pages.enseignant, '/lms/seances/my-teaching'), ctx.etat.id, ctx.etat.messageSuppression)),
])
