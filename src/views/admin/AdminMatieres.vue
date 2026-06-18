<template>
  <DashboardLayout>
    <div class="matieres-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <BookOpenIcon class="page-icon" />
          <div>
            <h1 class="page-title">Gestion des Matières</h1>
            <p class="page-subtitle">{{ stats.total }} matière(s) · {{ stats.totalHeures }}h au total</p>
          </div>
        </div>
        <div class="header-actions">
          <button @click="refreshData" class="btn-refresh" title="Actualiser les données">
            <ArrowPathIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div v-if="!loading && !error" class="filters-card">
        <div class="filter-item-large">
          <label class="filter-label">
            <MagnifyingGlassIcon class="w-4 h-4" />
            Recherche
          </label>
          <input
            v-model="filters.search"
            @input="applyFilters"
            type="text"
            placeholder="Nom de matière, code..."
            class="filter-input"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">
            <AcademicCapIcon class="w-4 h-4" />
            Filière
          </label>
          <select v-model="filters.filiere_id" @change="applyFilters" class="filter-select">
            <option value="">Toutes les filières</option>
            <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
              {{ filiere.nom || filiere.name || filiere.code }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">
            <AcademicCapIcon class="w-4 h-4" />
            Niveau
          </label>
          <select v-model="filters.niveau_id" @change="applyFilters" class="filter-select">
            <option value="">Tous les niveaux</option>
            <option v-for="niveau in niveaux" :key="niveau.id" :value="niveau.id">
              {{ niveau.nom || niveau.code }}
            </option>
          </select>
        </div>
        <button
          v-if="filters.filiere_id || filters.niveau_id || filters.search"
          @click="resetFilters"
          class="btn-reset"
          title="Réinitialiser les filtres"
        >
          <ArrowPathIcon class="w-4 h-4" />
          Réinitialiser
        </button>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des matieres..." />

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadMatieres" class="error-retry-btn">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <!-- Matieres Table -->
      <div v-else-if="filteredMatieres.length > 0" class="modern-table-container">
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
            <tr v-for="matiere in filteredMatieres" :key="matiere.id">
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
                <button @click="viewMatiereDetails(matiere)" class="icon-btn" title="Voir détails">
                  <EyeIcon class="icon" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <BookOpenIcon class="empty-icon" />
        <p class="empty-message">Aucune matière trouvée</p>
      </div>

      <!-- Modal Détails Niveau -->
      <Teleport to="body">
        <div v-if="showNiveauModal" class="modal-overlay" @click="closeNiveauModal">
          <div class="modal-container" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-header-content">
                <AcademicCapIcon class="modal-icon" />
                <div>
                  <h2 class="modal-title">
                    {{ selectedNiveau?.niveau.nom || selectedNiveau?.niveau.code }}
                  </h2>
                  <p class="modal-subtitle">
                    {{ selectedNiveau?.matieres.length }} matière(s) ·
                    {{ selectedNiveau?.totalHeures }}h ·
                    {{ selectedNiveau?.totalSeances }} séance(s)
                  </p>
                </div>
              </div>
              <button @click="closeNiveauModal" class="modal-close">
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
                      v-for="matiere in selectedNiveau?.matieres"
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
                          @click="viewMatiereDetails(matiere)"
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
        <div v-if="showMatiereModal" class="modal-overlay" @click="closeMatiereModal">
          <div class="modal-container modal-matiere" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-header-content">
                <BookOpenIcon class="modal-icon" />
                <div>
                  <h2 class="modal-title">{{ selectedMatiere?.nom }}</h2>
                  <p class="modal-subtitle">{{ selectedMatiere?.code }}</p>
                </div>
              </div>
              <button @click="closeMatiereModal" class="modal-close">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>

            <!-- Modal Body - Details -->
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Coefficient</span>
                  <span class="detail-value">{{ selectedMatiere?.coefficient || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Heures totales</span>
                  <span class="detail-value">{{ selectedMatiere?.heures_total || 0 }}h</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Séances programmées</span>
                  <span class="detail-value">{{ selectedMatiere?.nb_seances_programmees || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Couleur</span>
                  <div class="color-preview" :style="{ backgroundColor: selectedMatiere?.couleur }"></div>
                </div>
              </div>

              <div v-if="selectedMatiere?.description" class="detail-section">
                <h3 class="detail-section-title">Description</h3>
                <p class="detail-description">{{ selectedMatiere.description }}</p>
              </div>

              <div v-if="selectedMatiere?.combinaisons?.length > 0" class="detail-section">
                <h3 class="detail-section-title">Combinaisons Filière/Niveau</h3>
                <div class="combinaisons-list">
                  <div
                    v-for="(combi, idx) in selectedMatiere.combinaisons"
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
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache, clearCache } from '@/services/cache'
// #28 : logique métier pure extraite (testée dans tests/unit/matieres.test.js)
import {
  filterMatieres,
  groupMatieresByNiveau,
  computeMatieresStats,
  getMatiereFilieres,
  getMatiereNiveaux
} from '@/utils/matieres'
import {
  BookOpenIcon,
  AcademicCapIcon,
  ClockIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'

// State
const matieres = ref([])
const filieres = ref([])
const niveaux = ref([])
const loading = ref(false)
const error = ref(null)

const filters = ref({
  search: '',
  filiere_id: '',
  niveau_id: ''
})

const showNiveauModal = ref(false)
const selectedNiveau = ref(null)

const showMatiereModal = ref(false)
const selectedMatiere = ref(null)


// Computeds délégués à la logique pure extraite (#28)
const filteredMatieres = computed(() => filterMatieres(matieres.value, filters.value))

const filteredNiveauxWithMatieres = computed(() =>
  groupMatieresByNiveau(filteredMatieres.value, niveaux.value)
)

const stats = computed(() => computeMatieresStats(matieres.value))

// getMatiereFilieres / getMatiereNiveaux : importés depuis @/utils/matieres (#28).

// View niveau details (open modal)
function viewNiveauDetails(niveauGroup) {
  selectedNiveau.value = niveauGroup
  showNiveauModal.value = true
}

// Close niveau modal
function closeNiveauModal() {
  showNiveauModal.value = false
  selectedNiveau.value = null
}

// View matiere full details (optional)
function viewMatiereDetails(matiere) {
  selectedMatiere.value = matiere
  showMatiereModal.value = true
}

// Close matiere modal
function closeMatiereModal() {
  showMatiereModal.value = false
  selectedMatiere.value = null
}

// Load matieres
async function loadMatieres() {
  // Try cache first
  const cached = readCache('admin_matieres')
  if (cached) {
    console.log('[CACHE] Matières admin chargées depuis le cache')
    matieres.value = cached.matieres
    filieres.value = cached.filieres
    niveaux.value = cached.niveaux
    loading.value = false
    refreshInBackground()
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('[ADMIN] Chargement de toutes les matières...')

    // Utiliser le nouvel endpoint admin qui enrichit les combinaisons
    const response = await klassciService.getAdminMatieres()

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors du chargement des matières')
    }

    matieres.value = response.data.matieres || []

    // Récupérer aussi la structure pour les filtres
    const structureData = await klassciService.getStructure()
    filieres.value = structureData?.filieres || []
    niveaux.value = structureData?.niveaux_etude || structureData?.niveaux || []

    console.log('[ADMIN] Matières:', matieres.value.length)
    console.log('[ADMIN] Filières:', filieres.value.length)
    console.log('[ADMIN] Niveaux:', niveaux.value.length)

    // Save to cache
    writeCache('admin_matieres', {
      matieres: matieres.value,
      filieres: filieres.value,
      niveaux: niveaux.value
    })

    console.log('[OK] Matières admin chargées avec combinaisons complètes')
  } catch (err) {
    console.error('[ERREUR] Chargement matières admin:', err)
    error.value = 'Impossible de charger les matières. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

// Refresh in background
async function refreshInBackground() {
  try {
    console.log('[BACKGROUND] Rafraîchissement matières admin...')

    const [response, structureData] = await Promise.all([
      klassciService.getAdminMatieres(),
      klassciService.getStructure()
    ])

    if (response.success) {
      matieres.value = response.data.matieres || []
      filieres.value = structureData?.filieres || []
      niveaux.value = structureData?.niveaux_etude || structureData?.niveaux || []

      writeCache('admin_matieres', {
        matieres: matieres.value,
        filieres: filieres.value,
        niveaux: niveaux.value
      })

      console.log('[BACKGROUND] Rafraîchissement terminé')
    }
  } catch (error) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
  }
}

// Refresh data manually
function refreshData() {
  clearCache('admin_matieres')
  loadMatieres()
}

// Apply filters
function applyFilters() {
  // Filters are applied via computed property
}

// Reset filters
function resetFilters() {
  filters.value.search = ''
  filters.value.filiere_id = ''
  filters.value.niveau_id = ''
}

// Lifecycle
onMounted(() => {
  loadMatieres()
})
</script>

<style scoped>
/* Container */
.matieres-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 3rem;
  height: 3rem;
  color: var(--primary-color, #6366f1);
  flex-shrink: 0;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-refresh {
  padding: 0.625rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: var(--hover-bg);
  transform: rotate(180deg);
}

/* Filters */
.filters-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-item-large {
  flex: 1;
  min-width: 300px;
}

.filter-item {
  min-width: 200px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 0.625rem;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.btn-reset {
  padding: 0.625rem 1rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--hover-bg);
}

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
  color: #ffffff;
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


.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  color: var(--text-tertiary);
}

.empty-message {
  font-size: 1rem;
  color: var(--text-secondary);
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
}

.error-icon {
  font-size: 4rem;
}

.error-content {
  text-align: center;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.error-message {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.error-retry-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  border: none;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: #4f46e5;
}

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

.matieres-table-main tbody tr:hover .matiere-color {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Numero Column */
.col-numero {
  width: 60px;
  text-align: center;
}

.numero-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
}

/* Matiere Column */
.col-matiere {
  min-width: 200px;
}

.matiere-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.matiere-color-small {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
  border: 2px solid var(--border-color);
}

.matiere-name {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--text-primary);
  line-height: 1.3;
}

/* Description Column */
.col-description {
  min-width: 300px;
  max-width: 400px;
}

.matiere-description {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.4;
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

.lecons-badge {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.evaluations-badge {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.data-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
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
  .matieres-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-card {
    flex-direction: column;
  }

  .filter-item-large,
  .filter-item {
    min-width: 100%;
  }

  .niveaux-grid {
    grid-template-columns: 1fr;
  }

  .modal-container {
    max-width: 100%;
    max-height: 95vh;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
