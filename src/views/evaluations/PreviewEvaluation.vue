<template>
  <DashboardLayout>
    <div class="page-container">
      <!-- Header avec retour -->
      <div class="page-header">
        <button @click="goBack" class="btn-back">
          <ArrowLeftIcon class="w-5 h-5" />
          Retour
        </button>

        <!-- Bandeau MODE PRÉVISUALISATION -->
        <div class="preview-banner">
          <div class="preview-banner-content">
            <div class="preview-banner-icon">
              <EyeIcon class="w-6 h-6" />
            </div>
            <div>
              <p class="preview-banner-title">MODE PRÉVISUALISATION</p>
              <p class="preview-banner-subtitle">Aperçu de l'évaluation tel qu'elle apparaîtra aux étudiants</p>
            </div>
          </div>
        </div>

        <div class="header-content" v-if="evaluation">
          <DocumentTextIcon class="page-icon" />
          <div>
            <h1 class="page-title">{{ evaluation.titre }}</h1>
            <p v-if="evaluation.description" class="page-subtitle">{{ evaluation.description }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement de la prévisualisation...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <span class="error-icon">⚠</span>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadPreview" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <!-- Contenu principal -->
      <template v-else-if="evaluation">
        <!-- Statistiques -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper bg-blue-100">
              <ClockIcon class="stat-icon text-blue-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Durée</p>
              <p class="stat-value">{{ evaluation.duree_minutes }} min</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-green-100">
              <DocumentTextIcon class="stat-icon text-green-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Questions</p>
              <p class="stat-value">{{ evaluation.questions_count }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-purple-100">
              <TrophyIcon class="stat-icon text-purple-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Total Points</p>
              <p class="stat-value">{{ evaluation.total_points }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-orange-100">
              <ChartBarIcon class="stat-icon text-orange-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Barème</p>
              <p class="stat-value">{{ evaluation.bareme }}/20</p>
            </div>
          </div>
        </div>

        <!-- Barre de progression -->
        <div class="progress-card">
          <div class="progress-header">
            <span>Progression de prévisualisation</span>
            <span>{{ answeredCount }}/{{ evaluation.questions_count }} réponses simulées</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
          </div>
        </div>

        <!-- Questions -->
        <div class="questions-container">
          <div
            v-for="(question, index) in evaluation.questions"
            :key="question.id"
            class="question-card"
          >
            <!-- En-tête de question -->
            <div class="question-header">
              <div class="question-header-left">
                <span class="question-badge">Question {{ index + 1 }}</span>
                <span class="points-badge">{{ question.points }} point(s)</span>
                <span class="preview-badge">Prévisualisation</span>
              </div>
              <span v-if="previewAnswers[question.id] !== undefined" class="answered-icon">
                <CheckIcon class="w-5 h-5" />
              </span>
            </div>

            <p class="question-text">{{ question.question }}</p>

            <!-- Options QCM -->
            <div v-if="question.type === 'qcm' && question.options" class="options-list">
              <button
                v-for="(option, optIndex) in question.options"
                :key="optIndex"
                @click="selectAnswer(question.id, option)"
                :class="[
                  'option-button',
                  previewAnswers[question.id] === option ? 'option-selected' : ''
                ]"
              >
                <div class="option-radio" :class="{ selected: previewAnswers[question.id] === option }">
                  <div v-if="previewAnswers[question.id] === option" class="option-radio-dot"></div>
                </div>
                <span>{{ option }}</span>
              </button>
            </div>

            <!-- Réponse courte -->
            <div v-else-if="question.type === 'reponse_courte'" class="answer-input-wrapper">
              <textarea
                v-model="previewAnswers[question.id]"
                rows="3"
                placeholder="Entrez votre réponse ici... (mode prévisualisation)"
                class="answer-input"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Actions footer -->
        <div class="actions-footer">
          <div class="actions-info">
            <p class="actions-info-title">Mode prévisualisation activé</p>
            <p class="actions-info-subtitle">Les réponses ne seront pas enregistrées</p>
          </div>
          <div class="actions-buttons">
            <button @click="goBack" class="btn-secondary">
              Retour
            </button>
            <button
              v-if="!evaluation.is_published"
              @click="goToEdit"
              class="btn-edit"
            >
              <PencilIcon class="w-5 h-5" />
              Modifier les questions
            </button>
            <button
              v-if="!evaluation.is_published"
              @click="publishEvaluation"
              :disabled="publishing"
              class="btn-publish"
            >
              <CheckCircleIcon class="w-5 h-5" />
              {{ publishing ? 'Publication...' : 'Publier maintenant' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  EyeIcon,
  CheckIcon,
  CheckCircleIcon,
  PencilIcon
} from '@heroicons/vue/24/outline'
import evaluationService from '@/services/evaluation'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref(null)
const evaluation = ref(null)
const previewAnswers = ref({})
const publishing = ref(false)

// Progression
const answeredCount = computed(() => {
  return Object.keys(previewAnswers.value).filter(
    key => previewAnswers.value[key] !== undefined && previewAnswers.value[key] !== null && previewAnswers.value[key] !== ''
  ).length
})

const progressPercentage = computed(() => {
  if (!evaluation.value?.questions_count) return 0
  return (answeredCount.value / evaluation.value.questions_count) * 100
})

// Load preview
async function loadPreview() {
  loading.value = true
  error.value = null

  try {
    const evaluationId = route.params.id
    const result = await evaluationService.previewEvaluation(evaluationId)

    if (result.success) {
      evaluation.value = result.data
      console.log('[PREVIEW] Évaluation chargée:', evaluation.value)
    } else {
      error.value = result.message || 'Erreur lors du chargement de la prévisualisation'
    }
  } catch (err) {
    console.error('[PREVIEW ERROR]', err)
    error.value = 'Impossible de charger la prévisualisation'
  } finally {
    loading.value = false
  }
}

// Sélectionner une réponse (simulation)
function selectAnswer(questionId, answer) {
  previewAnswers.value[questionId] = answer
}

// Aller à l'édition
function goToEdit() {
  router.push({
    name: 'EditQuestions',
    params: { id: evaluation.value.id }
  })
}

// Publier l'évaluation
async function publishEvaluation() {
  if (!confirm('Voulez-vous publier cette évaluation maintenant ? Elle deviendra visible aux étudiants.')) {
    return
  }

  publishing.value = true
  try {
    const result = await evaluationService.publishEvaluation(evaluation.value.id)
    if (result.success) {
      alert('✅ Évaluation publiée avec succès !')
      router.push({ name: 'TeacherEvaluations' })
    } else {
      alert('❌ Erreur lors de la publication')
    }
  } catch (err) {
    console.error('[PUBLISH ERROR]', err)
    alert('❌ Erreur lors de la publication')
  } finally {
    publishing.value = false
  }
}

function goBack() {
  router.push({ name: 'TeacherEvaluations' })
}

onMounted(() => {
  loadPreview()
})
</script>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 1rem;
}

.btn-back:hover {
  background: var(--bg-hover);
  border-color: var(--border-secondary);
}

/* Bandeau prévisualisation */
.preview-banner {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.1), 0 2px 4px -1px rgba(139, 92, 246, 0.06);
}

.preview-banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.preview-banner-icon {
  width: 3rem;
  height: 3rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-banner-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.preview-banner-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 3rem;
  height: 3rem;
  color: var(--blue-500);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
}

/* Loading and Error States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  color: var(--text-secondary);
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid var(--border-primary);
  border-top-color: var(--blue-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  padding: 2rem;
  text-align: center;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 3rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--error-text);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--text-secondary);
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-retry:hover {
  background: var(--btn-primary-hover);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--card-shadow);
  transition: box-shadow var(--transition-fast);
}

.stat-card:hover {
  box-shadow: var(--card-hover-shadow);
}

.stat-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Barre de progression */
.progress-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--card-shadow);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.progress-bar-container {
  width: 100%;
  height: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

/* Questions */
.questions-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.question-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  transition: box-shadow var(--transition-fast);
}

