<template>
  <DashboardLayout>
  <div class="matiere-details-content">
    <!-- Notifications Toast -->
    <MatiereNotifications :notifications="notifications" />

    <!-- Simple Header -->
    <MatiereDetailsHeader :matiere="matiere" :statistiques="statistiques" @back="$router.back()" />

    <!-- Loading -->
    <ContentLoader v-if="loading" text="Chargement de la matière..." />

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-900 font-medium">{{ error }}</p>
      <button
        @click="loadMatiereDetails"
        class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        Réessayer
      </button>
    </div>

    <!-- Tabs -->
    <div v-else class="bg-white shadow rounded-lg">
      <!-- Tab Headers -->
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-6 py-4 font-medium text-sm border-b-2 transition',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
            <span
              v-if="tab.count !== undefined"
              :class="[
                'ml-2 px-2 py-1 rounded-full text-xs',
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              ]"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Onglet Lessons -->
        <div v-if="activeTab === 'lessons'">
          <MatiereLessonsTab
            :lessons="lessons"
            :is-teacher="isTeacher"
            :loading="loading"
            v-model:view-mode="viewMode"
            @create="createLesson"
            @view="viewLesson"
            @edit="editLesson"
            @delete="confirmDeleteLesson"
            @publish="publishLesson"
            @unpublish="unpublishLesson"
          />
        </div>

        <!-- Onglet Séances (#28 : extrait en sous-composant) -->
        <div v-if="activeTab === 'seances'">
          <MatiereSeancesTab
            :seances="seances"
            :is-teacher="isTeacher"
            @view-seance="viewSeance"
            @hide-seance="hideSeance"
            @visio-updated="loadMatiereDetails"
          />
        </div>

        <!-- Onglet Évaluations (#28 : extrait en sous-composant) -->
        <div v-if="activeTab === 'evaluations'">
          <MatiereEvaluationsTab
            :evaluations="evaluations"
            @view-evaluation="viewEvaluation"
          />
        </div>

        <!-- Onglet Classes (#28 : extrait en sous-composant) -->
        <div v-if="activeTab === 'classes'">
          <MatiereClassesTab :classes="classes" @view-classe="viewClasse" />
        </div>
      </div>
    </div>

    <!-- Modal Création Leçon -->
    <CreateLessonModal
      :visible="showCreateLessonModal"
      :lesson="newLesson"
      :creating="creatingLesson"
      @close="closeCreateLessonModal"
      @submit="submitCreateLesson"
    />
  </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Detail matiere (#H9 ≤300). Orchestrateur : donnees et logique dans
 * useMatiereDetails ; la vue assemble en-tete, notifications, onglet Lecons,
 * modale de creation et onglets Seances/Evaluations/Classes deja extraits. Les
 * overrides Tailwind vers theme restent ici en :deep() (ils ciblent deja les
 * descendants, y compris ceux des sous-composants).
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import MatiereNotifications from '@/components/matieres/MatiereNotifications.vue'
import MatiereDetailsHeader from '@/components/matieres/MatiereDetailsHeader.vue'
import MatiereLessonsTab from '@/components/matieres/MatiereLessonsTab.vue'
import CreateLessonModal from '@/components/matieres/CreateLessonModal.vue'
import MatiereSeancesTab from '@/components/matieres/MatiereSeancesTab.vue'
import MatiereEvaluationsTab from '@/components/matieres/MatiereEvaluationsTab.vue'
import MatiereClassesTab from '@/components/matieres/MatiereClassesTab.vue'
import { useMatiereDetails } from '@/composables/useMatiereDetails'

const {
  loading, error, activeTab, viewMode, matiere, lessons, seances, evaluations,
  classes, statistiques, showCreateLessonModal, creatingLesson, newLesson, notifications,
  tabs, isTeacher,
  loadMatiereDetails, viewLesson, createLesson, closeCreateLessonModal, submitCreateLesson,
  editLesson, confirmDeleteLesson, publishLesson, unpublishLesson,
  viewSeance, hideSeance, viewEvaluation, viewClasse,
} = useMatiereDetails()
</script>

<style scoped>
/* Matiere Details Content */
.matiere-details-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* Override Tailwind classes with theme variables */
.matiere-details-content :deep(.text-gray-900) {
  color: var(--text-primary) !important;
}
.matiere-details-content :deep(.text-gray-600) {
  color: var(--text-secondary) !important;
}
.matiere-details-content :deep(.text-gray-500) {
  color: var(--text-tertiary) !important;
}
.matiere-details-content :deep(.text-gray-700) {
  color: var(--text-secondary) !important;
}
.matiere-details-content :deep(.bg-white) {
  background-color: var(--card-bg) !important;
}
.matiere-details-content :deep(.bg-gray-50) {
  background-color: var(--bg-secondary) !important;
}
.matiere-details-content :deep(.bg-gray-100) {
  background-color: var(--bg-secondary) !important;
}
.matiere-details-content :deep(.border-gray-200) {
  border-color: var(--border-primary) !important;
}
.matiere-details-content :deep(.border-gray-300) {
  border-color: var(--border-secondary) !important;
}
.matiere-details-content :deep(.shadow),
.matiere-details-content :deep(.shadow-md),
.matiere-details-content :deep(.shadow-lg) {
  box-shadow: var(--card-shadow) !important;
}
.matiere-details-content :deep(.hover\:shadow-md:hover),
.matiere-details-content :deep(.hover\:shadow-lg:hover) {
  box-shadow: var(--card-hover-shadow) !important;
}

/* Status badges - ensure they remain visible */
.matiere-details-content :deep(.bg-orange-100) {
  background-color: rgba(251, 146, 60, 0.2) !important;
}
.matiere-details-content :deep(.text-orange-700) {
  color: rgb(234, 88, 12) !important;
}
.matiere-details-content :deep(.bg-green-100) {
  background-color: rgba(34, 197, 94, 0.2) !important;
}
.matiere-details-content :deep(.text-green-700) {
  color: rgb(21, 128, 61) !important;
}
.matiere-details-content :deep(.bg-blue-100) {
  background-color: rgba(59, 130, 246, 0.2) !important;
}
.matiere-details-content :deep(.text-blue-700) {
  color: rgb(29, 78, 216) !important;
}
.matiere-details-content :deep(.bg-red-50) {
  background-color: rgba(239, 68, 68, 0.1) !important;
}
.matiere-details-content :deep(.border-red-200) {
  border-color: rgba(239, 68, 68, 0.3) !important;
}
.matiere-details-content :deep(.text-red-900) {
  color: rgb(220, 38, 38) !important;
}

/* Loading spinner */
.matiere-details-content :deep(.border-blue-600) {
  border-color: var(--blue-600) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .matiere-details-content {
    padding: 0.5rem;
  }
}
</style>
