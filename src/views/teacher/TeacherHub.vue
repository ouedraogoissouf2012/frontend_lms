<template>
  <DashboardLayout>
    <div class="hub-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mon Espace</h1>
          <p class="page-subtitle">Accedez rapidement a vos classes, matieres et lecons</p>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement de votre espace..." />

      <!-- Hub Grid -->
      <HubNavCards v-else :stats="stats" />

      <!-- Quick Stats -->
      <HubQuickStats v-if="!loading" :stats="stats" />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Espace enseignant — orchestrateur (#H11 ≤300). La donnée/logique vit dans
 * useTeacherHub ; l'UI est composée de HubNavCards (raccourcis) + HubQuickStats
 * (aperçu rapide).
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import HubNavCards from '@/components/teacher/HubNavCards.vue'
import HubQuickStats from '@/components/teacher/HubQuickStats.vue'
import { useTeacherHub } from '@/composables/useTeacherHub'

const { loading, stats } = useTeacherHub()
</script>

<style scoped>
.hub-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
}
</style>
