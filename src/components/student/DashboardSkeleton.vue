<template>
  <div>
    <!-- Skeleton for widgets -->
    <div class="widget-card mb-6">
      <div class="widget-header">
        <SkeletonLoader type="circle" width="1.5rem" height="1.5rem" />
        <SkeletonLoader type="text" width="120px" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonLoader type="rect" height="60px" />
        <SkeletonLoader type="rect" height="60px" />
        <SkeletonLoader type="rect" height="60px" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <SkeletonLoader type="card" />
      <SkeletonLoader type="card" />
    </div>

    <div class="widget-card mb-6">
      <SkeletonLoader type="text" width="150px" />
      <div class="space-y-3 mt-4">
        <SkeletonLoader type="rect" height="60px" />
        <SkeletonLoader type="rect" height="60px" />
        <SkeletonLoader type="rect" height="60px" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Skeleton de chargement du Dashboard Étudiant (#G1 ≤300). Présentation pure,
 * aucune prop. Affiché pendant le chargement initial des données.
 */
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
</script>

<style scoped>
/*
 * NOTE : .widget-card et .widget-header sont dupliqués (verbatim) depuis
 * StudentDashboard.vue / DashboardWidgets.vue. Duplication scoped voulue :
 * chaque composant reste autonome côté style (pas de feuille partagée ici).
 */
.widget-card {
  background-color: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
</style>
