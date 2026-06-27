<template>
  <div class="modal-footer">
    <div class="action-buttons">
      <!-- Actions étudiant -->
      <template v-if="userRole === 'student'">
        <!-- Bouton rejoindre si visio active -->
        <button
          v-if="canJoinVisio"
          @click="$emit('action', 'joinVisio')"
          class="action-btn primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Rejoindre la visio
        </button>
        <!-- Message si visio programmée mais pas encore démarrée -->
        <div v-else-if="isSeance && eventData.visio?.status === 'programmee'" class="waiting-message">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>En attente du démarrage par l'enseignant</span>
        </div>
        <button
          v-if="canStartEvaluation"
          @click="$emit('action', 'startEvaluation')"
          class="action-btn primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Commencer l'évaluation
        </button>
        <button
          v-if="isSeance"
          @click="$emit('action', 'hideSeance')"
          class="action-btn secondary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
          Masquer
        </button>
      </template>

      <!-- Actions enseignant -->
      <template v-if="userRole === 'teacher'">
        <button
          v-if="canActivateVisio"
          @click="$emit('action', 'activateVisio')"
          class="action-btn primary"
        >
          Activer la visio
        </button>
        <button
          v-if="canStartVisio"
          @click="$emit('action', 'startVisio')"
          class="action-btn success"
        >
          Démarrer la visio
        </button>
        <button
          v-if="canEndVisio"
          @click="$emit('action', 'endVisio')"
          class="action-btn danger"
        >
          Terminer la visio
        </button>
        <button
          @click="$emit('action', 'viewParticipants')"
          class="action-btn secondary"
        >
          Voir participants
        </button>
        <button
          @click="$emit('action', 'exportAttendance')"
          class="action-btn secondary"
        >
          Exporter présences
        </button>
      </template>

      <!-- Actions admin/coordinateur -->
      <template v-if="['admin', 'coordinator'].includes(userRole)">
        <button
          v-if="isSeance"
          @click="$emit('action', 'toggleVisio')"
          class="action-btn primary"
        >
          {{ (eventData.visio?.enabled || eventData.visio_enabled) ? 'Désactiver' : 'Activer' }} visio
        </button>
        <button
          @click="$emit('action', 'delete')"
          class="action-btn danger"
        >
          Supprimer
        </button>
      </template>

      <!-- Voir détails complets (tous les rôles) -->
      <button
        @click="$emit('action', 'viewDetails')"
        class="action-btn outline"
      >
        Voir détails complets
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Footer d'actions de la modale d'événement (H8 — décomposition EventDetailModal.vue).
 * Sous-composant présentationnel : la visibilité des boutons dépend du rôle et des
 * capacités (props calculées par le composable useEventDetail) ; chaque bouton émet
 * `action` avec son type. CSS verbatim.
 */
defineProps({
  userRole: { type: String, required: true },
  isSeance: { type: Boolean, default: false },
  eventData: { type: Object, required: true },
  canJoinVisio: { type: Boolean, default: false },
  canStartEvaluation: { type: Boolean, default: false },
  canActivateVisio: { type: Boolean, default: false },
  canStartVisio: { type: Boolean, default: false },
  canEndVisio: { type: Boolean, default: false }
})

defineEmits(['action'])
</script>

<style scoped>
.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-secondary);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn.primary {
  background: var(--blue-500);
  color: white;
}

.action-btn.primary:hover {
  background: var(--color-primary-hover, #2563eb);
}

.action-btn.success {
  background: var(--emerald-500);
  color: white;
}

.action-btn.success:hover {
  background: var(--emerald-600);
}

.action-btn.danger {
  background: var(--red-500);
  color: white;
}

.action-btn.danger:hover {
  background: var(--red-600);
}

.action-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color, #e5e7eb);
}

.action-btn.secondary:hover {
  background: var(--bg-primary);
  border-color: var(--blue-500);
}

.action-btn.outline {
  background: transparent;
  color: var(--blue-500);
  border: 1px solid var(--blue-500);
}

.action-btn.outline:hover {
  background: var(--blue-500);
  color: white;
}

/* Message d'attente pour l'étudiant */
.waiting-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--warning-bg);
  color: var(--amber-800);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.waiting-message svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
