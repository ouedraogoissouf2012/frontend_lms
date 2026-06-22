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
        <SettingsPersonalInfo :user="user" :get-role-label="getRoleLabel" />

        <SettingsDisplaySection />

        <SettingsNotifications
          v-model:email-notifications="emailNotifications"
          v-model:system-alerts="systemAlerts"
          @save="savePreferences"
        />

        <SettingsSecurityCard @open-password="showPasswordModal = true" />

        <SettingsPermissions
          v-if="user?.permissions && user.permissions.length > 0"
          :permissions="user.permissions"
        />

        <SettingsSession @logout="logout" />
      </div>

      <!-- Modal Changement de mot de passe -->
      <SettingsPasswordModal
        v-model:show="showPasswordModal"
        :form="passwordForm"
        @submit="submitPasswordChange"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Paramètres (admin). Orchestrateur (#H3 ≤300) : la donnée et la logique vivent
 * dans useAdminSettings ; l'UI est composée de SettingsPersonalInfo,
 * SettingsDisplaySection, SettingsNotifications, SettingsSecurityCard,
 * SettingsPermissions, SettingsSession et SettingsPasswordModal. La vue ne fait
 * que câbler ces éléments.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SettingsPersonalInfo from '@/components/admin/SettingsPersonalInfo.vue'
import SettingsDisplaySection from '@/components/admin/SettingsDisplaySection.vue'
import SettingsNotifications from '@/components/admin/SettingsNotifications.vue'
import SettingsSecurityCard from '@/components/admin/SettingsSecurityCard.vue'
import SettingsPermissions from '@/components/admin/SettingsPermissions.vue'
import SettingsSession from '@/components/admin/SettingsSession.vue'
import SettingsPasswordModal from '@/components/admin/SettingsPasswordModal.vue'
import { useAdminSettings } from '@/composables/useAdminSettings'

const {
  user,
  emailNotifications,
  systemAlerts,
  showPasswordModal,
  passwordForm,
  getRoleLabel,
  savePreferences,
  submitPasswordChange,
  logout,
} = useAdminSettings()
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
</style>
