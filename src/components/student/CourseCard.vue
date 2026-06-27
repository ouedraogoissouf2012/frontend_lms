<template>
  <div
    class="course-card"
    @click="$emit('select')"
    @keydown.enter="$emit('select')"
    @keydown.space.prevent="$emit('select')"
    role="button"
    tabindex="0"
    :aria-label="`Accéder au cours ${course.title}`"
  >
    <!-- Badge type -->
    <div class="course-type-badge" :class="course.type">
      {{ getTypeLabel(course.type) }}
    </div>

    <div class="course-header">
      <h3 class="course-title">{{ course.title }}</h3>
      <p class="course-description" v-if="course.description">
        {{ truncateText(course.description, 80) }}
      </p>
    </div>

    <!-- Info enseignant et matière -->
    <div class="course-meta">
      <div class="meta-item" v-if="course.enseignant">
        <i class="fa fa-user"></i>
        <span>{{ course.enseignant.name }}</span>
      </div>
      <div class="meta-item" v-if="course.matiere">
        <i class="fa fa-book"></i>
        <span>{{ course.matiere.name }}</span>
      </div>
      <div class="meta-item" v-if="course.duree_estimee">
        <i class="fa fa-clock-o"></i>
        <span>{{ course.duree_estimee }} min</span>
      </div>
    </div>

    <!-- Progression -->
    <div class="course-progress" v-if="course.progress">
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: course.progress.percentage + '%' }"></div>
      </div>
      <span class="progress-text">{{ course.progress.percentage }}% complété</span>
    </div>

    <button class="course-button" aria-label="Voir les détails du cours">
      <span>Voir le cours</span>
      <span class="button-arrow" aria-hidden="true">→</span>
    </button>
  </div>
</template>

<script setup>
/**
 * Carte de cours de StudentCourses (#G1 ≤300). Présentation pure : reçoit `course`
 * et émet `select` au clic / clavier ; libellé de type et troncature calculés
 * localement (truncate de @/utils/formatters).
 */
import { truncate } from '@/utils/formatters'

defineProps({
  course: { type: Object, required: true },
})

defineEmits(['select'])

function getTypeLabel(type) {
  const types = {
    cours: 'Cours',
    tp: 'TP',
    td: 'TD',
    projet: 'Projet',
    autre: 'Autre',
  }
  return types[type] || 'Cours'
}

function truncateText(text, maxLength) {
  return truncate(text, maxLength)
}
</script>

<style scoped>
.course-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-4px);
}

/* Badge type */
.course-type-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.course-type-badge.cours {
  background: var(--info-bg);
  color: var(--info-text);
}

.course-type-badge.tp {
  background: var(--success-bg);
  color: var(--success-text);
}

.course-type-badge.td {
  background: var(--warning-bg);
  color: var(--amber-800);
}

.course-type-badge.projet {
  background: #f3e8ff;
  color: var(--violet-600);
}

.course-type-badge.autre {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.course-header {
  margin-bottom: 1rem;
  padding-right: 4rem;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.course-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Meta infos */
.course-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.meta-item i {
  width: 1rem;
  text-align: center;
  color: var(--primary);
}

/* Progress */
.course-progress {
  margin-bottom: 1rem;
}

.progress-bar-container {
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--blue-500), var(--color-info-strong));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.course-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
}

.course-button:hover {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, #1d4ed8 100%);
  transform: scale(1.02);
}

.button-arrow {
  font-size: 1.25rem;
  line-height: 1;
  font-weight: bold;
}
</style>
