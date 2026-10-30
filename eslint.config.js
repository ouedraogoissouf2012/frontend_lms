import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import noRawRoleString from './eslint-rules/no-raw-role-string.js'

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  ...pluginVue.configs['flat/essential'],
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      globals: { ...globals.browser },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      local: { rules: { 'no-raw-role-string': noRawRoleString } },
    },
    rules: {
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      'vue/no-mutating-props': 'off',
      'local/no-raw-role-string': 'error',
    },
  },
  {
    files: ['src/constants/roles.js'],
    rules: { 'local/no-raw-role-string': 'off' },
  },
  // Fichiers de test : UNE seule règle, pour ne pas faire surgir les écarts préexistants
  // aux autres règles (chantier séparé). Une fonction RENDUE par beforeEach ou beforeAll
  // est un nettoyage que Vitest appelle après le test : `beforeEach(() => fn.mockReset())`
  // rend le mock, qui est alors rappelé sans argument. On écrit le hook en bloc { }.
  {
    files: ['tests/**/*.{js,mjs}', 'src/**/__tests__/**/*.js'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'CallExpression[callee.name=/^(beforeEach|beforeAll)$/] > ArrowFunctionExpression[body.type!="BlockStatement"]',
        message: "Écrire ce hook en bloc { } : une fonction qu'il rendrait serait appelée comme nettoyage après le test.",
      }],
    },
  },
]
