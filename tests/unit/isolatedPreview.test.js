/**
 * Logique pure de l'aperçu isolé (`npm run preview:isolated`).
 *
 * Ce qui est testé ici, ce sont les DÉCISIONS du script, pas ses effets :
 * quelle référence et quel port sont retenus, si une référence doit être
 * rapatriée avant d'être servie, et surtout s'il faut réinstaller les
 * dépendances — la seule étape coûteuse (~4 min, ~600 Mo). Se tromper dans un
 * sens réinstalle inutilement à chaque lancement ; dans l'autre, on sert un
 * code avec des dépendances périmées.
 */
import { describe, it, expect } from 'vitest'
import {
  parseArgs,
  splitRemoteRef,
  fingerprintLock,
  needsInstall,
  DEFAULT_REF,
  DEFAULT_PORT
} from '../../scripts/lib/isolatedPreview.mjs'

describe('parseArgs', () => {
  it('sert origin/dev sur le port 5180 par defaut', () => {
    expect(parseArgs([])).toEqual({ ref: DEFAULT_REF, port: DEFAULT_PORT, help: false })
    expect(DEFAULT_REF).toBe('origin/dev')
    expect(DEFAULT_PORT).toBe(5180)
  })

  it('accepte la reference en positionnel ou en option', () => {
    expect(parseArgs(['origin/main']).ref).toBe('origin/main')
    expect(parseArgs(['--ref', 'ma-branche']).ref).toBe('ma-branche')
    expect(parseArgs(['--ref=ma-branche']).ref).toBe('ma-branche')
  })

  it('accepte un port explicite', () => {
    expect(parseArgs(['--port', '5199']).port).toBe(5199)
    expect(parseArgs(['--port=5199']).port).toBe(5199)
  })

  it('refuse un port hors plage plutot que de le corriger en silence', () => {
    // Un port invalide corrigé en douce ferait servir l'aperçu ailleurs que là
    // où l'utilisateur l'attend — il vaut mieux échouer tout de suite.
    expect(() => parseArgs(['--port', '0'])).toThrow(/port/i)
    expect(() => parseArgs(['--port', '70000'])).toThrow(/port/i)
    expect(() => parseArgs(['--port', 'abc'])).toThrow(/port/i)
  })

  it('refuse une option --ref laissee sans valeur', () => {
    // Retomber en silence sur origin/dev servirait un AUTRE code que celui
    // demande — exactement le faux negatif que cet outil existe pour eviter.
    expect(() => parseArgs(['--ref'])).toThrow(/ref/i)
  })

  it('signale la demande d aide', () => {
    expect(parseArgs(['--help']).help).toBe(true)
    expect(parseArgs(['-h']).help).toBe(true)
  })
})

describe('splitRemoteRef', () => {
  it('reconnait une reference distante a rapatrier', () => {
    expect(splitRemoteRef('origin/dev')).toEqual({ remote: 'origin', branch: 'dev' })
    expect(splitRemoteRef('origin/fix/ma-branche')).toEqual({ remote: 'origin', branch: 'fix/ma-branche' })
  })

  it('rend null pour une reference locale, qui n a rien a rapatrier', () => {
    expect(splitRemoteRef('dev')).toBeNull()
    expect(splitRemoteRef('HEAD')).toBeNull()
    // Un SHA n'est pas une branche distante, même s'il contient une barre... il n'en contient pas.
    expect(splitRemoteRef('55d43137')).toBeNull()
  })

  it('ne prend pour distante qu une reference dont le prefixe est un remote connu', () => {
    expect(splitRemoteRef('fix/ma-branche')).toBeNull()
    expect(splitRemoteRef('upstream/dev', ['origin', 'upstream'])).toEqual({ remote: 'upstream', branch: 'dev' })
  })
})

describe('needsInstall', () => {
  const empreinte = 'abc123'

  it('installe quand node_modules est absent', () => {
    expect(needsInstall({ hasNodeModules: false, storedFingerprint: empreinte, currentFingerprint: empreinte })).toBe(true)
  })

  it('installe quand le verrou a change', () => {
    expect(needsInstall({ hasNodeModules: true, storedFingerprint: 'ancien', currentFingerprint: empreinte })).toBe(true)
  })

  it('installe quand aucune empreinte n a ete gardee', () => {
    expect(needsInstall({ hasNodeModules: true, storedFingerprint: null, currentFingerprint: empreinte })).toBe(true)
  })

  it('NE reinstalle PAS quand rien n a bouge — c est tout l interet du worktree persistant', () => {
    expect(needsInstall({ hasNodeModules: true, storedFingerprint: empreinte, currentFingerprint: empreinte })).toBe(false)
  })
})

describe('fingerprintLock', () => {
  it('rend la meme empreinte pour un contenu identique', () => {
    expect(fingerprintLock('{"a":1}')).toBe(fingerprintLock('{"a":1}'))
  })

  it('change des que le verrou change', () => {
    expect(fingerprintLock('{"a":1}')).not.toBe(fingerprintLock('{"a":2}'))
  })
})
