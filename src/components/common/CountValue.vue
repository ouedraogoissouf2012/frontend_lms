<template>
  <!-- Non mesuré : « — » à l'œil, « non disponible » au lecteur d'écran (modèle : aperçu du Hub, #471). -->
  <span :aria-hidden="mesure ? null : 'true'">{{ formatCount(value) }}</span>
  <span v-if="!mesure" class="sr-only">non disponible</span>
</template>

<script setup>
/**
 * Un compteur qui ne se fabrique pas : un nombre mesuré s'affiche tel quel (0
 * compris) ; `null` — source refusée ou jamais chargée — s'affiche « — » et se lit
 * « non disponible ». Jamais un 0 inventé sous un refus.
 */
import { computed } from 'vue'
import { formatCount } from '@/utils/formatters'

const props = defineProps({
  value: { type: [Number, String], default: null },
})

const mesure = computed(() => Boolean(props.value))
</script>
