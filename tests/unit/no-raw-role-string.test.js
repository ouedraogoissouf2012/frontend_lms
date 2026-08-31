import { describe, it, expect } from 'vitest'
import { Linter } from 'eslint'
import rule from '../../eslint-rules/no-raw-role-string.js'

function lint(code) {
  const linter = new Linter()
  return linter.verify(code, {
    plugins: { local: { rules: { 'no-raw-role-string': rule } } },
    rules: { 'local/no-raw-role-string': 'error' },
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
  })
}

describe('no-raw-role-string', () => {
  it('autorise les helpers roles.js et les comparaisons non-rôle', () => {
    expect(lint("isTeacher(user)")).toEqual([])
    expect(lint("u.role === filterRole")).toEqual([])
    expect(lint("status === 'enseignant'")).toEqual([])
  })

  it('interdit role === et includes sur un rôle brut', () => {
    expect(lint("user.role === 'enseignant'").length).toBe(1)
    expect(lint("role === 'etudiant'").length).toBe(1)
    expect(lint("['coordinateur', 'superAdmin'].includes(user.role)").length).toBe(1)
  })
})
