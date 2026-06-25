<template>
  <div class="player-intro">
    <div class="intro-icon">
      <i class="material-icons">quiz</i>
    </div>
    <h3 class="intro-title">{{ quiz.title }}</h3>
    <p v-if="quiz.description" class="intro-description">{{ quiz.description }}</p>

    <div class="intro-stats">
      <div class="stat-item">
        <i class="material-icons">help_outline</i>
        <span>{{ quiz.questions_count || quiz.questions?.length || 0 }} questions</span>
      </div>
      <div v-if="quiz.time_limit_minutes" class="stat-item">
        <i class="material-icons">schedule</i>
        <span>{{ quiz.time_limit_minutes }} minutes</span>
      </div>
      <div class="stat-item">
        <i class="material-icons">emoji_events</i>
        <span>Score minimum: {{ quiz.passing_score }}%</span>
      </div>
      <div v-if="quiz.max_attempts" class="stat-item">
        <i class="material-icons">replay</i>
        <span>{{ quiz.max_attempts }} tentative(s) max</span>
      </div>
    </div>

    <!-- Historique tentatives -->
    <div v-if="quiz.user_best_score !== null" class="previous-attempts">
      <div class="best-score" :class="{ passed: quiz.user_passed }">
        <i class="material-icons">{{ quiz.user_passed ? 'check_circle' : 'stars' }}</i>
        <span>Meilleur score: {{ quiz.user_best_score }}%</span>
      </div>
    </div>

    <button
      v-if="quiz.can_attempt !== false"
      @click="$emit('start')"
      :disabled="loading"
      class="start-btn"
    >
      <i class="material-icons">play_arrow</i>
      {{ quiz.user_best_score !== null ? 'Retenter' : 'Commencer' }}
    </button>

    <p v-else class="max-attempts-reached">
      <i class="material-icons">block</i>
      Nombre maximum de tentatives atteint
    </p>
  </div>
</template>

<script setup>
/**
 * Écran d'intro du lecteur de quiz (#G6 ; éclaté sous 300 lignes en H5).
 * Sous-composant présentationnel extrait de KnowledgeCheckPlayer.vue : titre,
 * description, statistiques, meilleur score et bouton de démarrage. Le `quiz`
 * est une prop en lecture seule ; le démarrage est émis au parent (composable).
 */
defineProps({
  quiz: { type: Object, required: true },
  loading: { type: Boolean, default: false }
})

defineEmits(['start'])
</script>

<style scoped>
/* Intro */
.player-intro {
  padding: 2rem;
  text-align: center;
}

.intro-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.intro-icon i {
  font-size: 2.5rem;
  color: white;
}

.intro-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.intro-description {
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
}

.intro-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: 20px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-item i {
  font-size: 1.125rem;
  color: #6366f1;
}

.previous-attempts {
  margin-bottom: 1.5rem;
}

.best-score {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #fef3c7;
  color: #b45309;
  border-radius: 8px;
  font-weight: 500;
}

.best-score.passed {
  background: #d1fae5;
  color: #047857;
}

.best-score i {
  font-size: 1.25rem;
}

.start-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.start-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.max-attempts-reached {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  font-weight: 500;
}
</style>
