<template>
  <DashboardLayout>
    <div class="grades-container">
      <!-- En-tête avec statistiques -->
      <div class="grades-header">
        <h1 class="page-title">
          <i class="mdi mdi-certificate title-icon"></i>
          Mes Notes
        </h1>

        <div class="stats-cards">
          <div class="stat-card moyenne-card">
            <div class="stat-label">Moyenne Générale</div>
            <div class="stat-value" :class="getMoyenneClass(moyenneGenerale)">
              {{ moyenneGenerale }}/20
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Matières</div>
            <div class="stat-value">{{ totalMatieres }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Évaluations</div>
            <div class="stat-value">{{ totalEvaluations }}</div>
          </div>
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
      <div v-else-if="allEvaluations.length === 0" class="empty-state">
        <i class="mdi mdi-file-document-outline empty-icon"></i>
        <h3>Aucune note disponible</h3>
        <p>Vous n'avez pas encore de notes enregistrées.</p>
      </div>

      <!-- Tableau des notes -->
      <div v-else class="grades-table-container">
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
              v-for="(evaluation, index) in allEvaluations"
              :key="index"
              class="evaluation-row"
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
      // Trier par date décroissante (plus récent en premier)
      return evaluations.sort((a, b) => {
        return new Date(b.date_evaluation) - new Date(a.date_evaluation)
      })
    })

    // Récupérer les notes
    const fetchGrades = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await api.get('/my-grades')
        console.log('API /my-grades response:', response)

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
      router.push(`/evaluations/${evaluationId}/results`)
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
      fetchGrades,
      viewResults,
      formatType,
      formatDate,
      formatTemps,
      getMoyenneClass,
      getNoteClass
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

  .grades-table-container {
    padding: 1rem;
    overflow-x: auto;
  }

  .grades-table {
    min-width: 900px;
  }
}
</style>
