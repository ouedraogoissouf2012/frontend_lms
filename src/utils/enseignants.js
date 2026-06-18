/**
 * Logique métier PURE des enseignants (#28).
 *
 * Extraite de `views/admin/AdminEnseignants.vue` (god-component) : comptage des
 * classes (avec fallback depuis les matières), classes uniques, et statistiques
 * globales. Fonctions pures → testables.
 */

/**
 * Nombre de classes d'un enseignant.
 * Priorité aux statistiques backend, sinon dérivé des classes des matières.
 * @param {Object} enseignant
 * @returns {number}
 */
export function getEnseignantClassesCount(enseignant) {
  if (enseignant.statistiques?.total_classes) {
    return enseignant.statistiques.total_classes
  }
  const classesSet = new Set()
  enseignant.matieres?.forEach((matiere) => {
    matiere.classes?.forEach((classe) => classesSet.add(classe.id))
  })
  return classesSet.size
}

/**
 * Liste des classes uniques d'un enseignant (dérivée de ses matières).
 * @param {Object} enseignant
 * @returns {Array<Object>}
 */
export function getEnseignantUniqueClasses(enseignant) {
  if (!enseignant || !enseignant.matieres) return []
  const classesMap = new Map()
  enseignant.matieres.forEach((matiere) => {
    matiere.classes?.forEach((classe) => {
      if (!classesMap.has(classe.id)) classesMap.set(classe.id, classe)
    })
  })
  return Array.from(classesMap.values())
}

/**
 * Statistiques globales d'une liste d'enseignants.
 * @param {Array<Object>} enseignants
 * @returns {{ totalMatieres:number, totalClasses:number, actifs:number }}
 */
export function computeEnseignantsStats(enseignants) {
  const list = Array.isArray(enseignants) ? enseignants : []
  return {
    totalMatieres: list.reduce((sum, ens) => sum + (ens.matieres?.length || 0), 0),
    totalClasses: list.reduce((sum, ens) => sum + getEnseignantClassesCount(ens), 0),
    actifs: list.filter((ens) => ens.matieres?.length > 0 || ens.classes?.length > 0).length
  }
}
