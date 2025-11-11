<template>
  <DashboardLayout>
    <div class="evaluation-details-container">
      <!-- Header avec bouton retour -->
      <div class="page-header">
        <button @click="goBack" class="btn-back">
          <ArrowLeftIcon class="w-5 h-5" />
          Retour
        </button>
        <div class="header-content">
          <DocumentTextIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">{{ evaluation?.titre || 'Résultats Détaillés' }}</h1>
            <p class="page-subtitle">
              {{ evaluation?.matiere?.nom || 'Matière' }} -
              {{ evaluation?.classe?.nom || evaluation?.classe?.libelle || 'Classe' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <SkeletonLoader type="card" height="150px" />
        <SkeletonLoader type="table" :rows="5" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <span class="error-icon">⚠</span>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadData" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Statistiques globales -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper bg-blue-100">
              <UserGroupIcon class="stat-icon text-blue-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Total étudiants</p>
              <p class="stat-value">{{ statistiques?.total_etudiants || 0 }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-green-100">
              <CheckCircleIcon class="stat-icon text-green-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Ont soumis</p>
              <p class="stat-value">{{ statistiques?.etudiants_soumis || 0 }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-purple-100">
              <ChartBarIcon class="stat-icon text-purple-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Moyenne classe</p>
              <p class="stat-value">{{ statistiques?.moyenne_classe ? statistiques.moyenne_classe.toFixed(2) : '-' }}/20</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-indigo-100">
              <ClockIcon class="stat-icon text-indigo-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Taux participation</p>
              <p class="stat-value">{{ statistiques?.taux_participation || 0 }}%</p>
            </div>
          </div>
        </div>

        <!-- Informations évaluation -->
        <div class="info-card">
          <h3 class="info-title">Informations de l'évaluation</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Enseignant:</span>
              <span class="info-value">{{ evaluation?.enseignant_nom || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date:</span>
              <span class="info-value">{{ formatDate(evaluation?.date_evaluation) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Durée:</span>
              <span class="info-value">{{ evaluation?.duree_minutes }} minutes</span>
            </div>
            <div class="info-item">
              <span class="info-label">Questions:</span>
              <span class="info-value">{{ evaluation?.questions_count || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type:</span>
              <span class="info-value">{{ evaluation?.type || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Coefficient:</span>
              <span class="info-value">{{ evaluation?.coefficient || 1 }}</span>
            </div>
          </div>
        </div>

        <!-- Tableau des résultats -->
        <div class="results-card">
          <div class="results-header">
            <h3 class="results-title">Résultats par étudiant</h3>
            <div class="results-actions">
              <button @click="exportCSV" class="btn-export">
                <DocumentArrowDownIcon class="w-5 h-5" />
                Exporter CSV
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nom complet</th>
                  <th>Statut</th>
                  <th>Note /20</th>
                  <th>Score</th>
                  <th>Date soumission</th>
                  <th>Tentative</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(resultat, index) in resultats" :key="resultat.etudiant_id">
                  <td>{{ index + 1 }}</td>
                  <td class="student-name">{{ resultat.etudiant_nom_complet }}</td>
                  <td>
                    <span :class="getStatusClass(resultat.status)" class="status-badge">
                      {{ getStatusLabel(resultat.status) }}
                    </span>
                  </td>
                  <td>
                    <span :class="getNoteClass(resultat.note)" class="note-value">
                      {{ resultat.note !== null && resultat.note !== undefined ? resultat.note.toFixed(2) : '-' }}
                    </span>
                  </td>
                  <td>{{ resultat.score !== null ? resultat.score : '-' }}</td>
                  <td>{{ formatDateTime(resultat.submitted_at) }}</td>
                  <td>{{ resultat.attempt || '-' }}</td>
                </tr>
              </tbody>
            </table>

            <div v-if="resultats.length === 0" class="empty-state">
              <UserGroupIcon class="empty-icon" />
              <p class="empty-text">Aucun résultat disponible</p>
            </div>
          </div>
        </div>

        <!-- Statistiques détaillées -->
        <div class="detailed-stats-grid">
          <div class="stat-detail-card">
            <h4 class="stat-detail-title">Distribution des notes</h4>
            <div class="distribution-list">
              <div class="distribution-item">
                <span class="distribution-label">Note min:</span>
                <span class="distribution-value">{{ statistiques?.note_min !== null ? statistiques.note_min.toFixed(2) : '-' }}</span>
              </div>
              <div class="distribution-item">
                <span class="distribution-label">Note max:</span>
                <span class="distribution-value">{{ statistiques?.note_max !== null ? statistiques.note_max.toFixed(2) : '-' }}</span>
              </div>
              <div class="distribution-item">
                <span class="distribution-label">Médiane:</span>
                <span class="distribution-value">{{ statistiques?.mediane !== null ? statistiques.mediane.toFixed(2) : '-' }}</span>
              </div>
            </div>
          </div>

          <div class="stat-detail-card">
            <h4 class="stat-detail-title">Répartition</h4>
            <div class="distribution-list">
              <div class="distribution-item">
                <span class="distribution-label">Étudiants soumis:</span>
                <span class="distribution-value text-green-600">{{ statistiques?.etudiants_soumis || 0 }}</span>
              </div>
              <div class="distribution-item">
                <span class="distribution-label">En cours:</span>
                <span class="distribution-value text-orange-600">{{ statistiques?.etudiants_en_cours || 0 }}</span>
              </div>
              <div class="distribution-item">
                <span class="distribution-label">Non passés:</span>
                <span class="distribution-value text-red-600">{{ statistiques?.etudiants_non_passes || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import {
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

// State
const loading = ref(true)
const error = ref(null)
const evaluation = ref(null)
const resultats = ref([])
const statistiques = ref(null)

// Methods
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    const evaluationId = route.params.id
    const response = await api.get(`/evaluations/${evaluationId}/results-by-class`)

    if (response.data.success) {
      evaluation.value = response.data.data.evaluation
      resultats.value = response.data.data.resultats
      statistiques.value = response.data.data.statistiques
    } else {
      error.value = response.data.message || 'Erreur lors du chargement des résultats'
    }
  } catch (err) {
    console.error('Erreur chargement résultats:', err)
    error.value = err.response?.data?.message || 'Erreur lors du chargement des résultats'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const getStatusClass = (status) => {
  const classes = {
    'soumis': 'status-success',
    'corrige': 'status-success',
    'en_cours': 'status-warning',
    'non_passee': 'status-error'
  }
  return classes[status] || 'status-default'
}

const getStatusLabel = (status) => {
  const labels = {
    'soumis': 'Soumis',
    'corrige': 'Corrigé',
    'en_cours': 'En cours',
    'non_passee': 'Non passée'
  }
  return labels[status] || status
}

const getNoteClass = (note) => {
  if (note === null || note === undefined) return ''
  if (note >= 16) return 'note-excellent'
  if (note >= 14) return 'note-good'
  if (note >= 10) return 'note-average'
  return 'note-poor'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const exportCSV = () => {
  const csvContent = [
    ['#', 'Nom complet', 'Statut', 'Note /20', 'Score', 'Date soumission', 'Tentative'],
    ...resultats.value.map((r, i) => [
      i + 1,
      r.etudiant_nom_complet,
      getStatusLabel(r.status),
      r.note !== null && r.note !== undefined ? r.note.toFixed(2) : '-',
      r.score || '-',
      formatDateTime(r.submitted_at),
      r.attempt || '-'
    ])
  ].map(row => row.join(';')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `resultats_${evaluation.value?.titre || 'evaluation'}_${new Date().getTime()}.csv`
  link.click()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.evaluation-details-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  padding: 0.625rem;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all var(--transition-fast);
}

.btn-back:hover {
  background: var(--hover-bg);
  transform: translateX(-2px);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
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
  margin: 0.25rem 0 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--card-shadow);
}

.stat-icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Info Card */
.info-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--card-shadow);
}

.info-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
}

/* Results Card */
.results-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--card-shadow);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.results-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.results-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-export {
  padding: 0.625rem 1.25rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background var(--transition-fast);
}

.btn-export:hover {
  background: var(--primary-hover);
}

/* Table */
.table-container {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table thead {
  background: var(--neutral-light);
}

.results-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-primary);
}

.results-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
}

.student-name {
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-success {
  background: var(--success-light);
  color: var(--success);
}

.status-warning {
  background: var(--warning-light);
  color: var(--warning);
}

.status-error {
  background: var(--danger-light);
  color: var(--danger);
}

.status-default {
  background: var(--neutral-light);
  color: var(--text-secondary);
}

.note-value {
  font-weight: 600;
}

.note-excellent {
  color: #10b981;
}

.note-good {
  color: #3b82f6;
}

.note-average {
  color: #f59e0b;
}

.note-poor {
  color: #ef4444;
}

/* Detailed Stats */
.detailed-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.stat-detail-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
}

.stat-detail-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.distribution-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.distribution-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.distribution-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Loading/Error States */
.loading-state,
.error-state {
  padding: 3rem;
  text-align: center;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 3rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--danger);
  margin: 0 0 0.5rem;
}

.error-message {
  color: var(--text-secondary);
  margin: 0;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background var(--transition-fast);
}

.btn-retry:hover {
  background: var(--primary-hover);
}

.empty-state {
  padding: 3rem;
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-secondary);
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 1rem;
}
</style>
