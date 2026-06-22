<template>
  <div class="results-card">
    <div class="results-header">
      <h3 class="results-title">Résultats par étudiant</h3>
      <div class="results-actions">
        <button @click="$emit('export')" class="btn-export">
          <DocumentArrowDownIcon class="w-5 h-5" />
          Exporter CSV
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="results-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nom complet</th>
            <th>Statut</th>
            <th>Note /20</th>
            <th>Score</th>
            <th>Date soumission</th>
            <th>Tentative</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(resultat, index) in resultats" :key="resultat.etudiant_id">
            <td>{{ index + 1 }}</td>
            <td class="student-name">{{ resultat.etudiant_nom_complet }}</td>
            <td>
              <span :class="getStatusClass(resultat.status)" class="status-badge">
                {{ getStatusLabel(resultat.status) }}
              </span>
            </td>
            <td>
              <span :class="getNoteClass(resultat.note)" class="note-value">
                {{ resultat.note !== null && resultat.note !== undefined ? parseFloat(resultat.note).toFixed(2) : '-' }}
              </span>
            </td>
            <td>{{ resultat.score !== null ? resultat.score : '-' }}</td>
            <td>{{ formatDateTime(resultat.submitted_at) }}</td>
            <td>{{ resultat.attempt || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="resultats.length === 0" class="empty-state">
        <UserGroupIcon class="empty-icon" />
        <p class="empty-text">Aucun résultat disponible</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Tableau « Résultats par étudiant » d'AdminEvaluationDetails (#H3 ≤300).
 * Présentation pure : liste des résultats (prop) + état vide. Les helpers de
 * statut/note/date sont injectés en props (parité exacte) ; l'export remonte
 * via l'événement `export`.
 */
import {
  UserGroupIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'

defineProps({
  resultats: { type: Array, default: () => [] },
  getStatusClass: { type: Function, required: true },
  getStatusLabel: { type: Function, required: true },
  getNoteClass: { type: Function, required: true },
  formatDateTime: { type: Function, required: true },
})

defineEmits(['export'])
</script>

<style scoped>
/* Results Card */
.results-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--card-shadow);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.results-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.results-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-export {
  padding: 0.625rem 1.25rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background var(--transition-fast);
}

.btn-export:hover {
  background: var(--primary-hover);
}

/* Table */
.table-container {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table thead {
  background: var(--neutral-light);
}

.results-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-primary);
}

.results-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
}

.student-name {
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-success {
  background: var(--success-light);
  color: var(--success);
}

.status-warning {
  background: var(--warning-light);
  color: var(--warning);
}

.status-error {
  background: var(--danger-light);
  color: var(--danger);
}

.status-default {
  background: var(--neutral-light);
  color: var(--text-secondary);
}

.note-value {
  font-weight: 600;
}

.note-excellent {
  color: #10b981;
}

.note-good {
  color: #3b82f6;
}

.note-average {
  color: #f59e0b;
}

.note-poor {
  color: #ef4444;
}

.empty-state {
  padding: 3rem;
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-secondary);
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 1rem;
}
</style>
