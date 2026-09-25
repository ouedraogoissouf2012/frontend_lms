/**
 * Extraction des appels HTTP du front, par analyse syntaxique (#876).
 *
 * Rend, pour un fichier source, chaque couple (méthode, chemin) qu'il émet. Un
 * paramètre dynamique devient `{}` : `/notifications/{}`.
 *
 * ## Pourquoi un analyseur et pas une expression régulière
 *
 * Les chemins vivent dans `src/services/endpoints.js` et sont atteints par des
 * détours : une variable locale, un ternaire, une chaîne de requête collée, un
 * relais comme `getWithOptionalConfig(url)`. Une expression régulière rate ces
 * détours sans le dire. L'analyseur les suit, et ce qu'il ne sait pas suivre
 * est RENDU comme irrésolu : la garde en fait une violation, jamais un silence.
 *
 * `vue/compiler-sfc` fournit à la fois le découpage des composants et
 * l'analyseur Babel : aucune dépendance de plus que `vue`, déjà installé.
 *
 * ## Ce qui compte comme client HTTP
 *
 * L'import par défaut du module `api`, toute instance `axios.create(...)`, et
 * `fetch`. `Map.get` ou `params.delete` ne sont donc jamais pris pour un appel.
 *
 * ## Limites connues
 *
 * - Les constantes sont suivies par NOM, à l'échelle du fichier. Un nom déclaré
 *   deux fois devient illisible, ce qui est sûr ; un paramètre de fonction qui
 *   masquerait une constante du même nom serait mal suivi.
 * - Seul `src/` est lu. Un appel construit hors de `src/` échappe à la garde.
 */
import { babelParse, parse as parseSfc } from 'vue/compiler-sfc'

const VERBES = new Set(['get', 'post', 'put', 'patch', 'delete'])
const PARAM = '\u0000'
const MODULE_API = /(^|\/)api(\.js)?$/
const MODULE_ENDPOINTS = /(^|\/)endpoints(\.js)?$/

/** Blocs de script d'un fichier, avec le décalage de ligne de chacun. */
function blocs(fichier, source) {
  if (!fichier.endsWith('.vue')) return [{ code: source, decalage: 0 }]
  const { descriptor } = parseSfc(source)
  return [descriptor.script, descriptor.scriptSetup]
    .filter(Boolean)
    .map((s) => ({ code: s.content, decalage: s.loc.start.line - 1 }))
}

function parcourir(noeud, visite) {
  if (!noeud || typeof noeud.type !== 'string') return
  visite(noeud)
  for (const [k, v] of Object.entries(noeud)) {
    if (k === 'loc' || k === 'extra') continue
    if (Array.isArray(v)) v.forEach((n) => parcourir(n, visite))
    else if (v && typeof v === 'object') parcourir(v, visite)
  }
}

/** Liaisons du fichier : clients HTTP, carte d'endpoints, constantes, relais. */
function lier(programme) {
  const clients = new Set()
  const cartes = new Set()
  const constantes = new Map()
  parcourir(programme, (n) => {
    if (n.type === 'ImportDeclaration') {
      for (const s of n.specifiers) {
        if (MODULE_API.test(n.source.value) && s.type === 'ImportDefaultSpecifier') clients.add(s.local.name)
        if (MODULE_ENDPOINTS.test(n.source.value)) cartes.add(s.local.name)
      }
    }
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) {
      const i = n.init
      if (i.type === 'CallExpression' && i.callee.type === 'MemberExpression' && i.callee.property.name === 'create' && i.callee.object.name === 'axios') {
        clients.add(n.id.name)
      }
      constantes.set(n.id.name, constantes.has(n.id.name) ? null : i)
    }
  })
  return { clients, cartes, constantes, relais: new Map() }
}

/**
 * Méthode HTTP d'un appel au client : `{ methode }`, `{ erreur }` quand c'est
 * bien un appel HTTP mais que sa méthode ne se lit pas, ou `null` quand ce
 * n'est pas un appel HTTP. Une méthode devinée serait un silence.
 */
