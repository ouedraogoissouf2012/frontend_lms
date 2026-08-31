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
]
