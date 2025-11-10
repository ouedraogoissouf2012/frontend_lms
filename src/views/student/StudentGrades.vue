<template>
  <DashboardLayout>
    <div class="grades-container">
      <!-- En-tête avec statistiques -->
      <div class="grades-header">
        <h1 class="page-title">
          <i class="mdi mdi-certificate title-icon"></i>
          Mes Notes
        </h1>

        <!-- Statistiques améliorées -->
        <div class="stats-cards">
          <div class="stat-card moyenne-card">
            <div class="stat-label">Moyenne Générale</div>
            <div class="stat-value" :class="getMoyenneClass(moyenneGenerale)">
              {{ moyenneGenerale }}/20
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :class="getMoyenneClass(moyenneGenerale)"
                :style="{ width: `${(moyenneGenerale / 20) * 100}%` }"
              ></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Matières</div>
            <div class="stat-value">{{ totalMatieres }}</div>
            <div class="stat-detail">{{ totalEvaluations }} évaluations</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Taux de Réussite</div>
            <div class="stat-value">{{ statsReussite.taux }}%</div>
            <div class="stat-detail">{{ statsReussite.reussies }}/{{ statsReussite.total }} éval.</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Meilleure Note</div>
            <div class="stat-value note-excellent">{{ statsMeilleureNote }}/20</div>
            <div class="stat-detail" v-if="meilleureMatiere">{{ meilleureMatiere }}</div>
          </div>
        </div>

        <!-- Filtres et tri -->
        <div class="filters-section">
          <div class="filter-group">
            <label class="filter-label"><i class="mdi mdi-magnify"></i> Recherche:</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher une matière ou évaluation..."
              class="filter-input"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label"><i class="mdi mdi-folder-outline"></i> Type:</label>
            <select v-model="filterType" class="filter-select">
              <option value="">Tous les types</option>
              <option value="qcm">QCM</option>
              <option value="devoir">Devoir</option>
              <option value="composition">Composition</option>
              <option value="examen">Examen</option>
              <option value="tp">TP</option>
              <option value="td">TD</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label"><i class="mdi mdi-school-outline"></i> Matière:</label>
            <select v-model="filterMatiere" class="filter-select">
              <option value="">Toutes les matières</option>
              <option v-for="matiere in matieres" :key="matiere.matiere_id" :value="matiere.matiere_id">
                {{ matiere.matiere_nom }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label"><i class="mdi mdi-sort"></i> Trier par:</label>
            <select v-model="sortBy" class="filter-select">
              <option value="date-desc">Date (plus récent)</option>
              <option value="date-asc">Date (plus ancien)</option>
              <option value="note-desc">Note (meilleure)</option>
              <option value="note-asc">Note (moins bonne)</option>
              <option value="matiere">Matière (A-Z)</option>
            </select>
          </div>

          <button class="btn-export" @click="exportToPDF" title="Télécharger mes notes en PDF">
            <i class="mdi mdi-file-pdf-box"></i> Exporter PDF
          </button>
        </div>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p class="loading-text">Chargement de vos notes...</p>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="error-container">
        <i class="mdi mdi-alert-circle error-icon"></i>
        <p class="error-text">{{ error }}</p>
        <button class="btn-refresh" @click="fetchGrades">
          <i class="mdi mdi-refresh refresh-icon"></i>
          Réessayer
        </button>
      </div>

      <!-- Pas de notes -->
      <div v-else-if="filteredEvaluations.length === 0 && !searchQuery && !filterType && !filterMatiere" class="empty-state">
        <i class="mdi mdi-file-document-outline empty-icon"></i>
        <h3>Aucune note disponible</h3>
        <p>Vous n'avez pas encore de notes enregistrées.</p>
      </div>

      <!-- Aucun résultat de recherche -->
      <div v-else-if="filteredEvaluations.length === 0" class="empty-state">
        <i class="mdi mdi-filter-remove-outline empty-icon"></i>
        <h3>Aucun résultat</h3>
        <p>Aucune note ne correspond à vos critères de recherche.</p>
        <button class="btn-refresh" @click="resetFilters">
          <i class="mdi mdi-reload"></i> Réinitialiser les filtres
        </button>
      </div>

      <!-- Résumé par matière (repliable) -->
      <div v-else class="content-wrapper">
        <div class="summary-section">
          <div class="section-header" @click="toggleSummary">
            <h2 class="section-title">
              <i :class="showSummary ? 'mdi mdi-chevron-down' : 'mdi mdi-chevron-right'"></i>
              Résumé par Matière
            </h2>
            <span class="toggle-hint">{{ showSummary ? 'Masquer' : 'Afficher' }}</span>
          </div>

          <transition name="slide">
            <div v-show="showSummary" class="summary-content">
              <div class="summary-cards">
                <div
                  v-for="matiere in matieres"
                  :key="matiere.matiere_id"
                  class="summary-card"
                >
                  <div class="summary-card-header">
                    <h3 class="summary-matiere-name">{{ matiere.matiere_nom }}</h3>
                    <span class="summary-count">{{ matiere.total_evaluations }} éval.</span>
                  </div>

                  <div class="summary-moyenne" :class="getMoyenneClass(matiere.moyenne)">
                    <span class="moyenne-label">Moyenne:</span>
                    <span class="moyenne-value">{{ matiere.moyenne }}/20</span>
                  </div>

                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :class="getMoyenneClass(matiere.moyenne)"
                      :style="{ width: `${(matiere.moyenne / 20) * 100}%` }"
                    ></div>
                  </div>

                  <div class="summary-stats">
                    <div class="stat-item">
                      <i class="mdi mdi-trophy stat-icon"></i>
                      <span class="stat-text">{{ getMaxNote(matiere) }}/20</span>
                    </div>
                    <div class="stat-item">
                      <i class="mdi mdi-arrow-down stat-icon"></i>
                      <span class="stat-text">{{ getMinNote(matiere) }}/20</span>
                    </div>
                    <div class="stat-item">
                      <i class="mdi" :class="getTrendIcon(matiere)"></i>
                      <span class="stat-text">{{ getTrendText(matiere) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Tableau des notes -->
        <div class="grades-table-container">
          <div class="table-header">
            <h2 class="table-title">Toutes mes notes ({{ filteredEvaluations.length }})</h2>
          </div>

          <table class="grades-table">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Titre de l'évaluation</th>
                <th>Type</th>
                <th>Note</th>
                <th>Coefficient</th>
                <th>Date</th>
                <th>Temps passé</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(evaluation, index) in filteredEvaluations"
                :key="index"
                class="evaluation-row"
                :class="{ 'row-new': isNew(evaluation) }"
              >
                <!-- Matière -->
                <td class="matiere-cell">
                  <div class="matiere-info">
                    <i class="mdi mdi-book-open-variant matiere-icon"></i>
                    <span class="matiere-name">{{ evaluation.matiere_nom }}</span>
                  </div>
                </td>

                <!-- Titre -->
                <td class="titre-cell">
                  <div class="titre-info">
                    <i class="mdi mdi-file-document eval-icon"></i>
                    {{ evaluation.titre }}
                    <span v-if="isNew(evaluation)" class="badge-new">Nouveau</span>
                  </div>
                </td>

                <!-- Type -->
                <td>
                  <span class="type-badge" :class="`type-${evaluation.type}`">
                    {{ formatType(evaluation.type) }}
                  </span>
                </td>

                <!-- Note -->
                <td>
                  <span class="note-value" :class="getNoteClass(parseFloat(evaluation.note))">
                    {{ evaluation.note }}/20
                  </span>
                </td>

                <!-- Coefficient -->
                <td class="coef-cell">
                  <span class="coefficient-badge">
                    × {{ evaluation.coefficient }}
                  </span>
                </td>

                <!-- Date -->
                <td class="date-cell">
                  {{ formatDate(evaluation.date_evaluation) }}
                </td>

                <!-- Temps passé -->
                <td class="temps-cell">
                  {{ formatTemps(evaluation.temps_passe) }}
                </td>

                <!-- Actions -->
                <td class="actions-cell">
                  <button
                    class="btn-view"
                    @click="viewResults(evaluation.evaluation_id)"
                  >
                    <i class="mdi mdi-eye btn-icon"></i>
                    Voir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

export default {
  name: 'StudentGrades',
  components: {
    DashboardLayout
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const error = ref(null)
    const matieres = ref([])
    const moyenneGenerale = ref(0)
    const totalMatieres = ref(0)
    const totalEvaluations = ref(0)

    // Filtres et tri
    const searchQuery = ref('')
    const filterType = ref('')
    const filterMatiere = ref('')
    const sortBy = ref('date-desc')
    const showSummary = ref(true)

    // Aplatir toutes les évaluations dans un seul tableau
    const allEvaluations = computed(() => {
      const evaluations = []
      matieres.value.forEach(matiere => {
        matiere.evaluations.forEach(evaluation => {
          evaluations.push({
            ...evaluation,
            matiere_nom: matiere.matiere_nom,
            matiere_id: matiere.matiere_id
          })
        })
      })
      return evaluations
    })

    // Évaluations filtrées et triées
    const filteredEvaluations = computed(() => {
      let result = [...allEvaluations.value]

      // Filtrer par recherche
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(e =>
          e.matiere_nom.toLowerCase().includes(query) ||
          e.titre.toLowerCase().includes(query)
        )
      }

      // Filtrer par type
      if (filterType.value) {
        result = result.filter(e => e.type === filterType.value)
      }

      // Filtrer par matière
      if (filterMatiere.value) {
        result = result.filter(e => e.matiere_id === filterMatiere.value)
      }

      // Trier
      switch (sortBy.value) {
        case 'date-desc':
          result.sort((a, b) => new Date(b.date_evaluation) - new Date(a.date_evaluation))
          break
        case 'date-asc':
          result.sort((a, b) => new Date(a.date_evaluation) - new Date(b.date_evaluation))
          break
        case 'note-desc':
          result.sort((a, b) => parseFloat(b.note) - parseFloat(a.note))
          break
        case 'note-asc':
          result.sort((a, b) => parseFloat(a.note) - parseFloat(b.note))
          break
        case 'matiere':
          result.sort((a, b) => a.matiere_nom.localeCompare(b.matiere_nom))
          break
      }

      return result
    })

    // Statistiques de réussite
    const statsReussite = computed(() => {
      const total = allEvaluations.value.length
      const reussies = allEvaluations.value.filter(e => parseFloat(e.note) >= 10).length
      const taux = total > 0 ? Math.round((reussies / total) * 100) : 0
      return { total, reussies, taux }
    })

    // Meilleure note
    const statsMeilleureNote = computed(() => {
      if (allEvaluations.value.length === 0) return 0
      return Math.max(...allEvaluations.value.map(e => parseFloat(e.note)))
    })

    // Matière avec la meilleure note
    const meilleureMatiere = computed(() => {
      const meilleureEval = allEvaluations.value.find(
        e => parseFloat(e.note) === statsMeilleureNote.value
      )
      return meilleureEval?.matiere_nom || ''
    })

    // Récupérer les notes
    const fetchGrades = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await api.get('/my-grades')

        if (response.success) {
          const data = response.data
          matieres.value = data.matieres || []
          moyenneGenerale.value = data.moyenne_generale || 0
          totalMatieres.value = data.total_matieres || 0
          totalEvaluations.value = data.total_evaluations || 0
        } else {
          error.value = response.message || 'Erreur lors du chargement des notes'
        }
      } catch (err) {
        console.error('Erreur récupération notes:', err)
        error.value = err.response?.data?.message || 'Erreur de connexion au serveur'
      } finally {
        loading.value = false
      }
    }

    // Voir les résultats d'une évaluation
    const viewResults = (evaluationId) => {
      router.push(`/student/evaluations/${evaluationId}/results`)
    }

    // Formater le type d'évaluation
    const formatType = (type) => {
      const types = {
        'devoir': 'Devoir',
        'composition': 'Composition',
        'interrogation': 'Interrogation',
        'examen': 'Examen',
        'tp': 'TP',
        'td': 'TD',
        'qcm': 'QCM'
      }
      return types[type] || type
    }

    // Formater la date
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    // Formater le temps passé
    const formatTemps = (minutes) => {
      if (!minutes || minutes === 0) return '-'
      if (minutes < 60) return `${minutes} min`
      const heures = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${heures}h${mins}` : `${heures}h`
    }

    // Classe CSS pour la moyenne
    const getMoyenneClass = (moyenne) => {
      if (moyenne >= 16) return 'note-excellent'
      if (moyenne >= 14) return 'note-good'
      if (moyenne >= 12) return 'note-average'
      if (moyenne >= 10) return 'note-below-average'
      return 'note-fail'
    }

    // Classe CSS pour une note
    const getNoteClass = (note) => {
      if (note >= 16) return 'note-excellent'
      if (note >= 14) return 'note-good'
      if (note >= 12) return 'note-average'
      if (note >= 10) return 'note-below-average'
      return 'note-fail'
    }

    // Note maximale d'une matière
    const getMaxNote = (matiere) => {
      if (!matiere.evaluations || matiere.evaluations.length === 0) return 0
      return Math.max(...matiere.evaluations.map(e => parseFloat(e.note)))
    }

    // Note minimale d'une matière
    const getMinNote = (matiere) => {
      if (!matiere.evaluations || matiere.evaluations.length === 0) return 0
      return Math.min(...matiere.evaluations.map(e => parseFloat(e.note)))
    }

    // Icône de tendance (progression ou régression)
    const getTrendIcon = (matiere) => {
      if (!matiere.evaluations || matiere.evaluations.length < 2) return 'mdi-arrow-right'

      const sorted = [...matiere.evaluations].sort((a, b) =>
        new Date(a.date_evaluation) - new Date(b.date_evaluation)
      )

      const firstNote = parseFloat(sorted[0].note)
      const lastNote = parseFloat(sorted[sorted.length - 1].note)

      if (lastNote > firstNote) return 'mdi-trending-up'
      if (lastNote < firstNote) return 'mdi-trending-down'
      return 'mdi-arrow-right'
    }

    // Texte de la tendance
    const getTrendText = (matiere) => {
      if (!matiere.evaluations || matiere.evaluations.length < 2) return 'Stable'

      const sorted = [...matiere.evaluations].sort((a, b) =>
        new Date(a.date_evaluation) - new Date(b.date_evaluation)
      )

      const firstNote = parseFloat(sorted[0].note)
      const lastNote = parseFloat(sorted[sorted.length - 1].note)

      if (lastNote > firstNote) return 'En hausse'
      if (lastNote < firstNote) return 'En baisse'
      return 'Stable'
    }

    // Vérifier si une note est nouvelle (< 48h)
    const isNew = (evaluation) => {
      if (!evaluation.date_soumission) return false
      const soumissionDate = new Date(evaluation.date_soumission)
      const now = new Date()
      const diffHours = (now - soumissionDate) / (1000 * 60 * 60)
      return diffHours < 48
    }

    // Réinitialiser les filtres
    const resetFilters = () => {
      searchQuery.value = ''
      filterType.value = ''
      filterMatiere.value = ''
      sortBy.value = 'date-desc'
    }

    // Toggle résumé
    const toggleSummary = () => {
      showSummary.value = !showSummary.value
    }

    // Export PDF (basique pour l'instant)
    const exportToPDF = () => {
      window.print()
    }

    onMounted(() => {
      fetchGrades()
    })

    return {
      loading,
      error,
      matieres,
      moyenneGenerale,
      totalMatieres,
      totalEvaluations,
      allEvaluations,
      filteredEvaluations,
      statsReussite,
      statsMeilleureNote,
      meilleureMatiere,
      searchQuery,
      filterType,
      filterMatiere,
      sortBy,
      showSummary,
      fetchGrades,
      viewResults,
      formatType,
      formatDate,
      formatTemps,
      getMoyenneClass,
      getNoteClass,
      getMaxNote,
      getMinNote,
      getTrendIcon,
      getTrendText,
      isNew,
      resetFilters,
      toggleSummary,
      exportToPDF
    }
  }
}
</script>

<style scoped>
.grades-container {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* Header */
.grades-header {
  margin-bottom: 2rem;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

.title-icon {
  font-size: 2rem;
  color: var(--primary-color);
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-card.moyenne-card {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-detail {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 0.5rem;
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.75rem;
}

.moyenne-card .progress-bar {
  background: rgba(255, 255, 255, 0.3);
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-fill.note-excellent { background: #4caf50; }
.progress-fill.note-good { background: #8bc34a; }
.progress-fill.note-average { background: #ff9800; }
.progress-fill.note-below-average { background: #ff5722; }
.progress-fill.note-fail { background: #f44336; }

/* Filters Section */
.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 180px;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
}

.btn-export {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-export:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Summary Section */
.summary-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding-bottom: 1rem;
}

.section-header:hover .section-title {
  color: var(--primary-color);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  transition: color 0.2s;
}

.toggle-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.summary-content {
  padding-top: 1rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-primary);
  transition: all 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.summary-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.summary-matiere-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.summary-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.summary-moyenne {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.moyenne-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-icon {
  font-size: 1.2rem;
  color: var(--primary-color);
}

/* Loading & Error */
.loading-container,
.error-container,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.spinner {
  width: 64px;
  height: 64px;
  border: 4px solid var(--border-primary);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text,
.error-text {
  margin: 1rem 0;
  font-size: 1rem;
  color: var(--text-secondary);
}

.error-icon {
  font-size: 48px;
  display: block;
  margin: 0 auto 1rem;
  color: #f44336;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.refresh-icon {
  font-size: 1.2rem;
}

.empty-state h3 {
  color: var(--text-primary);
  margin: 1rem 0 0.5rem;
}

.empty-icon {
  font-size: 80px;
  display: block;
  margin: 0 auto 1rem;
  color: var(--text-secondary);
}

/* Table Container */
.grades-table-container {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.table-header {
  margin-bottom: 1rem;
}

.table-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Grades Table */
.grades-table {
  width: 100%;
  border-collapse: collapse;
}

.grades-table thead {
  background: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-primary);
}

.grades-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.grades-table tbody tr {
  border-bottom: 1px solid var(--border-primary);
  transition: background-color 0.2s ease;
}

.grades-table tbody tr:last-child {
  border-bottom: none;
}

.grades-table tbody tr:hover {
  background-color: var(--bg-hover);
}

.grades-table tbody tr.row-new {
  background: linear-gradient(90deg, rgba(76, 175, 80, 0.05), transparent);
}

.grades-table td {
  padding: 1rem;
  color: var(--text-primary);
}

/* Table Cells */
.matiere-cell,
.titre-cell {
  font-weight: 500;
}

.matiere-info,
.titre-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.matiere-icon {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.eval-icon {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.matiere-name {
  font-weight: 600;
  color: var(--text-primary);
}

.badge-new {
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #4caf50, #8bc34a);
  color: white;
  border-radius: 12px;
  font-weight: 700;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

.type-devoir {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.type-composition {
  background: rgba(156, 39, 176, 0.1);
  color: #9c27b0;
}

.type-interrogation {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.type-examen {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.type-tp, .type-td {
  background: rgba(0, 150, 136, 0.1);
  color: #009688;
}

.type-qcm {
  background: rgba(103, 58, 183, 0.1);
  color: #673ab7;
}

.note-value {
  font-weight: 700;
  font-size: 1.125rem;
}

.note-excellent { color: #4caf50; }
.note-good { color: #8bc34a; }
.note-average { color: #ff9800; }
.note-below-average { color: #ff5722; }
.note-fail { color: #f44336; }

.coefficient-badge {
  display: inline-block;
  background: var(--bg-tertiary);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.date-cell,
.temps-cell,
.coef-cell {
  color: var(--text-secondary);
  font-size: 0.875rem;
  white-space: nowrap;
}

.actions-cell {
  text-align: center;
}

.btn-view {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  background: var(--primary-color);
  color: white;
}

.btn-icon {
  font-size: 1rem;
}

/* Print styles */
@media print {
  .filters-section,
  .btn-export,
  .actions-cell,
  .section-header {
    display: none !important;
  }

  .summary-content {
    display: block !important;
    max-height: none !important;
  }

  .grades-container {
    padding: 0;
  }

  .stat-card,
  .summary-card,
  .grades-table-container {
    box-shadow: none;
    border: 1px solid #ddd;
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .grades-table {
    font-size: 0.875rem;
  }

  .grades-table th,
  .grades-table td {
    padding: 0.75rem 0.5rem;
  }
}

@media (max-width: 768px) {
  .grades-container {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .grades-table-container {
    padding: 1rem;
    overflow-x: auto;
  }

  .grades-table {
    min-width: 900px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