function methodeDirecte(appel, liens) {
  const c = appel.callee
  if (c.type === 'Identifier' && c.name === 'fetch') {
    const options = appel.arguments[1]
    if (!options) return { methode: 'GET' }
    const m = options.type === 'ObjectExpression' && options.properties.find((p) => p.key?.name === 'method')
    if (options.type === 'ObjectExpression' && !m) return { methode: 'GET' }
    return m && m.value.type === 'StringLiteral' ? { methode: m.value.value.toUpperCase() } : { erreur: 'fetch dont la méthode ne se lit pas' }
  }
  if (c.type === 'Identifier' && liens.clients.has(c.name)) return { erreur: `appel direct de « ${c.name}(…) » : passer par ses verbes` }
  if (c.type !== 'MemberExpression' || c.computed || c.object.type !== 'Identifier' || !liens.clients.has(c.object.name)) return null
  if (VERBES.has(c.property.name)) return { methode: c.property.name.toUpperCase() }
  return { erreur: `« ${c.object.name}.${c.property.name}(…) » : passer par get, post, put, patch ou delete` }
}

/** Un relais est une fonction qui transmet l'un de ses paramètres au client. */
function repererRelais(programme, liens) {
  parcourir(programme, (n) => {
    if (n.type !== 'VariableDeclarator' || n.id.type !== 'Identifier') return
    const f = n.init
    if (!f || !['ArrowFunctionExpression', 'FunctionExpression'].includes(f.type)) return
    const params = f.params.map((p) => (p.type === 'AssignmentPattern' ? p.left.name : p.name))
    parcourir(f.body, (a) => {
      if (a.type !== 'CallExpression') return
      const methode = methodeDirecte(a, liens)?.methode
      const index = params.indexOf(a.arguments[0]?.name)
      if (!methode || index < 0) return
      const connu = liens.relais.get(n.id.name) ?? { methode, index, noeuds: [] }
      // Deux verbes derrière un même relais : la méthode dépend de l'exécution.
      if (connu.methode !== methode || connu.index !== index) connu.conflit = true
      connu.noeuds.push(a)
      liens.relais.set(n.id.name, connu)
    })
  })
}

/**
 * Valeur désignée dans la carte par `endpoints.a.b`, ou `undefined` si
 * l'expression ne part pas de la carte importée.
 */
function valeurDansLaCarte(noeud, liens, endpoints) {
  const chaine = []
  while (noeud.type === 'MemberExpression' && !noeud.computed) {
    chaine.unshift(noeud.property.name)
    noeud = noeud.object
  }
  if (noeud.type !== 'Identifier' || !liens.cartes.has(noeud.name)) return undefined
  return { nom: `endpoints.${chaine.join('.')}`, v: chaine.reduce((o, k) => (o == null ? undefined : o[k]), endpoints) }
}

function carte(noeud, liens, endpoints) {
  let args = null
  if (noeud.type === 'CallExpression') {
    args = noeud.arguments.map((a) => (a.type === 'StringLiteral' ? a.value : PARAM))
    noeud = noeud.callee
  }
  // `endpoints.admin.reports[type]` : la clé n'est connue qu'à l'exécution, mais
  // elle ne peut désigner qu'une clé de l'objet. Toutes sont donc vérifiées.
  if (args === null && noeud.type === 'MemberExpression' && noeud.computed && noeud.property.type !== 'StringLiteral') {
    const objet = valeurDansLaCarte(noeud.object, liens, endpoints)
    if (!objet) return null
    const valeurs = Object.values(objet.v && typeof objet.v === 'object' ? objet.v : {})
    if (valeurs.length === 0 || !valeurs.every((v) => typeof v === 'string')) {
      return { erreur: `accès calculé sur ${objet.nom}, qui ne contient pas que des chemins fixes` }
    }
    return { chemins: valeurs }
  }
  const trouve = valeurDansLaCarte(noeud, liens, endpoints)
  if (!trouve) return null
  if (typeof trouve.v === 'string') return { chemin: trouve.v }
  if (typeof trouve.v === 'function') {
    const a = [...(args ?? [])]
    while (a.length < trouve.v.length) a.push(PARAM)
    return { chemin: trouve.v(...a) }
  }
  return { erreur: `${trouve.nom} n'existe pas dans endpoints.js` }
}

