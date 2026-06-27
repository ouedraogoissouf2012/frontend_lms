<template>
  <div class="profile-card">
    <div class="card-header">
      <UserIcon class="header-icon" />
      <h2 class="card-title">Informations Personnelles</h2>
    </div>
    <div class="card-body">
      <div class="profile-avatar">
        <div class="avatar-circle">
          <span class="avatar-initials">{{ userInitials }}</span>
        </div>
        <div class="avatar-info">
          <h3 class="user-name">{{ user?.nom }} {{ user?.prenom }}</h3>
          <p class="user-role">{{ roleLabel }}</p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <EnvelopeIcon class="info-icon" />
          <div class="info-content">
            <label class="info-label">Email</label>
            <p class="info-value">{{ user?.email || 'Non renseigné' }}</p>
          </div>
        </div>

        <div class="info-item">
          <PhoneIcon class="info-icon" />
          <div class="info-content">
            <label class="info-label">Téléphone</label>
            <p class="info-value">{{ user?.telephone || 'Non renseigné' }}</p>
          </div>
        </div>

        <div class="info-item">
          <IdentificationIcon class="info-icon" />
          <div class="info-content">
            <label class="info-label">ID Klassci</label>
            <p class="info-value">{{ user?.klassci_id || 'Non renseigné' }}</p>
          </div>
        </div>

        <div class="info-item">
          <CalendarIcon class="info-icon" />
          <div class="info-content">
            <label class="info-label">Membre depuis</label>
            <p class="info-value">{{ memberSince }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte « Informations Personnelles » d'AdminProfile (#H3 ≤300). Présentation
 * pure : reçoit l'utilisateur, ses initiales, le libellé de rôle et la date
 * d'inscription déjà formatée. Aucun appel API.
 */
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarIcon,
} from '@heroicons/vue/24/outline'

defineProps({
  user: { type: Object, default: null },
  userInitials: { type: String, default: '?' },
  roleLabel: { type: String, default: '' },
  memberSince: { type: String, default: '' },
})
</script>

<style scoped>
.profile-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
}

.header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--violet-500);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

/* Profile Avatar */
.profile-avatar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-primary);
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--violet-500) 0%, var(--violet-600) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.avatar-initials {
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.avatar-info {
  flex: 1;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.user-role {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.info-item:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.info-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--violet-500);
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 500;
  margin: 0;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .profile-avatar {
    flex-direction: column;
    text-align: center;
  }

  .avatar-circle {
    width: 100px;
    height: 100px;
  }
}
</style>
