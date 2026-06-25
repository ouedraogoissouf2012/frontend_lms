<template>
  <DashboardLayout>
    <div class="profile-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mon Profil</h1>
          <p class="page-subtitle">Consultez et gérez vos informations personnelles</p>
        </div>
      </div>

      <!-- Profile Content -->
      <div class="profile-content">
        <ProfileInfoCard
          :user="user"
          :user-initials="userInitials"
          :role-label="roleLabel"
          :member-since="memberSince"
        />

        <ProfileStatsCard :stats="stats" />

        <ProfilePermissionsCard
          v-if="user?.permissions && user.permissions.length > 0"
          :permissions="user.permissions"
        />

        <ProfileActionsCard />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Mon Profil (admin). Orchestrateur (#H3 ≤300) : la donnée et la logique vivent
 * dans useAdminProfile ; l'UI est composée de ProfileInfoCard, ProfileStatsCard,
 * ProfilePermissionsCard et ProfileActionsCard. La vue ne fait que câbler.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ProfileInfoCard from '@/components/admin/ProfileInfoCard.vue'
import ProfileStatsCard from '@/components/admin/ProfileStatsCard.vue'
import ProfilePermissionsCard from '@/components/admin/ProfilePermissionsCard.vue'
import ProfileActionsCard from '@/components/admin/ProfileActionsCard.vue'
import { useAdminProfile } from '@/composables/useAdminProfile'

const { user, stats, userInitials, roleLabel, memberSince } = useAdminProfile()
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
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

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
