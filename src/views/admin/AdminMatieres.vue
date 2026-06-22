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

      <MatiereModals
        :niveau="showNiveauModal ? selectedNiveau : null"
        :matiere="showMatiereModal ? selectedMatiere : null"
        @close-niveau="closeNiveauModal"
        @close-matiere="closeMatiereModal"
        @view-matiere="viewMatiereDetails"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import MatiereModals from '@/components/admin/MatiereModals.vue'
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

/* Responsive */
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
}</style>
