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

      <!-- Modal pour détails enseignant -->
      <Teleport to="body">
        <div v-if="selectedEnseignant" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-title-section">
                <div class="modal-avatar">
                  <span>{{ getInitials(selectedEnseignant) }}</span>
                </div>
                <div>
                  <h2 class="modal-title">{{ selectedEnseignant.nom }} {{ selectedEnseignant.prenom }}</h2>
                  <p class="modal-subtitle">{{ selectedEnseignant.email }}</p>
                </div>
              </div>
              <button @click="closeModal" class="close-btn">✕</button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
              <!-- Informations Personnelles -->
              <div class="info-section">
                <h3 class="section-title"><i class="fa fa-user"></i> Informations Personnelles</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{{ selectedEnseignant.email || 'Non disponible' }}</span>
                  </div>
                  <div v-if="selectedEnseignant.matricule" class="info-item">
                    <span class="info-label">Matricule:</span>
                    <span class="info-value">{{ selectedEnseignant.matricule }}</span>
                  </div>
                  <div v-if="selectedEnseignant.specialization" class="info-item">
                    <span class="info-label">Spécialisation:</span>
                    <span class="info-value">{{ selectedEnseignant.specialization }}</span>
                  </div>
                  <div v-if="selectedEnseignant.status" class="info-item">
                    <span class="info-label">Statut:</span>
                    <span class="info-value">{{ selectedEnseignant.status }}</span>
                  </div>
                  <div v-if="selectedEnseignant.telephone" class="info-item">
                    <span class="info-label">Téléphone:</span>
                    <span class="info-value">{{ selectedEnseignant.telephone }}</span>
                  </div>
                  <div v-if="selectedEnseignant.teacher_id" class="info-item">
                    <span class="info-label">Teacher ID:</span>
                    <span class="info-value">{{ selectedEnseignant.teacher_id }}</span>
                  </div>
                </div>
              </div>

              <!-- Statistiques globales (si disponibles) -->
              <div v-if="selectedEnseignant.statistiques" class="info-section">
                <h3 class="section-title"><i class="fa fa-bar-chart"></i> Statistiques Globales</h3>
                <div class="stats-detail-grid">
                  <div class="stat-detail-card">
                    <i class="fa fa-building stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ selectedEnseignant.statistiques.total_classes }}</span>
                      <span class="stat-detail-label">Classes</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-book stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ selectedEnseignant.statistiques.total_matieres }}</span>
                      <span class="stat-detail-label">Matières</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-check-circle stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ selectedEnseignant.statistiques.total_heures_effectuees }}h</span>
                      <span class="stat-detail-label">Heures effectuées</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-clock-o stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ selectedEnseignant.statistiques.total_heures_prevues }}h</span>
                      <span class="stat-detail-label">Heures prévues</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-pie-chart stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ selectedEnseignant.statistiques.taux_realisation_global.toFixed(1) }}%</span>
                      <span class="stat-detail-label">Taux réalisation</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-calendar-check-o stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ selectedEnseignant.statistiques.nb_seances_effectuees }}/{{ selectedEnseignant.statistiques.nb_seances_total }}</span>
                      <span class="stat-detail-label">Séances</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Classes Assignées -->
              <div class="info-section">
                <h3 class="section-title"><i class="fa fa-users"></i> Classes Assignées ({{ getEnseignantUniqueClasses(selectedEnseignant).length }})</h3>
                <div v-if="getEnseignantUniqueClasses(selectedEnseignant).length > 0" class="classes-detail-list">
                  <div
                    v-for="classe in getEnseignantUniqueClasses(selectedEnseignant)"
                    :key="classe.id"
                    class="classe-detail-card"
                  >
                    <div class="classe-detail-name">{{ classe.nom || 'Classe sans nom' }}</div>
                    <div v-if="classe.filiere || classe.niveau" class="classe-detail-info">
                      <span v-if="classe.filiere" class="badge badge-filiere">{{ classe.filiere }}</span>
                      <span v-if="classe.niveau" class="badge badge-niveau">{{ classe.niveau }}</span>
                    </div>
                  </div>
                </div>
                <p v-else class="no-data">Aucune classe assignée</p>
              </div>

              <!-- Matières Enseignées -->
              <div class="info-section">
                <h3 class="section-title"><i class="fa fa-book"></i> Matières Enseignées ({{ selectedEnseignant.matieres?.length || 0 }})</h3>
                <div v-if="selectedEnseignant.matieres?.length > 0" class="matieres-detail-list">
                  <div
                    v-for="matiere in selectedEnseignant.matieres"
                    :key="matiere.id"
                    class="matiere-detail-card"
                  >
                    <div class="matiere-detail-header">
                      <h4 class="matiere-detail-name">{{ matiere.nom || 'Matière sans nom' }}</h4>
                      <span v-if="matiere.code" class="matiere-code">{{ matiere.code }}</span>
                    </div>

                    <!-- Stats de la matière si disponibles -->
                    <div v-if="matiere.heures_prevues" class="matiere-detail-stats">
                      <div class="matiere-stat">
                        <span class="matiere-stat-label">Heures:</span>
                        <span class="matiere-stat-value">{{ matiere.heures_effectuees }}h / {{ matiere.heures_prevues }}h</span>
                      </div>
                      <div class="matiere-stat">
                        <span class="matiere-stat-label">Taux:</span>
                        <span class="matiere-stat-value">{{ matiere.taux_realisation.toFixed(0) }}%</span>
                      </div>
                      <div class="matiere-stat">
                        <span class="matiere-stat-label">Séances:</span>
                        <span class="matiere-stat-value">{{ matiere.nb_seances_effectuees }}/{{ matiere.nb_seances_total }}</span>
                      </div>
                    </div>

                    <!-- Classes pour cette matière -->
                    <div v-if="matiere.classes && matiere.classes.length > 0" class="matiere-classes">
                      <span class="matiere-classes-label">Classes:</span>
                      <span
                        v-for="(c, idx) in matiere.classes"
                        :key="c.id"
                        class="matiere-classe-tag"
                      >{{ c.nom }}<span v-if="idx < matiere.classes.length - 1">,</span></span>
                    </div>
                  </div>
                </div>
                <p v-else class="no-data">Aucune matière assignée</p>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button @click="closeModal" class="modal-btn modal-btn-secondary">Fermer</button>
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
import klassciService from '@/services/klassci'

