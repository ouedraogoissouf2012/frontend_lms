<template>
  <div class="table-container">
    <table class="institutions-table">
      <thead>
        <tr>
          <th>Institution</th>
          <th>Slug</th>
          <th>Statut</th>
          <th class="text-center">Utilisateurs</th>
          <th class="text-center">Cours</th>
          <th class="text-center">Evaluations</th>
          <th>Derniere activite</th>
          <th class="text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="inst in institutions" :key="inst.id" class="table-row">
          <td>
            <div class="inst-name-cell">
              <div class="inst-avatar" :style="{ backgroundColor: inst.primary_color || '#3b82f6' }">
                {{ inst.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="inst-name">{{ inst.name }}</div>
                <div class="inst-url">{{ inst.klassci_api_url }}</div>
              </div>
            </div>
          </td>
          <td>
            <code class="slug-badge">{{ inst.slug }}</code>
          </td>
          <td>
            <span :class="['status-badge', inst.is_active ? 'status-active' : 'status-inactive']">
              {{ inst.is_active ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="text-center">{{ inst.stats.users_count }}</td>
          <td class="text-center">{{ inst.stats.lessons_count }}</td>
          <td class="text-center">{{ inst.stats.evaluations_count }}</td>
          <td>{{ formatDate(inst.stats.last_activity) }}</td>
          <td>
            <div class="actions-cell">
              <button @click="$emit('edit', inst)" class="action-btn" title="Modifier">
                <i class="fa fa-pencil"></i>
              </button>
              <button
                @click="$emit('toggle', inst)"
                class="action-btn"
                :class="inst.is_active ? 'action-btn-green' : 'action-btn-gray'"
                :title="inst.is_active ? 'Desactiver' : 'Activer'"
              >
                <i :class="inst.is_active ? 'fa fa-toggle-on' : 'fa fa-toggle-off'"></i>
              </button>
              <button
                @click="$emit('test', inst)"
                class="action-btn action-btn-blue"
                :disabled="testingId === inst.id"
                title="Tester connexion KLASSCI"
              >
                <i :class="testingId === inst.id ? 'fa fa-spinner fa-spin' : 'fa fa-plug'"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
/**
 * Table des institutions d'AdminInstitutions (#G1 ≤300) : présentation pure.
 * Actions émises (edit/toggle/test) ; testingId pilote le spinner de test.
 * Date via formatDateShort partagé, repli 'Aucune' (parité exacte avec l'original).
 */
import { formatDateShort } from '@/utils/formatters'

defineProps({
  institutions: { type: Array, default: () => [] },
  testingId: { type: [Number, String], default: null },
})
defineEmits(['edit', 'toggle', 'test'])

function formatDate(dateStr) {
  return formatDateShort(dateStr, { fallback: 'Aucune' })
}
</script>

<style scoped lang="scss">
/* Table */
.table-container {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.institutions-table {
  width: 100%;
  border-collapse: collapse;
}

.institutions-table thead {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.institutions-table th {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  white-space: nowrap;
}

.institutions-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.table-row {
  transition: background var(--transition-fast);
}

.table-row:hover {
  background: var(--hover-bg);
}

.table-row:last-child td {
  border-bottom: none;
}

.text-center {
  text-align: center;
}

/* Institution name cell */
.inst-name-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.inst-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.inst-name {
  font-weight: 600;
  color: var(--text-primary);
}

.inst-url {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Slug badge */
.slug-badge {
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-family: monospace;
  color: var(--text-secondary);
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.status-active {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.status-inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

/* Actions */
.actions-cell {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.9rem;
}

.action-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  color: var(--text-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn-green {
  color: #16a34a;
}

.action-btn-gray {
  color: #9ca3af;
}

.action-btn-blue {
  color: #3b82f6;
}

/* Responsive */
@media (max-width: 1024px) {
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .institutions-table {
    min-width: 800px;
  }
}
</style>
