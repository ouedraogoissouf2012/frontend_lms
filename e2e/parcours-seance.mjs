// Parcours fonctionnel de la SÉANCE et de la VISIO (PR 4) : la séance (créée dans l'école LMS, celle de KLASSCI
// sinon), sa visio activée, démarrée, rejointe par l'élève, terminée ; la séance modifiée (école LMS ; dans l'école
// KLASSCI, sans objet, après avoir vérifié qu'aucun « Modifier » ne paraît : lms_backend#1121) et supprimée depuis
// l'historique, par la PORTE LOCALE (#623, lms_backend#1154) : la séance créée (école LMS), ou le MIROIR local de la
// séance KLASSCI, dont la séance KLASSCI elle-même reste au calendrier. Chaque étape relue.
//
// LIMITE DÉCLARÉE : aucun serveur Jitsi en CI. On juge le JETON émis à l'élève (un JWT dont la salle vaut celle de la
// séance, signé par un secret fictif de la CI), le DOMAINE de la salle (le front la demande à `visio.example.test`)
// et sa présence relue ; jamais la vidéo.
import { lireApi } from './fonctionnels.mjs'
import { ATTENTE, bouton, lu } from './gestes.mjs'
import { confirmer } from './gestes-evaluation.mjs'
import { creerSeance, detailSeance, heureAffichee, carteSeance, surLaCarte, rejoindre, modifierSeance } from './gestes-seance.mjs'

export const DOMAINE_JITSI = 'visio.example.test'
export const DONNEES_SEANCE = Object.freeze({ titre: 'Seance parcours, la visio' })
// Le titre modifié GARDE le titre d'origine : l'étape « supprimer » trouve sa ligne par ce texte.
export const TITRE_MODIFIE = `${DONNEES_SEANCE.titre} (modifiée)`

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

/**
 * « Modifier » sur la carte (lms_backend#1121, décision du user) : l'école autonome modifie sa séance ; l'école
 * KLASSCI jamais (la séance se modifie dans KLASSCI). Rend null quand la modification est à jouer.
 */
