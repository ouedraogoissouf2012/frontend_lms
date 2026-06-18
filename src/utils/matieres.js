/**
 * Logique métier PURE de gestion des matières (#28).
 *
 * Extraite de `views/admin/AdminMatieres.vue` (god-component) : filtrage,
 * regroupement par niveau (ex-computed de ~90 lignes), statistiques et
 * extraction des filières/niveaux uniques. Fonctions pures → testables.
 */

/**
 * Filtre les matières par recherche texte, filière et niveau.
 * @param {Array<Object>} matieres
 * @param {{ search?: string, filiere_id?: string|number, niveau_id?: string|number }} filters
 * @returns {Array<Object>}
 */
export function filterMatieres(matieres = [], filters = {}) {
  let result = matieres

  if (filters.search) {
    const search = filters.search.toLowerCase()
    result = result.filter((m) =>
      (m.nom?.toLowerCase() || '').includes(search) ||
      (m.code?.toLowerCase() || '').includes(search) ||
      (m.description?.toLowerCase() || '').includes(search)
    )
  }

  if (filters.filiere_id) {
    result = result.filter(
      (m) => m.combinaisons?.length && m.combinaisons.some((c) => c.filiere?.id == filters.filiere_id)
    )
  }

  if (filters.niveau_id) {
    result = result.filter(
      (m) => m.combinaisons?.length && m.combinaisons.some((c) => c.niveau?.id == filters.niveau_id)
    )
  }

  return result
}

/**
 * Regroupe les matières filtrées par niveau (avec totaux heures/séances).
 * Les groupes « non défini » / « sans niveau » sont placés en fin de liste.
 * @param {Array<Object>} filteredMatieres
 * @param {Array<Object>} niveaux - structure académique (fallback si aucune matière)
 * @returns {Array<{ niveau: Object, matieres: Array, totalHeures: number, totalSeances: number }>}
 */
export function groupMatieresByNiveau(filteredMatieres = [], niveaux = []) {
  // Pas de matières → grouper par niveaux disponibles
  if (filteredMatieres.length === 0 && niveaux.length > 0) {
    return niveaux.map((niveau) => ({ niveau, matieres: [], totalHeures: 0, totalSeances: 0 }))
  }

  const niveauxMap = new Map()

  filteredMatieres.forEach((matiere) => {
    if (matiere.combinaisons && matiere.combinaisons.length > 0) {
      const hasValidNiveau = matiere.combinaisons.some((c) => c.niveau?.id || c.niveau?.code)

      if (hasValidNiveau) {
        const uniqueNiveaux = new Set()
        matiere.combinaisons.forEach((combi) => {
          if (combi.niveau?.id) uniqueNiveaux.add(combi.niveau.id)
        })

        uniqueNiveaux.forEach((niveauId) => {
          if (!niveauxMap.has(niveauId)) {
            const niveau = matiere.combinaisons.find((c) => c.niveau?.id === niveauId)?.niveau
            if (niveau) niveauxMap.set(niveauId, { niveau, matieres: [] })
          }
          if (niveauxMap.has(niveauId)) {
            niveauxMap.get(niveauId).matieres.push(matiere)
          }
        })
      } else {
        // Combinaisons vides → « Niveau non défini »
        if (!niveauxMap.has('undefined')) {
          niveauxMap.set('undefined', {
            niveau: { id: 'undefined', nom: 'Niveau non défini', code: 'N/A' },
            matieres: []
          })
        }
        niveauxMap.get('undefined').matieres.push(matiere)
      }
    } else {
      // Aucune combinaison → « Sans niveau »
      if (!niveauxMap.has('none')) {
        niveauxMap.set('none', {
          niveau: { id: 'none', nom: 'Sans niveau', code: 'N/A' },
          matieres: []
        })
      }
      niveauxMap.get('none').matieres.push(matiere)
    }
  })

  const result = Array.from(niveauxMap.values()).map((group) => ({
    ...group,
    totalHeures: group.matieres.reduce((sum, m) => sum + (m.heures_total || 0), 0),
    totalSeances: group.matieres.reduce((sum, m) => sum + (m.nb_seances_programmees || 0), 0)
  }))

  // « undefined » / « none » en fin, le reste trié par code
  result.sort((a, b) => {
    const aId = a.niveau.id
    const bId = b.niveau.id
    if (aId === 'undefined' || aId === 'none') return 1
    if (bId === 'undefined' || bId === 'none') return -1
    return (a.niveau.code || '').localeCompare(b.niveau.code || '')
  })

  return result
}

/**
 * Statistiques globales des matières.
 * @param {Array<Object>} matieres
 * @returns {{ total:number, totalHeures:number, totalSeances:number }}
 */
export function computeMatieresStats(matieres = []) {
  return {
    total: matieres.length,
    totalHeures: matieres.reduce((sum, m) => sum + (m.heures_total || 0), 0),
    totalSeances: matieres.reduce((sum, m) => sum + (m.nb_seances_programmees || 0), 0)
  }
}

/**
 * Noms (ou codes) de filières uniques d'une matière.
 * @param {Object} matiere
 * @returns {Array<string>}
 */
export function getMatiereFilieres(matiere) {
  if (!matiere.combinaisons || matiere.combinaisons.length === 0) return []
  const unique = new Set()
  matiere.combinaisons.forEach((combi) => {
    if (combi.filiere?.nom) unique.add(combi.filiere.nom)
    else if (combi.filiere?.code) unique.add(combi.filiere.code)
  })
  return Array.from(unique)
}

/**
 * Noms (ou codes) de niveaux uniques d'une matière.
 * @param {Object} matiere
 * @returns {Array<string>}
 */
export function getMatiereNiveaux(matiere) {
  if (!matiere.combinaisons || matiere.combinaisons.length === 0) return []
  const unique = new Set()
  matiere.combinaisons.forEach((combi) => {
    if (combi.niveau?.nom) unique.add(combi.niveau.nom)
    else if (combi.niveau?.code) unique.add(combi.niveau.code)
  })
  return Array.from(unique)
}
