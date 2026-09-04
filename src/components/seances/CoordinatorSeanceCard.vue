<template>
  <div class="seance-card">
    <div class="seance-header">
      <!-- Infos séance -->
      <div class="seance-info">
        <h3 class="seance-title">
          {{ seance.matiere?.libelle || seance.matiere?.nom || 'Matière non définie' }}
        </h3>

        <div class="seance-details">
          <div class="detail-item" :title="`Date: ${formatDate(seance.programmation?.date)}`">
            <span class="detail-icon">◷</span>
            <div>
              <p class="detail-label">Date</p>
              <p class="detail-value">{{ formatDate(seance.programmation?.date) }}</p>
            </div>
          </div>

          <div class="detail-item" :title="`Horaire: ${formatTime(seance.programmation?.heure_debut)} - ${formatTime(seance.programmation?.heure_fin)}`">
            <i class="fa fa-clock-o detail-icon"></i>
            <div>
              <p class="detail-label">Horaire</p>
              <p class="detail-value">{{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}</p>
            </div>
          </div>

          <div class="detail-item" :title="`Classe: ${seance.classe?.libelle || seance.classe?.nom || 'Non assignée'}`">
            <i class="fa fa-building detail-icon"></i>
            <div>
              <p class="detail-label">Classe</p>
              <p class="detail-value">{{ seance.classe?.libelle || seance.classe?.nom || 'Non assignée' }}</p>
            </div>
          </div>

          <div class="detail-item" :title="`Salle: ${seance.salle || 'Non spécifiée'}`">
            <i class="fa fa-diamond detail-icon"></i>
            <div>
              <p class="detail-label">Salle</p>
              <p class="detail-value">{{ seance.salle || 'Non spécifiée' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Toggle Visio -->
      <div class="seance-action">
        <button
          @click="$emit('toggle', seance)"
          :class="[
            'toggle-visio-btn',
            seance.visio_enabled ? 'visio-active' : 'visio-inactive'
          ]"
          :title="seance.visio_enabled ? 'Désactiver la visioconférence' : 'Activer la visioconférence'"
        >
          <i class="fa fa-dot-circle-o btn-icon"></i>
          <span v-if="seance.visio_enabled">Visio activée</span>
          <span v-else>Activer visio</span>
        </button>
      </div>
    </div>

    <!-- Options visio -->
    <CoordinatorVisioPanel
      v-if="seance.visio_enabled"
      :seance="seance"
      @show-participants="$emit('show-participants', $event)"
      @join="$emit('join', $event)"
    />
  </div>
</template>

<script setup>
import { formatTime as fmtTime } from '@/utils/formatters'
/**
 * Carte d'une séance côté coordinateur (#H6 ≤300) : infos (date/horaire/classe/
 * salle), bouton d'activation visio et panneau visio (CoordinatorVisioPanel)
 * quand la visio est activée. Présentation pure extraite VERBATIM ; émet
 * `toggle`, `show-participants`, `join`. `formatDate`/`formatTime` redéfinis
 * localement (copie verbatim) pour l'indépendance du composant.
 */
import CoordinatorVisioPanel from '@/components/seances/CoordinatorVisioPanel.vue'

defineProps({
  seance: { type: Object, required: true }
})

defineEmits(['toggle', 'show-participants', 'join'])

// #283 : délègue au formatter canonique (repli local conservé).
const formatTime = (isoTimestamp) => fmtTime(isoTimestamp, { fallback: 'N/A' })

const formatDate = (date) => {
  if (!date) return 'Non défini'
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<style scoped>
/* Seance Card */
.seance-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.seance-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.seance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.seance-info {
  flex: 1;
}

.seance-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.seance-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.detail-icon {
  font-size: 1rem;
  line-height: 1;
  color: var(--primary-color);
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

/* Toggle Visio Button */
.seance-action {
  flex-shrink: 0;
}

.toggle-visio-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.visio-active {
  background: var(--purple-100);
  color: var(--violet-600);
}

.visio-active:hover {
  background: var(--purple-200);
}

.visio-inactive {
  background: var(--hover-bg);
  color: var(--text-secondary);
}

.visio-inactive:hover {
  background: var(--gray-200);
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .seance-header {
    flex-direction: column;
  }

  .seance-details {
    grid-template-columns: 1fr;
  }
}
</style>
