/**
 * Contrat d'API front ↔ backend : catalogues et comparaison (#876).
 *
 * Trois ensembles se font face :
 *
 *   - les APPELS du front, extraits du code (`apiContractExtraction.mjs`) ;
 *   - la SPEC du backend, `docs/openapi.yaml`, seule source partagée entre les
 *     deux dépôts, et gardée côté backend dans les deux sens (#809, #876) ;
 *   - les ROUTES que le serveur sert réellement (`php artisan route:list --json`),
 *     fournies seulement quand la garde tourne dans la CI du backend.
 *
 * Deux règles, de force différente :
 *
 *   1. Tout appel figure dans la spec, ou dans la dette nommée
 *      `.api-contract-baseline.json`. La dette ne peut que baisser.
 *   2. Face aux routes réelles, tout appel EXISTE. Aucune baseline : appeler une
 *      route que le serveur ne sert pas est un défaut, jamais une dette.
 *
 * La seconde est celle qui arrête une PR backend supprimant une route que le
 * front appelle encore : c'est le cas de #821 et de #337.
 */
import { normaliser } from './apiContractExtraction.mjs'

export { extraireAppels, normaliser } from './apiContractExtraction.mjs'

const VERBES_OPENAPI = ['get', 'put', 'post', 'delete', 'options', 'patch']

/** Clé stable d'un appel ou d'une opération : `GET /notifications/{}`. */
export function cle(x) {
  return `${x.method} ${x.path}`
}

function dedoublonner(operations) {
  const vues = new Map(operations.map((o) => [cle(o), o]))
  return [...vues.values()].sort((a, b) => cle(a).localeCompare(cle(b)))
}

/** Opérations d'un document OpenAPI 3 déjà chargé. */
export function catalogueDepuisSpec(spec) {
  const operations = []
  for (const [path, item] of Object.entries(spec?.paths ?? {})) {
    for (const verbe of Object.keys(item ?? {})) {
      if (VERBES_OPENAPI.includes(verbe)) operations.push({ method: verbe.toUpperCase(), path: normaliser(path) })
    }
  }
  return dedoublonner(operations)
}

/**
 * Opérations de `php artisan route:list --json`, telles que le front les atteint.
 *
 * Seules les routes `api/` non versionnées comptent : le front appelle
 * `VITE_API_URL`, qui vaut `https://apilms.klassci.com/api` sur le bundle
 * déployé. Le miroir `api/v1/` n'est pas une garantie pour lui : une PR qui
 * retirerait `api/x` en gardant `api/v1/x` le casserait. `HEAD` est écarté,
 * Laravel l'ajoute à tout `GET`.
 */
export function catalogueDepuisRoutes(routes) {
  const operations = []
  for (const r of routes ?? []) {
    if (!r.uri.startsWith('api/') || /^api\/v\d+\//.test(r.uri)) continue
    const path = normaliser(r.uri.replace(/^api\//, '/'))
    for (const method of r.method.split('|')) {
      if (method !== 'HEAD') operations.push({ method, path })
    }
  }
  return dedoublonner(operations)
}

/**
 * Un appel correspond à une opération si la méthode est la même et que chaque
 * segment concorde. Un paramètre du front (`{}`) ne concorde qu'avec un
 * paramètre : `/reports/{}` face à `/reports/attendance` dépend d'une valeur que
 * la garde ne voit pas.
 *
 * `fixeRemplitParametre` dit si un segment FIXE du front peut remplir un
 * paramètre. Vrai face aux routes : c'est ce que fait le routeur de Laravel.
 * Faux face à la spec : `GET /evaluations/student` est une route à part, non
 * documentée, et `GET /evaluations/{id}` ne la décrit pas.
 */
export function correspond(appel, operation, { fixeRemplitParametre }) {
  if (appel.method !== operation.method) return false
  const a = appel.path.split('/')
  const o = operation.path.split('/')
  return a.length === o.length && a.every((s, i) => s === o[i] || (fixeRemplitParametre && o[i] === '{}'))
}

const present = (appel, catalogue, souple) => catalogue.some((o) => correspond(appel, o, { fixeRemplitParametre: souple }))

/**
 * Nouvelle dette : l'ancienne, privée de ce qui est désormais documenté.
 *
 * Elle ne GRANDIT jamais. Un appel neuf vers une route non documentée se
 * documente d'abord dans la spec du backend : c'est toute la chaîne que #876
 * remet en place. Sinon, un appel vers une route inexistante entrerait en
 * dette, la CI du front resterait verte, et seule la CI du backend le verrait.
 * `actuelle === null` initialise la dette, une seule fois.
 */
export function resserrerBaseline(actuelle, nonDocumentes) {
  const restantes = actuelle === null ? nonDocumentes : actuelle.filter((c) => nonDocumentes.includes(c))
  return [...new Set(restantes)].sort()
}

/**
 * @param {Array} appels  appels extraits (plusieurs sites peuvent partager une clé)
 * @param {{ spec: Array, routes?: Array|null, baseline: string[] }} contexte
 * @returns {{ horsSpec: Array, inexistants: Array, obsoletes: string[], cles: string[], nonDocumentes: string[] }}
 */
export function comparer(appels, { spec, routes = null, baseline }) {
  const dette = new Set(baseline)
  const cles = [...new Set(appels.map(cle))].sort()
  const nonDocumentes = new Set(appels.filter((a) => !present(a, spec, false)).map(cle))
  return {
    horsSpec: appels.filter((a) => nonDocumentes.has(cle(a)) && !dette.has(cle(a))),
    inexistants: routes ? appels.filter((a) => !present(a, routes, true)) : [],
    obsoletes: [...dette].filter((c) => !nonDocumentes.has(c)).sort(),
    cles,
    nonDocumentes: [...nonDocumentes].sort(),
  }
}
