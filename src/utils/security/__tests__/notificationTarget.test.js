import { describe, it, expect } from 'vitest'
import { resolveNotificationTarget } from '../notificationTarget'

/**
 * Cible d'un lien de notification. Les formes à barre oblique inverse sont
 * construites avec `B` pour que le test porte exactement le caractère voulu.
 *
 * L'origine est celle de la page de test (jsdom, en http) : la fonction compare
 * à la même origine que celle sur laquelle `safeUrl` résout. La forme `schéma:hôte`
 * est donc écrite avec le schéma de cette origine ; en production (https), c'est
 * `https:hôte`, par la même branche.
 */
const ORIGIN = window.location.origin
const SCHEMA = new URL(ORIGIN).protocol
const AUTRE_SCHEMA = SCHEMA === 'https:' ? 'http:' : 'https:'
const B = String.fromCharCode(92)
const cible = (raw) => resolveNotificationTarget(raw)

describe('resolveNotificationTarget — chemins internes', () => {
  const interne = (path) => ({ kind: 'internal', path, href: `${ORIGIN}${path}` })

  it('garde un chemin relatif émis par le serveur, avec son href résolu', () => {
    expect(cible('/lessons/12')).toEqual(interne('/lessons/12'))
  })

  it('conserve la requête et le dièse', () => {
    expect(cible('/lessons/12?x=1#c')).toEqual(interne('/lessons/12?x=1#c'))
  })

  it('ramène une URL absolue de la même origine à son chemin', () => {
    expect(cible(`${ORIGIN}/quizzes/3`)).toEqual(interne('/quizzes/3'))
  })

  it('résout schéma:hôte et schéma:/hôte (schéma de la page) en chemin interne, sans ouverture externe', () => {
    expect(cible(`${SCHEMA}evil.test`)).toEqual(interne('/evil.test'))
    expect(cible(`${SCHEMA}/evil.test`)).toEqual(interne('/evil.test'))
  })

  it.each([
    ['/.//hôte', '/.//evil.test/x'],
    ['/a/..//hôte', '/a/..//evil.test/x'],
    ['<origine>//hôte', `${ORIGIN}//evil.test/x`],
  ])('refuse %s : son chemin résolu commence par //, qu un navigateur relirait comme une autre origine', (_nom, raw) => {
    expect(cible(raw)).toEqual({ kind: 'none' })
  })

  it('avec l AUTRE schéma, schéma:hôte désigne un autre hôte : ouverture du href résolu, jamais de la chaîne brute', () => {
    expect(cible(`${AUTRE_SCHEMA}evil.test`)).toEqual({ kind: 'external', href: `${AUTRE_SCHEMA}//evil.test/` })
  })
})

describe('resolveNotificationTarget — formes relatives qui quittent l origine', () => {
  it.each([
    ['//hôte', '//evil.test/x'],
    ['/\\hôte', `/${B}evil.test/x`],
    ['\\\\hôte', `${B}${B}evil.test`],
    ['\\/hôte', `${B}/evil.test`],
  ])('refuse %s', (_nom, raw) => {
    expect(cible(raw)).toEqual({ kind: 'none' })
  })
})

describe('resolveNotificationTarget — schémas refusés par la garde commune', () => {
  it.each([
    'javascript:alert(1)',
    'java\tscript:alert(1)',
    ' JavaScript:alert(1)',
    'data:text/html,x',
    'vbscript:x',
    'ftp://a.test/f',
  ])('refuse %j', (raw) => {
    expect(cible(raw)).toEqual({ kind: 'none' })
  })

  it.each([undefined, null, '', '   ', 42, {}])('refuse une valeur absente ou non textuelle (%j)', (raw) => {
    expect(cible(raw)).toEqual({ kind: 'none' })
  })
})

describe('resolveNotificationTarget — URL absolues acceptées', () => {
  it('ouvre une autre origine avec le href résolu', () => {
    expect(cible('https://a.test/page')).toEqual({ kind: 'external', href: 'https://a.test/page' })
  })

  it('suit la liste de la garde commune (http, mailto)', () => {
    expect(cible('http://a.test/')).toEqual({ kind: 'external', href: 'http://a.test/' })
    expect(cible('mailto:a@b.test')).toEqual({ kind: 'external', href: 'mailto:a@b.test' })
  })
})