const CACHE_KEY = 'admin_enseignants_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const enseignants = ref([])
const loading = ref(true)
const error = ref(null)
const selectedEnseignant = ref(null)

// Computed stats
const totalMatieres = computed(() => {
  return enseignants.value.reduce((sum, ens) => sum + (ens.matieres?.length || 0), 0)
})

const totalClasses = computed(() => {
  // Utiliser les statistiques si disponibles, sinon compter depuis les matieres
  return enseignants.value.reduce((sum, ens) => {
    if (ens.statistiques?.total_classes) {
      return sum + ens.statistiques.total_classes
    }
    // Fallback: extraire classes uniques depuis les matieres
    const classesSet = new Set()
    ens.matieres?.forEach(matiere => {
      matiere.classes?.forEach(classe => classesSet.add(classe.id))
    })
    return sum + classesSet.size
  }, 0)
})

const enseignantsActifs = computed(() => {
  return enseignants.value.filter(ens => ens.matieres?.length > 0 || ens.classes?.length > 0).length
})

// Get initials from enseignant
function getInitials(enseignant) {
  if (!enseignant) return '?'
  const firstInitial = (enseignant.prenom || enseignant.nom || '?')[0]
  const lastInitial = enseignant.nom ? enseignant.nom[0] : ''
  return (firstInitial + lastInitial).toUpperCase()
}

// Get classes count for an enseignant
function getEnseignantClassesCount(enseignant) {
  if (enseignant.statistiques?.total_classes) {
    return enseignant.statistiques.total_classes
  }
  // Fallback: extraire classes uniques depuis les matieres
  const classesSet = new Set()
  enseignant.matieres?.forEach(matiere => {
    matiere.classes?.forEach(classe => classesSet.add(classe.id))
  })
  return classesSet.size
}

