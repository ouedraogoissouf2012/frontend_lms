/**
 * Libellés du journal d'audit (ARRÊT 1, D127) : des tables FERMÉES, en français.
 * Une valeur hors table rend « — » : jamais le code du serveur (`login_failed`), jamais un nom de
 * classe PHP (`App\Models\…`), jamais une valeur inventée.
 */
import { describe, it, expect } from 'vitest'
import { auditActionLabel, auditElementLabel, auditEcoleLabel } from '@/utils/auditLogLabels'
import { CONNEXION, COPIE_MODIFIEE, ECHEC_CONNEXION, INCONNUE } from '../fixtures/auditLog'

describe('auditActionLabel', () => {
  it('les 9 actions validées par le serveur (ViewAuditLogRequest)', () => {
    expect(['create', 'update', 'delete', 'view', 'export', 'import', 'login', 'logout', 'login_failed'].map(auditActionLabel))
      .toEqual(['Création', 'Modification', 'Suppression', 'Consultation', 'Export', 'Import', 'Connexion', 'Déconnexion', 'Échec de connexion'])
  })

  it('inconnue, absente ou nom hérité : « — »', () => {
    for (const v of ['teleport', '', null, undefined, 'toString', '__proto__']) expect(auditActionLabel(v)).toBe('—')
  })
})

describe('auditElementLabel', () => {
  it('les 3 modèles journalisés, avec leur numéro', () => {
    expect(auditElementLabel('App\\Models\\Evaluation', 3)).toBe('Évaluation n° 3')
    expect(auditElementLabel(COPIE_MODIFIEE.auditable_type, 31)).toBe('Copie d’évaluation n° 31')
    expect(auditElementLabel('App\\Models\\QuizAttempt', 8)).toBe('Tentative de quiz n° 8')
  })

  it('sans élément (connexion) ou type inconnu : « — », jamais le nom de classe', () => {
    expect(auditElementLabel(null, null)).toBe('—')
    expect(auditElementLabel(INCONNUE.auditable_type, 2)).toBe('—')
    expect(auditElementLabel('Evaluation', 3)).toBe('—')
  })
})

describe('auditEcoleLabel (D127)', () => {
  it('le nom de l’école s’il est servi ; sinon son numéro, une valeur réelle', () => {
    expect(auditEcoleLabel(CONNEXION)).toBe('Collège Fictif Horizon')
    expect(auditEcoleLabel(COPIE_MODIFIEE)).toBe('École n° 9')
  })

  it('aucune école (échec de connexion, compte de plateforme) : « — »', () => {
    expect(auditEcoleLabel(ECHEC_CONNEXION)).toBe('—')
    expect(auditEcoleLabel({ institution_id: 7, institution: { id: 7, name: '' } })).toBe('École n° 7')
  })
})
