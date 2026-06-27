<template>
  <div class="filters-card">
    <div class="period-tabs">
      <button
        v-for="tab in periodTabs"
        :key="tab.value"
        :class="['period-tab', { active: selectedPeriod === tab.value }]"
        @click="$emit('select-period', tab.value)"
      >
        <i :class="`fa ${tab.icon} tab-icon`"></i>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Custom Date Range -->
    <div v-if="selectedPeriod === 'custom'" class="custom-date-section">
      <div class="date-inputs-row">
        <div class="input-group">
          <label class="input-label">Date début</label>
          <input v-model="customFrom" type="date" class="date-input" />
        </div>
        <div class="input-group">
          <label class="input-label">Date fin</label>
          <input v-model="customTo" type="date" class="date-input" />
        </div>
        <button @click="$emit('apply-custom')" class="btn-primary-action">
          Appliquer
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <span class="search-icon">⌕</span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Rechercher une matière, enseignant, séance..."
          @input="$emit('search')"
        />
        <button v-if="searchQuery" @click="$emit('clear')" class="clear-search-btn">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Filtres (onglets de période + plage personnalisée + recherche) de l'historique
 * des séances (H7) — sous-composant présentationnel extrait de
 * SeanceAttendanceHistory.vue. v-model sur recherche + dates custom ; émet
 * select-period / apply-custom / search (débouncé côté parent) / clear.
 */
defineProps({
  periodTabs: { type: Array, default: () => [] },
  selectedPeriod: { type: String, default: 'week' }
})

const searchQuery = defineModel('searchQuery', { type: String, default: '' })
const customFrom = defineModel('customFrom', { type: String, default: '' })
const customTo = defineModel('customTo', { type: String, default: '' })

defineEmits(['select-period', 'apply-custom', 'search', 'clear'])
</script>

<style scoped>
/* Filters Card */
.filters-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Period Tabs */
.period-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.period-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
}

.period-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: #e5e7eb;
}

.period-tab.active {
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
  border-color: var(--blue-500);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.tab-icon {
  font-size: 1.125rem;
  line-height: 1;
}

/* Custom Date Section */
.custom-date-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.date-inputs-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.input-group {
  flex: 1;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.date-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg, var(--bg-primary));
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-primary-action {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary-action:hover {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Search Section */
.search-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 1.25rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.875rem 3.5rem 0.875rem 3rem;
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background: var(--input-bg, var(--bg-primary));
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-secondary);
  border: none;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 1024px) {
  .period-tabs {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .date-inputs-row {
    flex-direction: column;
  }
}
</style>
