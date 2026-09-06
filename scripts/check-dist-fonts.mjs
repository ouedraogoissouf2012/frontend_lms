#!/usr/bin/env node
/**
 * Dist font guard (#340) — échoue si `dist/assets` émet une fonte non-woff2.
 *
 * Après le plugin postcss woff2-only (#340), seuls les woff2 d'icônes doivent
 * être émis. eot/ttf/otf/woff sont TOUJOURS des fontes (jamais des images) → on
 * les refuse tels quels. Le svg est ambigu (images légitimes) : on ne refuse que
 * les svg dont le nom est une fonte d'icône connue. L'app n'a qu'une seule source
 * de `@font-face` (icon-fonts.css), donc toutes ses fontes sont des icônes.
 *
 * À lancer APRÈS `npm run build`.
 *   node scripts/check-dist-fonts.mjs
 */
import { readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ASSETS_DIR = path.join(process.cwd(), 'dist', 'assets')

// eot/ttf/otf/woff : jamais du woff2 (ancré `$`), jamais des images.
const ALWAYS_FONT = /\.(eot|ttf|otf|woff)$/i
// svg de fonte d'icône connue (n'attrape pas les svg-images).
const FONT_NAMED_SVG = /^(fontawesome-webfont|material-icons)[^/]*\.svg$/i

function main() {
  if (!existsSync(ASSETS_DIR)) {
    console.error(
      `x ${path.relative(process.cwd(), ASSETS_DIR)} introuvable. Lance "npm run build" d'abord.`,
    )
    process.exitCode = 1
    return
  }

  const files = readdirSync(ASSETS_DIR)
  const dead = files.filter((f) => ALWAYS_FONT.test(f) || FONT_NAMED_SVG.test(f)).sort()

  if (dead.length === 0) {
    const woff2 = files.filter((f) => /\.woff2$/i.test(f))
    console.log(
      `OK Aucune fonte morte dans dist/assets (${woff2.length} woff2 émis, 0 non-woff2).`,
    )
    return
  }

  console.error(`x ${dead.length} fonte(s) non-woff2 émise(s) dans dist/assets :`)
  for (const f of dead) console.error(`  ${f}`)
  console.error(
    '\nLes @font-face ne doivent référencer que du woff2 (plugin postcss #340,' +
      ' scripts/postcss-woff2-only.mjs). Si une police non-woff2 est légitime,' +
      ' ajuste ce guard.',
  )
  process.exitCode = 1
}

main()
