<template>
  <div class="filtres">
    <div class="filtre">
      <label :for="id('statut')">Statut</label>
      <select :id="id('statut')" data-champ="statut" :value="statut" @change="$emit('update:statut', $event.target.value)">
        <option value="active">Actives</option>
        <option value="archivee">Archivées</option>
        <option value="">Toutes</option>
      </select>
    </div>
    <div class="filtre">
      <label :for="id('places')">Places</label>
      <select :id="id('places')" data-champ="places" :value="places" @change="$emit('update:places', $event.target.value)">
        <option value="">Toutes</option>
        <option value="disponibles">Places disponibles</option>
        <option value="pleine">Complètes</option>
      </select>
    </div>
  </div>
</template>

<script setup>
/**
 * Les filtres de la liste des classes locales (#659, lms_backend#1652) : `statut` (actives par défaut) et `places`.
 * Présentation pure, en `v-model:statut` / `v-model:places` ; l'écran relit la liste à chaque choix.
 */
import { useId } from 'vue'

defineProps({
  statut: { type: String, default: 'active' },
  places: { type: String, default: '' },
})

defineEmits(['update:statut', 'update:places'])

const base = `classes-filtres-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`
</script>

<style scoped>
.filtres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.filtre {
  display: grid;
  gap: var(--spacing-sm);
}

.filtre label {
  font-weight: 600;
  color: var(--text-primary);
}

.filtre select {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}
</style>
