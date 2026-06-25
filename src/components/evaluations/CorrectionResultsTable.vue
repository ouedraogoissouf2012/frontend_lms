<template>
  <div class="results-card">
    <div class="results-header">
      <h2 class="results-title">Résultats détaillés</h2>
      <button @click="$emit('export')" class="btn-export">
        <DocumentArrowDownIcon class="w-5 h-5" />
        Exporter (Excel)
      </button>
    </div>

    <div v-if="resultats.length > 0" class="table-container">
      <table class="results-table">
        <thead>
          <tr>
            <th class="th-name">Étudiant</th>
            <th class="th-center">Note</th>
            <th class="th-center">Statut</th>
            <th class="th-center">Date soumission</th>
            <th class="th-center">Tentative</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="resultat in resultats" :key="resultat.etudiant_id" class="table-row">
            <td class="td-name">
              <div class="student-info">
                <div class="student-avatar">
                  {{ getInitials(resultat.etudiant_nom_complet) }}
                </div>
                <span>{{ resultat.etudiant_nom_complet }}</span>
              </div>
            </td>
            <td class="td-center">
              <span v-if="resultat.note !== null" :class="getNoteClass(resultat.note)" class="note-badge">
                {{ resultat.note }}/20
              </span>
              <span v-else class="note-empty">-</span>
            </td>
            <td class="td-center">
              <span :class="getStatusClass(resultat.status)" class="status-badge">
                {{ getStatusLabel(resultat.status) }}
              </span>
            </td>
            <td class="td-center td-date">
              {{ resultat.submitted_at ? formatDateTime(resultat.submitted_at) : '-' }}
            </td>
            <td class="td-center">
              <span v-if="resultat.attempt" class="attempt-badge">
                Tentative {{ resultat.attempt }}
              </span>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-results">
      <UserGroupIcon class="empty-icon" />
      <p class="empty-text">Aucun résultat pour le moment</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Tableau des résultats détaillés (corrections enseignant, H2 ≤300) : ligne par
 * étudiant (note, statut, date, tentative) + bouton d'export. Section
 * présentationnelle extraite verbatim ; helpers de présentation purs via utils.
 * Émet `export`. Le tableau reste monobloc (sélecteurs descendants `.results-table td`).
 * Les badges note/statut viennent du partial @use'd (CSS verbatim).
 */
import { DocumentArrowDownIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import {
  getInitials,
  getNoteClass,
  getStatusClass,
  getStatusLabel,
  formatDateTime
} from '@/utils/evaluationCorrectionsFormat'

defineProps({
  resultats: { type: Array, default: () => [] }
})

defineEmits(['export'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/correction-badges';

/* Results Card */
.results-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.results-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.results-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.th-center {
  text-align: center;
}

.th-name {
  width: 35%;
}

.table-row {
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}

.table-row:hover {
  background: var(--bg-hover);
}

.results-table td {
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.td-center {
  text-align: center;
}

.td-date {
  color: var(--text-secondary);
  font-size: 0.8125rem;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

/* Empty State */
.empty-results {
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-tertiary);
  margin: 0 auto 1rem;
}

.empty-text {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-export {
    width: 100%;
    justify-content: center;
  }

  .table-container {
    overflow-x: scroll;
  }

  .results-table {
    min-width: 600px;
  }
}
</style>
