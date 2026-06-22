<template>
  <DashboardLayout>
    <div class="admin-enseignants-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Gestion des Enseignants</h1>
          <p class="page-subtitle">Liste complète des enseignants et leurs affectations</p>
        </div>
        <button @click="loadEnseignants(true)" class="refresh-btn" :disabled="loading">
          <i class="fa fa-refresh btn-icon"></i>
          <span class="btn-text">Actualiser</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <i class="fa fa-user stat-icon"></i>
          <div class="stat-details">
            <span class="stat-value">{{ enseignants.length }}</span>
            <span class="stat-label">Enseignants</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa fa-book stat-icon"></i>
          <div class="stat-details">
            <span class="stat-value">{{ totalMatieres }}</span>
            <span class="stat-label">Matières Assignées</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa fa-building stat-icon"></i>
          <div class="stat-details">
            <span class="stat-value">{{ totalClasses }}</span>
            <span class="stat-label">Classes Assignées</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa fa-sun-o stat-icon"></i>
          <div class="stat-details">
            <span class="stat-value">{{ enseignantsActifs }}</span>
            <span class="stat-label">Actifs</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des enseignants..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <h3 class="error-title">Erreur de Chargement</h3>
        <p class="error-message">{{ error }}</p>
        <button @click="loadEnseignants" class="retry-btn">Réessayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="enseignants.length === 0" class="empty-state">
        <i class="fa fa-user empty-icon"></i>
        <h3 class="empty-title">Aucun Enseignant</h3>
        <p class="empty-message">Aucun enseignant n'a été trouvé dans le système.</p>
      </div>

      <!-- Enseignants Grid -->
      <div v-else class="enseignants-grid">
        <div
          v-for="enseignant in enseignants"
          :key="enseignant.id"
          class="enseignant-card"
          @click="selectEnseignant(enseignant)"
        >
          <!-- Avatar & Header -->
          <div class="enseignant-header">
            <div class="enseignant-avatar">
              <span>{{ getInitials(enseignant) }}</span>
            </div>
            <div class="enseignant-info">
              <h3 class="enseignant-name">{{ enseignant.nom }} {{ enseignant.prenom }}</h3>
              <p class="enseignant-email">{{ enseignant.email || 'Email non disponible' }}</p>
            </div>
          </div>

          <!-- Enseignant Details -->
          <div class="enseignant-details">
            <!-- Matières -->
            <div class="detail-row">
              <i class="fa fa-bars detail-icon"></i>
              <span class="detail-label">Matières:</span>
              <span class="detail-value">{{ (enseignant.matieres?.length || 0) }}</span>
            </div>

            <!-- Classes -->
            <div class="detail-row">
              <i class="fa fa-th-large detail-icon"></i>
              <span class="detail-label">Classes:</span>
              <span class="detail-value">{{ getEnseignantClassesCount(enseignant) }}</span>
            </div>

            <!-- Téléphone -->
            <div v-if="enseignant.telephone" class="detail-row">
              <span class="detail-icon">☎</span>
              <span class="detail-label">Téléphone:</span>
              <span class="detail-value">{{ enseignant.telephone }}</span>
            </div>

            <!-- KLASSCI ID -->
            <div v-if="enseignant.klassci_id" class="detail-row">
              <span class="detail-icon">#</span>
              <span class="detail-label">KLASSCI ID:</span>
              <span class="detail-value">{{ enseignant.klassci_id }}</span>
            </div>
          </div>

          <!-- Tags -->
          <div class="enseignant-tags">
            <span v-if="enseignant.matieres?.length > 0" class="tag tag-matiere">
              {{ enseignant.matieres.length }} matière{{ enseignant.matieres.length > 1 ? 's' : '' }}
            </span>
            <span v-if="getEnseignantClassesCount(enseignant) > 0" class="tag tag-classe">
              {{ getEnseignantClassesCount(enseignant) }} classe{{ getEnseignantClassesCount(enseignant) > 1 ? 's' : '' }}
            </span>
          </div>

          <!-- View Details Button -->
          <button class="view-details-btn">
            <span>Voir détails</span>
            <span class="arrow">→</span>
          </button>
        </div>
      </div>

      <EnseignantDetailModal :enseignant="selectedEnseignant" @close="closeModal" />
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getInitials } from '@/utils/formatters'
import EnseignantDetailModal from '@/components/admin/EnseignantDetailModal.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import klassciService from '@/services/klassci'
import { readCache, writeCache, clearCache } from '@/services/cache'
// #28 : logique métier pure extraite (testée dans tests/unit/enseignants.test.js)
import {
  computeEnseignantsStats,
  getEnseignantClassesCount
} from '@/utils/enseignants'

