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
          <p class="preference-description">Recevoir des notifications pour les nouvelles évaluations et cours</p>
        </div>
        <div class="preference-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="emailNotifications" @change="$emit('change')">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div class="preference-item">
        <div class="preference-info">
          <label class="preference-label">Rappels de visioconférences</label>
          <p class="preference-description">Recevoir un rappel avant le début des visioconférences</p>
        </div>
        <div class="preference-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="visioReminders" @change="$emit('change')">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Section Notifications de StudentSettings (#H10 ≤300). Présentation pure :
 * deux interrupteurs (email / rappels visio) en v-model, émet `change` à chaque
 * bascule pour que le parent persiste les préférences. Chrome via `@use`.
 */
import { BellIcon } from '@heroicons/vue/24/outline'

const emailNotifications = defineModel('emailNotifications', { type: Boolean, default: true })
const visioReminders = defineModel('visioReminders', { type: Boolean, default: true })
defineEmits(['change'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/student-settings';

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
  background-color: #ccc;
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
  background-color: #3b82f6;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}
</style>
