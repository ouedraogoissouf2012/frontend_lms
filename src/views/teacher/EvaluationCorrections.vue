<template>
  <DashboardLayout>
    <div class="corrections-container">
      <!-- Header avec retour -->
      <div class="page-header">
        <button @click="goBack" class="btn-back">
          <ArrowLeftIcon class="w-5 h-5" />
          Retour
        </button>
        <div class="header-content">
          <div class="header-info">
            <DocumentTextIcon class="page-icon" />
            <div>
              <h1 class="page-title">Notes et Résultats</h1>
              <p v-if="evaluation" class="page-subtitle">{{ evaluation.titre }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <SkeletonLoader v-if="loading" type="list" :count="5" />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <span class="error-icon">⚠</span>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadResults" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <template v-else-if="evaluation">
        <!-- Informations de l'évaluation -->
        <div class="eval-info-card">
          <div class="info-grid">
            <div class="info-item">
              <BookOpenIcon class="info-icon" />
              <div>
                <p class="info-label">Matière</p>
                <p class="info-value">{{ evaluation.matiere?.nom || 'Non définie' }}</p>
              </div>
            </div>
            <div class="info-item">
              <UserGroupIcon class="info-icon" />
              <div>
                <p class="info-label">Classe</p>
                <p class="info-value">{{ evaluation.classe?.nom || evaluation.classe?.libelle || 'Non définie' }}</p>
              </div>
            </div>
            <div class="info-item">
              <CalendarIcon class="info-icon" />
              <div>
                <p class="info-label">Date</p>
                <p class="info-value">{{ formatDate(evaluation.date_evaluation) }}</p>
              </div>
            </div>
            <div class="info-item">
              <ClockIcon class="info-icon" />
              <div>
                <p class="info-label">Coefficient / Barème</p>
                <p class="info-value">{{ evaluation.coefficient || 1 }} - {{ evaluation.bareme || 20 }}/20</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <UserGroupIcon class="stat-icon text-blue-600" />
              <span class="stat-label">Total Étudiants</span>
            </div>
            <p class="stat-value">{{ statistiques.total_etudiants || 0 }}</p>
            <p class="stat-change">dans la classe</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <CheckCircleIcon class="stat-icon text-green-600" />
              <span class="stat-label">Ont composé</span>
            </div>
            <p class="stat-value">{{ statistiques.etudiants_soumis || 0 }}</p>
            <p class="stat-change">{{ statistiques.taux_participation || 0 }}% de participation</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <ChartBarIcon class="stat-icon text-purple-600" />
              <span class="stat-label">Moyenne Classe</span>
            </div>
            <p class="stat-value">{{ statistiques.moyenne_classe || '-' }}<span v-if="statistiques.moyenne_classe" class="stat-unit">/20</span></p>
            <p class="stat-change">
              Min: {{ statistiques.note_min || '-' }} / Max: {{ statistiques.note_max || '-' }}
            </p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <ClockIcon class="stat-icon text-orange-600" />
              <span class="stat-label">En cours</span>
            </div>
            <p class="stat-value">{{ statistiques.etudiants_en_cours || 0 }}</p>
            <p class="stat-change">étudiants</p>
          </div>
        </div>

        <!-- Liste des résultats -->
        <div class="results-card">
          <div class="results-header">
            <h2 class="results-title">Résultats détaillés</h2>
            <button @click="exportToExcel" class="btn-export">
              <DocumentArrowDownIcon class="w-5 h-5" />
              Exporter (Excel)
            </button>
          </div>

          <div v-if="resultats.length > 0" class="table-container">
            <table class="results-table">
              <thead>
                <tr>
                  <th class="th-name">Étudiant</th>
                  <th class="th-center">Note</th>
                  <th class="th-center">Statut</th>
                  <th class="th-center">Date soumission</th>
                  <th class="th-center">Tentative</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="resultat in resultats" :key="resultat.etudiant_id" class="table-row">
                  <td class="td-name">
                    <div class="student-info">
                      <div class="student-avatar">
                        {{ getInitials(resultat.etudiant_nom_complet) }}
                      </div>
                      <span>{{ resultat.etudiant_nom_complet }}</span>
                    </div>
                  </td>
                  <td class="td-center">
                    <span v-if="resultat.note !== null" :class="getNoteClass(resultat.note)" class="note-badge">
                      {{ resultat.note }}/20
                    </span>
                    <span v-else class="note-empty">-</span>
                  </td>
                  <td class="td-center">
                    <span :class="getStatusClass(resultat.status)" class="status-badge">
                      {{ getStatusLabel(resultat.status) }}
                    </span>
                  </td>
                  <td class="td-center td-date">
                    {{ resultat.submitted_at ? formatDateTime(resultat.submitted_at) : '-' }}
                  </td>
                  <td class="td-center">
                    <span v-if="resultat.attempt" class="attempt-badge">
                      Tentative {{ resultat.attempt }}
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-results">
            <UserGroupIcon class="empty-icon" />
            <p class="empty-text">Aucun résultat pour le moment</p>
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
import evaluationService from '@/services/evaluation'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  BookOpenIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref(null)
const evaluation = ref(null)
const resultats = ref([])
const statistiques = ref({
  total_etudiants: 0,
  etudiants_soumis: 0,
  etudiants_en_cours: 0,
  etudiants_non_passes: 0,
  taux_participation: 0,
  moyenne_classe: null,
  note_max: null,
  note_min: null
})

// Charger les résultats
async function loadResults() {
  loading.value = true
  error.value = null

  try {
    const evaluationId = parseInt(route.params.id)
    console.log('[NOTES] Chargement résultats pour évaluation:', evaluationId)

    const response = await evaluationService.getResultsByClass(evaluationId)

    if (response.success) {
      evaluation.value = response.data.evaluation
      resultats.value = response.data.resultats
      statistiques.value = response.data.statistiques

      console.log('[NOTES] Résultats chargés:', {
        evaluation: evaluation.value.titre,
        total_etudiants: statistiques.value.total_etudiants,
        soumis: statistiques.value.etudiants_soumis,
        moyenne: statistiques.value.moyenne_classe
      })
    } else {
      error.value = 'Impossible de charger les résultats'
    }
  } catch (err) {
    console.error('[ERREUR] Chargement résultats:', err)
    error.value = err.response?.data?.message || 'Erreur lors du chargement des résultats'
  } finally {
    loading.value = false
  }
}

// Retour
function goBack() {
  router.push({ name: 'TeacherEvaluations' })
}

// Format date
function formatDate(date) {
  if (!date) return 'Non définie'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Format date time
function formatDateTime(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get initials
function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Get note class
function getNoteClass(note) {
  if (note >= 16) return 'note-excellent'
  if (note >= 14) return 'note-good'
  if (note >= 10) return 'note-average'
  return 'note-low'
}

// Get status class
function getStatusClass(status) {
  const classes = {
    'soumis': 'status-submitted',
    'corrige': 'status-corrected',
    'en_cours': 'status-ongoing',
    'non_passee': 'status-not-taken'
  }
  return classes[status] || 'status-default'
}

// Get status label
function getStatusLabel(status) {
  const labels = {
    'soumis': 'Soumis',
    'corrige': 'Corrigé',
    'en_cours': 'En cours',
    'non_passee': 'Non passée'
  }
  return labels[status] || status
}

// Export to Excel
function exportToExcel() {
  if (!evaluation.value || resultats.value.length === 0) {
    alert('Aucune donnée à exporter')
    return
  }

  // Créer les données CSV
  const headers = ['Nom', 'Prénom', 'Note (/20)', 'Statut', 'Date soumission', 'Tentative']
  const rows = resultats.value.map(r => [
    r.etudiant_nom || '',
    r.etudiant_prenom || '',
    r.note !== null ? r.note : '',
    getStatusLabel(r.status),
    r.submitted_at ? formatDateTime(r.submitted_at) : '',
    r.attempt || ''
  ])

  let csvContent = headers.join(',') + '\n'
  rows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
  })

  // Télécharger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `notes_${evaluation.value.titre.replace(/[^a-z0-9]/gi, '_')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  loadResults()
})
</script>

