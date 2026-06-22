<template>
  <router-link :to="to" class="hub-card">
    <div class="card-icon" :class="iconClass">
      <component :is="icon" class="icon" />
    </div>
    <div class="card-content">
      <h2 class="card-title">{{ title }}</h2>
      <p class="card-description">{{ description }}</p>
      <div class="card-stat">
        <span class="stat-number">{{ stat }}</span>
        <span class="stat-label">{{ statLabel }}</span>
      </div>
    </div>
    <div class="card-footer">
      <span>{{ footerText }}</span>
      <ArrowRightIcon class="arrow-icon" />
    </div>
  </router-link>
</template>

<script setup>
/**
 * Carte de navigation du hub admin (#G1 ≤300). Présentation pure : lien vers une
 * section avec icône, libellés, compteur et pied de carte. Le compteur est fourni
 * par la vue (orchestration), la carte ne fait qu'afficher.
 */
import { ArrowRightIcon } from '@heroicons/vue/24/outline'

defineProps({
  to: { type: String, required: true },
  icon: { type: [Object, Function], required: true },
  iconClass: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  stat: { type: [Number, String], default: 0 },
  statLabel: { type: String, default: '' },
  footerText: { type: String, default: '' },
})
</script>

<style scoped>
/* Hub Card */
.hub-card {
  background: var(--card-bg);
  border-radius: 1rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-decoration: none;
  cursor: pointer;
}

.hub-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
  border-color: var(--primary-color, #3b82f6);
}

.hub-card:hover .card-footer {
  background: var(--primary-color, #3b82f6);
  color: white;
}

.hub-card:hover .arrow-icon {
  transform: translateX(4px);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.card-icon .icon {
  width: 32px;
  height: 32px;
  color: white;
}

.classes-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.matieres-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.enseignants-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.card-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.card-stat {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  margin-top: auto;
}

.card-footer .arrow-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.2s ease;
}
</style>
