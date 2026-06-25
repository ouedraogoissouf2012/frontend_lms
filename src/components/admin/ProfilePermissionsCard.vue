<template>
  <div class="profile-card">
    <div class="card-header">
      <ShieldCheckIcon class="header-icon" />
      <h2 class="card-title">Mes Permissions</h2>
    </div>
    <div class="card-body">
      <div class="permissions-grid">
        <span
          v-for="permission in permissions"
          :key="permission"
          class="permission-badge"
        >
          {{ permission }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte « Mes Permissions » d'AdminProfile (#H3 ≤300). Présentation pure :
 * reçoit la liste des permissions et les affiche en badges. Aucun appel API.
 */
import { ShieldCheckIcon } from '@heroicons/vue/24/outline'

defineProps({
  permissions: { type: Array, default: () => [] },
})
</script>

<style scoped>
.profile-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
}

.header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #8b5cf6;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

/* Permissions Grid */
.permissions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.permission-badge {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
  border: 1px solid #8b5cf6;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #8b5cf6;
}
</style>
