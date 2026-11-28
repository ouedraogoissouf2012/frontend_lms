<template>
  <span v-if="libelle" class="seance-type-badge">{{ libelle }}</span>
</template>

<script setup>
/**
 * #675 (lms_backend#1668) : le type d'une séance, sur les cartes des trois écrans. Une séance sans type (ou d'un
 * type hors de la liste) n'affiche rien : l'écran n'invente pas de type.
 */
import { computed } from 'vue'
import { libelleDuType } from '@/constants/typesDeSeance'

const props = defineProps({
  type: { type: String, default: null },
})
const libelle = computed(() => libelleDuType(props.type))
</script>

<style scoped>
.seance-type-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}
</style>
