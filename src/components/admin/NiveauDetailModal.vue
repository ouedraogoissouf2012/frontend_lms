<template>
  <Teleport to="body">
    <div v-if="niveau" class="modal-overlay" @click="$emit('close')">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-header-content">
            <AcademicCapIcon class="modal-icon" />
            <div>
              <h2 class="modal-title">
                {{ niveau?.niveau.nom || niveau?.niveau.code }}
              </h2>
              <p class="modal-subtitle">
                {{ niveau?.matieres.length }} matière(s) ·
                {{ niveau?.totalHeures }}h ·
                {{ niveau?.totalSeances }} séance(s)
              </p>
            </div>
          </div>
          <button @click="$emit('close')" class="modal-close">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <div class="modal-body">
          <div class="table-wrapper">
            <table class="matieres-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Matière</th>
                  <th>Filière(s)</th>
                  <th>Code</th>
                  <th>Coef.</th>
                  <th>Heures</th>
                  <th>Séances</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="matiere in niveau?.matieres"
                  :key="matiere.id"
                  class="table-row"
                >
                  <td>
                    <div
                      class="matiere-color"
                      :style="{ backgroundColor: matiere.couleur || '#6366f1' }"
                    ></div>
                  </td>
                  <td class="col-matiere">
                    <div class="matiere-info">
                      <span class="matiere-name">{{ matiere.nom }}</span>
                      <span v-if="matiere.description" class="matiere-desc">
                        {{ matiere.description.substring(0, 50) }}{{ matiere.description.length > 50 ? '...' : '' }}
                      </span>
                    </div>
                  </td>
                  <td class="col-filieres">
                    <div class="filieres-badges">
                      <span
                        v-for="(filiere, idx) in getMatiereFilieres(matiere)"
                        :key="idx"
                        class="filiere-badge"
                        :title="filiere"
                      >
                        {{ filiere }}
                      </span>
                      <span v-if="getMatiereFilieres(matiere).length === 0" class="no-data">-</span>
                    </div>
                  </td>
                  <td>
                    <span class="code-badge">{{ matiere.code || '-' }}</span>
                  </td>
                  <td class="col-center">
                    <span class="coef-value">{{ matiere.coefficient || '-' }}</span>
                  </td>
                  <td class="col-center">
                    <span class="hours-badge">{{ matiere.heures_total || 0 }}h</span>
                  </td>
                  <td class="col-center">
                    <span class="seances-badge">{{ matiere.nb_seances_programmees || 0 }}</span>
                  </td>
                  <td class="col-actions">
                    <button
                      @click="$emit('view-matiere', matiere)"
                      class="action-btn"
                      title="Voir détails complets"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * Modale détail Niveau (#G1 décompo) : table des matières d'un niveau. Demande
 * l'ouverture de la modale Matière via l'event view-matiere (orchestré au parent).
 */
import { AcademicCapIcon, EyeIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { getMatiereFilieres } from '@/utils/matieres'

defineProps({
  niveau: { type: Object, default: null }
})
defineEmits(['close', 'view-matiere'])
</script>

<style scoped lang="scss">
/* Chrome de base (overlay/container/header/body + @media) : @use matiere-modal.
   Rendu identique à MatiereModals.vue ; ci-dessous, le spécifique à la table. */
@use '../../assets/styles/matiere-modal';

.table-wrapper {
  overflow-x: auto;
}
.matieres-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.matieres-table thead {
  background: var(--hover-bg);
}
.matieres-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}
.matieres-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}
.matieres-table tbody tr:hover {
  background: var(--hover-bg);
}
.matieres-table td {
  padding: 0.75rem;
  color: var(--text-secondary);
}
.matiere-color {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  border: 3px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}
.col-matiere {
  min-width: 200px;
}
.matiere-name {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--text-primary);
  line-height: 1.3;
}
.col-filieres {
  min-width: 180px;
}
.filieres-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.filiere-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: var(--hover-bg);
  color: var(--text-primary);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
}
.code-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: var(--hover-bg);
  color: var(--text-primary);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 2px solid var(--border-color);
  font-family: 'Courier New', monospace;
}
.col-center {
  text-align: center;
}
.coef-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.hours-badge {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.seances-badge {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.col-actions {
  text-align: center;
}
.action-btn {
  padding: 0.625rem;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.action-btn:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}
.no-data {
  color: var(--text-tertiary);
  font-style: italic;
}
</style>
