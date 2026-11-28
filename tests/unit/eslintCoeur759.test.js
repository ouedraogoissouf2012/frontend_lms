// @vitest-environment node
/**
 * #759 : les règles RECOMMANDÉES du cœur d'ESLint tournent sur `src`.
 *
 * Mesuré le 28/11 : ESLint 10 n'embarque plus `@eslint/js`, et la configuration plate ne l'importait pas. AUCUNE règle
 * du cœur ne tournait : une variable inconnue, un code mort ou une clé en double passaient l'analyse. Mesurées sur
 * `src`, les règles recommandées ne trouvaient qu'une violation (un `no-useless-assignment`). Ce test exige qu'elles
 * soient actives, pour qu'un retrait de la configuration ne passe pas en silence.
 */
import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { ESLint } from 'eslint'

const RACINE = resolve(__dirname, '../..')

async function regles(code, fichier) {
  const [resultat] = await new ESLint({ cwd: RACINE }).lintText(code, { filePath: resolve(RACINE, fichier) })
  return resultat.messages.map((m) => m.ruleId)
}

describe('#759 — les règles recommandées du cœur tournent sur src', () => {
  it('une variable inconnue (no-undef)', async () => {
    expect(await regles('export const a = variableInconnue759\n', 'src/utils/sonde759.js')).toContain('no-undef')
  })

  it('un code mort après un return (no-unreachable)', async () => {
    expect(await regles('export function f() {\n  return 1\n  f()\n}\n', 'src/utils/sonde759.js')).toContain('no-unreachable')
  })

  it('aussi dans un composant Vue', async () => {
    const vue = '<template><div /></template>\n<script setup>\nconst a = autreInconnue759\nconsole.log(a)\n</script>\n'
    expect(await regles(vue, 'src/components/Sonde759.vue')).toContain('no-undef')
  })

  it('les globales du navigateur restent connues', async () => {
    expect(await regles('export const l = window.location.href + document.title\n', 'src/utils/sonde759.js')).not.toContain('no-undef')
  })
})
