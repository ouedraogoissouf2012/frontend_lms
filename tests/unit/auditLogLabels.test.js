/**
 * Libellés du journal d'audit (ARRÊT 1, D127) : des tables FERMÉES, en français.
 * Une valeur hors table rend « — » : jamais le code du serveur (`login_failed`), jamais un nom de
 * classe PHP (`App\Models\…`), jamais une valeur inventée.
 */
import { describe, it, expect } from 'vitest'
import { auditActionLabel, auditElementLabel, auditEcoleLabel, AUDIT_FILTRE_ACTIONS } from '@/utils/auditLogLabels'
import { AUDIT_LOG_CAPTURE, CONNEXION, COPIE_MODIFIEE, ECHEC_CONNEXION, INCONNUE } from '../fixtures/auditLog'

describe('auditActionLabel', () => {
  it('les 9 actions validées par le serveur (ViewAuditLogRequest)', () => {
    expect(['create', 'update', 'delete', 'view', 'export', 'import', 'login', 'logout', 'login_failed'].map(auditActionLabel))
      .toEqual(['Création', 'Modification', 'Suppression', 'Consultation', 'Export', 'Import', 'Connexion', 'Déconnexion', 'Échec de connexion'])
  })

  // #1014 : la colonne est une string(32) libre. Voici tout ce que le serveur ÉCRIT aujourd'hui.
  it('les actions que le serveur écrit au-delà des 9 du filtre (visio, écoles, comptes, rétention)', () => {
    expect([
      'visio_recording_start', 'visio_recording_stop', 'visio_recording_read',
      'institution.mode_changed', 'institution.soft_deleted', 'institution.purged',
      'user.soft_deleted', 'user.purged', 'recording.purged', 'chapter.purged', 'audit-logs.purged.bulk',
    ].map(auditActionLabel)).toEqual([
      'Enregistrement visio démarré', 'Enregistrement visio arrêté', 'Enregistrement visio consulté',
      'Mode de l’école changé', 'École supprimée (récupérable)', 'École purgée (définitif)',
      'Compte supprimé (récupérable)', 'Compte purgé (définitif)', 'Enregistrement purgé', 'Chapitre purgé',
      'Purge groupée du journal',
    ])
  })

  it('le filtre ne propose QUE les 9 valeurs que ViewAuditLogRequest accepte (sinon 422)', () => {
    expect(AUDIT_FILTRE_ACTIONS.map(([v]) => v))
      .toEqual(['create', 'update', 'delete', 'view', 'export', 'import', 'login', 'logout', 'login_failed'])
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

  it('les autres modèles audités (#1014) : école, compte, enregistrement visio, chapitre', () => {
    expect(auditElementLabel('App\\Models\\Institution', 1)).toBe('École n° 1')
    expect(auditElementLabel('App\\Models\\User', 4)).toBe('Compte n° 4')
    expect(auditElementLabel('App\\Models\\SeanceRecording', 12)).toBe('Enregistrement visio n° 12')
    expect(auditElementLabel('App\\Models\\Chapter', 3)).toBe('Chapitre n° 3')
  })

  it('sans élément (connexion) ou type inconnu : « — », jamais le nom de classe', () => {
    expect(auditElementLabel(null, null)).toBe('—')
    expect(auditElementLabel(INCONNUE.auditable_type, 2)).toBe('—')
    expect(auditElementLabel('Evaluation', 3)).toBe('—')
  })
})

describe('la capture réelle (#1014) se lit entièrement en français', () => {
  it('enregistrement visio et échec de connexion', () => {
    const [echec, visio] = AUDIT_LOG_CAPTURE.data.data
    expect([auditActionLabel(visio.action), auditElementLabel(visio.auditable_type, visio.auditable_id), auditEcoleLabel(visio)])
      .toEqual(['Enregistrement visio démarré', 'Enregistrement visio n° 12', 'Collège Les Palmiers'])
    expect([auditActionLabel(echec.action), auditElementLabel(echec.auditable_type, echec.auditable_id), auditEcoleLabel(echec)])
      .toEqual(['Échec de connexion', '—', '—'])
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
