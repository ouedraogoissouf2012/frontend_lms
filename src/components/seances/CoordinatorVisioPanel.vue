<template>
  <div class="visio-panel">
    <div class="visio-panel-content">
      <div class="visio-info">
        <div class="visio-icon-wrapper">
          <i class="fa fa-dot-circle-o visio-icon"></i>
        </div>
        <div>
          <p class="visio-title">Visioconférence Jitsi programmée</p>
          <p class="visio-room">
            <i class="fa fa-diamond room-icon"></i>
            Salle: <span class="room-id">{{ seance.visio_room_id }}</span>
          </p>
          <p class="visio-access">
            <i class="fa fa-clock-o access-icon"></i>
            Accès possible 15 minutes avant le cours
          </p>
        </div>
      </div>

      <div class="visio-action">
        <button
          @click="$emit('show-participants', seance)"
          class="participants-btn"
          title="Voir la liste des participants avec heures d'entrée/sortie"
        >
          <i class="fa fa-users btn-icon"></i>
          Voir participants
        </button>

        <!-- Coordinateur ne peut que rejoindre si active, pas démarrer -->
        <div v-if="seance.visio_status === 'active' || seance.visio_active" class="visio-status-group">
          <button
            @click="$emit('join', seance)"
            class="open-jitsi-btn"
            title="Rejoindre la visioconférence en cours"
          >
            <span class="btn-icon">↗</span>
            Rejoindre
          </button>
        </div>
        <div v-else class="waiting-message">
          <span class="waiting-icon">⏳</span>
          <span class="waiting-text">En attente que l'enseignant démarre</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Panneau visio d'une séance côté coordinateur (#H6 ≤300) : infos room +
 * actions (voir participants, rejoindre si active, sinon attente). Présentation
 * pure extraite VERBATIM ; émet `show-participants` et `join`.
 */
defineProps({
  seance: { type: Object, required: true }
})

defineEmits(['show-participants', 'join'])
</script>

<style scoped>
/* Visio Panel */
.visio-panel {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--card-bg-dark, #1f2937);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.visio-panel-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.visio-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.visio-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--primary-color);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.visio-icon {
  font-size: 1.5rem;
  line-height: 1;
  color: white;
}

.visio-title {
  font-weight: 600;
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 0.9375rem;
}

.visio-room {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: white;
  margin: 0 0 0.5rem 0;
}

.room-icon {
  font-size: 0.875rem;
  line-height: 1;
}

.room-id {
  font-family: monospace;
  background: var(--card-bg-dark, #1f2937);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.visio-access {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.access-icon {
  font-size: 0.75rem;
  line-height: 1;
}

.visio-action {
  flex-shrink: 0;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.participants-btn {
  padding: 0.75rem 1.25rem;
  background: var(--blue-500);
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.participants-btn:hover {
  background: var(--color-info-strong);
}

.open-jitsi-btn {
  padding: 0.75rem 1.25rem;
  background: var(--color-success-strong);
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: all 0.2s;
}

.open-jitsi-btn:hover {
  background: #15803d;
}

.waiting-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--warning-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--amber-300);
}

.waiting-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.waiting-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--amber-800);
}

/* btn-icon : partagé avec la carte (copie verbatim pour le scoping) */
.btn-icon {
  font-size: 1.125rem;
  line-height: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .visio-panel-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
