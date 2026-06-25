/**
 * Helpers de présentation PURS des résultats/corrections enseignant (H2).
 *
 * Extraits verbatim de `views/teacher/EvaluationCorrections.vue` : formats de
 * date, initiales d'avatar, classes/libellés de note et de statut. Fonctions
 * pures (aucun effet de bord, aucune dépendance Vue) → partagées entre le tableau
 * de résultats et l'export CSV du composable, testables isolément.
 */

export function formatDate(date) {
  if (!date) return 'Non définie'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatDateTime(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function getNoteClass(note) {
  if (note >= 16) return 'note-excellent'
  if (note >= 14) return 'note-good'
  if (note >= 10) return 'note-average'
  return 'note-low'
}

export function getStatusClass(status) {
  const classes = {
    'soumis': 'status-submitted',
    'corrige': 'status-corrected',
    'en_cours': 'status-ongoing',
    'non_passee': 'status-not-taken'
  }
  return classes[status] || 'status-default'
}

export function getStatusLabel(status) {
  const labels = {
    'soumis': 'Soumis',
    'corrige': 'Corrigé',
    'en_cours': 'En cours',
    'non_passee': 'Non passée'
  }
  return labels[status] || status
}
