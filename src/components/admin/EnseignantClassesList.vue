<template>
  <div v-if="classes.length > 0" class="classes-detail-list">
    <div
      v-for="classe in classes"
      :key="classe.id"
      class="classe-detail-card"
    >
      <div class="classe-detail-name">{{ classe.nom || 'Classe sans nom' }}</div>
      <div v-if="classe.filiere || classe.niveau" class="classe-detail-info">
        <span v-if="classe.filiere" class="badge badge-filiere">{{ classe.filiere }}</span>
        <span v-if="classe.niveau" class="badge badge-niveau">{{ classe.niveau }}</span>
      </div>
    </div>
  </div>
  <p v-else class="no-data">Aucune classe assignée</p>
</template>

<script setup>
/**
 * Liste "Classes Assignées" d'un enseignant (#G1 décompo — extraite d'EnseignantDetailModal).
 * Présentationnel pur : reçoit les classes uniques déjà calculées, aucun état ni émission.
 */
defineProps({ classes: { type: Array, default: () => [] } })
</script>

<style scoped lang="scss">
/* Classes Detail */
.classes-detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.classe-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.classe-detail-name {
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.classe-detail-info {
  display: flex;
  gap: var(--spacing-xs);
}

.badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.badge-filiere {
  background: var(--info-bg);
  color: var(--info-text);
}

.badge-niveau {
  background: var(--warning-bg);
  color: var(--amber-800);
}

.no-data {
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

@media (max-width: 768px) {
  .classe-detail-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
