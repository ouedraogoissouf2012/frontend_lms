/**
 * Comptages MESURÉS du tableau de bord enseignant (extraits de teacherDashboard.js, 300 lignes).
 *
 * Chacun rend un nombre seulement quand sa source l'a donné, sinon `null`, rendu « — ».
 * L'ancien comptage rendait 0 pour « rien de mesuré » : dans une école créée depuis le LMS,
 * le tableau de bord affichait 0 leçon et 0 étudiant à un enseignant qui en avait 3 et 6.
 */
import { measureClassStudentCount } from './classStats'
import { coalesceNumber } from './coalesceNumber'
import { measuredSum } from './measuredSum'

/** Leçons portées par chaque matière, ou `null` si une matière ne les porte pas. */
export function countLessons(matieres = []) {
  return measuredSum(matieres.map((matiere) => {
    if (Array.isArray(matiere?.lessons)) return matiere.lessons.length
    if (Array.isArray(matiere?.lecons)) return matiere.lecons.length
    return coalesceNumber([matiere?.lessons_count, matiere?.lecons_count, matiere?.nb_lecons])
  }))
}

/** Effectif total des classes, ou `null` si une classe n'a pas d'effectif mesuré. */
export function countStudents(classes = []) {
  return measuredSum(classes.map((classe) => measureClassStudentCount(classe)))
}

/** Une liste de la fiche, ou `null` si le champ est absent (non mesuré, pas « vide »). */
export function listeMesuree(source, champ) {
  return Array.isArray(source?.[champ]) ? source[champ] : null
}

/**
 * Les séances à venir MESURÉES, ou `null` (« — »). Une seule règle, partagée par la carte « Séances à
 * venir » et par `deriveTeacherCounters` : le serveur dit d'où vient la liste (règle d'origine, D172).
 * - Source locale (`source: 'lms_local'`, R4) : une liste reçue est une mesure, vide = 0.
 * - Sans cette marque (école KLASSCI) : une liste VIDE n'est pas tenue pour une mesure, tant que la
 *   question « KLASSCI remplit-il `prochaines_seances` aujourd'hui ? » (#739) n'est pas tranchée.
 * @param {object|null} charge le tableau de bord enseignant (`prochaines_seances`, `source`)
 * @returns {Array|null}
 */
export function prochainesSeancesMesurees(charge) {
  const liste = charge?.prochaines_seances
  if (!Array.isArray(liste)) return null
  return liste.length > 0 || charge?.source === 'lms_local' ? liste : null
}
