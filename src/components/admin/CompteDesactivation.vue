<template>
  <div class="compte-form" data-form="desactiver">
    <p class="compte-erreur" role="alert">{{ erreur }}</p>
    <p class="compte-explication">
      Désactiver le compte de « {{ ligne.name }} » ? La personne ne pourra plus se connecter et ses sessions ouvertes
      sont fermées. Son dossier (notes, copies, présences) est conservé.
    </p>
    <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
    <button
      type="button"
      class="compte-btn compte-btn-danger"
      data-confirmer="desactiver"
      :aria-disabled="occupe ? 'true' : 'false'"
      @click="desactiver"
    >
      Confirmer la désactivation
    </button>
  </div>
</template>

<script setup>
/**
 * Désactiver un compte (#656 b), `DELETE /users/{user}` : suppression LOGIQUE (lms#1728), dossier conservé, sessions
 * fermées. Ce panneau EST la confirmation : il dit ce que fait l'acte avant de l'envoyer. Émet `fait` et `incertain`.
 */
import { toRef } from 'vue'
import { useCompteDesactivation } from '@/composables/useCompteActes'

const props = defineProps({ ligne: { type: Object, required: true } })
const emit = defineEmits(['fait', 'incertain'])

const { erreur, occupe, desactiver } = useCompteDesactivation({
  ligne: toRef(props, 'ligne'),
  onFait: (detail) => emit('fait', detail),
  onIncertain: () => emit('incertain'),
})
</script>

<style scoped lang="scss">
@use '../../assets/styles/compte-formulaire';
</style>
