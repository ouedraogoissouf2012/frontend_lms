/**
 * Motifs d'échec d'un enregistrement visio : l'enseignant lit un libellé, jamais une clé.
 *
 * Le serveur sert `recording.error_message` filtré par le registre
 * `App\Enums\RecordingFailureReason` (lms #1002) : 9 clés et 2 phrases. Les libellés
 * attendus sont écrits ici en clair : ce test EST la spécification (D107).
 */
import { describe, it, expect } from 'vitest'
import { normalizeVisioRecording } from '@/utils/visioRecording'

const CONSIGNE = "Si le problème persiste, prévenez l'administrateur de votre établissement."

// Valeur servie par le serveur → libellé affiché.
const LIBELLES = {
  missing_klassci_matiere_id: "La séance n'est rattachée à aucune matière : la vidéo n'a pas pu être ajoutée à une leçon.",
  matiere_not_found: "La matière de la séance est introuvable : la vidéo n'a pas pu être ajoutée à une leçon.",
  lesson_not_found: "Aucune leçon de cette matière n'a été trouvée pour cette classe : la vidéo n'a pas pu y être ajoutée.",
  ambiguous_lesson:
    "Plusieurs leçons correspondent à cette séance : la vidéo n'a pas été ajoutée automatiquement, pour ne pas la ranger au mauvais endroit.",
  media_not_found: `Le fichier vidéo est introuvable chez le service d'enregistrement. ${CONSIGNE}`,
  media_copy_failed: `La copie du fichier vidéo a échoué. ${CONSIGNE}`,
  storage_exception: `La vidéo n'a pas pu être sauvegardée. ${CONSIGNE}`,
  seance_not_found: 'La séance de cet enregistrement est introuvable.',
  processing_exception: `Une erreur est survenue pendant le traitement de la vidéo. ${CONSIGNE}`,
  // Les deux phrases du registre (StaleRecordingFailer), recopiées à l'identique.
  "Aucun fichier reçu du fournisseur d'enregistrement dans le délai imparti.":
    "Aucune vidéo n'a été reçue dans le délai prévu.",
  'Enregistrement jamais arrêté : la visioconférence est terminée ou la durée maximale est dépassée.':
    "L'enregistrement n'a jamais été arrêté : la visioconférence s'est terminée ou la durée maximale a été dépassée.",
}
const GENERIQUE = "La cause de l'échec n'est pas précisée."
const TECHNIQUES = ['media_not_found', 'media_copy_failed', 'storage_exception', 'processing_exception']

const echoue = (recording) => normalizeVisioRecording({ recording: { status: 'failed', ...recording } })

describe('motifs d’échec d’enregistrement — un libellé, jamais la valeur servie', () => {
  it('couvre les 11 valeurs du registre du serveur', () => {
    expect(Object.keys(LIBELLES)).toHaveLength(11)
  })

  for (const [valeur, libelle] of Object.entries(LIBELLES)) {
    it(`« ${valeur.slice(0, 40)} » donne son libellé`, () => {
      const r = echoue({ error_message: valeur })
      expect(r.errorMessage).toBe(libelle)
      expect(r.errorMessage).not.toBe(valeur)
      expect(r.failureReason).toBe(valeur)
    })
  }

  it('une valeur inconnue donne le libellé générique, jamais la valeur brute', () => {
    const r = echoue({ error_message: 'valeur-hors-registre' })
    expect(r.errorMessage).toBe(GENERIQUE)
    expect(r.failureReason).toBe('valeur-hors-registre')
  })

  it('sans motif, aucun message', () => {
    expect(echoue({}).errorMessage).toBeNull()
    expect(echoue({ error_message: '   ' }).errorMessage).toBeNull()
  })

  it('failure_reason et recording_error ne sont pas des sources : le serveur ne les sert pas', () => {
    expect(echoue({ failure_reason: 'storage_exception' }).errorMessage).toBeNull()
    expect(normalizeVisioRecording({ recording: { status: 'failed' }, recording_error: 'storage_exception' }).errorMessage).toBeNull()
  })

  it('les causes techniques disent quoi faire ; aucun libellé ne nomme un système', () => {
    for (const valeur of TECHNIQUES) expect(echoue({ error_message: valeur }).errorMessage.endsWith(CONSIGNE)).toBe(true)
    for (const libelle of [...Object.values(LIBELLES), GENERIQUE]) expect(libelle).not.toMatch(/klassci|jibri/i)
  })
})
