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
        <ProfileQuickActions />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Profil enseignant — orchestrateur (#H11 ≤300). La donnée/logique vit dans
 * useTeacherProfile ; l'UI est composée de ProfileInfoCard (coordonnées),
 * ProfileStatsCard (compteurs) et ProfileQuickActions (raccourcis).
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ProfileInfoCard from '@/components/teacher/ProfileInfoCard.vue'
import ProfileStatsCard from '@/components/teacher/ProfileStatsCard.vue'
import ProfileQuickActions from '@/components/teacher/ProfileQuickActions.vue'
import { useTeacherProfile } from '@/composables/useTeacherProfile'

const { user, stats, userInitials, roleLabel, memberSince } = useTeacherProfile()
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
