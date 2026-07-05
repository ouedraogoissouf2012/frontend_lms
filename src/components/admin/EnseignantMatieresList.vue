<template>
  <div v-if="safeMatieres.length > 0" class="matieres-detail-list">
    <div
      v-for="matiere in safeMatieres"
      :key="matiere.id"
      class="matiere-detail-card"
    >
      <div class="matiere-detail-header">
        <h4 class="matiere-detail-name">{{ matiere.nom || 'Matière sans nom' }}</h4>
        <span v-if="matiere.code" class="matiere-code">{{ matiere.code }}</span>
      </div>

      <!-- Stats de la matière si disponibles -->
      <div v-if="matiere.heures_prevues" class="matiere-detail-stats">
        <div class="matiere-stat">
          <span class="matiere-stat-label">Heures:</span>
          <span class="matiere-stat-value">{{ matiere.heures_effectuees }}h / {{ matiere.heures_prevues }}h</span>
        </div>
        <div class="matiere-stat">
          <span class="matiere-stat-label">Taux:</span>
          <span class="matiere-stat-value">{{ matiere.taux_realisation.toFixed(0) }}%</span>
        </div>
        <div class="matiere-stat">
          <span class="matiere-stat-label">Séances:</span>
          <span class="matiere-stat-value">{{ matiere.nb_seances_effectuees }}/{{ matiere.nb_seances_total }}</span>
        </div>
      </div>

      <!-- Classes pour cette matière -->
      <div v-if="matiere.classes && matiere.classes.length > 0" class="matiere-classes">
        <span class="matiere-classes-label">Classes:</span>
        <span
          v-for="(c, idx) in matiere.classes"
          :key="c.id"
          class="matiere-classe-tag"
        >{{ c.nom }}<span v-if="idx < matiere.classes.length - 1">,</span></span>
      </div>
    </div>
  </div>
  <p v-else class="no-data">Aucune matière assignée</p>
</template>

<script setup>
import { computed } from 'vue'

/**
 * Liste "Matières Enseignées" d'un enseignant (#G1 décompo — extraite d'EnseignantDetailModal).
 * Présentationnel pur : reçoit le tableau des matières, aucun état interne ni émission.
 */
const props = defineProps({ matieres: { type: Array, default: () => [] } })

const asObjectArray = (value) =>
  Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : []

const numberOrZero = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const safeMatieres = computed(() =>
  asObjectArray(props.matieres).map(matiere => ({
    ...matiere,
    classes: asObjectArray(matiere.classes),
    heures_prevues: numberOrZero(matiere.heures_prevues),
    heures_effectuees: numberOrZero(matiere.heures_effectuees),
    taux_realisation: numberOrZero(matiere.taux_realisation),
    nb_seances_effectuees: numberOrZero(matiere.nb_seances_effectuees),
    nb_seances_total: numberOrZero(matiere.nb_seances_total),
  }))
)
</script>

<style scoped lang="scss">
/* Matières Detail */
.matieres-detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.matiere-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.matiere-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-md);
}

.matiere-detail-name {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.matiere-code {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background: var(--card-bg);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.matiere-detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--card-bg);
  border-radius: var(--radius-md);
}

.matiere-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.matiere-stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.matiere-stat-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.matiere-classes {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  font-size: var(--font-size-sm);
}

.matiere-classes-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.matiere-classe-tag {
  color: var(--text-primary);
}

.no-data {
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

@media (max-width: 768px) {
  .matiere-detail-stats {
    grid-template-columns: 1fr;
  }
}
</style>
