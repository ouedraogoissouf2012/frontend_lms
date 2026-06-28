<template>
  <DashboardLayout>
    <div class="classe-details">
      <!-- Header avec nom de la classe -->
      <ClasseDetailsHeader
        :classe="classe"
        :loading="loading"
        :etudiants-count="etudiants?.length || 0"
        :matieres-count="matieres?.length || 0"
        :evaluations-count="evaluations?.length || 0"
        @back="goBack"
      />

      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement de la classe..." />

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-900 font-medium">{{ error }}</p>
        <button
          @click="loadClasseDetails"
          class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          Réessayer
        </button>
      </div>

      <!-- Tabs -->
      <div v-else class="tabs-container">
        <!-- Tab Headers -->
        <ClasseTabsNav :tabs="tabs" :active-tab="activeTab" @select="activeTab = $event" />

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Onglet Matières -->
          <div v-if="activeTab === 'matieres'">
            <ClasseMatieresTab :matieres="matieres" @view-matiere="viewMatiere" />
          </div>

          <!-- Onglet Étudiants -->
          <div v-if="activeTab === 'etudiants'">
            <ClasseEtudiantsTab :etudiants="etudiants" />
          </div>

          <!-- Onglet Évaluations -->
          <div v-if="activeTab === 'evaluations'">
            <ClasseEvaluationsTab :evaluations="evaluations" @view-evaluation="viewEvaluation" />
          </div>

          <!-- Onglet Planning -->
          <div v-if="activeTab === 'planning'">
            <ClassePlanningTab :emploi-temps="emploiTemps" />
          </div>
        </div>
      </div>

      <!-- Séances à venir (30 jours) -->
      <ClasseUpcomingSeances
        v-if="!loading && !error"
        :seances="seances"
        @refresh="loadSeances"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Détails d’une classe (#H9 ≤300). Orchestrateur : la donnée et la logique
 * vivent dans useClasseDetails ; la vue assemble l’en-tête, la barre d’onglets
 * et les onglets/sections présentationnels. Le chrome partagé des onglets
 * (tables/badges/couleurs Tailwind) reste centralisé ici et atteint les enfants
 * via :deep() — source unique, parité exacte avec l’ancienne portée scoped.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import ClasseDetailsHeader from '@/components/classes/ClasseDetailsHeader.vue'
import ClasseTabsNav from '@/components/classes/ClasseTabsNav.vue'
import ClasseMatieresTab from '@/components/classes/ClasseMatieresTab.vue'
import ClasseEtudiantsTab from '@/components/classes/ClasseEtudiantsTab.vue'
import ClasseEvaluationsTab from '@/components/classes/ClasseEvaluationsTab.vue'
import ClassePlanningTab from '@/components/classes/ClassePlanningTab.vue'
import ClasseUpcomingSeances from '@/components/classes/ClasseUpcomingSeances.vue'
import { useClasseDetails } from '@/composables/useClasseDetails'

const {
  loading, error, activeTab, classe, matieres, etudiants, evaluations,
  emploiTemps, seances, tabs,
  loadClasseDetails, loadSeances, viewMatiere, viewEvaluation, goBack,
} = useClasseDetails()
</script>

<style scoped>
/* Container */
.classe-details {
  padding: 2rem;
}
/* Tabs Container */
.tabs-container {
  background: var(--bg-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  margin-bottom: 2rem;
}
/* Loading & Error States */
div[class*="bg-red-50"] {
  background: var(--red-50) !important;
  border: 1px solid #fca5a5;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}
button[class*="bg-red-600"] {
  background: var(--red-600) !important;
  color: white !important;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}
button[class*="bg-red-600"]:hover {
  background: var(--red-700) !important;
}
/* ============================================================
   Chrome partage des onglets/sections — rendu dans les
   sous-composants extraits. Conserve ici (source unique) et
   applique aux enfants via :deep(), VERBATIM de l ancienne portee.
   ============================================================ */
/* Tables */
:deep(table) {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-primary) !important;
}
:deep(thead) {
  background: var(--bg-secondary) !important;
}
:deep(thead tr) {
  background: var(--bg-secondary) !important;
}
:deep(th) {
  padding: 0.75rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-secondary) !important;
}
:deep(tbody) {
  background: var(--bg-primary) !important;
}
:deep(tbody tr) {
  background: var(--bg-primary) !important;
}
:deep(td) {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  background: var(--bg-primary) !important;
}
/* Force all table text to respect theme */
:deep(table td),
:deep(table td *:not(.active-badge):not([class*="bg-"])) {
  color: var(--text-primary) !important;
}
:deep(table th),
:deep(table th *) {
  color: var(--text-secondary) !important;
}
/* Override any Tailwind bg classes in table */
:deep(table thead[class*="bg-gray"]) {
  background: var(--bg-secondary) !important;
}
:deep(table tbody[class*="bg-white"]) {
  background: var(--bg-primary) !important;
}
:deep(table tr[class*="bg-white"]) {
  background: var(--bg-primary) !important;
}
:deep(tbody tr:hover) {
  /* Hover disabled */
}
/* Badge styles */
:deep(span[class*="bg-blue-100"]) {
  background: #dbeafe !important;
  color: #1e40af !important;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
:deep(span[class*="bg-green-100"]) {
  background: #dcfce7 !important;
  color: #166534 !important;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
:deep(span[class*="bg-purple-100"]) {
  background: var(--purple-100) !important;
  color: var(--purple-800) !important;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
}
:deep(span[class*="bg-gray-100"]) {
  background: var(--bg-secondary) !important;
  color: var(--text-secondary) !important;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
:deep(span[class*="bg-yellow-100"]) {
  background: #fef3c7 !important;
  color: var(--amber-800) !important;
}
/* Cards & Borders */
:deep(div[class*="border-gray-200"]) {
  border: 1px solid var(--border-color) !important;
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s;
}
:deep(div[class*="border-gray-200"]:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
/* Text Colors */
:deep(.text-gray-900),
:deep(div[class*="text-gray-900"]) {
  color: var(--text-primary) !important;
}
:deep(.text-gray-600),
:deep(div[class*="text-gray-600"]) {
  color: var(--text-secondary) !important;
}
:deep(.text-gray-500),
:deep(div[class*="text-gray-500"]) {
  color: var(--text-secondary) !important;
}
:deep(.text-gray-400),
:deep(span[class*="text-gray-400"]) {
  color: var(--text-tertiary) !important;
}
/* Force green color for active tabs (override Tailwind text-green-600) */
:deep(button[class*="text-green-600"]),
:deep(.text-green-600) {
  color: var(--emerald-500) !important;
}
/* Buttons */
:deep(button[class*="text-green-600"]) {
  color: var(--emerald-500) !important;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s;
}
:deep(button[class*="text-green-600"]:hover) {
  color: var(--emerald-600) !important;
}
/* Seances Card */
:deep(div[class*="bg-white shadow rounded-lg"]) {
  background: var(--bg-primary) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
}
/* Responsive */
@media (max-width: 768px) {
  .classe-details {
    padding: 1rem;
  }
}
</style>
