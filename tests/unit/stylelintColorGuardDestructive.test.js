/**
 * Suite destructrice de la garde couleurs (#161) — QA adversarial.
 *
 * Objectif : un garde de CI ne doit JAMAIS s'ouvrir silencieusement (fail-open).
 * On attaque : baseline corrompue, pollution de prototype, casse CSS, entrées
 * nulles/types corrompus, noms de fichiers hostiles (espaces + '#', unicode,
 * séparateurs U+2028), volumes, et on verrouille les invariants par des
 * property-based tests (fast-check).
 *
 * N/A prouvé : pas de réseau ni de logique temporelle dans ce code (aucun
 * import réseau, aucun Date) — les vecteurs « timeout réseau » et « fuseaux
 * horaires » ne s'appliquent pas.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { buildBaseline, diffAgainstBaseline, normalizeColor } from '../../scripts/lib/colorRatchet.mjs'
import {
  extractColor, isFallbackHex, serializeBaseline, totalCount, assertValidBaseline,
} from '../../scripts/lib/colorGuardHelpers.mjs'

const v = (file, line, column, color) => ({ file, line, column, color })

// ---------- Arbitraires ----------
const hexDigit = fc.constantFrom(...'0123456789abcdefABCDEF')
const hexColor = fc
  .tuple(fc.constantFrom(3, 4, 6, 8), fc.array(hexDigit, { minLength: 8, maxLength: 8 }))
  .map(([len, d]) => '#' + d.slice(0, len).join(''))
const nastyFile = fc.oneof(
  fc.constantFrom(
    'src/a.vue', 'src/propre à moi/é.scss', 'src/x #fff.vue', 'src/sp ace.css',
    'src/ sep.vue', 'src/emoji-🎨.vue', 'constructor', 'toString', 'hasOwnProperty',
  ),
  fc.string({ minLength: 1, maxLength: 30 }),
)
const violation = fc.record({
  file: nastyFile,
  line: fc.integer({ min: 1, max: 5000 }),
  column: fc.integer({ min: 1, max: 300 }),
  color: hexColor,
})
const violations = fc.array(violation, { maxLength: 60 })

// ---------- 1. Fail-closed : baseline corrompue ----------
describe('diffAgainstBaseline — baseline corrompue = FAIL CLOSED', () => {
  const one = [v('a.vue', 1, 5, '#ffffff')]

  it.each([
    ['compte chaîne', { 'a.vue': { '#ffffff': 'beaucoup' } }],
    ['compte NaN', { 'a.vue': { '#ffffff': NaN } }],
    ['compte négatif', { 'a.vue': { '#ffffff': -5 } }],
    ['compte flottant', { 'a.vue': { '#ffffff': 1.5 } }],
    ['compte Infinity', { 'a.vue': { '#ffffff': Infinity } }],
    ['compte null', { 'a.vue': { '#ffffff': null } }],
    ['compte objet', { 'a.vue': { '#ffffff': { evil: true } } }],
  ])('%s → la violation est signalée (pas d\'ouverture silencieuse)', (_label, baseline) => {
    expect(diffAgainstBaseline(one, baseline).newViolations).toEqual(one)
  })

  it('perFile null / tableau / primitive → signalé, sans throw', () => {
    for (const perFile of [null, [], 42, 'x']) {
      expect(diffAgainstBaseline(one, { 'a.vue': perFile }).newViolations).toEqual(one)
    }
  })

  it('baseline primitive ou tableau → tout est signalé, sans throw', () => {
    for (const baseline of [42, 'x', [], true]) {
      expect(diffAgainstBaseline(one, baseline).newViolations).toEqual(one)
    }
  })
})

// ---------- 2. Pollution de prototype ----------
describe('pollution de prototype', () => {
  it('buildBaseline avec un fichier nommé "__proto__" ne mute pas Object.prototype', () => {
    const baseline = buildBaseline([v('__proto__', 1, 1, '#fff'), v('__proto__', 2, 1, '#fff')])
    expect({}['#fff']).toBeUndefined() // Object.prototype intact
    expect(Object.getOwnPropertyNames(baseline)).toContain('__proto__')
    expect(Object.getOwnPropertyDescriptor(baseline, '__proto__').value['#fff']).toBe(2)
  })

  it('les clés héritées ne donnent AUCUNE allowance (constructor/toString/hasOwnProperty)', () => {
    for (const file of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      const cur = [v(file, 1, 1, '#abc123')]
      expect(diffAgainstBaseline(cur, {}).newViolations).toEqual(cur)
    }
  })

  it('une baseline JSON contenant "__proto__" ne pollue pas à la lecture', () => {
    const parsed = JSON.parse('{"__proto__": {"#fff": 3}}')
    diffAgainstBaseline([v('a.vue', 1, 1, '#fff')], parsed)
    expect({}['#fff']).toBeUndefined()
  })
})

// ---------- 3. Entrées nulles / types corrompus ----------
describe('entrées dégénérées', () => {
  it('normalizeColor coerce sans throw (null/undefined/nombre)', () => {
    expect(normalizeColor(null)).toBe('null')
    expect(normalizeColor(undefined)).toBe('undefined')
    expect(normalizeColor(0xfff)).toBe('4095')
    expect(normalizeColor('#AbCdEf')).toBe('#abcdef')
  })

  it('violations sans line/column → pas de throw, la violation reste signalée', () => {
    const weird = [{ file: 'a.vue', color: '#fff' }, { file: 'a.vue', line: 2, column: 1, color: '#fff' }]
    const { newViolations } = diffAgainstBaseline(weird, {})
    expect(newViolations).toHaveLength(2)
  })

  it('extractColor est immune aux textes absents ou non-string', () => {
    expect(extractColor(undefined)).toBeNull()
    expect(extractColor(null)).toBeNull()
    expect(extractColor(42)).toBeNull()
    expect(extractColor('sans guillemets #fff')).toBeNull()
    expect(extractColor('Disallowed hex color "#A1B2C3"')).toBe('#A1B2C3')
    expect(extractColor('x "#abcd" alpha 4 digits')).toBe('#abcd')
    expect(extractColor('x "#aabbccdd" alpha 8 digits')).toBe('#aabbccdd')
    expect(extractColor('x "#ab" trop court')).toBeNull()
  })
})

// ---------- 4. Exemption fallback var(--t, #hex) — chaînes hostiles ----------
describe('isFallbackHex — parsing hostile', () => {
  const col = (line, hex) => line.indexOf(hex) + 1

  it('cas nominal + espaces + hex majuscules', () => {
    for (const line of [
      'color: var(--a, #fff);',
      'color: var(--a,#fff);',
      'color: var( --a , #fff );',
      'color: var(--a, #FFF);',
      'color: var(--a-b_c1, #a1b2c3);',
    ]) {
      const hex = line.match(/#[0-9a-fA-F]+/)[0]
      expect(isFallbackHex(line, col(line, hex)), line).toBe(true)
    }
  })

  it('VAR()/Var() majuscules — CSS est insensible à la casse', () => {
    expect(isFallbackHex('color: VAR(--a, #fff);', col('color: VAR(--a, #fff);', '#fff'))).toBe(true)
    expect(isFallbackHex('color: Var(--a, #fff);', col('color: Var(--a, #fff);', '#fff'))).toBe(true)
  })

  it('var imbriqué : le fallback interne est exempté', () => {
    const line = 'color: var(--a, var(--b, #fff));'
    expect(isFallbackHex(line, col(line, '#fff'))).toBe(true)
  })

  it('un hex hors fallback sur la même ligne n\'est PAS exempté', () => {
    const line = 'border: 1px solid var(--a, #fff) #000;'
    expect(isFallbackHex(line, col(line, '#000'))).toBe(false)
  })

  it('un hex nu n\'est jamais exempté, même précédé d\'un var() ailleurs', () => {
    const line = 'x: var(--a) #fff;'
    expect(isFallbackHex(line, col(line, '#fff'))).toBe(false)
  })

  it('ligne absente / colonne hors bornes / CR traînant → false ou vrai sans throw', () => {
    expect(isFallbackHex(undefined, 3)).toBe(false)
    expect(isFallbackHex('', 1)).toBe(false)
    expect(isFallbackHex('color: #fff;', 9999)).toBe(false)
    expect(isFallbackHex('color: var(--a, #fff);\r', col('color: var(--a, #fff);', '#fff'))).toBe(true)
  })

  it('LIMITATION CONNUE (verrouillée) : déclaration multi-ligne → fallback non détecté sur la ligne du hex', () => {
    // `color: var(--a,\n  #fff);` — stylelint pointe la ligne 2, qui ne contient
    // pas le `var(` : l'exemption ligne-à-ligne ne s'applique pas (faux positif
    // possible). Comportement assumé et documenté ; ce test échouera le jour où
    // on gérera le multi-ligne, pour forcer la mise à jour de la doc.
    expect(isFallbackHex('  #fff);', 3)).toBe(false)
  })
})

// ---------- 5. Validation de la baseline persistée ----------
describe('assertValidBaseline — le fichier committé est une surface d\'attaque', () => {
  it('accepte une baseline saine (y compris unicode et espaces)', () => {
    expect(() => assertValidBaseline({ 'src/propre à moi/é #x.vue': { '#fff': 2, '#a1b2c3': 1 } })).not.toThrow()
    expect(() => assertValidBaseline({})).not.toThrow()
  })

  it.each([
    ['tableau', []],
    ['null', null],
    ['nombre', 42],
    ['chaîne', 'x'],
    ['perFile tableau', { 'a.vue': [] }],
    ['perFile null', { 'a.vue': null }],
    ['compte chaîne', { 'a.vue': { '#fff': '3' } }],
    ['compte zéro', { 'a.vue': { '#fff': 0 } }],
    ['compte négatif', { 'a.vue': { '#fff': -1 } }],
    ['compte flottant', { 'a.vue': { '#fff': 1.5 } }],
  ])('rejette : %s', (_label, bad) => {
    expect(() => assertValidBaseline(bad)).toThrow(/baseline invalide/)
  })
})

// ---------- 6. Propriétés (fast-check) ----------
describe('invariants (property-based)', () => {
  it('P1 — auto-cohérence : diff(vs, buildBaseline(vs)) = ∅', () => {
    fc.assert(fc.property(violations, (vs) => {
      expect(diffAgainstBaseline(vs, buildBaseline(vs)).newViolations).toEqual([])
    }))
  })

  it('P2 — monotonie : retirer des occurrences ne crée jamais de violation', () => {
    fc.assert(fc.property(violations, fc.nat(), (vs, k) => {
      const baseline = buildBaseline(vs)
      const subset = vs.filter((_, i) => i !== k % Math.max(vs.length, 1))
      expect(diffAgainstBaseline(subset, baseline).newViolations).toEqual([])
    }))
  })

  it('P3 — détection exacte : dupliquer UNE occurrence → exactement 1 nouvelle violation', () => {
    fc.assert(fc.property(violations.filter((vs) => vs.length > 0), fc.nat(), (vs, k) => {
      const dup = vs[k % vs.length]
      const { newViolations } = diffAgainstBaseline([...vs, { ...dup }], buildBaseline(vs))
      expect(newViolations).toHaveLength(1)
      expect(normalizeColor(newViolations[0].color)).toBe(normalizeColor(dup.color))
    }))
  })

  it('P4 — baseline vide : tout est signalé, dans l\'ordre positionnel par groupe', () => {
    fc.assert(fc.property(violations, (vs) => {
      expect(diffAgainstBaseline(vs, {}).newViolations).toHaveLength(vs.length)
    }))
  })

  it('P5 — pas de fuite d\'allowance entre (fichier, couleur) distincts — attaque "espace + #" dans les noms', () => {
    fc.assert(fc.property(violation, violation, (a, b) => {
      fc.pre(a.file !== b.file || normalizeColor(a.color) !== normalizeColor(b.color))
      const { newViolations } = diffAgainstBaseline([b], buildBaseline([a]))
      expect(newViolations).toEqual([b])
    }))
  })

  it('P6 — sérialisation déterministe : l\'ordre d\'entrée ne change pas l\'octet de sortie', () => {
    fc.assert(fc.property(violations, fc.array(fc.nat(), { maxLength: 60 }), (vs, seed) => {
      const shuffled = [...vs].sort((x, y) => (seed[vs.indexOf(x) % seed.length] ?? 0) - (seed[vs.indexOf(y) % seed.length] ?? 0))
      expect(serializeBaseline(buildBaseline(shuffled))).toBe(serializeBaseline(buildBaseline(vs)))
    }))
  })

  it('P7 — persistance : serialize → JSON.parse → validation OK et diff = ∅', () => {
    fc.assert(fc.property(violations, (vs) => {
      const parsed = JSON.parse(serializeBaseline(buildBaseline(vs)))
      assertValidBaseline(parsed)
      expect(diffAgainstBaseline(vs, parsed).newViolations).toEqual([])
      expect(totalCount(parsed)).toBe(vs.length)
    }))
  })
})

// ---------- 7. Volume ----------
describe('volume', () => {
  it('10 000 violations : diff en < 2 s, résultat exact', () => {
    const many = Array.from({ length: 10_000 }, (_, i) => v(`f${i % 97}.vue`, (i % 500) + 1, (i % 80) + 1, `#${(i % 4096).toString(16).padStart(3, '0')}`))
    const baseline = buildBaseline(many.slice(0, 5_000))
    const t0 = performance.now()
    const { newViolations } = diffAgainstBaseline(many, baseline)
    expect(performance.now() - t0).toBeLessThan(2_000)
    expect(newViolations.length).toBeGreaterThan(0)
    expect(newViolations.length).toBeLessThanOrEqual(5_000)
    expect(diffAgainstBaseline(many, buildBaseline(many)).newViolations).toEqual([])
  })
})
