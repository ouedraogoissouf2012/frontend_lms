/**
 * Parcours borné en parallèle — fonction PURE (aucune dépendance, aucun effet).
 *
 * Remplace les boucles `for (const x of xs) { await f(x) }` qui sérialisent N
 * allers-retours réseau : sur un écran qui agrège une ressource par entité
 * (ex. les étudiants classe par classe), la latence devient N × RTT et l'écran
 * reste bloqué proportionnellement au nombre d'entités.
 *
 * Le plafond est VOLONTAIRE (et non un `Promise.all` non borné) : le backend est
 * un proxy vers KLASSCI soumis à un quota (en-tête `x-ratelimit-limit`), et un
 * fan-out illimité le ferait tomber en 429 sur un gros établissement.
 *
 * Sémantique de type `allSettled` : un rejet n'interrompt NI les autres éléments
 * NI la promesse globale — l'appelant décide quoi faire de chaque issue. C'est ce
 * qui permet de distinguer un échec partiel d'un échec total (sans quoi une panne
 * se présente comme une liste vide, donc comme une donnée valide).
 *
 * @template T, R
 * @param {ReadonlyArray<T>} items - Éléments à traiter.
 * @param {number} limit - Nombre maximum de tâches simultanées ; toute valeur
 *   non finie ou < 1 est ramenée à 1 (jamais de concurrence infinie par accident).
 * @param {(item: T, index: number) => Promise<R>} fn - Traitement d'un élément.
 * @returns {Promise<Array<{status:'fulfilled',value:R}|{status:'rejected',reason:unknown}>>}
 *   Résultats DANS L'ORDRE des `items` (et non dans l'ordre d'achèvement).
 */
export async function mapWithConcurrency(items, limit, fn) {
  const list = Array.isArray(items) ? items : []
  if (list.length === 0) return []

  // Plafond effectif : au moins 1, jamais plus que le nombre d'éléments (inutile
  // d'ouvrir 10 créneaux pour 2 éléments).
  const ceiling = Number.isFinite(limit) ? Math.floor(limit) : 1
  const workers = Math.min(list.length, Math.max(1, ceiling))

  const results = new Array(list.length)

  // Curseur partagé : chaque worker prend l'index suivant dès qu'il se libère.
  // L'incrément est atomique ici car JavaScript est mono-thread — aucun `await`
  // ne sépare la lecture de l'écriture, donc pas de TOCTOU sur `cursor`.
  let cursor = 0

  async function worker() {
    while (cursor < list.length) {
      const index = cursor++
      try {
        results[index] = { status: 'fulfilled', value: await fn(list[index], index) }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, worker))
  return results
}

export default mapWithConcurrency
