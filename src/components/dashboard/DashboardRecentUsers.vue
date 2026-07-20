<template>
  <div class="widget-card">
    <div class="widget-header">
      <UserGroupIcon class="widget-icon text-blue-600" />
      <h2 class="widget-title">Utilisateurs Récents</h2>
      <span v-if="users.length > 0" class="widget-count">
        {{ displayedUsers.length }}/{{ users.length }}
      </span>
      <router-link :to="viewAllTo" class="view-all-link">Voir tout</router-link>
    </div>
    <div v-if="displayedUsers.length > 0" class="users-list">
      <div
        v-for="recentUser in displayedUsers"
        :key="recentUser.id"
        class="user-item"
      >
        <div class="user-avatar">
          {{ getInitials(recentUser.name) }}
        </div>
        <div class="user-info">
          <p class="user-name">{{ recentUser.name }}</p>
          <p class="user-email">{{ recentUser.email }}</p>
        </div>
        <div class="user-meta">
          <span class="user-role-badge" :class="getRoleClass(recentUser.role)">
            {{ getRoleLabel(recentUser.role) }}
          </span>
          <span class="user-date">{{ formatDate(recentUser.created_at) }}</span>
        </div>
      </div>
    </div>
    <div v-if="hiddenCount > 0" class="preview-footer">
      <span>{{ hiddenCount }} autre{{ hiddenCount > 1 ? 's' : '' }} utilisateur{{ hiddenCount > 1 ? 's' : '' }} récent{{ hiddenCount > 1 ? 's' : '' }}</span>
      <router-link :to="viewAllTo" class="preview-link">
        Ouvrir la liste complète
      </router-link>
    </div>
    <div v-if="displayedUsers.length === 0" class="empty-state-inline">
      <UserGroupIcon class="empty-icon" />
      <p class="empty-message">Aucun utilisateur récent</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Widget utilisateurs récents d'AdminDashboard (#H3 ≤300). Présentation pure : la
 * liste est une prop ; les helpers (initiales/rôle/date) viennent du composable de
 * formatage partagé pour rester verbatim au rendu d'origine.
 */
import { UserGroupIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useDashboardFormatters } from '@/composables/useDashboardFormatters'

const props = defineProps({
  users: { type: Array, default: () => [] },
  limit: { type: Number, default: 5 },
  viewAllTo: { type: String, default: '/admin/users' },
})

const { getInitials, getRoleLabel, getRoleClass, formatDate } = useDashboardFormatters()

const displayedUsers = computed(() => {
  if (!props.limit || props.limit < 1) return props.users
  return props.users.slice(0, props.limit)
})

const hiddenCount = computed(() => Math.max(props.users.length - displayedUsers.value.length, 0))
</script>

<style scoped>
/* Widget card */
.widget-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.widget-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  min-width: 0;
}

/* Empty state inline */
.empty-state-inline {
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  color: var(--text-tertiary);
}

.empty-message {
  color: var(--text-secondary);
}

/* Recent Users Widget */
.view-all-link {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--blue-500);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: var(--color-info-strong);
  text-decoration: underline;
}

.widget-count {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.preview-link {
  font-size: 0.875rem;
  color: var(--blue-500);
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
}

.preview-link:hover {
  color: var(--color-info-strong);
  text-decoration: underline;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.user-item:hover {
  background: var(--bg-tertiary);
  transform: translateX(4px);
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  border-radius: 50%;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.user-role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.role-student {
  background: var(--info-bg);
  color: var(--info-text);
}

.role-teacher {
  background: var(--emerald-100);
  color: var(--emerald-800);
}

.role-coordinator {
  background: var(--warning-bg);
  color: var(--amber-800);
}

.role-admin {
  background: var(--red-200);
  color: var(--error-text);
}

.role-default {
  background: var(--gray-200);
  color: var(--gray-700);
}

.user-date {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .user-item {
    padding: 0.75rem;
  }

  .user-avatar {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }

  .user-name {
    font-size: 0.8125rem;
  }

  .user-email {
    font-size: 0.6875rem;
  }

  .user-meta {
    display: none;
  }

  .widget-header,
  .preview-footer {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
