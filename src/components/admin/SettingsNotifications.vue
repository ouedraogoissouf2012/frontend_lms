<template>
  <div class="settings-section">
    <div class="section-header">
      <BellIcon class="section-icon" />
      <h2 class="section-title">Notifications</h2>
    </div>
    <div class="section-body">
      <div class="preference-item">
        <div class="preference-info">
          <label class="preference-label">Notifications par email</label>
          <p class="preference-description">Recevoir des notifications importantes du système</p>
        </div>
        <div class="preference-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="emailNotifications" @change="emit('save')">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div class="preference-item">
        <div class="preference-info">
          <label class="preference-label">Alertes système</label>
          <p class="preference-description">Recevoir des alertes pour les événements critiques</p>
        </div>
        <div class="preference-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="systemAlerts" @change="emit('save')">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Notifications » d'AdminSettings (#H3 ≤300). Présentation pure : deux
 * interrupteurs (email + alertes système) en v-model (defineModel) ; chaque
 * changement émet `save` pour que le parent persiste les préférences. Aucun appel API.
 */
import { BellIcon } from '@heroicons/vue/24/outline'

const emailNotifications = defineModel('emailNotifications', { type: Boolean, default: true })
const systemAlerts = defineModel('systemAlerts', { type: Boolean, default: true })

const emit = defineEmits(['save'])
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

/* Preferences */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.preference-info {
  flex: 1;
}

.preference-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.25rem;
}

.preference-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.preference-control {
  margin-left: 1rem;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-neutral);
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--blue-500);
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

@media (max-width: 768px) {
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .preference-control {
    margin-left: 0;
  }
}
</style>
