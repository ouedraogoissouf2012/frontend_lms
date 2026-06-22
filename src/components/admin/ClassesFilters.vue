<template>
  <div class="filters-card">
    <div class="filters-grid">
      <div class="filter-item">
        <label class="filter-label">
          <i class="fa fa-home filter-icon"></i>
          Filière
        </label>
        <select v-model="filiereId" @change="$emit('apply')" class="filter-select">
          <option value="">Toutes les filières</option>
          <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
            {{ filiere.name || filiere.nom }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <label class="filter-label">
          <i class="fa fa-bars filter-icon"></i>
          Niveau
        </label>
        <select v-model="niveauId" @change="$emit('apply')" class="filter-select">
          <option value="">Tous les niveaux</option>
          <option v-for="niveau in niveaux" :key="niveau.id" :value="niveau.id">
            {{ niveau.name || niveau.nom }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <label class="filter-label">
          <i class="fa fa-check filter-icon"></i>
          Statut
        </label>
        <select v-model="statut" @change="$emit('apply')" class="filter-select">
          <option value="">Tous</option>
          <option value="active">Actives</option>
          <option value="inactive">Inactives</option>
        </select>
      </div>

      <div class="filter-actions">
        <button
          v-if="filiereId || niveauId || statut"
          @click="$emit('reset')"
          class="btn-reset"
          title="Réinitialiser tous les filtres"
        >
          <ArrowPathIcon class="w-4 h-4" />
          Réinitialiser
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de filtres d'AdminClasses (#G1 ≤300). Filière / niveau / statut en v-model
 * (defineModel) ; listes filieres/niveaux en props. Émet apply (au changement) et
 * reset. Aucun appel API.
 *
 * NB parité : <ArrowPathIcon> n'était PAS importé dans AdminClasses.vue d'origine
 * (ni globalement enregistré) → composant non résolu, rendu vide sans icône. On
 * conserve ce comportement à l'identique (bug préexistant tracé, non « corrigé »).
 */
const filiereId = defineModel('filiereId', { default: '' })
const niveauId = defineModel('niveauId', { default: '' })
const statut = defineModel('statut', { type: String, default: '' })

defineProps({
  filieres: { type: Array, default: () => [] },
  niveaux: { type: Array, default: () => [] }
})

defineEmits(['apply', 'reset'])
</script>

<style scoped>
/* Widget card (Filters) */
.filters-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-icon {
  font-size: 1rem;
  line-height: 1;
}

.filter-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--primary-color);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.btn-reset:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
