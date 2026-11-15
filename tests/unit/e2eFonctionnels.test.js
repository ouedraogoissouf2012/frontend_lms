/**
 * Parcours fonctionnels de l'E2E, le SOCLE (PR 1) : une étape = une action par l'interface, puis une RELECTURE.
 * Le verdict ne vient que de la relecture : un clic sans relecture n'est jamais VERT. Un échec de l'OUTIL
 * (sélecteur, attente) est NON TESTÉ nommé, jamais un défaut du produit. Une étape dont une étape requise n'est
 * pas verte n'est pas jouée : NON TESTÉ, avec la raison.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { moteurFonctionnel, lireApi, resumeFonctionnel } from '../../e2e/fonctionnels.mjs'

const confirme = async () => ({ confirme: true, preuve: 'relu' })
const fait = async () => ({})
const nouveau = () => moteurFonctionnel({ ecole: 'lms', fonction: 'leçon' })

describe('fonctionnels.mjs — le verdict vient de la relecture', () => {
  it('action faite et relecture qui CONFIRME : VERT, avec la preuve', async () => {
    const m = nouveau()
    const c = await m.etape({ cle: 'creer', compte: 'enseignant', libelle: 'créer', action: fait, relecture: confirme })
    expect(c).toMatchObject({ ecole: 'lms', fonction: 'leçon', etape: 'creer', compte: 'enseignant', verdict: 'VERT', preuve: 'relu' })
  })

  it('une relecture qui CONTREDIT l’action : ROUGE, avec l’écart', async () => {
    const m = nouveau()
    const c = await m.etape({ cle: 'creer', compte: 'enseignant', libelle: 'créer', action: fait, relecture: async () => ({ confirme: false, ecart: 'statut relu « x »' }) })
    expect(c.verdict).toBe('ROUGE')
    expect(c.defaut).toContain('la relecture contredit l\'action : statut relu « x »')
  })

  it('une étape SANS relecture est refusée : elle ne serait jamais jugée', async () => {
    await expect(nouveau().etape({ cle: 'creer', compte: 'enseignant', libelle: 'créer', action: fait })).rejects.toThrow(/sans relecture/)
  })

  it('une relecture qui ne rend pas `confirme: true` n’est jamais VERT', async () => {
    const c = await nouveau().etape({ cle: 'creer', compte: 'enseignant', libelle: 'créer', action: fait, relecture: async () => ({ preuve: 'vu un toast' }) })
    expect(c.verdict).toBe('ROUGE')
  })

  it('une action REFUSÉE par le produit : ROUGE avec son motif, sans relecture', async () => {
    const relecture = vi.fn(confirme)
    const c = await nouveau().etape({ cle: 'creer', compte: 'enseignant', libelle: 'créer', action: async () => ({ rouge: 'HTTP 422' }), relecture })
    expect(c).toMatchObject({ verdict: 'ROUGE', defaut: 'HTTP 422' })
    expect(relecture).not.toHaveBeenCalled()
  })

  it('un échec de l’OUTIL pendant l’action : NON TESTÉ nommé, jamais ROUGE', async () => {
    const c = await nouveau().etape({ cle: 'creer', compte: 'enseignant', libelle: 'créer', action: async () => { throw new Error('Timeout 20000ms exceeded.\nlocator…') }, relecture: confirme })
    expect(c.verdict).toBe('NON TESTÉ')
    expect(c.defaut).toBe('échec de l\'outil pendant l\'action (sélecteur ou attente) : Timeout 20000ms exceeded.')
  })

  it('une relecture impossible (outil) : NON TESTÉ nommé', async () => {
    const c = await nouveau().etape({ cle: 'creer', compte: 'enseignant', libelle: 'créer', action: fait, relecture: async () => { throw new Error('fetch failed') } })
    expect(c).toMatchObject({ verdict: 'NON TESTÉ', defaut: 'relecture impossible (outil) : fetch failed' })
  })
})

describe('fonctionnels.mjs — la chaîne d’un objet', () => {
  it('une étape requise non verte : l’étape n’est pas jouée, NON TESTÉ avec la raison', async () => {
    const m = nouveau()
    await m.etape({ cle: 'creer', compte: 'enseignant', libelle: 'créer', action: async () => ({ rouge: 'refus' }), relecture: confirme })
    const action = vi.fn(fait)
    const c = await m.etape({ cle: 'publier', compte: 'enseignant', libelle: 'publier', requiert: ['creer'], action, relecture: confirme })
    expect(action).not.toHaveBeenCalled()
    expect(c).toMatchObject({ verdict: 'NON TESTÉ', defaut: 'étape requise « creer » non verte (ROUGE) : la chaîne de l\'objet s\'arrête' })
  })

  it('une étape qui ne requiert pas l’étape rouge est jouée (un ROUGE n’arrête pas tout le parcours)', async () => {
    const m = nouveau()
    await m.etape({ cle: 'creer', compte: 'enseignant', libelle: 'créer', action: fait, relecture: confirme })
    await m.etape({ cle: 'modifier', compte: 'enseignant', libelle: 'modifier', requiert: ['creer'], action: async () => ({ rouge: 'aucun chemin' }), relecture: confirme })
    const c = await m.etape({ cle: 'publier', compte: 'enseignant', libelle: 'publier', requiert: ['creer'], action: fait, relecture: confirme })
    expect(c.verdict).toBe('VERT')
    expect(m.cases.map((x) => x.verdict)).toEqual(['VERT', 'ROUGE', 'VERT'])
  })

  it('requérir une étape jamais jouée est une erreur de l’outil', async () => {
    await expect(nouveau().etape({ cle: 'publier', compte: 'enseignant', libelle: 'publier', requiert: ['creer'], action: fait, relecture: confirme })).rejects.toThrow(/n'a pas été jouée/)
  })
})

describe('fonctionnels.mjs — la relecture par l’API, avec le jeton du compte', () => {
  afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear() })

  it('lit le jeton de la session (comme le front) et rend le statut et le corps', async () => {
    sessionStorage.setItem('token', 'jeton-fictif')
    const fetch = vi.fn(async () => ({ status: 200, json: async () => ({ data: { id: 7 } }) }))
    vi.stubGlobal('fetch', fetch)
    const page = { evaluate: (fn, arg) => fn(arg) }
    expect(await lireApi(page, '/lessons/7')).toEqual({ statut: 200, corps: { data: { id: 7 } } })
    expect(fetch).toHaveBeenCalledWith('/api/lessons/7', { headers: { Accept: 'application/json', Authorization: 'Bearer jeton-fictif' } })
  })

  it('un corps non JSON : seul le statut compte', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 404, json: async () => { throw new Error('vide') } })))
    expect(await lireApi({ evaluate: (fn, arg) => fn(arg) }, '/lessons/7')).toEqual({ statut: 404, corps: null })
  })
})

describe('fonctionnels.mjs — le résumé', () => {
  it('compte les verdicts et donne une ligne par étape, la preuve ou le défaut', () => {
    const md = resumeFonctionnel([
      { fonction: 'leçon', libelle: 'créer', compte: 'enseignant', verdict: 'VERT', preuve: 'leçon 5 relue' },
      { fonction: 'leçon', libelle: 'modifier', compte: 'enseignant', verdict: 'ROUGE', defaut: 'aucun chemin | (Refs #564)' },
    ], 'école créée depuis le LMS')
    expect(md).toContain('Étapes : 2 — VERT 1, ROUGE 1, NON TESTÉ 0')
    expect(md).toContain('| leçon | créer | enseignant | VERT | leçon 5 relue |')
    expect(md).toContain('| leçon | modifier | enseignant | ROUGE | aucun chemin / (Refs #564) |')
  })
})