export function jugerBoutonModifier(boutonVu, ecoleKlassci) {
  if (ecoleKlassci) {
    return boutonVu ? { rouge: 'une séance KLASSCI offre « Modifier » : elle se modifie dans KLASSCI (Refs ouedraogoissouf2012/lms_backend#1121)' }
      : { nonTeste: 'sans objet : une séance KLASSCI se modifie dans KLASSCI ; sa carte n’offre aucun « Modifier » (vérifié)' }
  }
  return boutonVu ? null : { rouge: 'la carte d’une séance locale n’offre aucun « Modifier » (can_be_edited, Refs ouedraogoissouf2012/lms_backend#1121)' }
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

/**
 * La ligne d'historique à supprimer : la séance créée (école LMS), ou le MIROIR local de la séance KLASSCI, relu sur
 * l'historique par son `klassci_seance_id` (#623). L'historique ne liste que des lignes locales : son `id` est l'id LOCAL.
 */
export function ligneHistorique(lecture, ecole, id, titre) {
  if (ecole !== 'klassci') return { id, titre }
  const ecart = lu(lecture, '/lms/seances/history')
  if (ecart) return { rouge: ecart }
  const lignes = Array.isArray(lecture.corps?.data) ? lecture.corps.data : []
  const miroirs = lignes.filter((s) => s.klassci_seance_id != null && String(s.klassci_seance_id) === String(id))
  if (miroirs.length !== 1) return { rouge: `${miroirs.length} miroir(s) local(aux) de la séance KLASSCI ${id} dans l’historique, 1 attendu` }
  return { id: miroirs[0].id, titre: miroirs[0].titre }
}

/** La porte de la suppression (#623) : `DELETE /lms/seances/local/{id local}`, jamais la porte historique. */
export function jugerPorte(chemin, idLocal) {
  const attendu = `/api/lms/seances/local/${idLocal}`
  return chemin === attendu ? null : { rouge: `la suppression passe par ${chemin ?? 'aucune requête'}, ${attendu} attendu (porte locale, #623)` }
}

/** Le miroir supprimé (école KLASSCI) : absent de l'historique ; la séance KLASSCI, elle, reste au calendrier. */
export function jugerSuppressionMiroir(historique, calendrier, idLocal, idKlassci) {
  const ecart = lu(historique, '/lms/seances/history') ?? lu(calendrier, '/lms/seances/my-teaching')
  if (ecart) return { confirme: false, ecart }
  const lignes = (l) => (Array.isArray(l.corps?.data) ? l.corps.data : l.corps?.data?.seances ?? [])
  if (lignes(historique).some((s) => s.id === idLocal)) return { confirme: false, ecart: `le miroir local ${idLocal} est encore dans l’historique` }
  if (!lignes(calendrier).some((s) => String(s.id) === String(idKlassci))) {
    return { confirme: false, ecart: `la séance KLASSCI ${idKlassci} a quitté le calendrier : seul son miroir local devait partir` }
  }
  return { confirme: true, preuve: `miroir local ${idLocal} supprimé par la porte locale, absent de l’historique ; séance KLASSCI ${idKlassci} toujours au calendrier` }
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
      const modifier = carte.getByRole('button', { name: 'Modifier', exact: true })
      return jugerBoutonModifier((await modifier.count()) > 0, klassci(ctx)) ?? modifierSeance(ctx, modifier.first(), TITRE_MODIFIE)
    },
    async (ctx) => jugerSeance(await detailSeance(ctx, ctx.etat.id), ctx.etat.id, TITRE_MODIFIE)),
  ETAPE('supprimer', 'enseignant', 'supprimer depuis l’historique, par la porte locale (le miroir, école KLASSCI)', ['seance'],
    async (ctx) => {
      const page = ctx.pages.enseignant
      const histo = klassci(ctx) ? await lireApi(page, '/lms/seances/history') : null
      const cible = ligneHistorique(histo, ctx.jeu.ecole, ctx.etat.id, ctx.donnees.titre)
      if (cible.rouge) return { rouge: cible.rouge }
      ctx.etat.local = cible.id
      await page.goto(`${ctx.base}/attendance/seances`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
      const ligne = page.locator('tr').filter({ hasText: cible.titre })
      await ligne.first().waitFor({ timeout: ATTENTE }).catch(() => {})
      if (!(await ligne.count())) return { rouge: `la séance « ${cible.titre} » n’apparaît pas dans l’historique des séances` }
      await bouton(ligne.first(), 'Supprimer').click()
      const modale = page.locator('.modal-container').filter({ hasText: 'supprimer la séance' })
      ctx.etat.messageSuppression = (await modale.first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
      // Toute suppression de séance : la porte EMPRUNTÉE se juge, pas seulement l'absence de la bonne.
      const requete = page.waitForRequest((r) => r.method() === 'DELETE' && new URL(r.url()).pathname.startsWith('/api/lms/seances/'), { timeout: ATTENTE })
      requete.catch(() => {})
      await confirmer(page, 'supprimer la séance', 'Supprimer')
      const envoyee = await requete.catch(() => null)
      const porte = jugerPorte(envoyee && new URL(envoyee.url()).pathname, cible.id)
      if (porte) return porte
      const reponse = await envoyee.response()
      return reponse.status() >= 400 ? { rouge: `la suppression refusée par le serveur (HTTP ${reponse.status()})` } : {}
    },
    async (ctx) => (klassci(ctx)
      ? jugerSuppressionMiroir(await lireApi(ctx.pages.enseignant, '/lms/seances/history'),
        await lireApi(ctx.pages.enseignant, '/lms/seances/my-teaching'), ctx.etat.local, ctx.etat.id)
      : jugerSuppressionSeance(await detailSeance(ctx, ctx.etat.id),
        await lireApi(ctx.pages.enseignant, '/lms/seances/my-teaching'), ctx.etat.id, ctx.etat.messageSuppression))),
])
