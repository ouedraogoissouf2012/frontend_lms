// Test de capacité de la visio (lms_backend#1232) : le PLAN, pur et testé. Qui entre, quand, sur quel runner.
//
// Des participants simulés (Chromium sans écran, média factice) rejoignent UNE salle Jitsi dédiée, par paliers. Le
// participant 0 est l'enseignant (modérateur, caméra et micro actifs) ; les autres sont des élèves (caméra et micro
// coupés), comme en classe. Le participant n entre au palier dont l'effectif le dépasse, et reste jusqu'à la fin :
// chaque palier ajoute des participants à ceux déjà présents.
//
// Garde-fou : la salle DOIT être une salle de test (préfixe `test-charge-1232`). L'outil refuse toute autre salle,
// pour qu'aucune séance réelle ne puisse recevoir la charge par erreur.

export const PREFIXE_SALLE = 'test-charge-1232'

/** Le temps d'entrée d'un palier : les nouveaux participants y arrivent étalés, le reste du palier est mesuré. */
export const ENTREE_S = 60

/**
 * @typedef {{ salle: string, paliers: number[], dureePalierS: number, navigateursParRunner: number }} Plan
 */

/**
 * Le plan validé, ou une erreur qui dit pourquoi (l'outil ne démarre pas).
 * @param {Plan} plan
 * @returns {Plan}
 */
export function validerPlan(plan) {
  const p = plan ?? {}
  if (typeof p.salle !== 'string' || !new RegExp(`^${PREFIXE_SALLE}[a-z0-9-]*$`).test(p.salle)) {
    throw new Error(`salle refusée : « ${p.salle} » n’est pas une salle de test (${PREFIXE_SALLE}…)`)
  }
  if (!Array.isArray(p.paliers) || p.paliers.length === 0) throw new Error('aucun palier')
  p.paliers.forEach((n, i) => {
    if (!Number.isInteger(n) || n < 1) throw new Error(`palier ${i} invalide : ${n}`)
    if (i > 0 && n <= p.paliers[i - 1]) throw new Error(`paliers non croissants : ${p.paliers[i - 1]} puis ${n}`)
  })
  if (!Number.isInteger(p.dureePalierS) || p.dureePalierS < ENTREE_S + 30) {
    throw new Error(`durée de palier trop courte : ${p.dureePalierS} s (au moins ${ENTREE_S + 30} s)`)
  }
  if (!Number.isInteger(p.navigateursParRunner) || p.navigateursParRunner < 1 || p.navigateursParRunner > 8) {
    throw new Error(`navigateurs par runner hors bornes : ${p.navigateursParRunner} (1 à 8)`)
  }
  return p
}

/** Le nombre total de participants (le dernier palier). */
export const effectifMax = (plan) => plan.paliers[plan.paliers.length - 1]

/** Le nombre de runners de la matrice. */
export const runnersNecessaires = (plan) => Math.ceil(effectifMax(plan) / plan.navigateursParRunner)

/** La durée totale du test, en secondes depuis T0. */
export const finS = (plan) => plan.paliers.length * plan.dureePalierS

/** Le palier (index) d'un participant : le premier dont l'effectif le dépasse. */
export function palierDe(plan, numero) {
  return plan.paliers.findIndex((n) => numero < n)
}

/**
 * L'instant d'entrée d'un participant, en secondes depuis T0. Les nouveaux d'un palier sont étalés sur ses
 * ENTREE_S premières secondes (pas d'arrivée en rafale, que le serveur ne verrait pas en classe).
 */
export function entreeS(plan, numero) {
  const p = palierDe(plan, numero)
  const avant = p === 0 ? 0 : plan.paliers[p - 1]
  const nouveaux = plan.paliers[p] - avant
  return p * plan.dureePalierS + Math.floor(((numero - avant) / nouveaux) * (ENTREE_S - 10))
}

/**
 * Les participants qu'un runner fait vivre : numéros consécutifs, son rôle, son palier et son entrée.
 * @returns {{ numero: number, role: 'enseignant'|'eleve', palier: number, entreeS: number }[]}
 */
export function participantsDuRunner(plan, indexRunner) {
  const debut = indexRunner * plan.navigateursParRunner
  const fin = Math.min(debut + plan.navigateursParRunner, effectifMax(plan))
  const liste = []
  for (let numero = debut; numero < fin; numero += 1) {
    liste.push({ numero, role: numero === 0 ? 'enseignant' : 'eleve', palier: palierDe(plan, numero), entreeS: entreeS(plan, numero) })
  }
  return liste
}

/** La fenêtre MESURÉE d'un palier (après l'entrée), en secondes depuis T0 : [debut, fin). */
export function fenetreStable(plan, palier) {
  return { debut: palier * plan.dureePalierS + ENTREE_S, fin: (palier + 1) * plan.dureePalierS }
}

/**
 * L'adresse d'entrée Jitsi d'un participant. Aucun passage par le LMS : la salle est ouverte par le jeton signé
 * par l'émetteur du LMS (claims identiques), sans séance en base. Les élèves entrent caméra et micro coupés.
 */
export function adresseEntree(domaine, salle, jeton, role) {
  const coupe = role === 'eleve'
  const config = [
    'config.prejoinConfig.enabled=false',
    'config.prejoinPageEnabled=false',
    'config.disableDeepLinking=true',
    // Tout passe par le pont vidéo du serveur : c'est LUI qu'on mesure (en pair à pair, deux participants
    // s'échangeraient le média sans lui).
    'config.p2p.enabled=false',
    `config.startWithAudioMuted=${coupe}`,
    `config.startWithVideoMuted=${coupe}`,
  ].join('&')
  return `https://${domaine}/${encodeURIComponent(salle)}?jwt=${encodeURIComponent(jeton)}#${config}`
}