// Get unique classes list from enseignant's matieres
function getEnseignantUniqueClasses(enseignant) {
  if (!enseignant || !enseignant.matieres) return []

  const classesMap = new Map()
  enseignant.matieres.forEach(matiere => {
    matiere.classes?.forEach(classe => {
      if (!classesMap.has(classe.id)) {
        classesMap.set(classe.id, classe)
      }
    })
  })

  return Array.from(classesMap.values())
}

// Load enseignants from API
async function loadEnseignants(forceReload = false) {
  try {
    loading.value = true
    error.value = null

    // Si force reload, ignorer le cache
    if (forceReload) {
      console.log('🔄 Force reload demandé, vidage du cache...')
      localStorage.removeItem(CACHE_KEY)
    } else {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)

        // Vérifier si le cache est valide et contient des données utiles
        const cacheIsRecent = Date.now() - timestamp < CACHE_TTL
        const cacheHasData = data && data.length > 0
        const cacheHasDetails = cacheHasData && (data.some(e => e.matieres?.length > 0 || e.classes?.length > 0))

        if (cacheIsRecent && cacheHasData) {
          console.log('fa-check-circle Loaded enseignants from cache')
          enseignants.value = data
          loading.value = false

          // Si le cache n'a pas de détails, forcer un refresh en background
          if (!cacheHasDetails) {
            console.log('fa-exclamation-triangle️ Cache sans détails, refresh en background forcé')
          }

          // Refresh in background
          refreshInBackground()
          return
        } else if (!cacheIsRecent) {
          console.log('fa-clock-o Cache expiré, rechargement...')
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
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: enseignants.value,
      timestamp: Date.now()
    }))

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
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: enseignants.value,
      timestamp: Date.now()
    }))
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
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: enseignants.value,
        timestamp: Date.now()
      }))

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

<style scoped>
.admin-enseignants-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.page-subtitle {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin: 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
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

.stat-details {
  display: flex;
  flex-direction: column;
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

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.modal-avatar {
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-xl);
  color: white;
}

.modal-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.modal-subtitle {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  line-height: 1;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-xl);
  overflow-y: auto;
  flex: 1;
}

.info-section {
  margin-bottom: var(--spacing-xl);
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: var(--font-size-md);
  color: var(--text-primary);
  font-weight: 500;
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

.no-data {
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

.modal-footer {
  padding: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.modal-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-btn-secondary {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.modal-btn-secondary:hover {
  background: var(--hover-bg);
}

/* Stats Detail Grid */
.stats-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.stat-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-detail-icon {
  font-size: 1.5rem;
}

.stat-detail-content {
  display: flex;
  flex-direction: column;
}

.stat-detail-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-detail-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Classes Detail */
.classes-detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.classe-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.classe-detail-name {
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.classe-detail-info {
  display: flex;
  gap: var(--spacing-xs);
}

.badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.badge-filiere {
  background: #dbeafe;
  color: #1e40af;
}

:global(.dark) .badge-filiere {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.badge-niveau {
  background: #fef3c7;
  color: #92400e;
}

:global(.dark) .badge-niveau {
  background: rgba(251, 191, 36, 0.2);
  color: #fde047;
}

/* Matières Detail */
.matieres-detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.matiere-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.matiere-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-md);
}

.matiere-detail-name {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.matiere-code {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background: var(--card-bg);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.matiere-detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--card-bg);
  border-radius: var(--radius-md);
}

.matiere-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.matiere-stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.matiere-stat-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.matiere-classes {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  font-size: var(--font-size-sm);
}

.matiere-classes-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.matiere-classe-tag {
  color: var(--text-primary);
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

  .info-grid {
    grid-template-columns: 1fr;
  }

  .stats-detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .matiere-detail-stats {
    grid-template-columns: 1fr;
  }

  .classe-detail-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
