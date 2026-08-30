<template>
  <div class="profile-card">
    <div class="card-header">
      <ChartBarIcon class="header-icon" />
      <h2 class="card-title">Statistiques Système</h2>
    </div>
    <div class="card-body">
      <div class="stats-grid">
        <div class="stat-box">
          <UserGroupIcon class="stat-icon text-blue-500" />
          <div class="stat-content">
            <p class="stat-value">{{ formatCount(stats.enseignants) }}</p>
            <p class="stat-label">Enseignants</p>
          </div>
        </div>

        <div class="stat-box">
          <AcademicCapIcon class="stat-icon text-green-500" />
          <div class="stat-content">
            <p class="stat-value">{{ formatCount(stats.etudiants) }}</p>
            <p class="stat-label">Étudiants</p>
          </div>
        </div>

        <div class="stat-box">
          <BuildingLibraryIcon class="stat-icon text-purple-500" />
          <div class="stat-content">
            <p class="stat-value">{{ formatCount(stats.classes) }}</p>
            <p class="stat-label">Classes actives</p>
          </div>
        </div>

        <div class="stat-box">
          <BookOpenIcon class="stat-icon text-orange-500" />
          <div class="stat-content">
            <p class="stat-value">{{ formatCount(stats.matieres) }}</p>
            <p class="stat-label">Matières</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte « Statistiques Système » d'AdminProfile (#H3 ≤300). Présentation pure :
 * reçoit l'objet `stats` et affiche 4 compteurs. Aucun appel API.
 */
import {
  ChartBarIcon,
  BookOpenIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
} from '@heroicons/vue/24/outline'
import { formatCount } from '@/utils/formatters'

defineProps({
  stats: {
    type: Object,
    // Défaut NON MESURÉ (null), et non zéro : sans données chargées, l'ancien
    // défaut affichait « 0 Enseignants » comme un comptage effectif.
    default: () => ({ enseignants: null, etudiants: null, classes: null, matieres: null }),
  },
})
</script>

<style scoped>
.profile-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
}

.header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--violet-500);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.stat-box:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
