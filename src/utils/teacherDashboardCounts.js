/**
 * Comptages MESURÉS du tableau de bord enseignant (extraits de teacherDashboard.js, 300 lignes).
 *
 * Chacun rend un nombre seulement quand sa source l'a donné, sinon `null`, rendu « — ».
 * L'ancien comptage rendait 0 pour « rien de mesuré » : dans une école créée depuis le LMS,
 * le tableau de bord affichait 0 leçon et 0 étudiant à un enseignant qui en avait 3 et 6.
 */
import { measureClassStudentCount } from './classStats'
import { coalesceNumber } from './coalesceNumber'

/**
 * Somme de mesures, ou `null` si UNE seule manque : un total partiel passerait pour le total,
 * et « rien de mesuré » ne vaut jamais 0. Une liste vide (réellement obtenue) vaut 0.
 */
function sommeMesuree(valeurs) {
  return valeurs.every((v) => v !== null) ? valeurs.reduce((s, v) => s + v, 0) : null
}

/** Leçons portées par chaque matière, ou `null` si une matière ne les porte pas. */
export function countLessons(matieres = []) {
  return sommeMesuree(matieres.map((matiere) => {
    if (Array.isArray(matiere?.lessons)) return matiere.lessons.length
    if (Array.isArray(matiere?.lecons)) return matiere.lecons.length
    return coalesceNumber([matiere?.lessons_count, matiere?.lecons_count, matiere?.nb_lecons])
  }))
}

/** Effectif total des classes, ou `null` si une classe n'a pas d'effectif mesuré. */
export function countStudents(classes = []) {
  return sommeMesuree(classes.map((classe) => measureClassStudentCount(classe)))
}

/** Une liste de la fiche, ou `null` si le champ est absent (non mesuré, pas « vide »). */
export function listeMesuree(source, champ) {
  return Array.isArray(source?.[champ]) ? source[champ] : null
}
