<template>
      <Teleport to="body">
        <div v-if="niveau" class="modal-overlay" @click="$emit('close-niveau')">
          <div class="modal-container" @click.stop>
            <!-- Modal Header -->
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
              <button @click="$emit('close-niveau')" class="modal-close">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>

            <!-- Modal Body - Table -->
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
                      <!-- Color -->
                      <td>
                        <div
                          class="matiere-color"
                          :style="{ backgroundColor: matiere.couleur || '#6366f1' }"
                        ></div>
                      </td>

                      <!-- Matière -->
                      <td class="col-matiere">
                        <div class="matiere-info">
                          <span class="matiere-name">{{ matiere.nom }}</span>
                          <span v-if="matiere.description" class="matiere-desc">
                            {{ matiere.description.substring(0, 50) }}{{ matiere.description.length > 50 ? '...' : '' }}
                          </span>
                        </div>
                      </td>

                      <!-- Filières -->
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

                      <!-- Code -->
                      <td>
                        <span class="code-badge">{{ matiere.code || '-' }}</span>
                      </td>

                      <!-- Coefficient -->
                      <td class="col-center">
                        <span class="coef-value">{{ matiere.coefficient || '-' }}</span>
                      </td>

                      <!-- Heures -->
                      <td class="col-center">
                        <span class="hours-badge">{{ matiere.heures_total || 0 }}h</span>
                      </td>

                      <!-- Séances -->
                      <td class="col-center">
                        <span class="seances-badge">{{ matiere.nb_seances_programmees || 0 }}</span>
                      </td>

                      <!-- Actions -->
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

      <!-- Modal Détails Matière (optional full details) -->
      <Teleport to="body">
        <div v-if="matiere" class="modal-overlay" @click="$emit('close-matiere')">
          <div class="modal-container modal-matiere" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-header-content">
                <BookOpenIcon class="modal-icon" />
                <div>
                  <h2 class="modal-title">{{ matiere?.nom }}</h2>
                  <p class="modal-subtitle">{{ matiere?.code }}</p>
                </div>
              </div>
              <button @click="$emit('close-matiere')" class="modal-close">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>

            <!-- Modal Body - Details -->
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Coefficient</span>
                  <span class="detail-value">{{ matiere?.coefficient || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Heures totales</span>
                  <span class="detail-value">{{ matiere?.heures_total || 0 }}h</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Séances programmées</span>
                  <span class="detail-value">{{ matiere?.nb_seances_programmees || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Couleur</span>
                  <div class="color-preview" :style="{ backgroundColor: matiere?.couleur }"></div>
                </div>
              </div>

              <div v-if="matiere?.description" class="detail-section">
                <h3 class="detail-section-title">Description</h3>
                <p class="detail-description">{{ matiere.description }}</p>
              </div>

              <div v-if="matiere?.combinaisons?.length > 0" class="detail-section">
                <h3 class="detail-section-title">Combinaisons Filière/Niveau</h3>
                <div class="combinaisons-list">
                  <div
                    v-for="(combi, idx) in matiere.combinaisons"
                    :key="idx"
                    class="combinaison-item"
                  >
                    <span class="combinaison-filiere">
                      {{ combi.filiere?.nom || combi.filiere?.code || '-' }}
                    </span>
                    <span class="combinaison-separator">→</span>
                    <span class="combinaison-niveau">
                      {{ combi.niveau?.nom || combi.niveau?.code || '-' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
</template>

<script setup>
/**
 * Modales détail d'AdminMatieres (#G1 décompo) : modale Niveau (table des matières
 * du niveau) et modale Matière (détails). La modale Niveau demande l'ouverture de
 * la modale Matière via l'event view-matiere (orchestration au parent).
 */
import { AcademicCapIcon, BookOpenIcon, EyeIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { getMatiereFilieres } from '@/utils/matieres'

defineProps({
  niveau: { type: Object, default: null },
  matiere: { type: Object, default: null }
})
defineEmits(['close-niveau', 'close-matiere', 'view-matiere'])
</script>

<style scoped lang="scss">
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}
/* Modal Container */
.modal-container {
  background: var(--card-bg);
  border-radius: 1rem;
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.modal-matiere {
  max-width: 700px;
}
/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}
.modal-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.modal-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}
.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.modal-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}
.modal-close {
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.modal-close:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}
/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}
/* Table Wrapper */
.table-wrapper {
  overflow-x: auto;
}
/* Matieres Table */
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
/* Matiere Color */
.matiere-color {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  border: 3px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}
/* Matiere Column */
.col-matiere {
  min-width: 200px;
}
.matiere-name {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--text-primary);
  line-height: 1.3;
}
/* Filières Badges */
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
/* Code Badge */
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
/* Centered Columns */
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
/* Actions */
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
/* No Data */
.no-data {
  color: var(--text-tertiary);
  font-style: italic;
}
/* Detail Grid (for matiere modal) */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.detail-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}
.color-preview {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  border: 2px solid var(--border-color);
}
/* Detail Section */
.detail-section {
  margin-top: 2rem;
}
.detail-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}
.detail-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
/* Combinaisons List */
.combinaisons-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.combinaison-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--hover-bg);
  border-radius: 0.5rem;
}
.combinaison-filiere,
.combinaison-niveau {
  padding: 0.375rem 0.75rem;
  background: var(--card-bg);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}
.combinaison-separator {
  color: var(--text-tertiary);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 95vh;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