/** Chemin porté par une expression : `{ chemin }`, `{ chemins }` ou `{ erreur }`. */
function chemin(n, liens, endpoints, profondeur = 0) {
  if (!n) return { erreur: 'appel sans URL' }
  if (profondeur > 4) return { erreur: 'indirection trop profonde' }
  const suivre = (x) => chemin(x, liens, endpoints, profondeur + 1)
  switch (n.type) {
    case 'StringLiteral':
      return { chemin: n.value }
    case 'Identifier': {
      const init = liens.constantes.get(n.name)
      return init ? suivre(init) : { erreur: `« ${n.name} » ne se résout pas statiquement` }
    }
    case 'ConditionalExpression': {
      const a = suivre(n.consequent)
      const b = suivre(n.alternate)
      if (a.chemin !== undefined && sansRequete(a.chemin) === sansRequete(b.chemin)) return a
      return { erreur: 'ternaire qui mène à deux chemins différents' }
    }
    case 'TemplateLiteral': {
      // Une expression étrangère à la carte (un id) devient un paramètre. Une
      // référence à la carte qui ne se résout pas en UN chemin est une erreur :
      // la changer en paramètre la ferait passer pour un id.
      let s = ''
      for (const [i, q] of n.quasis.entries()) {
        s += q.value.cooked
        const e = n.expressions[i]
        if (!e || (e.type === 'CallExpression' && e.callee.name === 'apiBaseUrl')) continue
        const init = e.type === 'Identifier' ? liens.constantes.get(e.name) : null
        const r = carte(e, liens, endpoints) ?? (init ? carte(init, liens, endpoints) : null)
        if (r && r.chemin === undefined) return { erreur: r.erreur ?? 'plusieurs chemins possibles dans un gabarit' }
        s += r?.chemin ?? PARAM
      }
      return { chemin: s }
    }
    default: {
      const r = carte(n, liens, endpoints)
      return r ?? { erreur: `expression ${n.type} que la garde ne sait pas lire` }
    }
  }
}

function sansRequete(c) {
  return c === undefined ? undefined : c.split('?')[0]
}

/**
 * @returns {{ appels: Array<{method: string, path: string, fichier: string, ligne: number}>,
 *             irresolus: Array<{fichier: string, ligne: number, raison: string, extrait: string}> }}
 */
export function extraireAppels(fichier, source, endpoints) {
  const appels = []
  const irresolus = []
  for (const { code, decalage } of blocs(fichier, source)) {
    const programme = babelParse(code, { sourceType: 'module', plugins: ['jsx'] }).program
    const liens = lier(programme)
    repererRelais(programme, liens)
    const internes = new Set([...liens.relais.values()].flatMap((r) => r.noeuds))
    const lignes = code.split('\n')
    parcourir(programme, (n) => {
      if (n.type !== 'CallExpression' || internes.has(n)) return
      const relais = n.callee.type === 'Identifier' ? liens.relais.get(n.callee.name) : null
      const direct = relais ? null : methodeDirecte(n, liens)
      if (!relais && !direct) return
      const ligne = decalage + n.loc.start.line
      const extrait = lignes[n.loc.start.line - 1].trim().slice(0, 120)
      const refus = relais?.conflit ? `le relais « ${n.callee.name} » appelle plusieurs méthodes` : direct?.erreur
      if (refus) {
        irresolus.push({ fichier, ligne, raison: refus, extrait })
        return
      }
      const method = relais?.methode ?? direct.methode
      const r = chemin(n.arguments[relais ? relais.index : 0], liens, endpoints)
      for (const c of r.chemins ?? [r.chemin]) {
        const brut = sansRequete(c)
        if (brut !== undefined && brut.startsWith('/')) {
          appels.push({ method, path: normaliser(brut.replaceAll(PARAM, '{}')), fichier, ligne })
        } else {
          const raison = r.erreur ?? `le chemin ne commence pas par « / » : ${String(brut).replaceAll(PARAM, '{}')}`
          irresolus.push({ fichier, ligne, raison, extrait })
        }
      }
    })
  }
  return { appels, irresolus }
}

/** `/a/b/` → `/a/b` ; `{x}` → `{}`. Forme commune aux trois sources. */
export function normaliser(c) {
  const p = c.replace(/\{[^}]*\}/g, '{}').replace(/\/+$/, '')
  return p === '' ? '/' : p
}
