<template>
  <div class="profile-card">
    <div class="card-header">
      <BoltIcon class="header-icon" />
      <h2 class="card-title">Actions Rapides</h2>
    </div>
    <div class="card-body">
      <div class="actions-grid">
        <router-link to="/admin/settings" class="action-button">
          <CogIcon class="action-icon" />
          <div class="action-content">
            <span class="action-title">Paramètres</span>
            <span class="action-description">Gérer mes préférences</span>
          </div>
        </router-link>

        <router-link to="/admin/users" class="action-button">
          <UserGroupIcon class="action-icon" />
          <div class="action-content">
            <span class="action-title">Utilisateurs</span>
            <span class="action-description">Gérer les utilisateurs</span>
          </div>
        </router-link>

        <router-link to="/admin/classes" class="action-button">
          <BuildingLibraryIcon class="action-icon" />
          <div class="action-content">
            <span class="action-title">Classes</span>
            <span class="action-description">Gérer les classes</span>
          </div>
        </router-link>

        <router-link to="/admin/matieres" class="action-button">
          <BookOpenIcon class="action-icon" />
          <div class="action-content">
            <span class="action-title">Matières</span>
            <span class="action-description">Gérer les matières</span>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte « Actions Rapides » d'AdminProfile (#H3 ≤300). Présentation pure :
 * 4 liens de navigation statiques (router-link). Aucune donnée ni appel API.
 */
import {
  BookOpenIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  BoltIcon,
  CogIcon,
} from '@heroicons/vue/24/outline'
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

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  text-decoration: none;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.action-button:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
  border-color: var(--violet-500);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.action-icon {
  width: 2rem;
  height: 2rem;
  color: var(--violet-500);
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.action-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
