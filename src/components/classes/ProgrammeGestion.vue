<template>
  <div class="programme-gestion">
    <ProgrammeRattachement
      :classe-id="classeId"
      :programme="programme"
      @rattachee="$emit('relire')"
      @incertaine="$emit('relire')"
    />
    <ProgrammeEdition
      v-if="programme.length"
      :classe-id="classeId"
      :programme="programme"
      @fait="$emit('relire')"
      @incertaine="$emit('relire')"
    />
  </div>
</template>

<script setup>
/**
 * Gérer le programme d'une classe dans une école qui tient son catalogue : rattacher une matière (#654), puis modifier
 * ou retirer une matière du programme (#660). Regroupés ici pour que la fiche de classe n'en porte qu'un seul bloc.
 * Émet `relire` après toute écriture, faite ou incertaine : la fiche relit son programme.
 */
import ProgrammeEdition from '@/components/classes/ProgrammeEdition.vue'
import ProgrammeRattachement from '@/components/classes/ProgrammeRattachement.vue'

defineProps({
  classeId: { type: Number, required: true },
  programme: { type: Array, default: () => [] },
})

defineEmits(['relire'])
</script>
