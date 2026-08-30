<template>
  <div class="filters-section">
    <div class="search-box">
      <i class="fa fa-search search-icon"></i>
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher par nom, email ou matricule…"
        class="search-input"
      />
    </div>
    <div class="filter-group">
      <select v-model="role" class="filter-select">
        <option value="all">Tous les rôles</option>
        <option :value="ROLES.ETUDIANT">Étudiants</option>
        <option :value="ROLES.ENSEIGNANT">Enseignants</option>
      </select>
      <select v-model="classe" class="filter-select">
        <option value="all">Toutes les classes</option>
        <option v-for="c in classes" :key="c.id" :value="c.id">{{ classeLabel(c) }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de filtres d'AdminUsers (#G1 ≤300). Recherche + rôle + classe en v-model
 * (defineModel) ; la liste des classes est une prop. Aucun appel API.
 */
import { classeLabel } from '@/utils/classes'
import { ROLES } from '@/constants/roles'

const search = defineModel('search', { type: String, default: '' })
const role = defineModel('role', { type: String, default: 'all' })
const classe = defineModel('classe', { default: 'all' })

defineProps({
  classes: { type: Array, default: () => [] },
})
</script>

<style scoped lang="scss">
.filters-section {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 0.9rem;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: var(--font-size-md);
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.filter-group {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-select {
  padding: 10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }
}
</style>
