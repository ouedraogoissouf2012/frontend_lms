<template>
  <div class="filters-section">
    <div class="filter-group">
      <label class="filter-label"><i class="mdi mdi-magnify"></i> Recherche:</label>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher une matière ou évaluation..."
        class="filter-input"
      />
    </div>

    <div class="filter-group">
      <label class="filter-label"><i class="mdi mdi-folder-outline"></i> Type:</label>
      <select v-model="filterType" class="filter-select">
        <option value="">Tous les types</option>
        <option value="qcm">QCM</option>
        <option value="devoir">Devoir</option>
        <option value="composition">Composition</option>
        <option value="examen">Examen</option>
        <option value="tp">TP</option>
        <option value="td">TD</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label"><i class="mdi mdi-school-outline"></i> Matière:</label>
      <select v-model="filterMatiere" class="filter-select">
        <option value="">Toutes les matières</option>
        <option v-for="matiere in matieres" :key="matiere.matiere_id" :value="matiere.matiere_id">
          {{ matiere.matiere_nom }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label"><i class="mdi mdi-sort"></i> Trier par:</label>
      <select v-model="sortBy" class="filter-select">
        <option value="date-desc">Date (plus récent)</option>
        <option value="date-asc">Date (plus ancien)</option>
        <option value="note-desc">Note (meilleure)</option>
        <option value="note-asc">Note (moins bonne)</option>
        <option value="matiere">Matière (A-Z)</option>
      </select>
    </div>

    <button class="btn-export" @click="$emit('export')" title="Télécharger mes notes en PDF">
      <i class="mdi mdi-file-pdf-box"></i> Exporter PDF
    </button>
  </div>
</template>

<script setup>
/**
 * Barre de filtres des notes élève (#H10 ≤300). Recherche + type + matière + tri
 * en v-model (defineModel) ; la liste des matières est une prop. L'export PDF est
 * délégué au parent via l'évènement `export`. Aucun appel API.
 */
const searchQuery = defineModel('searchQuery', { type: String, default: '' })
const filterType = defineModel('filterType', { type: String, default: '' })
const filterMatiere = defineModel('filterMatiere', { default: '' })
const sortBy = defineModel('sortBy', { type: String, default: 'date-desc' })

defineProps({
  matieres: { type: Array, default: () => [] },
})

defineEmits(['export'])
</script>

<style scoped>
/* Filters Section */
.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 180px;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
}

.btn-export {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-export:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }
}

/* Print styles */
@media print {
  .filters-section,
  .btn-export {
    display: none !important;
  }
}
</style>
