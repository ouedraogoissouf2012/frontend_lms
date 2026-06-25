/**
 * Test du composable useDashboardFormatters (#H3 ≤300) : fonctions pures de
 * présentation (initiales, libellé/classe de rôle, date relative). Aucune
 * dépendance externe à mocker.
 */
import { describe, it, expect } from 'vitest'
import { useDashboardFormatters } from '@/composables/useDashboardFormatters'

const { getInitials, getRoleLabel, getRoleClass, formatDate } = useDashboardFormatters()

describe('useDashboardFormatters (#H3)', () => {
  it('getInitials : deux mots -> deux initiales majuscules', () => {
    expect(getInitials('Jean Dupont')).toBe('JD')
  })

  it('getInitials : un seul mot -> deux premières lettres', () => {
    expect(getInitials('alice')).toBe('AL')
  })

  it('getInitials : vide -> ?', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials(null)).toBe('?')
  })

  it('getRoleLabel : libellés connus et repli sur la valeur brute', () => {
    expect(getRoleLabel('enseignant')).toBe('Enseignant')
    expect(getRoleLabel('superAdmin')).toBe('Admin')
    expect(getRoleLabel('inconnu')).toBe('inconnu')
  })

  it('getRoleClass : classes connues et repli role-default', () => {
    expect(getRoleClass('etudiant')).toBe('role-student')
    expect(getRoleClass('coordinateur')).toBe('role-coordinator')
    expect(getRoleClass('inconnu')).toBe('role-default')
  })

  it('formatDate : vide -> chaîne vide', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
  })

  it('formatDate : intervalles relatifs', () => {
    const now = Date.now()
    expect(formatDate(new Date(now - 30 * 1000).toISOString())).toBe('À l\'instant')
    expect(formatDate(new Date(now - 5 * 60 * 1000).toISOString())).toBe('Il y a 5min')
    expect(formatDate(new Date(now - 3 * 3600 * 1000).toISOString())).toBe('Il y a 3h')
    expect(formatDate(new Date(now - 2 * 86400 * 1000).toISOString())).toBe('Il y a 2j')
  })
})
