<template>
  <div class="knowledge-check-player">
    <!-- En attente de demarrage -->
    <div v-if="state === 'intro'" class="player-intro">
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
        @click="startQuiz"
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

    <!-- Quiz en cours -->
    <div v-else-if="state === 'playing'" class="player-quiz">
      <!-- Progress bar -->
      <div class="quiz-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
      </div>

      <!-- Timer -->
      <div v-if="timeLimit" class="quiz-timer" :class="{ warning: timeRemaining < 60 }">
        <i class="material-icons">schedule</i>
        <span>{{ formatTime(timeRemaining) }}</span>
      </div>

      <!-- Question actuelle -->
      <div class="question-container">
        <h4 class="question-text">{{ currentQuestion.question }}</h4>

        <div class="options-list">
          <label
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            class="option-item"
            :class="{
              selected: isOptionSelected(index),
              'radio-type': currentQuestion.type !== 'multiple',
              'checkbox-type': currentQuestion.type === 'multiple'
            }"
          >
            <input
              v-if="currentQuestion.type === 'multiple'"
              type="checkbox"
              :checked="isOptionSelected(index)"
              @change="toggleOption(index)"
            />
            <input
              v-else
              type="radio"
              :name="'question-' + currentIndex"
              :checked="answers[currentIndex] === index"
              @change="selectOption(index)"
            />
            <span class="option-text">{{ option }}</span>
          </label>
        </div>
      </div>

      <!-- Navigation -->
      <div class="quiz-navigation">
        <button
          @click="previousQuestion"
          :disabled="currentIndex === 0"
          class="nav-btn prev-btn"
        >
          <i class="material-icons">arrow_back</i>
          Precedent
        </button>

        <div class="question-dots">
          <button
            v-for="(_, i) in questions"
            :key="i"
            @click="goToQuestion(i)"
            class="dot"
            :class="{
              active: i === currentIndex,
              answered: answers[i] !== null && answers[i] !== undefined
            }"
          >
            {{ i + 1 }}
          </button>
        </div>

        <button
          v-if="currentIndex < questions.length - 1"
          @click="nextQuestion"
          class="nav-btn next-btn"
        >
          Suivant
          <i class="material-icons">arrow_forward</i>
        </button>
        <button
          v-else
          @click="submitQuiz"
          :disabled="submitting"
          class="nav-btn submit-btn"
        >
          <i class="material-icons" v-if="submitting">sync</i>
          <i class="material-icons" v-else>check</i>
          {{ submitting ? 'Envoi...' : 'Terminer' }}
        </button>
      </div>
    </div>

    <!-- Resultats -->
    <div v-else-if="state === 'results'" class="player-results">
      <div class="results-header" :class="{ passed: results.passed }">
        <div class="results-icon">
          <i class="material-icons">{{ results.passed ? 'emoji_events' : 'sentiment_dissatisfied' }}</i>
        </div>
        <h3 class="results-title">
          {{ results.passed ? 'Felicitations !' : 'Continuez vos efforts !' }}
        </h3>
        <p class="results-message">{{ results.message }}</p>
      </div>

      <div class="score-display">
        <div class="score-circle" :class="{ passed: results.passed }">
          <span class="score-value">{{ results.score }}%</span>
          <span class="score-label">Score</span>
        </div>
        <div class="score-details">
          <p>
            <strong>{{ results.correct_answers }}</strong> / {{ results.total_questions }} bonnes reponses
          </p>
          <p>Temps: {{ results.time_spent }}</p>
          <p>Score minimum: {{ results.passing_score }}%</p>
        </div>
      </div>

      <!-- Corrections -->
      <div v-if="results.answers && results.answers.length > 0" class="corrections">
        <h4>Correction</h4>
        <div
          v-for="(answer, index) in results.answers"
          :key="index"
          class="correction-item"
          :class="{ correct: answer.is_correct, incorrect: !answer.is_correct }"
        >
          <div class="correction-header">
            <i class="material-icons">{{ answer.is_correct ? 'check_circle' : 'cancel' }}</i>
            <span class="correction-question">{{ questions[answer.question_index]?.question }}</span>
          </div>
          <div class="correction-body">
            <p v-if="!answer.is_correct && answer.correct_answer !== null">
              <strong>Bonne reponse:</strong>
              {{ getAnswerText(answer.question_index, answer.correct_answer) }}
            </p>
            <p v-if="answer.explanation" class="explanation">
              <i class="material-icons">lightbulb</i>
              {{ answer.explanation }}
            </p>
          </div>
        </div>
      </div>

      <div class="results-actions">
        <button
          v-if="results.can_retry"
          @click="resetQuiz"
          class="retry-btn"
        >
          <i class="material-icons">replay</i>
          Retenter
        </button>
        <button @click="$emit('close')" class="close-btn">
          <i class="material-icons">close</i>
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import knowledgeCheckService from '@/services/knowledgeCheck'

const props = defineProps({
  quiz: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'completed'])

const state = ref('intro') // intro, playing, results
const loading = ref(false)
const submitting = ref(false)
const questions = ref([])
const answers = ref([])
const currentIndex = ref(0)
const startTime = ref(null)
const timeLimit = ref(null)
const timeRemaining = ref(0)
let timerInterval = null

const currentQuestion = computed(() => questions.value[currentIndex.value] || {})
const progressPercent = computed(() =>
  questions.value.length > 0 ? ((currentIndex.value + 1) / questions.value.length) * 100 : 0
)
const results = ref(null)

