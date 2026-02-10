<template>
  <DashboardLayout>
    <div class="matieres-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon-wrapper">
            <BookOpenIcon class="page-icon" />
          </div>
          <div>
            <h1 class="page-title">Gestion des Matières</h1>
            <p class="page-subtitle">{{ stats.total }} matière(s) · {{ stats.totalHeures }}h au total</p>
          </div>
        </div>
        <div class="header-actions">
          <button @click="refreshData" class="btn-refresh" title="Actualiser les données">
            <ArrowPathIcon class="w-5 h-5" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div v-if="!loading && !error" class="filters-section">
        <div class="filter-item-large">
          <label class="filter-label">
            <MagnifyingGlassIcon class="w-4 h-4" />
            Rechercher une matière
          </label>
          <input
            v-model="filters.search"
            @input="applyFilters"
            type="text"
            placeholder="Nom, code, description..."
            class="filter-input"
          />
        </div>
        <div class="filter-row">
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
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <SkeletonLoader v-if="loading" type="card" :count="6" height="320px" />

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

      <!-- Matieres Grid - Modern Card Design -->
      <div v-else-if="filteredMatieres.length > 0" class="matieres-grid">
        <div
          v-for="matiere in filteredMatieres"
          :key="matiere.id"
          class="matiere-card"
          @click="viewMatiereDetails(matiere)"
        >
          <!-- Card Header with Color Accent -->
          <div class="card-header" :style="{ borderTopColor: matiere.couleur || '#6366f1' }">
            <div class="card-header-content">
              <div class="matiere-icon" :style="{ backgroundColor: matiere.couleur || '#6366f1' }">
                <BookOpenIcon class="w-5 h-5" />
              </div>
              <div class="matiere-title-section">
                <h3 class="matiere-title">{{ matiere.nom }}</h3>
                <span class="matiere-code">{{ matiere.code || 'Sans code' }}</span>
              </div>
            </div>
            <button
              @click.stop="viewMatiereDetails(matiere)"
              class="card-action-btn"
              title="Voir détails"
            >
              <EyeIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <!-- Description -->
            <p v-if="matiere.description" class="matiere-description">
              {{ matiere.description.substring(0, 100) }}{{ matiere.description.length > 100 ? '...' : '' }}
            </p>
            <p v-else class="matiere-description-empty">Aucune description disponible</p>

            <!-- Stats Grid -->
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon coefficient">
                  <span>×{{ matiere.coefficient || 1 }}</span>
                </div>
                <div class="stat-label">Coefficient</div>
              </div>
              <div class="stat-item">
                <div class="stat-icon hours">
                  <ClockIcon class="w-4 h-4" />
                  <span>{{ matiere.heures_total || 0 }}</span>
                </div>
                <div class="stat-label">Heures</div>
              </div>
              <div class="stat-item">
                <div class="stat-icon seances">
                  <CalendarIcon class="w-4 h-4" />
                  <span>{{ matiere.nb_seances_programmees || 0 }}</span>
                </div>
                <div class="stat-label">Séances</div>
              </div>
            </div>

            <!-- Filieres -->
            <div class="card-section">
              <div class="section-label">
                <AcademicCapIcon class="w-4 h-4" />
                <span>Filière(s)</span>
              </div>
              <div class="badges-wrapper">
                <span
                  v-for="(filiere, idx) in getMatiereFilieres(matiere)"
                  :key="idx"
                  class="badge badge-filiere"
                >
                  {{ filiere }}
                </span>
                <span v-if="getMatiereFilieres(matiere).length === 0" class="badge badge-empty">
                  Aucune filière
                </span>
              </div>
            </div>

            <!-- Niveaux -->
            <div class="card-section">
              <div class="section-label">
                <AcademicCapIcon class="w-4 h-4" />
                <span>Niveau(x)</span>
              </div>
              <div class="badges-wrapper">
                <span
                  v-for="(niveau, idx) in getMatiereNiveaux(matiere)"
                  :key="idx"
                  class="badge badge-niveau"
                >
                  {{ niveau }}
                </span>
                <span v-if="getMatiereNiveaux(matiere).length === 0" class="badge badge-empty">
                  Aucun niveau
                </span>
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="card-footer">
            <button
              @click.stop="viewMatiereDetails(matiere)"
              class="view-details-btn"
            >
              <span>Voir les détails</span>
              <ArrowRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <BookOpenIcon class="empty-icon" />
        <p class="empty-message">Aucune matière trouvée</p>
        <p class="empty-hint">Essayez de modifier vos filtres ou d'actualiser les données</p>
      </div>

      <!-- Modal Détails Matière -->
      <Teleport to="body">
        <div v-if="showMatiereModal" class="modal-overlay" @click="closeMatiereModal">
          <div class="modal-container modal-matiere" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-header-content">
                <div class="modal-icon-wrapper" :style="{ backgroundColor: selectedMatiere?.couleur || '#6366f1' }">
                  <BookOpenIcon class="modal-icon" />
                </div>
                <div>
                  <h2 class="modal-title">{{ selectedMatiere?.nom }}</h2>
                  <p class="modal-subtitle">{{ selectedMatiere?.code }}</p>
                </div>
              </div>
              <button @click="closeMatiereModal" class="modal-close">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>

            <!-- Modal Body -->
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
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { klassciService } from '@/services/klassci'
import {
  BookOpenIcon,
  AcademicCapIcon,
  ClockIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon
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

const showMatiereModal = ref(false)
const selectedMatiere = ref(null)

const CACHE_KEY = 'admin_matieres_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Computed: Filtered matieres
const filteredMatieres = computed(() => {
  let result = matieres.value

  // Filter by search
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(m =>
      (m.nom?.toLowerCase() || '').includes(search) ||
      (m.code?.toLowerCase() || '').includes(search) ||
      (m.description?.toLowerCase() || '').includes(search)
    )
  }

  // Filter by filiere
  if (filters.value.filiere_id) {
    result = result.filter(m => {
      if (!m.combinaisons || m.combinaisons.length === 0) return false
      return m.combinaisons.some(c => c.filiere?.id == filters.value.filiere_id)
    })
  }

  // Filter by niveau
  if (filters.value.niveau_id) {
    result = result.filter(m => {
      if (!m.combinaisons || m.combinaisons.length === 0) return false
      return m.combinaisons.some(c => c.niveau?.id == filters.value.niveau_id)
    })
  }

  return result
})

