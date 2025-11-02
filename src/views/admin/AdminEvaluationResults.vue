<template>
  <DashboardLayout>
    <div class="results-container">
      <!-- En-tête -->
      <div class="results-header">
        <div class="header-title-wrapper">
          <h1 class="header-title">
            <span class="title-icon">📊</span>
            Résultats des Évaluations
          </h1>
          <p class="header-subtitle">Consultez les résultats détaillés par classe et évaluation</p>
        </div>
      </div>

      <!-- Filtres de sélection -->
      <div class="filters-section">
        <div class="filters-row">
          <!-- Sélection Classe -->
          <div class="filter-group">
            <label class="filter-label">
              <span class="label-icon">🏫</span>
              Classe
            </label>
            <select v-model="selectedClasseId" @change="onClasseChange" class="filter-select-input">
              <option value="">Sélectionner une classe</option>
              <option v-for="classe in classes" :key="classe.id" :value="classe.id">
                {{ classe.name || classe.libelle }}
              </option>
            </select>
          </div>

          <!-- Sélection Évaluation -->
          <div class="filter-group">
            <label class="filter-label">
              <span class="label-icon">📝</span>
              Évaluation
            </label>
            <select
              v-model="selectedEvaluationId"
              @change="loadResults"
              :disabled="!selectedClasseId || loadingEvaluations"
              class="filter-select-input"
            >
              <option value="">{{ loadingEvaluations ? 'Chargement...' : 'Sélectionner une évaluation' }}</option>
              <option v-for="evaluation in evaluations" :key="evaluation.id" :value="evaluation.id">
                {{ evaluation.titre }}
              </option>
            </select>
          </div>

          <!-- Actions de réinitialisation -->
          <div class="filter-group-action">
            <button
              v-if="selectedClasseId || selectedEvaluationId"
              @click="resetFilters"
              class="btn-reset-filters"
              title="Réinitialiser les filtres"
            >
              <span>🔄</span>
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">⏳</div>
        <p class="loading-text">Chargement des résultats...</p>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">Erreur de Chargement</h3>
        <p class="error-message">{{ error }}</p>
        <button @click="loadResults" class="error-retry-btn">
          <span class="filter-icon">🔄</span>
          Réessayer
        </button>
      </div>

      <!-- Résultats -->
      <div v-else-if="results">
        <!-- Statistiques -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="stat-card border-l-blue">
            <div class="stat-header">
              <span class="stat-icon">👥</span>
              <p class="stat-label">Total Étudiants</p>
            </div>
            <p class="stat-value text-blue-400">{{ statistics.total_etudiants }}</p>
          </div>

          <div class="stat-card border-l-green">
            <div class="stat-header">
              <span class="stat-icon">✅</span>
              <p class="stat-label">Ont Soumis</p>
            </div>
            <p class="stat-value text-green-400">{{ statistics.etudiants_soumis }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ statistics.taux_participation }}% de participation</p>
          </div>

          <div class="stat-card border-l-orange">
            <div class="stat-header">
              <span class="stat-icon">📈</span>
              <p class="stat-label">Moyenne Classe</p>
            </div>
            <p class="stat-value text-orange-400">
              {{ statistics.moyenne_classe !== null ? statistics.moyenne_classe + '/20' : 'N/A' }}
            </p>
          </div>

          <div class="stat-card border-l-purple">
            <div class="stat-header">
              <span class="stat-icon">🎯</span>
              <p class="stat-label">Notes Min/Max</p>
            </div>
            <p class="text-xl font-bold text-purple-400">
              {{ statistics.note_min !== null ? statistics.note_min : 'N/A' }} -
              {{ statistics.note_max !== null ? statistics.note_max : 'N/A' }}
            </p>
          </div>
        </div>

        <!-- Info Évaluation -->
        <div class="widget-card mb-6 border-l-4 border-blue-500">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-gray-500 flex items-center gap-1">
                <span>📝</span> Évaluation
              </p>
              <p class="font-medium text-gray-200">{{ evaluation.titre }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 flex items-center gap-1">
                <span>📚</span> Matière
              </p>
              <p class="font-medium text-gray-200">{{ evaluation.matiere?.name || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 flex items-center gap-1">
                <span>🏫</span> Classe
              </p>
              <p class="font-medium text-gray-200">{{ evaluation.classe?.name || evaluation.classe?.libelle || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 flex items-center gap-1">
                <span>💯</span> Barème
              </p>
              <p class="font-medium text-gray-200">{{ evaluation.bareme || 20 }}/20</p>
            </div>
          </div>
        </div>

        <!-- Filtres de recherche et Export -->
        <div class="filters-card">
          <div class="filters-grid">
            <!-- Recherche -->
            <div class="filter-item-large">
              <label class="filter-label">
                <span class="filter-icon">🔍</span>
                Recherche
              </label>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Nom de l'étudiant..."
                class="filter-input"
              />
            </div>

            <!-- Filtre par statut -->
            <div class="filter-item">
              <label class="filter-label">
                <span class="filter-icon">🎯</span>
                Statut
              </label>
              <select v-model="filterStatus" class="filter-select">
                <option value="">Tous les statuts</option>
                <option value="soumis">✅ Soumis</option>
                <option value="en_cours">⏳ En cours</option>
                <option value="non_passee">❌ Non passée</option>
              </select>
            </div>

            <!-- Boutons Export -->
            <div class="filter-actions" style="gap: 0.5rem;">
              <button @click="exportToExcel" class="btn-success flex items-center gap-2">
                <span>📥</span>
                Excel
              </button>
              <button @click="exportToPDF" class="btn-danger flex items-center gap-2">
                <span>📄</span>
                PDF
              </button>
            </div>
          </div>
        </div>

        <!-- Tableau des résultats -->
        <div class="widget-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th @click="sortBy('etudiant_nom_complet')" class="cursor-pointer">
                    Étudiant
                    <span v-if="sortColumn === 'etudiant_nom_complet'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th @click="sortBy('note')" class="cursor-pointer">
                    Note /20
                    <span v-if="sortColumn === 'note'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th @click="sortBy('score')" class="cursor-pointer">
                    Score
                    <span v-if="sortColumn === 'score'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th @click="sortBy('status')" class="cursor-pointer">
                    Statut
                    <span v-if="sortColumn === 'status'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th @click="sortBy('submitted_at')" class="cursor-pointer">
                    Date Soumission
                    <span v-if="sortColumn === 'submitted_at'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th>Tentative</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="resultat in filteredResults" :key="resultat.etudiant_id">
                  <td>
                    <div class="font-medium text-gray-200">{{ resultat.etudiant_nom_complet }}</div>
                  </td>
                  <td>
                    <div class="font-bold" :class="getNoteColor(resultat.note)">
                      {{ resultat.note !== null ? resultat.note + '/20' : '-' }}
                    </div>
                  </td>
                  <td>
                    <div class="text-gray-300">
                      {{ resultat.score !== null ? resultat.score + ' pts' : '-' }}
                    </div>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusClass(resultat.status)">
                      {{ getStatusText(resultat.status) }}
                    </span>
                  </td>
                  <td class="text-gray-400">
                    {{ resultat.submitted_at ? formatDate(resultat.submitted_at) : '-' }}
                  </td>
                  <td class="text-gray-400">
                    {{ resultat.attempt || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Message si pas de résultats -->
          <div v-if="filteredResults.length === 0" class="empty-state-small">
            <div class="empty-icon-small">🔍</div>
            <p class="empty-message-small">Aucun résultat ne correspond à vos critères de recherche</p>
          </div>
        </div>
      </div>

      <!-- Message si pas de sélection -->
      <div v-else class="empty-state">
        <div class="empty-icon">📊</div>
        <h3 class="empty-title">Aucune sélection</h3>
        <p class="empty-message">Veuillez sélectionner une classe et une évaluation pour afficher les résultats</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import evaluationService from '@/services/evaluation'
import klassciService from '@/services/klassci'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// State
const classes = ref([])
const evaluations = ref([])
const selectedClasseId = ref('')
const selectedEvaluationId = ref('')
const loadingEvaluations = ref(false)
const loading = ref(false)
const error = ref(null)
const results = ref(null)
const evaluation = ref(null)
const statistics = ref(null)

// Filtres et tri
const searchQuery = ref('')
const filterStatus = ref('')
const sortColumn = ref('etudiant_nom_complet')
const sortDirection = ref('asc')

// Computed
const filteredResults = computed(() => {
  if (!results.value) return []

  let filtered = results.value

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r =>
      r.etudiant_nom_complet.toLowerCase().includes(query)
    )
  }

  // Filtre par statut
  if (filterStatus.value) {
    filtered = filtered.filter(r => r.status === filterStatus.value)
  }

  // Tri
  filtered = [...filtered].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]

    // Gérer les valeurs null
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (sortColumn.value === 'submitted_at') {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    }

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return filtered
})

// Methods
async function loadClasses() {
  try {
    const response = await klassciService.getClasses()
    if (response.success) {
      classes.value = response.data
    }
  } catch (err) {
    console.error('Erreur chargement classes:', err)
  }
}

async function onClasseChange() {
  selectedEvaluationId.value = ''
  results.value = null
  evaluation.value = null
  statistics.value = null

  if (!selectedClasseId.value) {
    evaluations.value = []
    return
  }

  await loadEvaluations()
}

async function loadEvaluations() {
  loadingEvaluations.value = true
  try {
    const response = await evaluationService.getEvaluations({
      classe_id: selectedClasseId.value,
      is_published: true
    })
    if (response.success) {
      evaluations.value = response.data
    }
  } catch (err) {
    console.error('Erreur chargement évaluations:', err)
  } finally {
    loadingEvaluations.value = false
  }
}

async function loadResults() {
  if (!selectedEvaluationId.value) {
    results.value = null
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await evaluationService.getEvaluationResultsByClass(selectedEvaluationId.value)

    if (response.success) {
      evaluation.value = response.data.evaluation
      results.value = response.data.resultats
      statistics.value = response.data.statistiques
    } else {
      error.value = 'Erreur lors du chargement des résultats'
    }
  } catch (err) {
    console.error('Erreur chargement résultats:', err)
    error.value = 'Impossible de charger les résultats'
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  selectedClasseId.value = ''
  selectedEvaluationId.value = ''
  evaluations.value = []
  results.value = null
  evaluation.value = null
  statistics.value = null
  searchQuery.value = ''
  filterStatus.value = ''
}

function sortBy(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'soumis':
      return 'badge-success'
    case 'en_cours':
      return 'badge-warning'
    case 'non_passee':
      return 'badge-secondary'
    default:
      return 'badge-secondary'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'soumis':
      return 'Soumis'
    case 'en_cours':
      return 'En cours'
    case 'non_passee':
      return 'Non passée'
    default:
      return status
  }
}

function getNoteColor(note) {
  if (note === null || note === undefined) return 'text-gray-500'
  if (note >= 16) return 'text-green-400'
  if (note >= 12) return 'text-blue-400'
  if (note >= 10) return 'text-yellow-400'
  return 'text-red-400'
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function exportToExcel() {
  if (!results.value || results.value.length === 0) {
    alert('Aucun résultat à exporter')
    return
  }

  // Préparer les données
  const data = filteredResults.value.map(r => ({
    'Nom Complet': r.etudiant_nom_complet,
    'Note /20': r.note !== null ? r.note : '-',
    'Score': r.score !== null ? r.score : '-',
    'Statut': getStatusText(r.status),
    'Date Soumission': r.submitted_at ? formatDate(r.submitted_at) : '-',
    'Tentative': r.attempt || '-'
  }))

  // Créer le workbook
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Résultats')

  // Télécharger
  const filename = `resultats_${evaluation.value.titre}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}

function exportToPDF() {
  if (!results.value || results.value.length === 0) {
    alert('Aucun résultat à exporter')
    return
  }

  const doc = new jsPDF()

  // Titre
  doc.setFontSize(18)
  doc.text('Résultats d\'Évaluation', 14, 20)

  // Infos évaluation
  doc.setFontSize(10)
  doc.text(`Évaluation: ${evaluation.value.titre}`, 14, 30)
  doc.text(`Matière: ${evaluation.value.matiere?.name || 'N/A'}`, 14, 36)
  doc.text(`Classe: ${evaluation.value.classe?.name || evaluation.value.classe?.libelle || 'N/A'}`, 14, 42)
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 48)

  // Statistiques
  doc.text(`Total étudiants: ${statistics.value.total_etudiants}`, 14, 56)
  doc.text(`Ont soumis: ${statistics.value.etudiants_soumis} (${statistics.value.taux_participation}%)`, 14, 62)
  doc.text(`Moyenne: ${statistics.value.moyenne_classe !== null ? statistics.value.moyenne_classe + '/20' : 'N/A'}`, 14, 68)

  // Tableau
  const tableData = filteredResults.value.map(r => [
    r.etudiant_nom_complet,
    r.note !== null ? r.note + '/20' : '-',
    r.score !== null ? r.score : '-',
    getStatusText(r.status),
    r.submitted_at ? formatDate(r.submitted_at) : '-'
  ])

  doc.autoTable({
    startY: 75,
    head: [['Étudiant', 'Note /20', 'Score', 'Statut', 'Date Soumission']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  })

  // Télécharger
  const filename = `resultats_${evaluation.value.titre}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

// Lifecycle
onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
/* =========================
   CONTAINER
   ========================= */
.results-container {
  padding: var(--spacing-xl);
  max-width: 100%;
  background: var(--bg-secondary);
  min-height: calc(100vh - 4rem);
}

/* =========================
   HEADER
   ========================= */
.results-header {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
}

.header-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.header-title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0;
}

.title-icon {
  font-size: 2.5rem;
  display: inline-flex;
  align-items: center;
}

.header-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
  padding-left: 3.5rem;
}

/* =========================
   FILTERS SECTION
   ========================= */
.filters-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
}

.filters-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--spacing-lg);
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.filter-group-action {
  display: flex;
  align-items: flex-end;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.label-icon {
  font-size: 1.25rem;
}

.filter-select-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: var(--font-size-base);
  color: var(--input-text);
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.filter-select-input:hover {
  border-color: var(--input-border-focus);
}

.filter-select-input:focus {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-select-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-tertiary);
}

.btn-reset-filters {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  background: var(--btn-secondary-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-reset-filters:hover {
  background: var(--btn-secondary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* =========================
   LOADING STATE
   ========================= */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  margin-top: var(--spacing-xl);
}

.loading-spinner {
  font-size: 4rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

.loading-text {
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

/* =========================
   EMPTY STATE
   ========================= */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  margin-top: var(--spacing-xl);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.empty-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-message {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
}

.empty-state-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-icon-small {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.4;
}

.empty-message-small {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* =========================
   ERROR STATE
   ========================= */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--error-border);
  margin-top: var(--spacing-xl);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.error-message {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.error-retry-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.75rem 1.5rem;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all var(--transition-fast);
}

.error-retry-btn:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* =========================
   RESPONSIVE
   ========================= */
@media (max-width: 1024px) {
  .filters-row {
    grid-template-columns: 1fr 1fr;
  }

  .filter-group-action {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .results-container {
    padding: var(--spacing-md);
  }

  .results-header,
  .filters-section {
    padding: var(--spacing-md);
  }

  .header-title {
    font-size: var(--font-size-2xl);
  }

  .header-subtitle {
    padding-left: 0;
    margin-top: var(--spacing-xs);
  }

  .filters-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .empty-state,
  .error-state {
    padding: 2rem 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }
}
</style>
