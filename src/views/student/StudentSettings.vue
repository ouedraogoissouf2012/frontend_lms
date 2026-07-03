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
        <div class="settings-section">
          <div class="section-header">
            <UserIcon class="section-icon" />
            <h2 class="section-title">Informations Personnelles</h2>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">Nom complet</label>
                <p class="info-value">{{ user?.nom }} {{ user?.prenom }}</p>
              </div>
              <div class="info-item">
                <label class="info-label">Email</label>
                <p class="info-value">{{ user?.email || 'Non renseigné' }}</p>
              </div>
              <div class="info-item">
                <label class="info-label">Téléphone</label>
                <p class="info-value">{{ user?.telephone || 'Non renseigné' }}</p>
              </div>
              <div class="info-item">
                <label class="info-label">Rôle</label>
                <p class="info-value">{{ getRoleLabel(user?.role) }}</p>
              </div>
            </div>
          </div>
        </div>

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
          v-model:visio-reminders="visioReminders"
          @change="savePreferences"
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
      <SettingsPasswordModal v-model="showPasswordModal" />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Paramètres (élève). Orchestrateur (#H10 ≤300) : l'état et la logique (user,
 * préférences, déconnexion) vivent dans useStudentSettings ; les Notifications et
 * la modale de mot de passe sont des sous-composants. Chrome de section via `@use`.
 */
import { ref } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import SettingsNotifications from '@/components/student/SettingsNotifications.vue'
import SettingsPasswordModal from '@/components/student/SettingsPasswordModal.vue'
import {
  UserIcon,
  AdjustmentsHorizontalIcon,
  LockClosedIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'
import { useStudentSettings } from '@/composables/useStudentSettings'

defineOptions({ name: 'StudentSettings' })

const showPasswordModal = ref(false)
const {
  user, emailNotifications, visioReminders, getRoleLabel, savePreferences, logout,
} = useStudentSettings()
</script>

<style scoped lang="scss">
@use '../../assets/styles/student-settings';

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

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin: 0;
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
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