// Computed: Statistics
const stats = computed(() => {
  return {
    total: matieres.value.length,
    totalHeures: matieres.value.reduce((sum, m) => sum + (m.heures_total || 0), 0),
    totalSeances: matieres.value.reduce((sum, m) => sum + (m.nb_seances_programmees || 0), 0)
  }
})

// Get matiere filieres (unique)
function getMatiereFilieres(matiere) {
  if (!matiere.combinaisons || matiere.combinaisons.length === 0) return []

  const uniqueFilieres = new Set()
  matiere.combinaisons.forEach(combi => {
    if (combi.filiere?.code) {
      uniqueFilieres.add(combi.filiere.code)
    } else if (combi.filiere?.nom) {
      uniqueFilieres.add(combi.filiere.nom)
    }
  })

  return Array.from(uniqueFilieres)
}

// Get matiere niveaux (unique)
function getMatiereNiveaux(matiere) {
  if (!matiere.combinaisons || matiere.combinaisons.length === 0) return []

  const uniqueNiveaux = new Set()
  matiere.combinaisons.forEach(combi => {
    if (combi.niveau?.code) {
      uniqueNiveaux.add(combi.niveau.code)
    } else if (combi.niveau?.nom) {
      uniqueNiveaux.add(combi.niveau.nom)
    }
  })

  return Array.from(uniqueNiveaux)
}

// View matiere full details
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
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('[CACHE] Matières admin chargées depuis le cache')
        matieres.value = data.matieres
        filieres.value = data.filieres
        niveaux.value = data.niveaux
        loading.value = false
        refreshInBackground()
        return
      }
    } catch (err) {
      console.warn('[CACHE] Cache invalide, rechargement...')
    }
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
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: {
        matieres: matieres.value,
        filieres: filieres.value,
        niveaux: niveaux.value
      },
      timestamp: Date.now()
    }))

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

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: {
          matieres: matieres.value,
          filieres: filieres.value,
          niveaux: niveaux.value
        },
        timestamp: Date.now()
      }))

      console.log('[BACKGROUND] Rafraîchissement terminé')
    }
  } catch (error) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
  }
}

