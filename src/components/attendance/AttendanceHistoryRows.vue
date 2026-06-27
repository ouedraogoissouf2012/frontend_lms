<template>
  <table class="data-table">
    <thead>
      <tr>
        <th>Date & Heure</th>
        <th v-if="user.role !== 'etudiant'">Participant</th>
        <th>Séance</th>
        <th>Matière</th>
        <th>Classe</th>
        <th>Statut</th>
        <th>Durée</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="attendance in attendances" :key="attendance.id">
        <td>
          <div class="date-cell">
            <div class="date-primary">{{ formatDate(attendance.joined_at) }}</div>
            <div class="date-secondary">{{ formatTime(attendance.joined_at) }}</div>
          </div>
        </td>
        <td v-if="user.role !== 'etudiant'">
          <div class="user-cell">
            <span class="user-name">{{ attendance.user.name }}</span>
            <span class="user-email">{{ attendance.user.email }}</span>
          </div>
        </td>
        <td>
          <div class="seance-cell">
            <span class="seance-id">#{{ attendance.seance.klassci_seance_id }}</span>
            <span class="seance-date">{{ formatDate(attendance.seance.date) }}</span>
          </div>
        </td>
        <td>
          <span v-if="attendance.seance.matiere" class="matiere-badge">
            {{ attendance.seance.matiere.nom }}
          </span>
          <span v-else class="text-gray">-</span>
        </td>
        <td>
          <span v-if="attendance.seance.classe" class="classe-badge">
            {{ attendance.seance.classe.nom }}
          </span>
          <span v-else class="text-gray">-</span>
        </td>
        <td>
          <span
            :class="['status-badge', attendance.status === 'connected' ? 'status-connected' : 'status-disconnected']"
          >
            {{ attendance.status === 'connected' ? 'fa-circle Connecté' : 'fa-circle Déconnecté' }}
          </span>
        </td>
        <td>
          <span v-if="attendance.duration_minutes" class="duration-text">
            {{ attendance.duration_minutes }} min
          </span>
          <span v-else-if="attendance.status === 'connected'" class="duration-text text-green">
            En cours...
          </span>
          <span v-else class="text-gray">-</span>
        </td>
        <td>
          <button
            @click="$emit('view-details', attendance)"
            class="btn-action"
            title="Voir les détails"
          >
            👁
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
/**
 * Lignes du tableau d'historique des présences (H7) — sous-composant
 * présentationnel extrait d'AttendanceHistory.vue. Masque la colonne Participant
 * aux étudiants ; reçoit les formateurs date/heure LOCAUX (parité, #H7) ;
 * émet view-details au clic sur l'œil.
 */
defineProps({
  attendances: { type: Array, default: () => [] },
  user: { type: Object, default: () => ({}) },
  formatDate: { type: Function, required: true },
  formatTime: { type: Function, required: true }
})

defineEmits(['view-details'])
</script>

<style scoped>
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--bg-secondary);
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
}

.data-table tbody tr:hover {
  background: var(--bg-hover);
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-primary {
  font-weight: 500;
  color: var(--text-primary);
}

.date-secondary {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 500;
  color: var(--text-primary);
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.seance-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.seance-id {
  font-weight: 500;
  color: var(--blue-500);
}

.seance-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.matiere-badge,
.classe-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-connected {
  background: #d1fae5;
  color: #065f46;
}

.status-disconnected {
  background: var(--error-bg);
  color: var(--error-text);
}

.duration-text {
  font-weight: 500;
  color: var(--text-primary);
}

.text-green {
  color: #10b981;
}

.text-gray {
  color: var(--text-tertiary);
}

.btn-action {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  transition: transform 0.2s;
}

.btn-action:hover {
  transform: scale(1.2);
}

/* Responsive */
@media (max-width: 768px) {
  .data-table {
    font-size: 0.75rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }
}
</style>
