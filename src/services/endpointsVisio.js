/**
 * Les chemins du cycle de vie VISIO d'une séance (sous /lms/seances/{id}/*), sortis de `endpoints.js` pour
 * la garde de taille (≤300 lignes, #741). `endpoints.js` les étale à leur place : les appelants écrivent
 * toujours `endpoints.lms.visio.*`, et la garde de contrat (scripts/lint-api-contract.mjs) les lit par
 * l'import de la carte.
 *
 * Le préfixe `lms` est passé par la carte : la frontière /lms/ garde une source unique (#26).
 */
export const cheminsVisio = (lms) => ({
  visio: {
    // Consentement du porteur — reglage de COMPTE, pas de seance (#716).
    // Le backend refuse tout enregistrement tant qu'il n'a pas cette ligne.
    consent: () => `${lms}/visio/consent`,
    toggle: (id) => `${lms}/seances/${id}/toggle-visio`,
    activate: (id) => `${lms}/seances/${id}/activate-visio`,
    deactivate: (id) => `${lms}/seances/${id}/deactivate-visio`,
    start: (id) => `${lms}/seances/${id}/start-visio`,
    end: (id) => `${lms}/seances/${id}/end-visio`,
    leave: (id) => `${lms}/seances/${id}/leave`,
    heartbeat: (id) => `${lms}/seances/${id}/heartbeat`,
    participants: (id) => `${lms}/seances/${id}/visio-participants`,
    // Participation en cours de l'appelant (#673). Sans identifiant de
    // séance : le serveur la résout par l'utilisateur authentifié, et par lui
    // seul. Sert à remonter la salle embarquée après un rechargement de page.
    activeParticipation: () => `${lms}/visio/active`,
    recordingStatus: (id) => `${lms}/seances/${id}/recording`,
    recordingStart: (id) => `${lms}/seances/${id}/recording/start`,
    recordingStop: (id) => `${lms}/seances/${id}/recording/stop`,
  },
})
