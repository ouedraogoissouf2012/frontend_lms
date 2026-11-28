/**
 * Les chemins de l'ASSIDUITÉ sous `/lms`, une part de la carte unique `endpoints.js` (#105), sortie à sa limite de
 * taille (300 lignes) pour #335. Rien ne change pour les appelants : `endpoints.lms.attendance.*`,
 * `endpoints.lms.codesEmargement.*` et `endpoints.lms.emargement` restent où ils étaient.
 *
 * Le préfixe est REÇU d'`endpoints.js`, qui reste la source unique des frontières (#26) : aucun `/lms` écrit ici.
 * Même convention : chemin statique = chaîne ; chemin paramétré = fonction pure. Extension `.js` explicite à
 * l'import : la garde de contrat charge `endpoints.js` sous Node, hors de Vite.
 *
 * @param {string} LMS le préfixe des chemins enrichis
 */
export function cheminsAssiduite(LMS) {
  return {
    attendance: {
      history: `${LMS}/attendance/history`,
      fromVideoSession: `${LMS}/attendances/from-video-session`,
    },

    // lms_backend#1680 (#335) : l'émargement par code d'une séance en ligne. Le personnel génère (POST), liste
    // (GET ?seance_id=) et révoque (DELETE) ; l'élève signe.
    codesEmargement: {
      index: `${LMS}/codes-emargement`,
      store: `${LMS}/codes-emargement`,
      destroy: (id) => `${LMS}/codes-emargement/${id}`,
    },
    emargement: `${LMS}/emargement`,

    // lms_backend#1681 (#687) : l'élève justifie ses absences ; la gestion de l'école tranche et lit la pièce.
    mesAbsences: `${LMS}/mes-absences`,
    mesJustificatifs: `${LMS}/mes-justificatifs`,
    justificatifs: {
      index: `${LMS}/justificatifs`,
      store: `${LMS}/justificatifs`,
      valider: (id) => `${LMS}/justificatifs/${id}/valider`,
      rejeter: (id) => `${LMS}/justificatifs/${id}/rejeter`,
      piece: (id) => `${LMS}/justificatifs/${id}/piece`,
    },
  }
}
