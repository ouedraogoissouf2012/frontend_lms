<template>
  <div class="form-section">
    <h4 class="section-title">Configuration</h4>

    <div class="config-grid">
      <div class="config-item">
        <label>Score de reussite (%)</label>
        <input
          v-model.number="quiz.passing_score"
          type="number"
          min="0"
          max="100"
          class="config-input"
        />
      </div>

      <div class="config-item">
        <label>Tentatives max (vide = illimite)</label>
        <input
          v-model.number="quiz.max_attempts"
          type="number"
          min="1"
          placeholder="Illimite"
          class="config-input"
        />
      </div>

      <div class="config-item">
        <label>Limite de temps (min)</label>
        <input
          v-model.number="quiz.time_limit_minutes"
          type="number"
          min="1"
          placeholder="Pas de limite"
          class="config-input"
        />
      </div>
    </div>

    <div class="config-toggles">
      <label class="toggle-item">
        <input type="checkbox" v-model="quiz.shuffle_questions" />
        <span>Melanger les questions</span>
      </label>
      <label class="toggle-item">
        <input type="checkbox" v-model="quiz.shuffle_options" />
        <span>Melanger les options</span>
      </label>
      <label class="toggle-item">
        <input type="checkbox" v-model="quiz.show_correct_answers" />
        <span>Afficher les reponses correctes</span>
      </label>
      <label class="toggle-item">
        <input type="checkbox" v-model="quiz.show_explanation" />
        <span>Afficher les explications</span>
      </label>
    </div>

    <!-- Option Quiz obligatoire -->
    <div class="required-quiz-section">
      <label class="toggle-item required-toggle">
        <input type="checkbox" v-model="quiz.is_required" />
        <div class="required-toggle-content">
          <span class="required-label">Quiz obligatoire</span>
          <span class="required-description">
            L'etudiant doit reussir ce quiz pour acceder au chapitre suivant
          </span>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Configuration » de KnowledgeCheckEditor (#G6 ; éclaté sous 300 lignes
 * en H5). Sous-composant présentationnel : scores, tentatives, limite de temps,
 * bascules d'affichage et option « quiz obligatoire ». Le `quiz` est lié en
 * two-way par référence (les v-model mutent directement l'objet du parent).
 */
defineProps({
  quiz: { type: Object, required: true }
})
</script>

<style scoped>
.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.config-item label {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
}

.config-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.config-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-item input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Required Quiz Section */
.required-quiz-section {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 0.5rem;
}

.required-toggle {
  align-items: flex-start;
}

.required-toggle-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.required-label {
  font-weight: 600;
  color: var(--text-primary);
}

.required-description {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
</style>
