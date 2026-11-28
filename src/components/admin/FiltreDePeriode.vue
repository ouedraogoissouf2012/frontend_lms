<template>
  <label v-if="periodes.length" class="filtre-periode">
    <span class="filtre-periode-libelle">Période</span>
    <select :value="modelValue" name="periode" class="filtre-periode-choix" @change="choisir($event.target.value)">
      <option :value="TOUTES">Toutes les périodes</option>
      <option v-for="p in periodes" :key="p.id" :value="String(p.id)">
        {{ p.en_cours ? `${p.libelle} (en cours)` : p.libelle }}
      </option>
    </select>
  </label>
</template>

<script setup>
/**
 * Le sélecteur de période des écrans Classes et Séances (#707). Caché sans période ; la valeur est l'id de la période,
 * ou `TOUTES`. La logique (défaut = période en cours) vit dans `useFiltreDePeriode`.
 */
import { TOUTES } from '@/composables/useFiltreDePeriode'

defineProps({
  periodes: { type: Array, default: () => [] },
  modelValue: { type: [Number, String], default: TOUTES },
})
const emit = defineEmits(['update:modelValue'])

function choisir(valeur) {
  emit('update:modelValue', valeur === TOUTES ? TOUTES : Number(valeur))
}
</script>

<style scoped>
.filtre-periode {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.filtre-periode-libelle {
  font-weight: 600;
}

.filtre-periode-choix {
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}
</style>
