<template>
  <DashboardLayout>
    <div class="classes-container">
      <!-- Header -->
      <div class="welcome-header">
        <i class="fa fa-home welcome-icon"></i>
        <div>
          <h1 class="page-title">Gestion des Classes</h1>
          <p class="page-subtitle">Gérez toutes les classes de l'établissement</p>
        </div>
      </div>

      <!-- Statistics -->
      <div v-if="!loading && !error" class="stats-grid">
        <div class="stat-card border-l-blue">
          <div class="stat-header">
            <i class="fa fa-home stat-icon"></i>
            <span class="stat-label">Total Classes</span>
          </div>
          <p class="stat-value">{{ stats.total }}</p>
        </div>

        <div class="stat-card border-l-green">
          <div class="stat-header">
            <i class="fa fa-user stat-icon"></i>
            <span class="stat-label">Total Étudiants</span>
          </div>
          <p class="stat-value">{{ stats.totalEtudiants }}</p>
        </div>

        <div class="stat-card border-l-orange">
          <div class="stat-header">
            <span class="stat-icon">☷</span>
            <span class="stat-label">Total Matières</span>
          </div>
          <p class="stat-value">{{ stats.totalMatieres }}</p>
        </div>

        <div class="stat-card border-l-purple">
          <div class="stat-header">
            <span class="stat-icon">☀</span>
            <span class="stat-label">Classes Actives</span>
          </div>
          <p class="stat-value">{{ stats.actives }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div v-if="!loading && !error" class="filters-card">
        <div class="filters-grid">
          <div class="filter-item">
            <label class="filter-label">
              <i class="fa fa-home filter-icon"></i>
              Filière
            </label>
            <select v-model="filters.filiere_id" @change="applyFilters" class="filter-select">
              <option value="">Toutes les filières</option>
              <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                {{ filiere.name || filiere.nom }}
              </option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">
              <i class="fa fa-bars filter-icon"></i>
              Niveau
            </label>
            <select v-model="filters.niveau_id" @change="applyFilters" class="filter-select">
              <option value="">Tous les niveaux</option>
              <option v-for="niveau in niveaux" :key="niveau.id" :value="niveau.id">
                {{ niveau.name || niveau.nom }}
              </option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">
              <i class="fa fa-check filter-icon"></i>
              Statut
            </label>
            <select v-model="filters.statut" @change="applyFilters" class="filter-select">
              <option value="">Tous</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
          </div>

          <div class="filter-actions">
            <button
              v-if="filters.filiere_id || filters.niveau_id || filters.statut"
              @click="resetFilters"
              class="btn-reset"
              title="Réinitialiser tous les filtres"
            >
              <ArrowPathIcon class="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des classes..." />

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadClasses" class="error-retry-btn">
          <span class="btn-icon">🔄</span>
          Réessayer
        </button>
      </div>

      <!-- Classes Grid -->
      <div v-else-if="filteredClasses.length > 0" class="classes-grid">
        <div
          v-for="classe in filteredClasses"
          :key="classe.id"
          class="class-card"
        >
          <!-- Header -->
          <div class="class-header">
            <div class="class-info">
              <h3 class="class-name">{{ classe.name || classe.libelle }}</h3>
              <div class="class-badges">
                <span v-if="classe.filiere" class="badge badge-filiere">
                  {{ classe.filiere.code || classe.filiere.nom }}
                </span>
                <span v-if="classe.niveau" class="badge badge-niveau">
                  {{ classe.niveau.code || classe.niveau.nom }}
                </span>
              </div>
            </div>
            <span v-if="classe.is_active" class="active-badge" title="Classe active cette année">
              <span class="pulse-dot"></span>
              Active
            </span>
          </div>

          <!-- Filiere Section -->
          <div v-if="classe.filiere" class="class-section">
            <i class="fa fa-home section-icon"></i>
            <div>
              <p class="section-label">Filière</p>
              <p class="section-value">{{ classe.filiere.name || classe.filiere.nom }}</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="class-stats">
            <div class="stat-item">
              <i class="fa fa-user stat-icon"></i>
              <div>
                <p class="stat-label">Étudiants</p>
                <p class="stat-value">{{ classe.places_occupees || 0 }}/{{ classe.places_totales || 0 }}</p>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-icon">☷</span>
              <div>
                <p class="stat-label">Matières</p>
                <p class="stat-value">{{ classe.nb_matieres || 0 }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="class-actions">
            <button
              @click="viewClasseDetails(classe)"
              class="btn-action btn-primary"
              title="Voir les détails de la classe"
            >
              <span class="btn-icon">→</span>
              Détails
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <span class="empty-icon">☹</span>
        <h3 class="empty-title">Aucune classe trouvée</h3>
        <p class="empty-message">
          {{ filters.filiere_id || filters.niveau_id || filters.statut
            ? 'Aucune classe ne correspond à vos filtres'
            : 'Aucune classe disponible dans le système' }}
        </p>
        <button
          v-if="filters.filiere_id || filters.niveau_id || filters.statut"
          @click="resetFilters"
          class="btn-empty"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'

const router = useRouter()

const classes = ref([])
const filieres = ref([])
const niveaux = ref([])
const matieres = ref([])
const loading = ref(false)
const error = ref(null)

const filters = ref({
  filiere_id: '',
  niveau_id: '',
  statut: ''
})


// Computed: Filtered classes
const filteredClasses = computed(() => {
  let result = classes.value

  if (filters.value.filiere_id) {
    result = result.filter(c => c.filiere?.id === parseInt(filters.value.filiere_id))
  }

  if (filters.value.niveau_id) {
    result = result.filter(c => c.niveau?.id === parseInt(filters.value.niveau_id))
  }

  if (filters.value.statut) {
    const isActive = filters.value.statut === 'active'
    result = result.filter(c => c.is_active === isActive)
  }

  return result
})

// Computed: Statistics
const stats = computed(() => {
  return {
    total: classes.value.length,
    totalEtudiants: classes.value.reduce((sum, c) => sum + (c.places_occupees || 0), 0),
    totalMatieres: classes.value.reduce((sum, c) => sum + (c.nb_matieres || 0), 0),
    actives: classes.value.filter(c => c.is_active).length
  }
})

// Load classes
async function loadClasses() {
  // Check cache
  const cached = readCache('admin_classes')
  if (cached) {
    classes.value = cached.classes
    filieres.value = cached.filieres
    niveaux.value = cached.niveaux
    matieres.value = cached.matieres
    loading.value = false
    refreshInBackground()
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('[ADMIN] Chargement de toutes les classes...')

    // Load all data in parallel
    const [classesData, matieresData, structureData] = await Promise.all([
      klassciService.getClasses(),
      klassciService.getMatieres(),
      klassciService.getStructure()
    ])

    const rawClasses = classesData || []
    matieres.value = matieresData || []
    filieres.value = structureData?.filieres || []
    niveaux.value = structureData?.niveaux || []

    console.log('[ADMIN] Classes:', rawClasses.length, 'Matières:', matieres.value.length)

    // Enrich each class with counters
    const enrichedClasses = await Promise.all(
      rawClasses.map(async (classe) => {
        try {
          const etudiants = await klassciService.getClasseEtudiants(classe.id)
          const nbEtudiants = etudiants?.length || 0

          // Count all matieres for this class (same logic as TeacherClasses)
          const nbMatieres = matieres.value.length

          const placesTotales = classe.effectif_max ||
                                classe.capacite ||
                                classe.places_totales ||
                                classe.effectif ||
                                (nbEtudiants > 0 ? Math.max(nbEtudiants, 30) : 30)

          return {
            ...classe,
            places_occupees: nbEtudiants,
            places_totales: placesTotales,
            nb_matieres: nbMatieres
          }
        } catch (err) {
          console.warn(`[WARN] Impossible d'enrichir classe ${classe.id}:`, err.message)
          return {
            ...classe,
            places_occupees: 0,
            places_totales: 30,
            nb_matieres: matieres.value.length
          }
        }
      })
    )

    classes.value = enrichedClasses

    // Save to cache
    writeCache('admin_classes', {
      classes: classes.value,
      filieres: filieres.value,
      niveaux: niveaux.value,
      matieres: matieres.value
    })
  } catch (err) {
    console.error('[ERREUR] Chargement classes admin:', err)
    error.value = 'Impossible de charger les classes. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

// Refresh in background
async function refreshInBackground() {
  try {
    console.log('[BACKGROUND] Rafraîchissement classes admin...')
    const [classesData, matieresData, structureData] = await Promise.all([
      klassciService.getClasses(),
      klassciService.getMatieres(),
      klassciService.getStructure()
    ])

    const rawClasses = classesData || []
    matieres.value = matieresData || []
    filieres.value = structureData?.filieres || []
    niveaux.value = structureData?.niveaux || []

    const enrichedClasses = await Promise.all(
      rawClasses.map(async (classe) => {
        try {
          const etudiants = await klassciService.getClasseEtudiants(classe.id)
          const nbEtudiants = etudiants?.length || 0
          const nbMatieres = matieres.value.length
          const placesTotales = classe.effectif_max || classe.capacite || (nbEtudiants > 0 ? Math.max(nbEtudiants, 30) : 30)

          return {
            ...classe,
            places_occupees: nbEtudiants,
            places_totales: placesTotales,
            nb_matieres: nbMatieres
          }
        } catch (err) {
          return {
            ...classe,
            places_occupees: 0,
            places_totales: 30,
            nb_matieres: matieres.value.length
          }
        }
      })
    )

    classes.value = enrichedClasses

    writeCache('admin_classes', {
      classes: classes.value,
      filieres: filieres.value,
      niveaux: niveaux.value,
      matieres: matieres.value
    })
  } catch (error) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
  }
}

// Apply filters
function applyFilters() {
  console.log('[FILTERS] Filtres appliqués:', filters.value)
}

// Reset filters
function resetFilters() {
  filters.value.filiere_id = ''
  filters.value.niveau_id = ''
  filters.value.statut = ''
  console.log('[FILTERS] Filtres réinitialisés')
}

// View class details
function viewClasseDetails(classe) {
  router.push({
    name: 'classe-details',
    params: { id: classe.id }
  })
}

onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.classes-container {
  padding: 2rem;
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.welcome-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Stat cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.border-l-blue {
  border-left-color: #3b82f6;
}

.border-l-green {
  border-left-color: #10b981;
}

.border-l-purple {
  border-left-color: #8b5cf6;
}

.border-l-orange {
  border-left-color: #f59e0b;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Widget card (Filters) */
.filters-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-icon {
  font-size: 1rem;
  line-height: 1;
}

.filter-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--primary-color);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.btn-reset:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: translateY(-1px);
}

/* Class cards */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.class-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.class-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.class-info {
  flex: 1;
}

.class-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.class-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-filiere {
  background: #e0e7ff;
  color: #5b21b6;
}

.badge-niveau {
  background: #fef3c7;
  color: #92400e;
}

.active-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #dcfce7;
  color: #15803d;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.class-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.section-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.section-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.section-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.class-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.stat-item .stat-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.stat-item .stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.stat-item .stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.class-actions {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 2rem;
  color: #DC2626;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #991B1B;
  margin: 0 0 0.5rem 0;
}

.error-message {
  color: #B91C1C;
  margin: 0;
}

.error-retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #DC2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.error-retry-btn:hover {
  background: #B91C1C;
  transform: scale(1.02);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  font-size: 3rem;
  line-height: 1;
  margin: 0 auto 1rem;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-message {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.btn-empty {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-empty:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .classes-container {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .classes-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .error-state {
    flex-direction: column;
    text-align: center;
  }

  .error-retry-btn {
    width: 100%;
  }
}
</style>
