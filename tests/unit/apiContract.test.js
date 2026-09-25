/**
 * La garde « contrat d'API » doit ROUGIR : c'est ce que ce fichier prouve (#876).
 *
 * Elle confronte chaque appel HTTP du front à la spec du backend, et, quand on
 * lui donne la table des routes, à ce que le serveur sert réellement. On écrit
 * d'abord les cas qui prouvent qu'elle attrape, puis ceux qui prouvent qu'elle
 * se tait là où elle le doit : une garde bruyante est désactivée dans la semaine.
 */
import { describe, it, expect } from 'vitest'
import {
  catalogueDepuisRoutes,
  catalogueDepuisSpec,
  cle,
  comparer,
  extraireAppels,
  resserrerBaseline,
} from '../../scripts/lib/apiContract.mjs'

/** Carte d'endpoints réduite, de même forme que `src/services/endpoints.js`. */
const ENDPOINTS = {
  notifications: {
    recent: '/notifications/recent',
    delete: (id) => `/notifications/${id}`,
  },
  forum: { post: (id) => `/forum/posts/${id}` },
  admin: { reports: (type) => `/admin/reports/${type}` },
  lessons: { myCourses: '/lessons/my-courses' },
}

const ENTETE = "import api from './api'\nimport { endpoints } from './endpoints'\n"

const extraire = (source, fichier = 'src/services/x.js') => extraireAppels(fichier, source, ENDPOINTS)

const SPEC = catalogueDepuisSpec({
  paths: {
    '/notifications/recent': { get: {} },
    '/notifications/{id}': { delete: {}, parameters: [] },
    '/forum/posts/{post}': { put: {} },
  },
})

describe('extraction : chaque appel HTTP est vu, avec sa méthode', () => {
  it('résout une clé d’endpoints.js et sa méthode', () => {
    const { appels, irresolus } = extraire(`${ENTETE}api.get(endpoints.notifications.recent)`)

    expect(irresolus).toEqual([])
    expect(appels.map(cle)).toEqual(['GET /notifications/recent'])
    expect(appels[0].ligne).toBe(3)
  })

  it('remplace un argument dynamique par un paramètre', () => {
    const { appels } = extraire(`${ENTETE}const f = (id) => api.delete(endpoints.notifications.delete(id))`)

    expect(appels.map(cle)).toEqual(['DELETE /notifications/{}'])
  })

  it('garde la valeur d’un argument littéral', () => {
    const { appels } = extraire(`${ENTETE}api.post(endpoints.admin.reports('attendance'))`)

    expect(appels.map(cle)).toEqual(['POST /admin/reports/attendance'])
  })

  it('développe un accès calculé en TOUTES les clés qu’il peut atteindre', () => {
    const cartes = { admin: { reports: { attendance: '/admin/reports/attendance', grades: '/admin/reports/grades' } } }
    const src = `${ENTETE}api.post(endpoints.admin.reports[form.value.type])`

    const { appels, irresolus } = extraireAppels('src/services/x.js', src, cartes)

    expect(irresolus).toEqual([])
    expect(appels.map(cle)).toEqual(['POST /admin/reports/attendance', 'POST /admin/reports/grades'])
  })

  it('suit une variable locale, et retire la chaîne de requête', () => {
    const src = `${ENTETE}const url = \`\${endpoints.lessons.myCourses}?page=2\`\napi.get(url)`

    expect(extraire(src).appels.map(cle)).toEqual(['GET /lessons/my-courses'])
  })

  it('suit un ternaire dont les deux branches visent le même chemin', () => {
    // `q` est une CONSTANTE calculée du fichier, comme dans api.js et
    // klassciCourses.js : c'est une donnée, pas une référence à la carte.
    const src =
      `${ENTETE}const q = new URLSearchParams(f).toString()\n` +
      `const url = q ? \`\${endpoints.lessons.myCourses}?\${q}\` : endpoints.lessons.myCourses\napi.get(url)`

    expect(extraire(src).appels.map(cle)).toEqual(['GET /lessons/my-courses'])
  })

  it('suit un relais qui transmet son argument au client HTTP', () => {
    const src =
      `${ENTETE}const relais = (url, config = {}) => (config.x ? api.get(url, config) : api.get(url))\n` +
      'relais(endpoints.notifications.recent, {})'

    const { appels, irresolus } = extraire(src)

    expect(irresolus).toEqual([])
    expect(appels.map(cle)).toEqual(['GET /notifications/recent'])
  })

  it('lit fetch, sa méthode, et retire la base de l’API', () => {
    const src =
      "import { apiBaseUrl } from '../constants/http'\n" +
      "fetch(`${apiBaseUrl()}/lms/seances/${id}/leave`, { method: 'POST', keepalive: true })\n" +
      'fetch(`${apiBaseUrl()}/ping`)'

    expect(extraire(src).appels.map(cle)).toEqual(['POST /lms/seances/{}/leave', 'GET /ping'])
  })

  it('lit le script d’un composant Vue, avec le bon numéro de ligne', () => {
    const src = `<template><p/></template>\n<script setup>\n${ENTETE}api.get(endpoints.notifications.recent)\n</script>\n`

    const { appels } = extraire(src, 'src/components/X.vue')

    expect(appels.map(cle)).toEqual(['GET /notifications/recent'])
    expect(appels[0].ligne).toBe(5)
  })

  it('reconnaît une instance créée par axios.create', () => {
    const src = "import axios from 'axios'\nconst client = axios.create({})\nclient.post('/auth/logout')"

    expect(extraire(src).appels.map(cle)).toEqual(['POST /auth/logout'])
  })
})

