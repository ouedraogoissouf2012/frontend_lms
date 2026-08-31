/**
 * Logique métier PURE des enseignants (#28).
 *
 * Extraite de `views/admin/AdminEnseignants.vue` (god-component) : comptage des
 * classes (avec fallback depuis les matières), classes uniques, et statistiques
 * globales. Fonctions pures → testables.
 */

const asArray = (value) => Array.isArray(value) ? value : []
const asObjectArray = (value) => asArray(value).filter(item => item && typeof item === 'object')

/**
 * Nombre de classes d'un enseignant.
 * Priorité aux statistiques backend, sinon dérivé des classes des matières.
 * @param {Object} enseignant
 * @returns {number}
 */
export function getEnseignantClassesCount(enseignant) {
  const totalClasses = Number(enseignant?.statistiques?.total_classes)
  if (Number.isFinite(totalClasses)) {
    return totalClasses
  }
  const classesSet = new Set()
  asObjectArray(enseignant?.matieres).forEach((matiere) => {
    asObjectArray(matiere?.classes).forEach((classe) => {
      if (classe.id != null) classesSet.add(classe.id)
    })
  })
  return classesSet.size
}

/**
 * Liste des classes uniques d'un enseignant (dérivée de ses matières).
 * @param {Object} enseignant
 * @returns {Array<Object>}
 */
export function getEnseignantUniqueClasses(enseignant) {
  const classesMap = new Map()
  asObjectArray(enseignant?.matieres).forEach((matiere) => {
    asObjectArray(matiere?.classes).forEach((classe) => {
      if (classe.id != null && !classesMap.has(classe.id)) {
        classesMap.set(classe.id, classe)
      }
    })
  })
  return Array.from(classesMap.values())
}

/**
 * Libellé des classes d'un enseignant, prêt à afficher — `null` si aucune n'est
 * connue. `null` signifie « non renseigné », jamais « aucune classe » : l'appelant
 * doit le rendre « — » plutôt qu'une cellule vide.
 * @param {Object} enseignant
 * @returns {string|null}
 */
export function getEnseignantClassesLabel(enseignant) {
  const noms = getEnseignantUniqueClasses(enseignant)
    .map((classe) => classe?.nom)
    .filter(Boolean)
  return noms.length ? noms.join(', ') : null
}

/**
 * Statistiques globales d'une liste d'enseignants.
 * @param {Array<Object>} enseignants
 * @returns {{ totalMatieres:number, totalClasses:number, actifs:number }}
 */
export function computeEnseignantsStats(enseignants) {
  const list = asObjectArray(enseignants)
  return {
    totalMatieres: list.reduce((sum, ens) => sum + asObjectArray(ens?.matieres).length, 0),
    totalClasses: list.reduce((sum, ens) => sum + getEnseignantClassesCount(ens), 0),
    actifs: list.filter((ens) =>
      asObjectArray(ens?.matieres).length > 0 || asObjectArray(ens?.classes).length > 0
    ).length
  }
}
