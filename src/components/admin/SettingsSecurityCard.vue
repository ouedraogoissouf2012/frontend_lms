<template>
  <div class="settings-section">
    <div class="section-header">
      <LockClosedIcon class="section-icon" />
      <h2 class="section-title">Sécurité</h2>
    </div>
    <div class="section-body">
      <button class="btn-secondary" @click="emit('open-password')" aria-label="Ouvrir le formulaire de changement de mot de passe">
        <KeyIcon class="w-5 h-5" aria-hidden="true" />
        <span>Changer le mot de passe</span>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Sécurité » d'AdminSettings (#H3 ≤300). Présentation pure : un bouton
 * qui émet `open-password` pour que le parent ouvre la modale. Aucun appel API.
 */
import { LockClosedIcon, KeyIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits(['open-password'])
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
.btn-secondary {
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

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}
</style>
