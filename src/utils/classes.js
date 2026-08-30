/**
 * Helpers de présentation des classes KLASSCI — fonctions PURES.
 *
 * `/proxy/classes` renvoie `{id, name:'B2 COM', libelle:null, …}` : le libellé
 * vit dans `name`, et le champ `nom` N'EXISTE PAS (vérifié contre l'API réelle).
 * D'autres sources internes exposent pourtant `libelle` ou `nom` — d'où un repli
 * en cascade qui était recopié dans cinq gabarits, dont un qui lisait `nom` seul
 * et rendait donc des options de filtre vides.
 */

/** Première chaîne non vide de la liste, sinon `null`. */
function firstText(values) {
  for (const value of values) {
    if (typeof value !== 'string') continue
    const text = value.trim()
    if (text) return text
  }
  return null
}

/**
 * Libellé affichable d'une classe.
 *
 * Distinct de `displayName` (utils/evaluationDisplay.js) à dessein : celui-ci
 * compose `nom + prenom` en priorité — sémantique de PERSONNE — et n'a pas de
 * repli identifiant. Une classe sans libellé doit rester sélectionnable, d'où
 * `Classe {id}` plutôt qu'une ligne vide.
 *
 * @param {{id?: number|string, name?: string, libelle?: string, nom?: string}|null|undefined} classe
 * @returns {string} Libellé, `Classe {id}` à défaut, `'—'` si rien n'est exploitable.
 */
export function classeLabel(classe) {
  if (!classe || typeof classe !== 'object') return '—'

  const label = firstText([classe.name, classe.libelle, classe.nom])
  if (label) return label

  return classe.id === null || classe.id === undefined ? '—' : `Classe ${classe.id}`
}