<style scoped>
.corrections-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.btn-back:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

/* Error State */
.error-state {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  font-size: 2rem;
  line-height: 1;
}

.error-title {
  font-size: 1rem;
  font-weight: 600;
  color: #c00;
  margin: 0 0 0.25rem 0;
}

.error-message {
  font-size: 0.875rem;
  color: #900;
  margin: 0;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #b91c1c;
}

/* Eval Info Card */
.eval-info-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary-color);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Statistics */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.stat-unit {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.stat-change {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Results Card */
.results-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.results-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.results-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.th-center {
  text-align: center;
}

.th-name {
  width: 35%;
}

.table-row {
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}

.table-row:hover {
  background: var(--bg-hover);
}

.results-table td {
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.td-center {
  text-align: center;
}

.td-date {
  color: var(--text-secondary);
  font-size: 0.8125rem;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

/* Note Badge */
.note-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
}

.note-excellent {
  background: #dcfce7;
  color: #166534;
}

.note-good {
  background: #dbeafe;
  color: #1e40af;
}

.note-average {
  background: #fef3c7;
  color: #92400e;
}

.note-low {
  background: #fee2e2;
  color: #991b1b;
}

.note-empty {
  color: var(--text-tertiary);
  font-style: italic;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-submitted {
  background: #dbeafe;
  color: #1e40af;
}

.status-corrected {
  background: #dcfce7;
  color: #166534;
}

.status-ongoing {
  background: #fef3c7;
  color: #92400e;
}

.status-not-taken {
  background: #f3f4f6;
  color: #6b7280;
}

.attempt-badge {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

/* Empty State */
.empty-results {
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-tertiary);
  margin: 0 auto 1rem;
}

.empty-text {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .corrections-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-export {
    width: 100%;
    justify-content: center;
  }

  .table-container {
    overflow-x: scroll;
  }

  .results-table {
    min-width: 600px;
  }
}
</style>
