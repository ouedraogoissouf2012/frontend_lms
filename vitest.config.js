import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.js'

/**
 * Config Vitest — réutilise la config Vite du projet (plugin Vue + alias `@`)
 * via mergeConfig, et ajoute le bloc `test`.
 *
 * - environment jsdom : permet les tests de composants Vue (window/document/storage).
 * - include limité aux fichiers `*.test.*` : `tests/contract/api-contract.spec.mjs`
 *   est un MODULE DE LOGIQUE partagé (pas une suite), il ne doit pas être collecté.
 * - test:contract (runner Node natif) reste disponible sans Vitest (cf. #17).
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['tests/**/*.test.{js,mjs}', 'src/**/*.test.{js,mjs}'],
      exclude: [...configDefaults.exclude, 'dist/**'],
      // 15 s (défaut 5 s) : absorbe les montages lourds légitimes (éditeur TipTap)
      // qui frôlaient la limite et flappaient. Un test réellement bloqué échoue
      // toujours — plus lentement, mais sans masquage par `--retry` (#282).
      testTimeout: 15000,
      coverage: {
        provider: 'v8',
        reportsDirectory: './coverage',
        // Couvre AUSSI components/views/stores (#282) : sans eux, le rapport
        // ignorait le gros de l'UI et surestimait la couverture réelle. Sans seuil
        // bloquant (introduction progressive) — la CI ne joue pas la couverture.
        include: [
          'src/services/**',
          'src/composables/**',
          'src/utils/**',
          'src/components/**',
          'src/views/**',
          'src/stores/**',
        ],
      },
    },
  }),
)
