<template>
  <div class="users-table-wrapper">
    <table class="users-table">
      <thead>
        <tr>
          <th @click="$emit('sort', 'name')" class="sortable">
            Nom
            <i v-if="sortField === 'name'" :class="sortAsc ? 'fa fa-sort-up' : 'fa fa-sort-down'"></i>
          </th>
          <th @click="$emit('sort', 'email')" class="sortable">
            Email
            <i v-if="sortField === 'email'" :class="sortAsc ? 'fa fa-sort-up' : 'fa fa-sort-down'"></i>
          </th>
          <th @click="$emit('sort', 'role')" class="sortable">
            Rôle
            <i v-if="sortField === 'role'" :class="sortAsc ? 'fa fa-sort-up' : 'fa fa-sort-down'"></i>
          </th>
          <th>Classe</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user._uid" @click="$emit('select', user)" class="user-row">
          <td>
            <div class="user-name-cell">
              <div class="user-avatar" :class="'avatar-' + user.role">
                <span>{{ getInitials(user) }}</span>
              </div>
              <span class="user-name">{{ user.name }}</span>
            </div>
          </td>
          <td class="user-email">{{ user.email || 'Non disponible' }}</td>
          <td>
            <span class="role-badge" :class="'role-' + user.role">{{ getRoleLabel(user.role) }}</span>
          </td>
          <td class="user-classe">{{ user.classe_nom || '-' }}</td>
          <td>
            <button class="action-btn" @click.stop="$emit('select', user)">
              <i class="fa fa-eye"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">
        <i class="fa fa-angle-double-left"></i>
      </button>
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
        <i class="fa fa-angle-left"></i>
      </button>
      <span class="page-info">
        Page {{ currentPage }} / {{ totalPages }}
        <span class="page-total">({{ filteredCount }} utilisateurs)</span>
      </span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
        <i class="fa fa-angle-right"></i>
      </button>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">
        <i class="fa fa-angle-double-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Table des utilisateurs d'AdminUsers (#G1 ≤300) : en-têtes triables (emit sort),
 * lignes cliquables (emit select), pagination (v-model currentPage). Présentation
 * pure ; getInitials/getRoleLabel sont des utils purs partagés.
 */
import { getInitials } from '@/utils/formatters'
import { getRoleLabel } from '@/utils/userRoles'

const currentPage = defineModel('currentPage', { type: Number, default: 1 })

defineProps({
  users: { type: Array, default: () => [] },
  sortField: { type: String, default: 'name' },
  sortAsc: { type: Boolean, default: true },
  totalPages: { type: Number, default: 1 },
  filteredCount: { type: Number, default: 0 },
})
defineEmits(['sort', 'select'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-badges';

.users-table-wrapper {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: var(--bg-secondary);
}

.users-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.users-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.users-table th.sortable:hover {
  color: var(--text-primary);
}

.users-table th i {
  margin-left: 4px;
  font-size: 0.7rem;
}

.users-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.user-row {
  cursor: pointer;
  transition: background var(--transition-fast);
}

.user-row:hover {
  background: var(--hover-bg);
}

.user-name-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.user-name {
  font-weight: 500;
  white-space: nowrap;
}

.user-email {
  color: var(--text-secondary);
}

.user-classe {
  color: var(--text-secondary);
}

.action-btn {
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.page-btn {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: 0 var(--spacing-md);
}

.page-total {
  color: var(--text-tertiary);
}

@media (max-width: 768px) {
  .users-table th:nth-child(4),
  .users-table td:nth-child(4) {
    display: none;
  }
}
</style>
