<template>
  <div class="widget-card">
    <div class="widget-header">
      <ClockIcon class="widget-icon text-blue-600" />
      <h2 class="widget-title">Activité Récente</h2>
    </div>
    <div class="activity-grid">
      <div class="activity-item">
        <div class="activity-icon-wrapper bg-blue-100">
          <AcademicCapIcon class="activity-icon text-blue-600" />
        </div>
        <div>
          <p class="activity-label">Leçons Créées</p>
          <p class="activity-value">{{ stats.nb_lecons || 0 }}</p>
        </div>
      </div>

      <div class="activity-item">
        <div class="activity-icon-wrapper bg-green-100">
          <CheckCircleIcon class="activity-icon text-green-600" />
        </div>
        <div>
          <p class="activity-label">Corrections Effectuées</p>
          <p class="activity-value">{{ stats.nb_corrections || 0 }}</p>
        </div>
      </div>

      <div class="activity-item">
        <div class="activity-icon-wrapper bg-purple-100">
          <VideoCameraIcon class="activity-icon text-purple-600" />
        </div>
        <div>
          <p class="activity-label">Visioconférences</p>
          <p class="activity-value">{{ stats.nb_visio || 0 }}</p>
        </div>
      </div>

      <div class="activity-item">
        <div class="activity-icon-wrapper bg-orange-100">
          <ChatBubbleLeftRightIcon class="activity-icon text-orange-600" />
        </div>
        <div>
          <p class="activity-label">Messages Forum</p>
          <p class="activity-value">{{ stats.nb_messages_forum || 0 }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Widget « Activité récente » des statistiques enseignant (#H11 ≤300).
 *  Présentation pure : 4 indicateurs (leçons, corrections, visio, forum). */
import { ClockIcon, AcademicCapIcon, CheckCircleIcon, VideoCameraIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, required: true }
})
</script>

<style scoped>
/* Widget Card */
.widget-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.widget-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Activity Grid */
.activity-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.activity-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-blue-100 {
  background: var(--info-bg);
}

.bg-green-100 {
  background: var(--success-bg);
}

.bg-orange-100 {
  background: #ffedd5;
}

.bg-purple-100 {
  background: #f3e8ff;
}

.activity-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.activity-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.activity-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

@media (max-width: 768px) {
  .activity-grid {
    grid-template-columns: 1fr;
  }
}
</style>