describe('extraction : un appel illisible est une violation, jamais un silence', () => {
  it('signale une URL que la garde ne sait pas résoudre', () => {
    const { appels, irresolus } = extraire(`${ENTETE}export function f(u) { return api.get(u.chemin) }`)

    expect(appels).toEqual([])
    expect(irresolus).toHaveLength(1)
    expect(irresolus[0].ligne).toBe(3)
  })

  it('signale un fetch dont la méthode n’est pas écrite en toutes lettres', () => {
    const { appels, irresolus } = extraire("const m = choix()\nfetch('/ping', { method: m })")

    expect(appels).toEqual([])
    expect(irresolus).toHaveLength(1)
  })

  it('signale un relais qui appelle deux méthodes différentes', () => {
    const src = `${ENTETE}const relais = (url, ecrire) => (ecrire ? api.post(url) : api.get(url))\nrelais(endpoints.notifications.recent, true)`

    const { appels, irresolus } = extraire(src)

    expect(appels).toEqual([])
    expect(irresolus).toHaveLength(1)
  })

  it('signale un appel du client par une autre porte que ses verbes', () => {
    const src = `${ENTETE}api.request({ url: '/ping', method: 'get' })\napi({ url: '/ping' })`

    expect(extraire(src).irresolus).toHaveLength(2)
  })

  it('signale une clé inexistante même au milieu d’un gabarit', () => {
    const { appels, irresolus } = extraire(`${ENTETE}api.get(\`/x\${endpoints.notifications.absente}/y\`)`)

    expect(appels).toEqual([])
    expect(irresolus[0].raison).toContain('endpoints.notifications.absente')
  })

  it('signale une clé d’endpoints.js qui n’existe pas', () => {
    const { irresolus } = extraire(`${ENTETE}api.get(endpoints.notifications.recentes)`)

    expect(irresolus).toHaveLength(1)
    expect(irresolus[0].raison).toContain('endpoints.notifications.recentes')
  })
})

describe('extraction : elle se tait là où elle le doit', () => {
  it('ignore Map.get et les autres méthodes homonymes', () => {
    const src = `${ENTETE}const m = new Map()\nm.get(cle)\nparams.delete('x')`

    expect(extraire(src)).toEqual({ appels: [], irresolus: [] })
  })

  it('ne prend pas une clé d’endpoints nommée post ou delete pour un appel', () => {
    const src = `${ENTETE}api.put(endpoints.forum.post(id), {})`

    expect(extraire(src).appels.map(cle)).toEqual(['PUT /forum/posts/{}'])
  })
})

