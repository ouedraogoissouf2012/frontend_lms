<template>
  <div class="grades-table-container">
    <div class="table-header">
      <h2 class="table-title">Toutes mes notes ({{ filteredEvaluations.length }})</h2>
    </div>

    <table class="grades-table">
      <thead>
        <tr>
          <th>Matière</th>
          <th>Titre de l'évaluation</th>
          <th>Type</th>
          <th>Note</th>
          <th>Coefficient</th>
          <th>Date</th>
          <th>Temps passé</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(evaluation, index) in filteredEvaluations"
          :key="index"
          class="evaluation-row"
          :class="{ 'row-new': isNew(evaluation) }"
        >
          <td class="matiere-cell">
            <div class="matiere-info">
              <i class="mdi mdi-book-open-variant matiere-icon"></i>
              <span class="matiere-name">{{ evaluation.matiere_nom }}</span>
            </div>
          </td>

          <td class="titre-cell">
            <div class="titre-info">
              <i class="mdi mdi-file-document eval-icon"></i>
              {{ evaluation.titre }}
              <span v-if="isNew(evaluation)" class="badge-new">Nouveau</span>
            </div>
          </td>

          <td>
            <span class="type-badge" :class="`type-${evaluation.type}`">
              {{ formatType(evaluation.type) }}
            </span>
          </td>

          <td>
            <span class="note-value" :class="getNoteClass(parseFloat(evaluation.note))">
              {{ evaluation.note }}/20
            </span>
          </td>

          <td class="coef-cell">
            <span class="coefficient-badge">
              × {{ evaluation.coefficient }}
            </span>
          </td>

          <td class="date-cell">
            {{ formatDate(evaluation.date_evaluation) }}
          </td>

          <td class="temps-cell">
            {{ formatTemps(evaluation.temps_passe) }}
          </td>

          <td class="actions-cell">
            <button
              class="btn-view"
              @click="$emit('view', evaluation.evaluation_id)"
            >
              <i class="mdi mdi-eye btn-icon"></i>
              Voir
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
/**
 * Tableau des notes élève (#H10 ≤300). Présentation pure : une ligne par
 * évaluation filtrée/triée. Les formats et classes viennent des utils purs
 * studentGrades ; le clic « Voir » est délégué au parent via l'évènement `view`.
 */
import {
  formatType,
  formatDate,
  formatTemps,
  getNoteClass,
  isNew,
} from '@/utils/studentGrades'

defineProps({
  filteredEvaluations: { type: Array, default: () => [] },
})

defineEmits(['view'])
</script>

<style scoped>
/* Table Container */
.grades-table-container {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}
.table-header {
  margin-bottom: 1rem;
}
.table-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
/* Grades Table */
.grades-table {
  width: 100%;
  border-collapse: collapse;
}
.grades-table thead {
  background: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-primary);
}
.grades-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.grades-table tbody tr {
  border-bottom: 1px solid var(--border-primary);
  transition: background-color 0.2s ease;
}
.grades-table tbody tr:last-child {
  border-bottom: none;
}
.grades-table tbody tr:hover {
  background-color: var(--bg-hover);
}
.grades-table tbody tr.row-new {
  background: linear-gradient(90deg, rgba(76, 175, 80, 0.05), transparent);
}
.grades-table td {
  padding: 1rem;
  color: var(--text-primary);
}
/* Table Cells */
.matiere-cell, .titre-cell {
  font-weight: 500;
}
.matiere-info, .titre-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.matiere-icon {
  color: var(--primary-color);
  font-size: 1.2rem;
}
.eval-icon {
  color: var(--text-secondary);
  font-size: 1.1rem;
}
.matiere-name {
  font-weight: 600;
  color: var(--text-primary);
}
.badge-new {
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, var(--md-green-500), var(--md-light-green-500));
  color: white;
  border-radius: 12px;
  font-weight: 700;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
.type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}
.type-devoir {
  background: rgba(33, 150, 243, 0.1);
  color: var(--md-blue-500);
}
.type-composition {
  background: rgba(156, 39, 176, 0.1);
  color: var(--md-purple-500);
}
.type-interrogation {
  background: rgba(255, 152, 0, 0.1);
  color: var(--md-orange-500);
}
.type-examen {
  background: rgba(244, 67, 54, 0.1);
  color: var(--md-red-500);
}
.type-tp, .type-td {
  background: rgba(0, 150, 136, 0.1);
  color: var(--md-teal-500);
}
.type-qcm {
  background: rgba(103, 58, 183, 0.1);
  color: var(--md-deep-purple-500);
}
.note-value {
  font-weight: 700;
  font-size: 1.125rem;
}
.note-excellent { color: var(--md-green-500); }
.note-good { color: var(--md-light-green-500); }
.note-average { color: var(--md-orange-500); }
.note-below-average { color: var(--md-deep-orange-500); }
.note-fail { color: var(--md-red-500); }
.coefficient-badge {
  display: inline-block;
  background: var(--bg-tertiary);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}
.date-cell, .temps-cell, .coef-cell {
  color: var(--text-secondary);
  font-size: 0.875rem;
  white-space: nowrap;
}
.actions-cell {
  text-align: center;
}
.btn-view {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-view:hover {
  background: var(--primary-color);
  color: white;
}
.btn-icon {
  font-size: 1rem;
}
/* Responsive */
@media (max-width: 1200px) {
  .grades-table {
    font-size: 0.875rem;
  }
  .grades-table th, .grades-table td {
    padding: 0.75rem 0.5rem;
  }
}
@media (max-width: 768px) {
  .grades-table-container {
    padding: 1rem;
    overflow-x: auto;
  }
  .grades-table {
    min-width: 900px;
  }
}
/* Print styles */
@media print {
  .actions-cell {
    display: none !important;
  }
  .grades-table-container {
    box-shadow: none;
    border: 1px solid var(--gray-200);
  }
}
</style>
