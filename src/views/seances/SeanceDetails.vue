<template>
  <DashboardLayout>
  <div class="seance-details">
    <!-- Loading -->
    <ContentLoader v-if="loading" text="Chargement de la séance..." />

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-900 font-medium">{{ error }}</p>
      <button
        @click="loadSeanceDetails"
        class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        Réessayer
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="seance">
      <!-- Header -->
      <SeanceDetailsHeader
        :seance="seance"
        :participants="participants"
        :is-teacher="isTeacher"
        @hide="hideSeance"
      />

      <!-- Visioconférence Section -->
      <SeanceDetailsVisio
        v-if="visio && visio.enabled"
        :visio="visio"
        :seance="seance"
        :is-teacher="isTeacher"
        :is-student="isStudent"
        :room-active="roomActive"
        :joining-visio="joiningVisio"
        @start="startVisio"
        @join="joinVisio"
      />

      <!-- Présentiel -->
      <div v-else class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="flex items-center gap-3 text-blue-600">
          <i class="fa fa-diamond presentiel-icon"></i>
          <div>
            <p class="font-semibold">Cours en présentiel</p>
            <p class="text-sm text-gray-600">Salle: {{ seance.salle || 'À définir' }}</p>
          </div>
        </div>
      </div>

      <!-- Participants (Teachers and Coordinators only) -->
      <div v-if="isTeacher" class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">
          Participants ({{ participants.total }})
        </h2>

        <!-- Teacher -->
        <div v-if="participants.teacher" class="mb-4 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-600 font-medium">Enseignant</p>
          <p class="font-semibold text-gray-900">
            {{ participants.teacher.prenom }} {{ participants.teacher.nom }}
          </p>
        </div>

        <!-- Students -->
        <div v-if="participants.students && participants.students.length > 0">
          <p class="text-sm text-gray-600 font-medium mb-2">
            Étudiants ({{ participants.students.length }})
          </p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div
              v-for="student in participants.students"
              :key="student.id"
              class="p-2 bg-gray-50 rounded text-sm"
            >
              {{ student.prenom }} {{ student.nom }}
            </div>
          </div>
        </div>

        <div v-else class="text-center py-6 text-gray-500">
          <p>Aucun étudiant inscrit</p>
        </div>
      </div>
    </div>
  </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Détail d'une séance (#H6 ≤300). Orchestrateur : données et logique dans
 * useSeanceDetails ; l'UI compose en-tête (SeanceDetailsHeader) et section
 * visio (SeanceDetailsVisio), tandis que présentiel et participants restent
 * inline. Comportement et rendu strictement identiques à l'Options API d'origine.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import SeanceDetailsHeader from '@/components/seances/SeanceDetailsHeader.vue'
import SeanceDetailsVisio from '@/components/seances/SeanceDetailsVisio.vue'
import { useSeanceDetails } from '@/composables/useSeanceDetails'

const {
  loading, error, seance, visio, participants, roomActive, joiningVisio,
  isTeacher, isStudent,
  loadSeanceDetails, startVisio, joinVisio, hideSeance,
} = useSeanceDetails()
</script>

<style scoped lang="scss">
@use '../../assets/styles/seance-details';

.seance-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--bg-primary);
}

/* Cards - Style cohérent avec le reste de l'app */
.seance-details > div {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
}

.seance-details > div:hover {
  box-shadow: var(--card-shadow-hover, 0 4px 6px rgba(0, 0, 0, 0.15));
}

/* Animation pour le loading (dette pré-existante : .animate-spin non utilisé) */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Responsive */
@media (max-width: 768px) {
  .seance-details {
    padding: 1rem;
  }

  .seance-details > div {
    padding: 1rem;
  }
}
</style>
