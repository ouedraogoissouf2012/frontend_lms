<template>
  <div class="filters-card">
    <div class="filters-grid">
      <div class="filter-item">
        <label class="filter-label">Matière</label>
        <select v-model="matiereId" @change="$emit('apply')" class="filter-select">
          <option value="">Toutes les matières</option>
          <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
            {{ matiere.name || matiere.nom }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <label class="filter-label">Statut</label>
        <select v-model="status" @change="$emit('apply')" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="published">Publiée</option>
          <option value="draft">Brouillon</option>
          <option value="archived">Archivée</option>
        </select>
      </div>

      <div class="filter-item">
        <label class="filter-label">Type</label>
        <select v-model="type" @change="$emit('apply')" class="filter-select">
          <option value="">Tous les types</option>
          <option value="video">Vidéo</option>
          <option value="document">Document</option>
          <option value="quiz">Quiz</option>
          <option value="tp">TP</option>
          <option value="td">TD</option>
        </select>
      </div>

      <div class="filter-item">
        <button @click="$emit('reset')" class="btn-reset">
          Réinitialiser
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Filtres des leçons enseignant (#H4 ≤300) : matière / statut / type en v-model
 * (defineModel) ; liste des matières en prop. `apply` (log) et `reset` relayés au parent.
 */
const matiereId = defineModel('matiereId', { default: '' })
const status = defineModel('status', { type: String, default: '' })
const type = defineModel('type', { type: String, default: '' })

defineProps({
  matieres: { type: Array, default: () => [] }
})

defineEmits(['apply', 'reset'])
</script>

<style scoped>
/* Filtres */
.filters-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.btn-reset {
  margin-top: 1.75rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--bg-tertiary);
}

/* Responsive */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
