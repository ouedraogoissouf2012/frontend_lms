<template>
  <div class="modern-table-container">
    <table class="modern-table">
      <thead>
        <tr>
          <th>MATIÈRE</th>
          <th>FILIÈRE(S)</th>
          <th>NIVEAUX D'ÉTUDE</th>
          <th>COEF.</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="matiere in matieres" :key="matiere.id">
          <td class="matiere-cell">
            <div class="matiere-indicator" :style="{ backgroundColor: matiere.couleur || '#6366f1' }"></div>
            <span class="matiere-text">{{ matiere.nom }}</span>
          </td>
          <td>
            <div class="text-content">
              <span v-for="(filiere, idx) in getMatiereFilieres(matiere)" :key="idx" class="list-item">
                {{ filiere }}
              </span>
              <span v-if="getMatiereFilieres(matiere).length === 0" class="empty-value">-</span>
            </div>
          </td>
          <td>
            <div class="text-content">
              <span v-for="(niveau, idx) in getMatiereNiveaux(matiere)" :key="idx" class="list-item">
                {{ niveau }}
              </span>
              <span v-if="getMatiereNiveaux(matiere).length === 0" class="empty-value">-</span>
            </div>
          </td>
          <td class="centered-cell">{{ matiere.coefficient || '-' }}</td>
          <td class="actions-cell">
            <button @click="$emit('view', matiere)" class="icon-btn" title="Voir détails">
              <EyeIcon class="icon" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
/**
 * Tableau des matières d'AdminMatieres (#G1 ≤300). Présentation pure : reçoit la
 * liste filtrée en prop, dérive filières/niveaux via la logique pure
 * (@/utils/matieres) et émet `view` au clic sur l'icône détails. Aucun appel API.
 */
import { EyeIcon } from '@heroicons/vue/24/outline'
import { getMatiereFilieres, getMatiereNiveaux } from '@/utils/matieres'

defineProps({
  matieres: { type: Array, default: () => [] },
})

defineEmits(['view'])
</script>

<style scoped>
/* Modern Table Container */
.modern-table-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 2rem;
}

/* Modern Table */
.modern-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg);
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Table Header - Style bleu vif comme l'exemple */
.modern-table thead {
  background: linear-gradient(135deg, #4a90e2 0%, #5a9df2 100%);
}

.modern-table thead tr {
  background: transparent;
}

.modern-table th {
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.8125rem;
  color: var(--white);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}

.modern-table th:last-child {
  border-right: none;
}

/* Table Body */
.modern-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.15s ease;
}

.modern-table tbody tr:hover {
  background: var(--hover-bg);
}

.modern-table tbody tr:last-child {
  border-bottom: none;
}

.modern-table td {
  padding: 1.125rem 1.25rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  vertical-align: middle;
  border-right: 1px solid var(--border-color);
}

.modern-table td:last-child {
  border-right: none;
}

/* Matiere Cell avec indicateur de couleur */
.matiere-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.matiere-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.matiere-text {
  font-weight: 600;
  color: var(--text-primary);
}

/* Text Content - pour les listes (filières, niveaux) */
.text-content {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.list-item {
  display: block;
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.4;
}

.empty-value {
  color: var(--text-secondary);
  font-style: italic;
}

/* Centered Cell - pour les valeurs numériques */
.centered-cell {
  text-align: center;
  font-weight: 500;
  color: var(--text-primary);
}

/* Actions Cell */
.actions-cell {
  text-align: center;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}

.icon-btn .icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .modern-table th,
  .modern-table td {
    padding: 0.875rem 1rem;
    font-size: 0.8125rem;
  }
}
</style>
