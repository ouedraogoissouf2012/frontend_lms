// @vitest-environment node
/**
 * #432 — la garde couleurs (#161) MORD encore, avec le stylelint réellement installé.
 *
 * La baseline `.stylelint-color-baseline.json` vaut 0. Le job « Stylelint (hardcoded colors) » affiche
 * donc « ✔ No new hardcoded colors » aussi bien quand stylelint lit les fichiers que quand il n'en lit
 * plus aucun. Une montée de stylelint (Dependabot #595 : 17 → 18, une majeure) ou de ses syntaxes
 * (postcss-html, postcss-scss) passerait au vert sans rien prouver. Les autres suites de la garde ne
 * testent que ses helpers, jamais stylelint lui-même.
 *
 * Ici, le VRAI `stylelint.lint` tourne avec la VRAIE configuration du dépôt (`.stylelintrc.json`, trouvée
 * depuis `codeFilename`) sur du code en mémoire : rien n'est écrit dans src/. Ce qui suit la lecture,
 * le tri des avertissements, reprend les helpers du script (`extractColor`, `isFallbackHex`).
 *
 * Mesuré avant d'écrire, sur stylelint 17 : un repli `var(--x, #abc)` est SIGNALÉ par stylelint lui-même,
 * puis admis par la garde (`isFallbackHex`). Le témoin affirme les deux.
 */
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import stylelint from 'stylelint'
import { extractColor, isFallbackHex } from '../../scripts/lib/colorGuardHelpers.mjs'

const RACINE = process.cwd()

async function lire(fichier, code) {
  const { results } = await stylelint.lint({ code, codeFilename: resolve(RACINE, fichier), cwd: RACINE })
  expect(results).toHaveLength(1)
  return results[0]
}

// Ce que la garde retient d'un avertissement : sa couleur, et si c'est un repli de jeton admis.
function trier(code, resultat) {
  const lignes = code.split('\n')
  return resultat.warnings.map((w) => ({
    regle: w.rule,
    ligne: w.line,
    couleur: extractColor(w.text),
    repli: isFallbackHex(lignes[w.line - 1], w.column),
  }))
}

const VUE = [
  '<template><p class="a">Texte fictif</p></template>',
  '<script setup>',
  "const titre = 'Leçon fictive'",
  '</script>',
  '<style scoped>',
  '.a { color: #abc; }',
  '.b { color: var(--x, #abc); }',
  '</style>',
  '',
].join('\n')

const SCSS = [
  '$espace: 4px;',
  '@mixin cadre($e) { padding: $e; }',
  '.carte {',
  '  @include cadre($espace);',
  '  &__titre { border: 1px solid #a1b2c3; }',
  '  &__note { color: var(--x, #abc); }',
  '}',
  '',
].join('\n')

describe('#432 — la garde couleurs lit un .vue avec le stylelint installé', () => {
  it('le .vue se lit sans erreur de syntaxe : un avertissement illisible rendrait la garde aveugle', async () => {
    const r = await lire('src/__garde432__.vue', VUE)
    expect(r.ignored).toBeFalsy()
    expect(r.warnings.map((w) => w.rule)).toEqual(['color-no-hex', 'color-no-hex'])
  })

  it('un #abc nu dans le <style> est retenu ; le repli var(--x, #abc) est signalé puis admis', async () => {
    const r = await lire('src/__garde432__.vue', VUE)
    expect(trier(VUE, r)).toEqual([
      { regle: 'color-no-hex', ligne: 6, couleur: '#abc', repli: false },
      { regle: 'color-no-hex', ligne: 7, couleur: '#abc', repli: true },
    ])
  })
})

describe('#432 — la garde couleurs lit un .scss avec le stylelint installé', () => {
  it('la syntaxe SCSS ($variable, @mixin, &__) se lit sans erreur, et #a1b2c3 est retenu', async () => {
    const r = await lire('src/__garde432__.scss', SCSS)
    expect(r.ignored).toBeFalsy()
    expect(trier(SCSS, r)).toEqual([
      { regle: 'color-no-hex', ligne: 5, couleur: '#a1b2c3', repli: false },
      { regle: 'color-no-hex', ligne: 6, couleur: '#abc', repli: true },
    ])
  })
})

describe('#432 — témoin de la configuration', () => {
  it('le fichier de jetons de thème reste ignoré (ignoreFiles), comme le prévoit la garde', async () => {
    const r = await lire('src/assets/styles/themes.css', ':root { --x: #abc; }\n')
    expect(r.ignored).toBe(true)
    expect(r.warnings).toEqual([])
  })
})