const enseignants = ref([])
const loading = ref(true)
const error = ref(null)
const selectedEnseignant = ref(null)

// Computed stats — délégués à la logique pure extraite (#28)
const stats = computed(() => computeEnseignantsStats(enseignants.value))
const totalMatieres = computed(() => stats.value.totalMatieres)
const totalClasses = computed(() => stats.value.totalClasses)
const enseignantsActifs = computed(() => stats.value.actifs)

// getEnseignantClassesCount : importé depuis @/utils/enseignants (#28).
// getEnseignantUniqueClasses est désormais utilisé dans EnseignantDetailModal (#G1).

// Load enseignants from API
async function loadEnseignants(forceReload = false) {
  try {
    loading.value = true
    error.value = null

    // Si force reload, ignorer le cache
    if (forceReload) {
      console.log('🔄 Force reload demandé, vidage du cache...')
      clearCache('admin_enseignants')
    } else {
      // Check cache first
      const cached = readCache('admin_enseignants')
      if (cached) {
        const cacheHasData = cached && cached.length > 0
        const cacheHasDetails = cacheHasData && (cached.some(e => e.matieres?.length > 0 || e.classes?.length > 0))

        if (cacheHasData) {
          console.log('fa-check-circle Loaded enseignants from cache')
          enseignants.value = cached
          loading.value = false

          // Si le cache n'a pas de détails, forcer un refresh en background
          if (!cacheHasDetails) {
            console.log('fa-exclamation-triangle️ Cache sans détails, refresh en background forcé')
          }

          // Refresh in background
          refreshInBackground()
          return
        } else if (!cacheHasData) {
          console.log('📭 Cache vide, rechargement...')
        }
      }
    }

    // Load from API avec détails enrichis
    console.log('🔄 Loading enseignants from API (with details)...')

    try {
      const response = await klassciService.getLmsEnseignants({
        with_details: true
      })

      console.log('fa-bar-chart API Response:', response)

      // Process data
      if (response.success) {
        enseignants.value = Array.isArray(response.data) ? response.data : []
        console.log(`fa-check-circle Loaded ${enseignants.value.length} enseignants with full details`)
        console.log('fa-clipboard Sample enseignant:', enseignants.value[0])
      } else {
        // Fallback vers l'endpoint simple si l'enrichi retourne success=false
        console.warn('fa-exclamation-triangle️ Endpoint enrichi retourne success=false, utilisation endpoint simple')
        const fallbackData = await klassciService.getEnseignants()
        enseignants.value = Array.isArray(fallbackData) ? fallbackData : []
        console.log(`fa-check-circle Loaded ${enseignants.value.length} enseignants (format simple)`)
      }
    } catch (apiErr) {
      // Si erreur API (503, etc.), utiliser endpoint simple
      console.warn('fa-exclamation-triangle️ Endpoint enrichi en erreur, fallback vers endpoint simple:', apiErr.message)
      const fallbackData = await klassciService.getEnseignants()
      enseignants.value = Array.isArray(fallbackData) ? fallbackData : []
      console.log(`fa-check-circle Loaded ${enseignants.value.length} enseignants via fallback (format simple)`)
    }

    // Update cache
    writeCache('admin_enseignants', enseignants.value)

    loading.value = false
  } catch (err) {
    console.error('fa-times-circle Error loading enseignants (all methods failed):', err)
    error.value = err.message || 'Erreur lors du chargement des enseignants'
    loading.value = false
  }
}

