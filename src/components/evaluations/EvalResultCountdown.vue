<template>
  <div class="countdown-alert">
    <div class="flex items-start gap-3">
      <!-- Icône horloge -->
      <div class="flex-shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>

      <div class="flex-1">
        <h3 class="countdown-title">Correction complète en cours de préparation</h3>

        <!-- Compte à rebours visuel -->
        <div class="flex items-center gap-2 mb-3">
          <div class="countdown-badge">
            <div class="countdown-number">{{ daysUntilCorrection }}</div>
            <div class="countdown-label">{{ daysUntilCorrection > 1 ? 'JOURS' : 'JOUR' }}</div>
          </div>
          <div class="flex-1">
            <p class="countdown-subtitle">Avant accès à la correction complète</p>
            <!-- Barre de progression -->
            <div class="progress-bar-bg">
              <div
                class="progress-bar-fill"
                :style="{ width: correctionProgressPercent + '%' }"
              ></div>
            </div>
            <p class="countdown-percent">{{ correctionProgressPercent }}% du délai écoulé</p>
          </div>
        </div>

        <p class="countdown-info">
          fa-circle Les bonnes réponses seront affichées <strong>{{ formatCorrectionDate }}</strong> (7 jours après la soumission) pour préserver l'intégrité des futures sessions.
        </p>
        <p class="countdown-note">
          Vous pouvez consulter vos réponses et votre note, mais les corrections détaillées ne sont pas encore visibles.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Alerte « correction en préparation » de EvaluationResults (H2 ≤300) : compte à
 * rebours, barre de progression et date d'ouverture. Section présentationnelle
 * extraite verbatim ; reçoit jours restants / pourcentage / date formatée en props.
 */
defineProps({
  daysUntilCorrection: { type: Number, required: true },
  correctionProgressPercent: { type: Number, required: true },
  formatCorrectionDate: { type: String, default: '' }
})
</script>

<style scoped>
/* Alerte de compte à rebours */
.countdown-alert {
  background-color: var(--bg-tertiary);
  border-left: 4px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--card-shadow);
}

.countdown-alert svg {
  color: #f59e0b;
}

.countdown-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.countdown-badge {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  padding: 1rem;
  text-align: center;
  border: 2px solid #fbbf24;
}

.countdown-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f59e0b;
}

.countdown-label {
  font-size: 0.75rem;
  color: #d97706;
  font-weight: 600;
}

.countdown-subtitle {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.progress-bar-bg {
  width: 100%;
  background-color: var(--bg-secondary);
  border-radius: 9999px;
  height: 0.5rem;
  overflow: hidden;
}

.progress-bar-fill {
  background-color: #f59e0b;
  height: 0.5rem;
  border-radius: 9999px;
  transition: all 0.5s;
}

.countdown-percent {
  font-size: 0.75rem;
  color: #d97706;
  margin-top: 0.25rem;
}

.countdown-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.countdown-note {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}
</style>
