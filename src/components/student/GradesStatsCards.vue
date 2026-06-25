<template>
  <div class="stats-cards">
    <div class="stat-card moyenne-card">
      <div class="stat-label">Moyenne Générale</div>
      <div class="stat-value" :class="getMoyenneClass(moyenneGenerale)">
        {{ moyenneGenerale }}/20
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :class="getMoyenneClass(moyenneGenerale)"
          :style="{ width: `${(moyenneGenerale / 20) * 100}%` }"
        ></div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Matières</div>
      <div class="stat-value">{{ totalMatieres }}</div>
      <div class="stat-detail">{{ totalEvaluations }} évaluations</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Taux de Réussite</div>
      <div class="stat-value">{{ statsReussite.taux }}%</div>
      <div class="stat-detail">{{ statsReussite.reussies }}/{{ statsReussite.total }} éval.</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Meilleure Note</div>
      <div class="stat-value note-excellent">{{ statsMeilleureNote }}/20</div>
      <div class="stat-detail" v-if="meilleureMatiere">{{ meilleureMatiere }}</div>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes de statistiques des notes élève (#H10 ≤300). Présentation pure :
 * moyenne générale, matières/évaluations, taux de réussite, meilleure note.
 * La classe couleur de la moyenne provient de l'util pur getMoyenneClass.
 */
import { getMoyenneClass } from '@/utils/studentGrades'

defineProps({
  moyenneGenerale: { type: [Number, String], default: 0 },
  totalMatieres: { type: [Number, String], default: 0 },
  totalEvaluations: { type: [Number, String], default: 0 },
  statsReussite: { type: Object, default: () => ({ total: 0, reussies: 0, taux: 0 }) },
  statsMeilleureNote: { type: [Number, String], default: 0 },
  meilleureMatiere: { type: String, default: '' },
})
</script>

<style scoped>
/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-card.moyenne-card {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-detail {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 0.5rem;
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.75rem;
}

.moyenne-card .progress-bar {
  background: rgba(255, 255, 255, 0.3);
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

/* Classes couleur (utilisées sur .stat-value note-excellent) */
.note-excellent { color: #4caf50; }
.note-good { color: #8bc34a; }
.note-average { color: #ff9800; }
.note-below-average { color: #ff5722; }
.note-fail { color: #f44336; }

/* Responsive */
@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}

/* Print styles */
@media print {
  .stat-card {
    box-shadow: none;
    border: 1px solid #ddd;
  }
}
</style>
