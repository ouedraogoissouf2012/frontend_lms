/**
 * Hook de résolution ESM pour le runner natif des tests de contrat.
 *
 * Le code source frontend est écrit pour Vite, qui résout les imports relatifs
 * SANS extension (`import './cache'`). Node en ESM strict exige l'extension.
 * Ce hook complète l'extension `.js` quand un import relatif sans extension
 * échoue, reproduisant le comportement de résolution de Vite/Vitest pour le
 * seul périmètre du runner natif (aucune dépendance tierce).
 */
import path from 'node:path'

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (err) {
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../')
    if (isRelative && !path.extname(specifier)) {
      return await nextResolve(`${specifier}.js`, context)
    }
    throw err
  }
}