// Refresh data manually
function refreshData() {
  localStorage.removeItem(CACHE_KEY)
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
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-icon-wrapper {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: white;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--text-primary) 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0.5rem 0 0 0;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-refresh {
  padding: 0.75rem 1.5rem;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.btn-refresh:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.btn-refresh:hover svg {
  transform: rotate(180deg);
}

.btn-refresh svg {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Filters Section */
.filters-section {
  background: var(--card-bg);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
}

.filter-item-large {
  margin-bottom: 1.25rem;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: flex-end;
}

.filter-item {
  min-width: 0;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.625rem;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--input-bg);
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  color: var(--text-primary);
  font-size: 0.9375rem;
  transition: all 0.2s;
  font-weight: 500;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.btn-reset {
  padding: 0.875rem;
  background: #ef4444;
  border: none;
  border-radius: 0.75rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  width: 3rem;
  height: 3rem;
}

.btn-reset:hover {
  background: #dc2626;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* Matieres Grid */
.matieres-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
}

/* Matiere Card */
.matiere-card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 1.25rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.matiere-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  border-color: var(--primary-color);
}

/* Card Header */
.card-header {
  padding: 1.5rem;
  border-top: 4px solid var(--primary-color);
  background: linear-gradient(135deg, var(--card-bg) 0%, var(--hover-bg) 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-header-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  flex: 1;
}

.matiere-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.matiere-title-section {
  flex: 1;
  min-width: 0;
}

.matiere-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.375rem 0;
  line-height: 1.3;
  word-wrap: break-word;
}

.matiere-code {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--hover-bg);
  color: var(--text-secondary);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
}

.card-action-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.card-action-btn:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  transform: scale(1.1);
}

/* Card Body */
.card-body {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.matiere-description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.matiere-description-empty {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  font-style: italic;
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: var(--hover-bg);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-icon.coefficient {
  color: #f59e0b;
}

.stat-icon.hours {
  color: #3b82f6;
}

.stat-icon.seances {
  color: #10b981;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-align: center;
}

/* Card Section */
.card-section {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badges-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge {
  padding: 0.375rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;
}

.badge-filiere {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.badge-niveau {
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.badge-empty {
  background: var(--hover-bg);
  color: var(--text-tertiary);
  border-color: var(--border-color);
  font-style: italic;
}

/* Card Footer */
.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--hover-bg);
}

.view-details-btn {
  width: 100%;
  padding: 0.875rem 1.25rem;
  background: transparent;
  border: 2px solid var(--primary-color);
  border-radius: 0.75rem;
  color: var(--primary-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  font-weight: 700;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.view-details-btn:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: var(--card-bg);
  border-radius: 1.25rem;
  border: 2px dashed var(--border-color);
}

.empty-icon {
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  color: var(--text-tertiary);
  opacity: 0.5;
}

.empty-message {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-hint {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 1.25rem;
  border: 2px solid #ef4444;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
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
  padding: 0.875rem 1.5rem;
  background: var(--primary-color);
  border: none;
  border-radius: 0.75rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.error-retry-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Container */
.modal-container {
  background: var(--card-bg);
  border-radius: 1.25rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--border-color);
}

@keyframes slideUp {
  from {
    transform: translateY(2rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 2px solid var(--border-color);
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.modal-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-subtitle {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0.375rem 0 0 0;
  font-weight: 500;
}

.modal-close {
  width: 3rem;
  height: 3rem;
  background: var(--hover-bg);
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
  transform: scale(1.05);
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1.25rem;
  background: var(--hover-bg);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.detail-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.color-preview {
  width: 4rem;
  height: 4rem;
  border-radius: 0.75rem;
  border: 2px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Detail Section */
.detail-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.detail-section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1.25rem 0;
}

.detail-description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.7;
  padding: 1.25rem;
  background: var(--hover-bg);
  border-radius: 0.75rem;
  border-left: 4px solid var(--primary-color);
}

/* Combinaisons List */
.combinaisons-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.combinaison-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--hover-bg);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.combinaison-item:hover {
  background: var(--card-bg);
  border-color: var(--primary-color);
  transform: translateX(4px);
}

.combinaison-filiere,
.combinaison-niveau {
  padding: 0.5rem 1rem;
  background: var(--card-bg);
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.combinaison-separator {
  color: var(--text-tertiary);
  font-size: 1.25rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .matieres-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .matieres-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .filter-row {
    grid-template-columns: 1fr;
  }

  .matieres-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
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