.question-card:hover {
  box-shadow: var(--card-hover-shadow);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.question-badge {
  background: var(--blue-100);
  color: var(--blue-800);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
}

.points-badge {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.preview-badge {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
}

.answered-icon {
  color: #8b5cf6;
}

.question-text {
  font-size: 1.125rem;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  text-align: left;
  padding: 1rem;
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.option-button:hover {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.option-button.option-selected {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
}

.option-radio {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  border: 2px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.option-radio.selected {
  border-color: #8b5cf6;
  background: #8b5cf6;
}

.option-radio-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: white;
  border-radius: 50%;
}

/* Réponse courte */
.answer-input-wrapper {
  margin-top: 1rem;
}

.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--input-border);
  border-radius: var(--radius-lg);
  background: var(--input-bg);
  color: var(--input-text);
  font-size: 1rem;
  transition: all var(--transition-fast);
  resize: vertical;
}

.answer-input:focus {
  outline: none;
  border-color: #8b5cf6;
  background: var(--input-bg);
}

.answer-input::placeholder {
  color: var(--input-placeholder);
}

/* Actions footer */
.actions-footer {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--card-shadow);
  gap: 1rem;
  flex-wrap: wrap;
}

.actions-info {
  flex: 1;
  min-width: 200px;
}

.actions-info-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.actions-info-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.actions-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--btn-secondary-hover);
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-edit:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-1px);
}

.btn-publish {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-publish:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-1px);
}

.btn-publish:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.question-card {
  animation: fadeIn 0.3s ease-out;
}
</style>
