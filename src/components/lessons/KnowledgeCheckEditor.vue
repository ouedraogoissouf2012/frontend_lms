<template>
  <div class="knowledge-check-editor">
    <!-- Header -->
    <div class="editor-header">
      <h3 class="editor-title">
        <i class="material-icons">quiz</i>
        {{ isEditing ? 'Modifier le quiz' : 'Nouveau quiz' }}
      </h3>
      <button @click="$emit('close')" class="close-btn">
        <i class="material-icons">close</i>
      </button>
    </div>

    <!-- Form -->
    <div class="editor-content">
      <!-- Informations generales -->
      <div class="form-section">
        <h4 class="section-title">Informations generales</h4>

        <div class="form-group">
          <label>Titre du quiz *</label>
          <input
            v-model="quiz.title"
            type="text"
            placeholder="Ex: Testez vos connaissances - Chapitre 1"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>Description (optionnel)</label>
          <textarea
            v-model="quiz.description"
            rows="2"
            placeholder="Description courte du quiz..."
            class="form-input"
          ></textarea>
        </div>
      </div>

      <!-- Questions -->
      <div class="form-section">
        <div class="section-header">
          <h4 class="section-title">Questions ({{ quiz.questions.length }})</h4>
        </div>

        <div v-if="quiz.questions.length === 0" class="empty-questions">
          <i class="material-icons">help_outline</i>
          <p>Aucune question. Cliquez sur "Ajouter une question" pour commencer.</p>
        </div>

        <draggable
          v-else
          v-model="quiz.questions"
          item-key="index"
          handle=".drag-handle"
          ghost-class="ghost-question"
        >
          <template #item="{ element: question, index }">
            <div class="question-card">
              <div class="question-header">
                <div class="drag-handle">
                  <i class="material-icons">drag_indicator</i>
                </div>
                <span class="question-number">Question {{ index + 1 }}</span>
                <select v-model="question.type" class="type-select" @change="onTypeChange(index)">
                  <option value="single">Choix unique</option>
                  <option value="multiple">Choix multiple</option>
                  <option value="true_false">Vrai / Faux</option>
                </select>
                <button @click="removeQuestion(index)" class="remove-btn">
                  <i class="material-icons">delete</i>
                </button>
              </div>

              <div class="question-body">
                <div class="form-group">
                  <label>Question *</label>
                  <textarea
                    v-model="question.question"
                    rows="2"
                    placeholder="Posez votre question..."
                    class="form-input"
                  ></textarea>
                </div>

                <!-- Options -->
                <div class="options-section">
                  <label>Options de reponse *</label>
                  <div
                    v-for="(option, optIndex) in question.options"
                    :key="optIndex"
                    class="option-row"
                  >
                    <!-- Radio/Checkbox for correct answer -->
                    <div class="correct-indicator">
                      <input
                        v-if="question.type === 'multiple'"
                        type="checkbox"
                        :checked="isCorrectOption(index, optIndex)"
                        @change="toggleCorrectMultiple(index, optIndex)"
                      />
                      <input
                        v-else
                        type="radio"
                        :name="'correct-' + index"
                        :checked="question.correct_answer === optIndex"
                        @change="question.correct_answer = optIndex"
                      />
                    </div>
                    <input
                      v-model="question.options[optIndex]"
                      type="text"
                      :placeholder="'Option ' + (optIndex + 1)"
                      class="option-input"
                      :disabled="question.type === 'true_false'"
                    />
                    <button
                      v-if="question.type !== 'true_false' && question.options.length > 2"
                      @click="removeOption(index, optIndex)"
                      class="remove-option-btn"
                    >
                      <i class="material-icons">close</i>
                    </button>
                  </div>
                  <button
                    v-if="question.type !== 'true_false' && question.options.length < 6"
                    @click="addOption(index)"
                    class="add-option-btn"
                  >
                    <i class="material-icons">add</i>
                    Ajouter une option
                  </button>
                </div>

                <!-- Explanation -->
                <div class="form-group">
                  <label>Explication (affichee apres reponse)</label>
                  <textarea
                    v-model="question.explanation"
                    rows="2"
                    placeholder="Expliquez la bonne reponse..."
                    class="form-input"
                  ></textarea>
                </div>

                <!-- Points -->
                <div class="form-group points-group">
                  <label>Points</label>
                  <input
                    v-model.number="question.points"
                    type="number"
                    min="1"
                    max="10"
                    class="points-input"
                  />
                </div>
              </div>
            </div>
          </template>
        </draggable>

        <!-- Bouton Ajouter en bas -->
        <div class="add-question-section">
          <button @click="addQuestion" class="add-question-btn">
            <i class="material-icons">add</i>
            Ajouter une question
          </button>
        </div>

        <!-- Aide validation -->
        <div v-if="quiz.questions.length > 0 && !isValid" class="validation-help">
          <i class="material-icons">info</i>
          <span>Assurez-vous de selectionner la bonne reponse pour chaque question (cochez le cercle a gauche)</span>
        </div>
      </div>

      <!-- Configuration -->
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
    </div>

    <!-- Footer -->
    <div class="editor-footer">
      <button @click="$emit('close')" class="cancel-btn">
        Annuler
      </button>
      <button @click="save" :disabled="!isValid || saving" class="save-btn">
        <i class="material-icons spinning" v-if="saving">sync</i>
        <i class="material-icons" v-else>save</i>
        {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import knowledgeCheckService from '@/services/knowledgeCheck'

const props = defineProps({
  chapterId: {
    type: Number,
    required: true
  },
  existingQuiz: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const saving = ref(false)
const isEditing = computed(() => !!props.existingQuiz)

const quiz = ref({
  chapter_id: props.chapterId,
  title: '',
  description: '',
  questions: [],
  passing_score: 70,
  max_attempts: null,
  shuffle_questions: false,
  shuffle_options: false,
  show_correct_answers: true,
  show_explanation: true,
  time_limit_minutes: null,
  position: 0,
  is_required: false // Quiz obligatoire pour passer au chapitre suivant
})

const isValid = computed(() => {
  if (!quiz.value.title.trim()) return false
  if (quiz.value.questions.length === 0) return false

  // Validate each question
  for (const q of quiz.value.questions) {
    if (!q.question.trim()) return false
    if (q.options.some(o => !o.trim())) return false
    if (q.type === 'multiple') {
      if (!Array.isArray(q.correct_answer) || q.correct_answer.length === 0) return false
    } else {
      if (q.correct_answer === null || q.correct_answer === undefined) return false
    }
  }

  return true
})

onMounted(() => {
  if (props.existingQuiz) {
    quiz.value = { ...props.existingQuiz }
  }
})

function addQuestion() {
  quiz.value.questions.push(knowledgeCheckService.createEmptyQuestion('single'))
}

function removeQuestion(index) {
  quiz.value.questions.splice(index, 1)
}

function addOption(questionIndex) {
  quiz.value.questions[questionIndex].options.push('')
}

function removeOption(questionIndex, optionIndex) {
  const q = quiz.value.questions[questionIndex]
  q.options.splice(optionIndex, 1)

  // Adjust correct_answer if needed
  if (q.type === 'multiple' && Array.isArray(q.correct_answer)) {
    q.correct_answer = q.correct_answer
      .filter(i => i !== optionIndex)
      .map(i => i > optionIndex ? i - 1 : i)
  } else if (q.correct_answer === optionIndex) {
    q.correct_answer = null
  } else if (q.correct_answer > optionIndex) {
    q.correct_answer--
  }
}

function onTypeChange(index) {
  const q = quiz.value.questions[index]

  if (q.type === 'true_false') {
    q.options = ['Vrai', 'Faux']
    q.correct_answer = null
  } else if (q.type === 'multiple') {
    q.correct_answer = []
  } else {
    q.correct_answer = null
  }
}

function isCorrectOption(questionIndex, optionIndex) {
  const q = quiz.value.questions[questionIndex]
  return Array.isArray(q.correct_answer) && q.correct_answer.includes(optionIndex)
}

function toggleCorrectMultiple(questionIndex, optionIndex) {
  const q = quiz.value.questions[questionIndex]
  if (!Array.isArray(q.correct_answer)) {
    q.correct_answer = []
  }

  const idx = q.correct_answer.indexOf(optionIndex)
  if (idx >= 0) {
    q.correct_answer.splice(idx, 1)
  } else {
    q.correct_answer.push(optionIndex)
  }
}

async function save() {
  if (!isValid.value || saving.value) return

  saving.value = true

  try {
    let response
    if (isEditing.value) {
      response = await knowledgeCheckService.update(props.existingQuiz.id, quiz.value)
    } else {
      response = await knowledgeCheckService.create(quiz.value)
    }

    emit('saved', response.data)
  } catch (error) {
    console.error('Erreur sauvegarde quiz:', error)
    alert('Erreur lors de la sauvegarde du quiz')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.knowledge-check-editor {
  background: var(--bg-primary);
  border-radius: 12px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.editor-title i {
  color: #6366f1;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.section-header .section-title {
  margin: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.9375rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #6366f1;
}

.add-question-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.add-question-btn:hover {
  background: #4f46e5;
}

.add-question-section {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  margin-top: 0.5rem;
}

.add-question-section .add-question-btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
}

.validation-help {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #b45309;
  font-size: 0.8125rem;
  margin-top: 1rem;
}

.validation-help i {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.empty-questions {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-questions i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.question-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.ghost-question {
  opacity: 0.5;
  background: #6366f1 !important;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.drag-handle {
  cursor: grab;
  color: var(--text-tertiary);
}

.drag-handle:active {
  cursor: grabbing;
}

.question-number {
  font-weight: 600;
  color: var(--text-primary);
}

.type-select {
  margin-left: auto;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.8125rem;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 4px;
  color: #ef4444;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.question-body {
  padding: 1rem;
}

.options-section {
  margin-bottom: 1rem;
}

.options-section > label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.correct-indicator input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.option-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.option-input:focus {
  outline: none;
  border-color: #6366f1;
}

.option-input:disabled {
  background: var(--bg-tertiary);
  cursor: not-allowed;
}

.remove-option-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--text-tertiary);
  transition: color 0.2s;
}

.remove-option-btn:hover {
  color: #ef4444;
}

.add-option-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: none;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.add-option-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.points-group {
  max-width: 120px;
}

.points-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  text-align: center;
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

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.cancel-btn {
  padding: 0.625rem 1.25rem;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: var(--bg-tertiary);
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn i {
  font-size: 1.125rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.save-btn i.spinning {
  animation: spin 1s linear infinite;
}
</style>
