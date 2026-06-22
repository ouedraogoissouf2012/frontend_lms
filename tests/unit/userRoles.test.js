/**
 * Tests du util pur getRoleLabel (#G1 décompo) — mapping rôle -> libellé FR,
 * partagé entre la table d'AdminUsers et UserDetailModal.
 */
import { describe, it, expect } from 'vitest'
import { getRoleLabel } from '@/utils/userRoles'

describe('utils/userRoles — getRoleLabel', () => {
  it('mappe les rôles connus vers leur libellé FR', () => {
    expect(getRoleLabel('etudiant')).toBe('Étudiant')
    expect(getRoleLabel('student')).toBe('Étudiant')
    expect(getRoleLabel('enseignant')).toBe('Enseignant')
    expect(getRoleLabel('teacher')).toBe('Enseignant')
    expect(getRoleLabel('coordinateur')).toBe('Coordinateur')
    expect(getRoleLabel('admin')).toBe('Admin')
    expect(getRoleLabel('superAdmin')).toBe('Super Admin')
  })
  it('retourne le rôle brut si inconnu', () => {
    expect(getRoleLabel('wizard')).toBe('wizard')
    expect(getRoleLabel('')).toBe('')
  })
})
