<template>
  <div class="seance-info-grid">
    <div class="info-item">
      <span class="info-icon">◷</span>
      <div>
        <p class="info-label">Date</p>
        <p class="info-value">{{ formatDate(seance.programmation?.date) }}</p>
      </div>
    </div>

    <div class="info-item">
      <i class="fa fa-clock-o info-icon"></i>
      <div>
        <p class="info-label">Horaire</p>
        <p class="info-value">
          {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
        </p>
      </div>
    </div>

    <div class="info-item">
      <i class="fa fa-building info-icon"></i>
      <div>
        <p class="info-label">Classe</p>
        <p class="info-value">{{ seance.classe?.nom || 'N/A' }}</p>
      </div>
    </div>

    <div class="info-item">
      <i class="fa fa-diamond info-icon"></i>
      <div>
        <p class="info-label">Salle</p>
        <p class="info-value">{{ seance.salle || 'N/A' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Grille d'infos d'une carte de séance (#H6 ≤300) : date, horaire, classe, salle.
 * Présentation pure, extrait VERBATIM de SeanceCard.vue.
 */
defineProps({
  seance: { type: Object, required: true }
})

// #23 : l'heure délègue au formatter centralisé (repli 'N/A' identique).
import { formatTime as fmtTime } from '@/utils/formatters'

// formatDate gardé local : format « ven. 19 juin 2026 » (weekday court + jour
// numérique) sans équivalent canonique strict (#23 — pas de convergence forcée).
function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatTime(dateTimeStr) {
  return fmtTime(dateTimeStr, { fallback: 'N/A' })
}
</script>

<style scoped>
/* Seance Info Grid */
.seance-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  font-size: 1.25rem;
  line-height: 1;
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
</style>
