<template>
  <div class="summary-section">
    <div class="section-header" @click="showSummary = !showSummary">
      <h2 class="section-title">
        <i :class="showSummary ? 'mdi mdi-chevron-down' : 'mdi mdi-chevron-right'"></i>
        Résumé par Matière
      </h2>
      <span class="toggle-hint">{{ showSummary ? 'Masquer' : 'Afficher' }}</span>
    </div>

    <transition name="slide">
      <div v-show="showSummary" class="summary-content">
        <div class="summary-cards">
          <div
            v-for="matiere in matieres"
            :key="matiere.matiere_id"
            class="summary-card"
          >
            <div class="summary-card-header">
              <h3 class="summary-matiere-name">{{ matiere.matiere_nom }}</h3>
              <span class="summary-count">{{ matiere.total_evaluations }} éval.</span>
            </div>

            <div class="summary-moyenne" :class="getMoyenneClass(matiere.moyenne)">
              <span class="moyenne-label">Moyenne:</span>
              <span class="moyenne-value">{{ matiere.moyenne }}/20</span>
            </div>

            <div class="progress-bar">
              <div
                class="progress-fill"
                :class="getMoyenneClass(matiere.moyenne)"
                :style="{ width: `${(matiere.moyenne / 20) * 100}%` }"
              ></div>
            </div>

            <div class="summary-stats">
              <div class="stat-item">
                <i class="mdi mdi-trophy stat-icon"></i>
                <span class="stat-text">{{ getMaxNote(matiere) }}/20</span>
              </div>
              <div class="stat-item">
                <i class="mdi mdi-arrow-down stat-icon"></i>
                <span class="stat-text">{{ getMinNote(matiere) }}/20</span>
              </div>
              <div class="stat-item">
                <i class="mdi" :class="getTrendIcon(matiere)"></i>
                <span class="stat-text">{{ getTrendText(matiere) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
/**
 * Résumé repliable par matière (#H10 ≤300). Présentation pure : une carte par
 * matière (moyenne, min/max, tendance). L'état d'ouverture est en v-model
 * (defineModel) ; les calculs viennent des utils purs studentGrades.
 */
import {
  getMoyenneClass,
  getMaxNote,
  getMinNote,
  getTrendIcon,
  getTrendText,
} from '@/utils/studentGrades'

const showSummary = defineModel('showSummary', { type: Boolean, default: true })

defineProps({
  matieres: { type: Array, default: () => [] },
})
</script>

<style scoped>
/* Summary Section */
.summary-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding-bottom: 1rem;
}

.section-header:hover .section-title {
  color: var(--primary-color);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  transition: color 0.2s;
}

.toggle-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.summary-content {
  padding-top: 1rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-primary);
  transition: all 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.summary-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.summary-matiere-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.summary-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.summary-moyenne {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.moyenne-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-icon {
  font-size: 1.2rem;
  color: var(--primary-color);
}

/* Classes couleur (appliquées via getMoyenneClass sur .summary-moyenne) */
.note-excellent { color: #4caf50; }
.note-good { color: #8bc34a; }
.note-average { color: #ff9800; }
.note-below-average { color: #ff5722; }
.note-fail { color: #f44336; }

/* Progress Bar (réutilisée ici) */
.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.75rem;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-fill.note-excellent { background: #4caf50; }
.progress-fill.note-good { background: #8bc34a; }
.progress-fill.note-average { background: #ff9800; }
.progress-fill.note-below-average { background: #ff5722; }
.progress-fill.note-fail { background: #f44336; }

/* Responsive */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}

/* Print styles */
@media print {
  .section-header {
    display: none !important;
  }

  .summary-content {
    display: block !important;
    max-height: none !important;
  }

  .summary-card {
    box-shadow: none;
    border: 1px solid var(--gray-200);
  }
}
</style>