// Refresh in background
async function refreshInBackground() {
  console.log('🔄 Background refresh started...')
  try {
    const response = await klassciService.getLmsEnseignants({
      with_details: true
    })

    console.log('fa-bar-chart Background refresh - API response received:', response)
    console.log('fa-bar-chart response.success:', response.success)
    console.log('fa-bar-chart response.data:', response.data)

    if (response.success && response.data && Array.isArray(response.data)) {
      enseignants.value = response.data
      console.log(`fa-check-circle Background refresh completed (enriched data) - ${enseignants.value.length} enseignants`)
    } else {
      // Fallback si réponse sans succès
      console.warn('fa-exclamation-triangle️ Endpoint enrichi retourne success=false ou pas de données, fallback vers endpoint simple')
      console.log('🔄 Calling fallback endpoint...')
      const fallbackData = await klassciService.getEnseignants()
      console.log('fa-bar-chart Fallback data received:', fallbackData)
      enseignants.value = Array.isArray(fallbackData) ? fallbackData : []
      console.log(`fa-check-circle Background refresh completed (simple data) - ${enseignants.value.length} enseignants`)
    }

    // Update cache
    writeCache('admin_enseignants', enseignants.value)
    console.log('fa-save Cache updated with', enseignants.value.length, 'enseignants')
  } catch (err) {
    // Si erreur (503, etc.), utiliser endpoint simple
    console.warn('fa-exclamation-triangle️ Endpoint enrichi en erreur, fallback vers endpoint simple:', err.message)
    console.error('fa-times-circle Full error:', err)
    try {
      console.log('🔄 Calling fallback endpoint after error...')
      const fallbackData = await klassciService.getEnseignants()
      console.log('fa-bar-chart Fallback data after error:', fallbackData)
      enseignants.value = Array.isArray(fallbackData) ? fallbackData : []

      // Update cache avec données simple
      writeCache('admin_enseignants', enseignants.value)

      console.log(`fa-check-circle Background refresh completed with fallback (simple data) - ${enseignants.value.length} enseignants`)
    } catch (fallbackErr) {
      console.error('fa-times-circle Fallback failed:', fallbackErr)
    }
  }
}

// Select enseignant
function selectEnseignant(enseignant) {
  selectedEnseignant.value = enseignant
}

// Close modal
function closeModal() {
  selectedEnseignant.value = null
}

// Load on mount
onMounted(() => {
  loadEnseignants()
})
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

.admin-enseignants-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.btn-icon {
  font-size: 1.25rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-icon {
  font-size: 2rem;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border-radius: var(--radius-lg);
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

/* Error State */
.error-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.error-message {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
}

.retry-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-message {
  color: var(--text-secondary);
  margin: 0;
}

/* Enseignants Grid */
.enseignants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-lg);
}

.enseignant-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.enseignant-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

/* Enseignant Header */
.enseignant-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.enseignant-avatar {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-lg);
  color: white;
}

.enseignant-info {
  flex: 1;
  overflow: hidden;
}

.enseignant-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.enseignant-email {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Enseignant Details */
.enseignant-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.detail-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  color: var(--text-secondary);
}

.detail-label {
  color: var(--text-secondary);
  min-width: 80px;
}

.detail-value {
  color: var(--text-primary);
  font-weight: 500;
  flex: 1;
}

/* Tags */
.enseignant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
}

.tag {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.tag-matiere {
  background: #e0f2fe;
  color: #0369a1;
}

:global(.dark) .tag-matiere {
  background: rgba(14, 165, 233, 0.2);
  color: #7dd3fc;
}

.tag-classe {
  background: #f0fdf4;
  color: #15803d;
}

:global(.dark) .tag-classe {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

/* View Details Button */
.view-details-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: var(--hover-bg);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-top: var(--spacing-sm);
}

.view-details-btn:hover {
  background: #3b82f6;
  color: white;
  transform: translateY(-2px);
}

:global(.dark) .view-details-btn:hover {
  background: var(--primary-gradient);
}

.arrow {
  font-size: 1.25rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag-matiere-large,
.tag-classe-large {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.tag-matiere-large {
  background: #e0f2fe;
  color: #0369a1;
}

:global(.dark) .tag-matiere-large {
  background: rgba(14, 165, 233, 0.2);
  color: #7dd3fc;
}

.tag-classe-large {
  background: #f0fdf4;
  color: #15803d;
}

:global(.dark) .tag-classe-large {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

:global(.dark) .badge-filiere {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

:global(.dark) .badge-niveau {
  background: rgba(251, 191, 36, 0.2);
  color: #fde047;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-enseignants-container {
    padding: var(--spacing-lg);
  }

  .header-section {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .enseignants-grid {
    grid-template-columns: 1fr;
  }
}
</style>
