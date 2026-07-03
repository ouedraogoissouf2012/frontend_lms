<template>
  <DashboardLayout>
    <div class="settings-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Paramètres</h1>
          <p class="page-subtitle">Gérez vos préférences et informations personnelles</p>
        </div>
      </div>

      <!-- Settings Sections -->
      <div class="settings-content">
        <!-- Informations Personnelles -->
        <SettingsPersonalInfo :user="user" :role-label="getRoleLabel(user?.role)" />

        <!-- Préférences d'affichage -->
        <div class="settings-section">
          <div class="section-header">
            <AdjustmentsHorizontalIcon class="section-icon" />
            <h2 class="section-title">Préférences d'affichage</h2>
          </div>
          <div class="section-body">
            <div class="preference-item">
              <div class="preference-info">
                <label class="preference-label">Thème</label>
                <p class="preference-description">Choisir entre le mode clair et sombre</p>
              </div>
              <div class="preference-control">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <SettingsNotifications
          v-model:email-notifications="emailNotifications"
          v-model:seance-reminders="seanceReminders"
          @save="savePreferences"
        />

        <!-- Sécurité -->
        <div class="settings-section">
          <div class="section-header">
            <LockClosedIcon class="section-icon" />
            <h2 class="section-title">Sécurité</h2>
          </div>
          <div class="section-body">
            <button class="btn-secondary" @click="showPasswordModal = true" aria-label="Ouvrir le formulaire de changement de mot de passe">
              <KeyIcon class="w-5 h-5" aria-hidden="true" />
              <span>Changer le mot de passe</span>
            </button>
          </div>
        </div>

        <!-- Déconnexion -->
        <div class="settings-section">
          <div class="section-header">
            <ArrowRightOnRectangleIcon class="section-icon" />
            <h2 class="section-title">Session</h2>
          </div>
          <div class="section-body">
            <button class="btn-danger" @click="logout" aria-label="Se déconnecter de l'application">
              <ArrowRightOnRectangleIcon class="w-5 h-5" aria-hidden="true" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Changement de mot de passe -->
      <PasswordChangeModal
        v-model="showPasswordModal"
        v-model:current-password="passwordForm.currentPassword"
        v-model:new-password="passwordForm.newPassword"
        v-model:confirm-password="passwordForm.confirmPassword"
        @submit="submitPasswordChange"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Paramètres enseignant — orchestrateur (#H11 ≤300). La donnée/logique vit dans
 * useTeacherSettings ; l'UI est composée de SettingsPersonalInfo,
 * SettingsNotifications et PasswordChangeModal ; les sections triviales (thème,
 * sécurité, session) restent inline.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import SettingsPersonalInfo from '@/components/teacher/SettingsPersonalInfo.vue'
import SettingsNotifications from '@/components/teacher/SettingsNotifications.vue'
import PasswordChangeModal from '@/components/teacher/PasswordChangeModal.vue'
import {
  AdjustmentsHorizontalIcon,
  LockClosedIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'
import { useTeacherSettings } from '@/composables/useTeacherSettings'

const {
  user, emailNotifications, seanceReminders, showPasswordModal, passwordForm,
  getRoleLabel, savePreferences, submitPasswordChange, logout,
} = useTeacherSettings()
</script>

<style scoped>
.settings-container {
  max-width: 1024px;
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

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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

/* Buttons */
.btn-secondary, .btn-danger {
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

.btn-danger {
  background: linear-gradient(135deg, var(--red-500) 0%, var(--red-600) 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, var(--red-600) 0%, var(--red-700) 100%);
  transform: scale(1.02);
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
