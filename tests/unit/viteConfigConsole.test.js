// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolveConfig } from 'vite'
import { describe, expect, it } from 'vitest'
import viteConfig from '../../vite.config.js'

describe('vite config — console production guard (#15, révisé #234)', () => {
  it('retire TOUS les console.* du build prod (sécurité #234)', () => {
    // #234 : l'intercepteur pose Authorization = Bearer … → l'objet erreur axios
    // porte le token. Garder console.error/warn en prod le fuyait. La décision #15
    // (garder warn/error pour le diagnostic) est donc RÉVISÉE : on les strippe au
    // build (les erreurs à surfacer passent par errorHandler.logError / un toast),
    // complété par un no-op runtime dans main.js (appels dynamiques + dépendances).
    expect(viteConfig.esbuild?.pure).toEqual([
      'console.log',
      'console.info',
      'console.debug',
      'console.error',
      'console.warn',
    ])
  })

  it('ne laisse pas de log non essentiel dans le worker public copié tel quel', () => {
    const worker = readFileSync(new URL('../../public/heartbeat-worker.js', import.meta.url), 'utf8')

    expect(worker).not.toMatch(/console\.(log|info|debug)\s*\(/)
    expect(worker).toMatch(/console\.error\s*\(/)
  })

  it('proxyfie API et storage en développement pour éviter les CORS locaux', () => {
    // Cible en IPv4 EXPLICITE, et non `localhost` : `php artisan serve`
    // n'ouvre le port 8000 qu'en 127.0.0.1, alors que `localhost` se résout
    // d'abord en `::1` sur Windows avec Node >= 17. Le repli sauve la mise
    // aujourd'hui ; ce test fige le fait qu'on n'en dépende plus.
    expect(viteConfig.server?.proxy?.['/api']?.target).toBe('http://127.0.0.1:8000')
    expect(viteConfig.server?.proxy?.['/storage']?.target).toBe('http://127.0.0.1:8000')
  })

  it('ne cible jamais un nom d hôte ambigu pour le proxy de dev', () => {
    // Garde de non-retour : réintroduire `localhost` rouvrirait l'ambiguïté
    // IPv4/IPv6, dont le symptôme — « Identifiants incorrects » au login —
    // n'a aucun rapport visible avec la cause.
    for (const chemin of ['/api', '/storage']) {
      expect(viteConfig.server?.proxy?.[chemin]?.target).not.toMatch(/localhost/)
    }
  })
})

// La configuration RÉSOLUE par vite, et non le littéral du fichier : un plugin (crochet `config`)
// ou une option d'environnement pourrait changer la cible effective sans toucher au littéral.
const resolue = () =>
  resolveConfig(
    { configFile: fileURLToPath(new URL('../../vite.config.js', import.meta.url)), logLevel: 'silent' },
    'build',
    'production',
    'production',
  )

describe('vite config — ce que le build livre ne change pas avec la version de vite', () => {
  const CIBLE_VITE_6 = ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']

  it('garde la cible de vite 6, Safari 14 compris, pour le JS et pour le CSS', async () => {
    // Le défaut de `build.target` a changé avec vite 7 : `'modules'` (ESBUILD_MODULES_TARGET,
    // vite 6.4.5 packages/vite/src/node/constants.ts:79) devient la « Baseline Widely
    // Available », soit Chrome 107, Edge 107, Firefox 104 et Safari 16. Suivre ce défaut
    // retirerait sans décision les navigateurs que l'école supporte. La cible est donc
    // ÉCRITE : la relever est une décision produit, pas l'effet d'une montée de version.
    const { build } = await resolue()
    expect(build.target).toEqual(CIBLE_VITE_6)
    expect(build.cssTarget).toEqual(CIBLE_VITE_6)
  })

  it('garde les notices de licence (/*! … */) dans le JS et le CSS livrés', async () => {
    // vite 7.3.8 impose `legalComments: 'none'` aux options d'esbuild (config.ts:1529), y compris
    // pour la minification du CSS (css.ts:2201) ; vite 6.4.5 ne le posait pas, et esbuild gardait
    // les notices en ligne. Les licences des dépendances livrées (MIT, OFL de Font Awesome…)
    // demandent que leur notice accompagne les copies : on garde le comportement de vite 6.
    const { esbuild } = await resolue()
    expect(esbuild.legalComments).toBe('inline')
  })
})
