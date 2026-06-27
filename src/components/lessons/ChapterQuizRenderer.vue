<template>
  <div class="content-block content-quiz">
    <div v-if="quiz">
      <KnowledgeCheckPlayer
        :quiz="quiz"
        @completed="$emit('completed', $event)"
        @close="$emit('close')"
      />
    </div>
    <div v-else class="quiz-empty">
      <i class="fa fa-question-circle"></i>
      <p>Le quiz n'est pas encore disponible.</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Rendu d'un chapitre quiz (#H4 ≤300) : joue le KnowledgeCheckPlayer quand un quiz
 * est disponible, sinon état vide. Relaie completed/close au parent.
 * NB : CSS .quiz-card/.score-circle/.btn-start-quiz conservés = morts (dette pré-existante).
 */
import KnowledgeCheckPlayer from '@/components/lessons/KnowledgeCheckPlayer.vue'

defineProps({
  quiz: { type: Object, default: null }
})

defineEmits(['completed', 'close'])
</script>

<style scoped>
/* Content blocks */
.content-block {
  margin-bottom: 2rem;
}

/* QUIZ CONTENT */
.quiz-card {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
}

.quiz-icon {
  font-size: 3rem;
  color: #34d399;
  margin-bottom: 1rem;
}

.quiz-card h3 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.quiz-meta {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.quiz-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.score-circle {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
}

.score-circle.passed {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 2px solid #10b981;
}

.score-circle.failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 2px solid #ef4444;
}

.btn-start-quiz {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.btn-start-quiz:hover {
  transform: translateY(-2px);
}

.quiz-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.quiz-empty i {
  font-size: 3rem;
  opacity: 0.5;
}
</style>