onMounted(() => {
  // Nothing to do on mount
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

async function startQuiz() {
  loading.value = true

  try {
    const response = await knowledgeCheckService.startAttempt(props.quiz.id)

    if (response.success) {
      questions.value = response.data.questions
      answers.value = new Array(questions.value.length).fill(null)
      startTime.value = Date.now()
      timeLimit.value = response.data.time_limit_minutes

      if (timeLimit.value) {
        timeRemaining.value = timeLimit.value * 60
        startTimer()
      }

      state.value = 'playing'
    }
  } catch (error) {
    console.error('Erreur demarrage quiz:', error)
    alert('Erreur lors du demarrage du quiz')
  } finally {
    loading.value = false
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeRemaining.value--

    if (timeRemaining.value <= 0) {
      clearInterval(timerInterval)
      submitQuiz()
    }
  }, 1000)
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function isOptionSelected(index) {
  const answer = answers.value[currentIndex.value]
  if (Array.isArray(answer)) {
    return answer.includes(index)
  }
  return answer === index
}

function selectOption(index) {
  answers.value[currentIndex.value] = index
}

function toggleOption(index) {
  let answer = answers.value[currentIndex.value]
  if (!Array.isArray(answer)) {
    answer = []
  }

  const idx = answer.indexOf(index)
  if (idx >= 0) {
    answer.splice(idx, 1)
  } else {
    answer.push(index)
  }

  answers.value[currentIndex.value] = [...answer]
}

function previousQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

function goToQuestion(index) {
  currentIndex.value = index
}

async function submitQuiz() {
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  submitting.value = true

  const timeSpent = Math.round((Date.now() - startTime.value) / 1000)

  try {
    const response = await knowledgeCheckService.submitAttempt(
      props.quiz.id,
      answers.value,
      timeSpent
    )

    if (response.success) {
      results.value = response.data
      state.value = 'results'
      emit('completed', response.data)
    }
  } catch (error) {
    console.error('Erreur soumission quiz:', error)
    alert('Erreur lors de la soumission du quiz')
  } finally {
    submitting.value = false
  }
}

function getAnswerText(questionIndex, answerValue) {
  const q = questions.value[questionIndex]
  if (!q) return ''

  if (Array.isArray(answerValue)) {
    return answerValue.map(i => q.options[i]).join(', ')
  }

  return q.options[answerValue] || ''
}

function resetQuiz() {
  state.value = 'intro'
  questions.value = []
  answers.value = []
  currentIndex.value = 0
  results.value = null
  timeRemaining.value = 0
}
</script>

<style scoped>
.knowledge-check-player {
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
}

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

/* Quiz en cours */
.player-quiz {
  padding: 1.5rem;
}

.quiz-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.quiz-timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.quiz-timer.warning {
  background: #fee2e2;
  color: #b91c1c;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.question-container {
  margin-bottom: 2rem;
}

.question-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #6366f1;
}

.option-item.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
}

.option-item input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: var(--text-primary);
}

.quiz-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.prev-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.prev-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.prev-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.next-btn {
  background: #6366f1;
  border: none;
  color: white;
}

.next-btn:hover {
  background: #4f46e5;
}

.submit-btn {
  background: #10b981;
  border: none;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #059669;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.question-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.dot.active {
  border-color: #6366f1;
  background: #6366f1;
  color: white;
}

.dot.answered:not(.active) {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

/* Resultats */
.player-results {
  padding: 2rem;
}

.results-header {
  text-align: center;
  padding: 2rem;
  margin: -2rem -2rem 2rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.results-header.passed {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.results-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.results-icon i {
  font-size: 2.5rem;
  color: #b45309;
}

.results-header.passed .results-icon i {
  color: #047857;
}

.results-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #92400e;
  margin: 0 0 0.5rem 0;
}

.results-header.passed .results-title {
  color: #047857;
}

.results-message {
  color: #a16207;
  margin: 0;
}

.results-header.passed .results-message {
  color: #059669;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.score-circle.passed {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.score-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 0.75rem;
  opacity: 0.9;
}

.score-details {
  text-align: left;
}

.score-details p {
  margin: 0.25rem 0;
  color: var(--text-secondary);
}

.corrections {
  margin-bottom: 2rem;
}

.corrections h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.correction-item {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.correction-item.correct {
  background: rgba(16, 185, 129, 0.1);
  border-color: #10b981;
}

.correction-item.incorrect {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.correction-header {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.correction-header i {
  font-size: 1.25rem;
}

.correction-item.correct .correction-header i {
  color: #10b981;
}

.correction-item.incorrect .correction-header i {
  color: #ef4444;
}

.correction-question {
  font-weight: 500;
  color: var(--text-primary);
}

.correction-body {
  padding-left: 1.75rem;
}

.correction-body p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.explanation {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  margin-top: 0.5rem !important;
  padding: 0.5rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 6px;
  color: #4f46e5 !important;
}

.explanation i {
  font-size: 1rem;
  flex-shrink: 0;
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.retry-btn,
.close-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn {
  background: #6366f1;
  border: none;
  color: white;
}

.retry-btn:hover {
  background: #4f46e5;
}

.close-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.close-btn:hover {
  background: var(--bg-secondary);
}

@media (max-width: 640px) {
  .quiz-navigation {
    flex-wrap: wrap;
  }

  .question-dots {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .score-display {
    flex-direction: column;
    text-align: center;
  }

  .score-details {
    text-align: center;
  }
}
</style>
