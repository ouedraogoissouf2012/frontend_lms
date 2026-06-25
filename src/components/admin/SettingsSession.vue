<template>
  <div class="settings-section">
    <div class="section-header">
      <ArrowRightOnRectangleIcon class="section-icon" />
      <h2 class="section-title">Session</h2>
    </div>
    <div class="section-body">
      <button class="btn-danger" @click="emit('logout')" aria-label="Se déconnecter de l'application">
        <ArrowRightOnRectangleIcon class="w-5 h-5" aria-hidden="true" />
        <span>Se déconnecter</span>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Session » d'AdminSettings (#H3 ≤300). Présentation pure : un bouton
 * de déconnexion qui émet `logout` ; la logique (confirm + auth.logout + redirect)
 * vit dans le composable parent. Aucun appel API ici.
 */
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits(['logout'])
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

/* Buttons */
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: scale(1.02);
}
</style>
