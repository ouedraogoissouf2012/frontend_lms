<template>
  <div class="settings-section">
    <div class="section-header">
      <ShieldCheckIcon class="section-icon" />
      <h2 class="section-title">Vos Permissions</h2>
    </div>
    <div class="section-body">
      <div class="permissions-grid">
        <span v-for="permission in permissions" :key="permission" class="permission-badge">
          <CheckCircleIcon class="w-4 h-4" />
          {{ permission }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Vos Permissions » d'AdminSettings (#H3 ≤300). Présentation pure :
 * affiche la liste de permissions reçue en prop sous forme de badges. Aucun appel API.
 */
import { ShieldCheckIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

defineProps({
  permissions: { type: Array, default: () => [] },
})
</script>

<style scoped>
.settings-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.section-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--text-secondary);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Permissions Grid */
.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.permission-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, var(--sky-50) 0%, var(--sky-100) 100%);
  color: var(--sky-700);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid var(--sky-200);
  transition: all 0.2s;
}

.permission-badge:hover {
  background: linear-gradient(135deg, var(--sky-100) 0%, var(--sky-200) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(3, 105, 161, 0.1);
}

.permission-badge svg {
  flex-shrink: 0;
}

:root[data-theme="dark"] .permission-badge {
  background: linear-gradient(135deg, var(--sky-900) 0%, var(--sky-800) 100%);
  color: var(--sky-300);
  border-color: var(--sky-900);
}

:root[data-theme="dark"] .permission-badge:hover {
  background: linear-gradient(135deg, var(--sky-800) 0%, var(--sky-700) 100%);
  box-shadow: 0 4px 6px rgba(125, 211, 252, 0.1);
}
</style>
