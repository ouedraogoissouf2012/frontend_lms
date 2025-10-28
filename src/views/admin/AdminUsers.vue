<template>
  <DashboardLayout>
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Gestion des Utilisateurs</h1>
        <p class="page-subtitle">Gérez les enseignants, étudiants et autres utilisateurs</p>
      </div>

      <div class="empty-state">
        <div class="empty-icon-wrapper">
          <UserGroupIcon class="empty-icon" />
        </div>
        <h3 class="empty-title">Fonctionnalité en cours de développement</h3>
        <p class="empty-description">La gestion des utilisateurs sera bientôt disponible.</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { UserGroupIcon } from '@heroicons/vue/24/outline'
</script>

<style scoped>
.page-container {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.empty-icon {
  width: 60px;
  height: 60px;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-description {
  font-size: 1rem;
  color: var(--text-secondary);
  max-width: 500px;
}
</style>
