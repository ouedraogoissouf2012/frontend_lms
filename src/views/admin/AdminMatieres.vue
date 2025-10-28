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
        <button
          v-if="filters.filiere_id || filters.search"
          @click="resetFilters"
          class="btn-reset"
          title="Réinitialiser les filtres"
        >
          <ArrowPathIcon class="w-4 h-4" />
          Réinitialiser
        </button>
      </div>

      <!-- Loading state -->
      <SkeletonLoader v-if="loading" type="card" :count="6" height="180px" />

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠</div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadMatieres" class="error-retry-btn">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <!-- Niveaux Cards Grid -->
      <div v-else-if="filteredNiveauxWithMatieres.length > 0" class="niveaux-grid">
        <div
          v-for="niveauGroup in filteredNiveauxWithMatieres"
          :key="niveauGroup.niveau.id"
          class="niveau-card"
        >
          <!-- Niveau Icon -->
          <div class="niveau-card-icon">
            <AcademicCapIcon class="w-10 h-10" />
          </div>

          <!-- Niveau Content -->
          <div class="niveau-card-content">
            <h3 class="niveau-card-title">
              {{ niveauGroup.niveau.nom || niveauGroup.niveau.code }}
            </h3>
            <div class="niveau-card-stats">
              <div class="stat-item">
                <BookOpenIcon class="w-4 h-4" />
                <span>{{ niveauGroup.matieres.length }} matière(s)</span>
              </div>
              <div class="stat-item">
                <ClockIcon class="w-4 h-4" />
                <span>{{ niveauGroup.totalHeures }}h</span>
              </div>
              <div class="stat-item">
                <CalendarIcon class="w-4 h-4" />
                <span>{{ niveauGroup.totalSeances }} séance(s)</span>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <button
            @click="viewNiveauDetails(niveauGroup)"
            class="niveau-card-action"
            title="Voir les détails"
          >
            <EyeIcon class="w-6 h-6" />
          </button>
        </div>
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
  filiere_id: ''
})

const showNiveauModal = ref(false)
const selectedNiveau = ref(null)

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

  return result
})

// Computed: Niveaux with matieres
const filteredNiveauxWithMatieres = computed(() => {
  // Si pas de matières, grouper par niveaux disponibles dans structure
  if (filteredMatieres.value.length === 0 && niveaux.value.length > 0) {
    return niveaux.value.map(niveau => ({
      niveau: niveau,
      matieres: [],
      totalHeures: 0,
      totalSeances: 0
    }))
  }

  // Group matieres by niveau
  const niveauxMap = new Map()

  filteredMatieres.value.forEach(matiere => {
    // Si la matière a des combinaisons (même avec objets vides)
    if (matiere.combinaisons && matiere.combinaisons.length > 0) {
      // Vérifier si les combinaisons contiennent des niveaux valides
      const hasValidNiveau = matiere.combinaisons.some(c => c.niveau?.id || c.niveau?.code)

      if (hasValidNiveau) {
        // Récupérer les niveaux uniques avec données valides
        const uniqueNiveaux = new Set()
        matiere.combinaisons.forEach(combi => {
          if (combi.niveau?.id) {
            uniqueNiveaux.add(combi.niveau.id)
          }
        })

        // Ajouter la matière à chaque groupe de niveau
        uniqueNiveaux.forEach(niveauId => {
          if (!niveauxMap.has(niveauId)) {
            const niveau = matiere.combinaisons.find(c => c.niveau?.id === niveauId)?.niveau
            if (niveau) {
              niveauxMap.set(niveauId, {
                niveau: niveau,
                matieres: []
              })
            }
          }
          if (niveauxMap.has(niveauId)) {
            niveauxMap.get(niveauId).matieres.push(matiere)
          }
        })
      } else {
        // Les combinaisons existent mais sont vides → groupe "Niveau non défini"
        if (!niveauxMap.has('undefined')) {
          niveauxMap.set('undefined', {
            niveau: { id: 'undefined', nom: 'Niveau non défini', code: 'N/A' },
            matieres: []
          })
        }
        niveauxMap.get('undefined').matieres.push(matiere)
      }
    } else {
      // Pas de combinaisons → groupe "Sans niveau"
      if (!niveauxMap.has('none')) {
        niveauxMap.set('none', {
          niveau: { id: 'none', nom: 'Sans niveau', code: 'N/A' },
          matieres: []
        })
      }
      niveauxMap.get('none').matieres.push(matiere)
    }
  })

  // Convert to array and add stats
  const result = Array.from(niveauxMap.values()).map(group => {
    const totalHeures = group.matieres.reduce((sum, m) => sum + (m.heures_total || 0), 0)
    const totalSeances = group.matieres.reduce((sum, m) => sum + (m.nb_seances_programmees || 0), 0)

    return {
      ...group,
      totalHeures,
      totalSeances
    }
  })

  // Sort: undefined/none at the end, others by code
  result.sort((a, b) => {
    const aId = a.niveau.id
    const bId = b.niveau.id

    if (aId === 'undefined' || aId === 'none') return 1
    if (bId === 'undefined' || bId === 'none') return -1
    return (a.niveau.code || '').localeCompare(b.niveau.code || '')
  })

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

/* Niveaux Grid */
.niveaux-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Niveau Card */
.niveau-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: default;
  overflow: hidden;
}

.niveau-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  transform: translateY(-2px);
}

.niveau-card-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, #8b5cf6 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 1rem;
}

.niveau-card-content {
  margin-bottom: 1rem;
}

.niveau-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.niveau-card-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-item svg {
  flex-shrink: 0;
  color: var(--primary-color);
}

.niveau-card-action {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--primary-color);
  border: none;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.niveau-card-action:hover {
  background: #4f46e5;
  transform: scale(1.1);
}

/* Empty State */
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
  width: 32px;
  height: 32px;
  border-radius: 0.375rem;
  border: 2px solid var(--border-color);
}

/* Matiere Info */
.col-matiere {
  min-width: 200px;
}

.matiere-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.matiere-name {
  font-weight: 600;
  color: var(--text-primary);
}

.matiere-desc {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Filières Badges */
.col-filieres {
  min-width: 150px;
}

.filieres-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.filiere-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: var(--primary-color);
  color: white;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Code Badge */
.code-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: var(--hover-bg);
  color: var(--text-primary);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Centered Columns */
.col-center {
  text-align: center;
}

.coef-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.hours-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.375rem;
  font-weight: 600;
}

.seances-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: #10b981;
  color: white;
  border-radius: 0.375rem;
  font-weight: 600;
}

/* Actions */
.col-actions {
  text-align: center;
}

.action-btn {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
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
