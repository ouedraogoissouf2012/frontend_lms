<template>
  <div />
</template>

<script setup>
/** #659 : squelette du commit de tests seuls ; le transfert arrive avec le correctif. */
defineProps({
  classeId: { type: Number, required: true },
  etudiants: { type: Array, default: () => [] },
})
</script>
