<template>
  <div>
    <!-- Bandeau mode entraînement -->
    <div v-if="isPractice" class="practice-banner">
      <i class="fa fa-graduation-cap"></i>
      <div>
        <p class="practice-title">Mode Entraînement</p>
        <p class="practice-subtitle">Cette note ne sera pas comptabilisée dans votre moyenne.</p>
      </div>
    </div>

    <!-- Alerte fermeture imminente fenêtre -->
    <div v-if="windowTimeLeft !== null && windowTimeLeft <= 5" class="alert-urgent">
      <i class="fa fa-exclamation-triangle"></i>
      <div>
        <p class="alert-title">ATTENTION: La fenêtre d'évaluation va se fermer dans {{ windowTimeLeft }} minutes!</p>
        <p class="alert-subtitle">Votre évaluation sera automatiquement soumise à la fermeture.</p>
      </div>
    </div>

    <!-- Compte à rebours fenêtre temporelle -->
    <div v-else-if="windowTimeLeft !== null && windowTimeLeft > 0" class="alert-info">
      <div class="alert-info-row">
        <div class="alert-info-left">
          <i class="fa fa-clock-o"></i>
          <span>Temps restant avant fermeture de la fenêtre</span>
        </div>
        <span class="alert-info-time">{{ formatTimeLeft(windowTimeLeft) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Bandeaux d'en-tête de TakeEvaluation (H1) : mode entraînement et alertes de
 * fenêtre temporelle (fermeture imminente / compte à rebours). Présentation pure ;
 * CSS déplacé verbatim depuis TakeEvaluation.
 */
defineProps({
  isPractice: { type: Boolean, default: false },
  windowTimeLeft: { type: Number, default: null },
  formatTimeLeft: { type: Function, required: true }
})
</script>

<style scoped>
/* Bandeau mode entraînement */
.practice-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f3e8ff, var(--violet-100));
  border: 2px solid var(--violet-500);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: var(--violet-800);
}

.practice-banner .fa {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.practice-title {
  font-weight: 700;
  font-size: 1rem;
  margin: 0 0 0.25rem 0;
}

.practice-subtitle {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.85;
}

/* Alerts */
.alert-urgent {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--error-bg);
  border: 2px solid var(--red-500);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  animation: pulse 2s infinite;
  color: var(--error-text);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.alert-urgent .fa {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.alert-title {
  font-weight: 700;
  font-size: 1rem;
  margin: 0 0 0.25rem 0;
}

.alert-subtitle {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
}

.alert-info {
  padding: 1rem 1.5rem;
  background: var(--bg-secondary, #eff6ff);
  border: 1px solid var(--primary-color, #3b82f6);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.alert-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alert-info-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.alert-info-time {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color, #3b82f6);
}

/* Responsive */
@media (max-width: 768px) {
  .alert-info-row {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
