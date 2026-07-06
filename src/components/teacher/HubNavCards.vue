<template>
  <div class="hub-grid">
    <!-- Section Classes -->
    <router-link to="/teacher/classes" class="hub-card">
      <div class="card-icon classes-icon">
        <UserGroupIcon class="icon" />
      </div>
      <div class="card-content">
        <h2 class="card-title">Mes Classes</h2>
        <p class="card-description">Les classes auxquelles vous enseignez</p>
        <div class="card-stat">
          <span class="stat-number">{{ stats.classes }}</span>
          <span class="stat-label">classe(s)</span>
        </div>
      </div>
      <div class="card-footer">
        <span>Voir mes classes</span>
        <ArrowRightIcon class="arrow-icon" />
      </div>
    </router-link>

    <!-- Section Matieres -->
    <router-link to="/teacher/matieres" class="hub-card">
      <div class="card-icon matieres-icon">
        <BookOpenIcon class="icon" />
      </div>
      <div class="card-content">
        <h2 class="card-title">Mes Matieres</h2>
        <p class="card-description">Les matieres que vous enseignez</p>
        <div class="card-stat">
          <span class="stat-number">{{ stats.matieres }}</span>
          <span class="stat-label">matiere(s)</span>
        </div>
      </div>
      <div class="card-footer">
        <span>Voir mes matieres</span>
        <ArrowRightIcon class="arrow-icon" />
      </div>
    </router-link>

    <!-- Section Lecons -->
    <router-link to="/teacher/lessons" class="hub-card">
      <div class="card-icon lecons-icon">
        <AcademicCapIcon class="icon" />
      </div>
      <div class="card-content">
        <h2 class="card-title">Mes Lecons</h2>
        <p class="card-description">Les lecons que vous avez creees</p>
        <div class="card-stat">
          <span class="stat-number">{{ stats.lecons }}</span>
          <span class="stat-label">lecon(s)</span>
        </div>
      </div>
      <div class="card-footer">
        <span>Voir mes lecons</span>
        <ArrowRightIcon class="arrow-icon" />
      </div>
    </router-link>
  </div>
</template>

<script setup>
/** Cartes de navigation du hub enseignant (#H11 ≤300). Présentation pure :
 *  3 raccourcis cliquables (classes/matières/leçons) avec leur compteur. */
import { UserGroupIcon, BookOpenIcon, AcademicCapIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, required: true }
})
</script>

<style scoped>
/* Hub Grid - 3 colonnes */
.hub-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

/* Hub Card - Carte entiere cliquable */
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
  border-color: var(--primary-color);
}

.hub-card:hover .card-footer {
  background: var(--primary-color);
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
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
}

.matieres-icon {
  background: linear-gradient(135deg, var(--amber-500) 0%, var(--amber-600) 100%);
}

.lecons-icon {
  background: linear-gradient(135deg, var(--emerald-500) 0%, var(--emerald-600) 100%);
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
  color: var(--primary-color);
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

/* Responsive */
@media (max-width: 1024px) {
  .hub-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hub-grid {
    grid-template-columns: 1fr;
  }
}
</style>
