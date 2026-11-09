/**
 * Libellés des motifs d'échec d'un enregistrement visio (D107).
 *
 * Le serveur sert `recording.error_message`, filtré par son registre unique
 * `App\Enums\RecordingFailureReason` (lms #1002) : 9 clés et 2 phrases. Une valeur hors
 * registre y est déjà servie comme `processing_exception`. L'enseignant lit le libellé,
 * jamais la valeur : une valeur que ce fichier ne connaît pas donne le libellé générique.
 *
 * Libellés courts, sans jargon ni nom de système : ils valent pour une école créée depuis
 * KLASSCI comme pour une école créée depuis le LMS.
 */
const CONSIGNE = "Si le problème persiste, prévenez l'administrateur de votre établissement."

export const RECORDING_FAILURE_LABELS = Object.freeze({
  // Rattachement de la vidéo à une leçon.
  missing_klassci_matiere_id: "La séance n'est rattachée à aucune matière : la vidéo n'a pas pu être ajoutée à une leçon.",
  matiere_not_found: "La matière de la séance est introuvable : la vidéo n'a pas pu être ajoutée à une leçon.",
  lesson_not_found: "Aucune leçon de cette matière n'a été trouvée pour cette classe : la vidéo n'a pas pu y être ajoutée.",
  // Import du fichier vidéo.
  media_not_found: `Le fichier vidéo est introuvable chez le service d'enregistrement. ${CONSIGNE}`,
  media_copy_failed: `La copie du fichier vidéo a échoué. ${CONSIGNE}`,
  storage_exception: `La vidéo n'a pas pu être sauvegardée. ${CONSIGNE}`,
  // Traitement de la vidéo prête ; `processing_exception` est aussi le repli du serveur.
  seance_not_found: 'La séance de cet enregistrement est introuvable.',
  processing_exception: `Une erreur est survenue pendant le traitement de la vidéo. ${CONSIGNE}`,
  // Enregistrement resté bloqué : deux PHRASES du registre, appariées sur leur texte exact.
  "Aucun fichier reçu du fournisseur d'enregistrement dans le délai imparti.":
    "Aucune vidéo n'a été reçue dans le délai prévu.",
  'Enregistrement jamais arrêté : la visioconférence est terminée ou la durée maximale est dépassée.':
    "L'enregistrement n'a jamais été arrêté : la visioconférence s'est terminée ou la durée maximale a été dépassée.",
})

export const RECORDING_FAILURE_GENERIC = "La cause de l'échec n'est pas précisée."

/** Libellé d'un motif servi ; `null` sans motif ; jamais la valeur brute. */
export function recordingFailureLabel(reason) {
  if (reason === null) return null
  return Object.prototype.hasOwnProperty.call(RECORDING_FAILURE_LABELS, reason)
    ? RECORDING_FAILURE_LABELS[reason]
    : RECORDING_FAILURE_GENERIC
}