describe('comparaison : elle rougit', () => {
  const appel = (method, path) => ({ method, path, fichier: 'src/x.js', ligne: 1 })

  it('rougit sur un chemin absent de la spec', () => {
    const r = comparer([appel('GET', '/notifications/recentes')], { spec: SPEC, baseline: [] })

    expect(r.horsSpec.map(cle)).toEqual(['GET /notifications/recentes'])
  })

  it('rougit sur la mauvaise méthode', () => {
    const r = comparer([appel('PATCH', '/forum/posts/{}')], { spec: SPEC, baseline: [] })

    expect(r.horsSpec.map(cle)).toEqual(['PATCH /forum/posts/{}'])
  })

  it('ne tient pas une route fixe pour documentée par un paramètre de la spec', () => {
    // Mesuré : `GET /evaluations/student` est une route à part, non documentée ;
    // la spec ne décrit que `GET /evaluations/{id}`. « student » n'est pas un id.
    const spec = catalogueDepuisSpec({ paths: { '/evaluations/{id}': { get: {} } } })

    const r = comparer([appel('GET', '/evaluations/student')], { spec, baseline: [] })

    expect(r.horsSpec.map(cle)).toEqual(['GET /evaluations/student'])
  })

  it('rougit sur un segment dynamique là où le serveur n’a que des chemins fixes', () => {
    const routes = catalogueDepuisRoutes([{ method: 'POST', uri: 'api/admin/reports/attendance' }])

    const r = comparer([appel('POST', '/admin/reports/{}')], { spec: SPEC, routes, baseline: ['POST /admin/reports/{}'] })

    expect(r.inexistants.map(cle)).toEqual(['POST /admin/reports/{}'])
  })

  it('face aux routes réelles, la baseline ne couvre rien', () => {
    const routes = catalogueDepuisRoutes([{ method: 'GET|HEAD', uri: 'api/notifications' }])

    const r = comparer([appel('GET', '/notifications/recent')], {
      spec: [],
      routes,
      baseline: ['GET /notifications/recent'],
    })

    expect(r.horsSpec).toEqual([])
    expect(r.inexistants.map(cle)).toEqual(['GET /notifications/recent'])
  })
})

describe('comparaison : elle se tait là où elle le doit', () => {
  const appel = (method, path) => ({ method, path, fichier: 'src/x.js', ligne: 1 })

  it('accepte un paramètre du front face à un paramètre de la spec, quel que soit son nom', () => {
    const r = comparer([appel('PUT', '/forum/posts/{}'), appel('DELETE', '/notifications/{}')], { spec: SPEC, baseline: [] })

    expect(r.horsSpec).toEqual([])
  })

  it('tolère la dette nommée, et signale celle qui est remboursée', () => {
    const r = comparer([appel('GET', '/dette')], {
      spec: SPEC,
      baseline: ['GET /dette', 'GET /notifications/recent', 'POST /plus-appele'],
    })

    expect(r.horsSpec).toEqual([])
    expect(r.obsoletes).toEqual(['GET /notifications/recent', 'POST /plus-appele'])
  })

  it('lit la table de routes de Laravel : HEAD écarté, hors api/ écarté', () => {
    const routes = catalogueDepuisRoutes([
      { method: 'GET|HEAD', uri: 'api/notifications/{id}' },
      { method: 'GET|HEAD', uri: 'docs' },
    ])

    expect(routes.map(cle)).toEqual(['GET /notifications/{}'])
  })

  it('ne compte pas le miroir api/v1/ : le front n’appelle que api/', () => {
    // Mesuré sur le bundle déployé : la base est `https://apilms.klassci.com/api`.
    // Une PR qui retirerait `api/x` en gardant `api/v1/x` casserait le front.
    const routes = catalogueDepuisRoutes([{ method: 'GET|HEAD', uri: 'api/v1/notifications/recent' }])

    const r = comparer([{ method: 'GET', path: '/notifications/recent', fichier: 'src/x.js', ligne: 1 }], {
      spec: [],
      routes,
      baseline: ['GET /notifications/recent'],
    })

    expect(r.inexistants).toHaveLength(1)
  })
})

describe('baseline : elle ne peut que se resserrer', () => {
  it('retire la dette remboursée', () => {
    expect(resserrerBaseline(['GET /a', 'GET /b'], ['GET /a'])).toEqual(['GET /a'])
  })

  it('n’ajoute JAMAIS un appel neuf : il se documente côté backend', () => {
    // Sinon un appel vers une route inexistante entrerait en dette, la CI du
    // front resterait verte, et seule la CI du backend le verrait, sur une PR
    // sans rapport.
    expect(resserrerBaseline(['GET /a'], ['GET /a', 'GET /neuf'])).toEqual(['GET /a'])
  })

  it('initialise la dette une seule fois, quand elle n’existe pas', () => {
    expect(resserrerBaseline(null, ['GET /b', 'GET /a'])).toEqual(['GET /a', 'GET /b'])
  })
})
