<template>
  <DashboardLayout>
    <div class="grades-container">
      <!-- En-tête avec statistiques -->
      <div class="grades-header">
        <h1 class="page-title">
          <i class="mdi mdi-certificate title-icon"></i>
          Mes Notes
        </h1>

        <GradesStatsCards
          :moyenne-generale="moyenneGenerale"
          :total-matieres="totalMatieres"
          :total-evaluations="totalEvaluations"
          :stats-reussite="statsReussite"
          :stats-meilleure-note="statsMeilleureNote"
          :meilleure-matiere="meilleureMatiere"
        />

        <GradesFilters
          v-model:searchQuery="searchQuery"
          v-model:filterType="filterType"
          v-model:filterMatiere="filterMatiere"
          v-model:sortBy="sortBy"
          :matieres="matieres"
          @export="exportToPDF"
        />
      </div>

      <!-- Chargement -->
      <ContentLoader v-if="loading" text="Chargement de vos notes..." />

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

      <!-- Résumé par matière + tableau des notes -->
      <div v-else class="content-wrapper">
        <GradesSummary :matieres="matieres" v-model:showSummary="showSummary" />
        <GradesTable :filtered-evaluations="filteredEvaluations" @view="viewResults" />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Notes de l'élève. Orchestrateur (#H10 ≤300) : la donnée et le chargement
 * vivent dans useStudentGrades ; la logique pure (format/tri/stats) dans
 * @/utils/studentGrades ; l'UI est composée de GradesStatsCards, GradesFilters,
 * GradesSummary et GradesTable. Comportement et rendu STRICTEMENT identiques.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import GradesStatsCards from '@/components/student/GradesStatsCards.vue'
import GradesFilters from '@/components/student/GradesFilters.vue'
import GradesSummary from '@/components/student/GradesSummary.vue'
import GradesTable from '@/components/student/GradesTable.vue'
import { useStudentGrades } from '@/composables/useStudentGrades'
import {
  flattenEvaluations,
  filterAndSortEvaluations,
  computeStatsReussite,
  computeMeilleureNote,
  findMeilleureMatiere
} from '@/utils/studentGrades'

defineOptions({ name: 'StudentGrades' })

const router = useRouter()

// État + chargement délégués au composable (H10 : orchestrateur < 300)
const {
  loading,
  error,
  matieres,
  moyenneGenerale,
  totalMatieres,
  totalEvaluations,
  fetchGrades
} = useStudentGrades()

// Filtres et tri
const searchQuery = ref('')
const filterType = ref('')
const filterMatiere = ref('')
const sortBy = ref('date-desc')
const showSummary = ref(true)

// Évaluations aplaties, filtrées/triées et stats dérivées (utils purs)
const allEvaluations = computed(() => flattenEvaluations(matieres.value))

const filteredEvaluations = computed(() => filterAndSortEvaluations(allEvaluations.value, {
  searchQuery: searchQuery.value,
  filterType: filterType.value,
  filterMatiere: filterMatiere.value,
  sortBy: sortBy.value
}))

const statsReussite = computed(() => computeStatsReussite(allEvaluations.value))
const statsMeilleureNote = computed(() => computeMeilleureNote(allEvaluations.value))
const meilleureMatiere = computed(() => findMeilleureMatiere(allEvaluations.value, statsMeilleureNote.value))

// Voir les résultats d'une évaluation
const viewResults = (evaluationId) => {
  router.push(`/student/evaluations/${evaluationId}/results`)
}

// Réinitialiser les filtres
const resetFilters = () => {
  searchQuery.value = ''
  filterType.value = ''
  filterMatiere.value = ''
  sortBy.value = 'date-desc'
}

// Export PDF (basique pour l'instant)
const exportToPDF = () => {
  window.print()
}

onMounted(() => {
  fetchGrades()
})
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

/* Error & Empty */
.error-container,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

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

/* Print styles */
@media print {
  .grades-container {
    padding: 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .grades-container {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
