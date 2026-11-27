<template>
  <form class="compte-form" data-form="mot-de-passe" novalidate @submit.prevent="definir">
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="compte-erreur" role="alert">{{ erreur }}</p>
    <p class="compte-annonce" role="status" aria-live="polite">{{ annonce }}</p>
    <CompteChamp
      v-model="saisie.motDePasse"
      nom="motDePasse"
      etiquette="Nouveau mot de passe"
      type="password"
      autocomplete="new-password"
      aide="8 caractères au moins. Les sessions ouvertes de la personne seront fermées."
      :erreur="erreurs.motDePasse"
    />
    <CompteChamp
      v-model="saisie.confirmation"
      nom="confirmation"
      etiquette="Confirmer le mot de passe"
      type="password"
      autocomplete="new-password"
      :erreur="erreurs.confirmation"
    />
    <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
    <button type="submit" class="compte-btn" :aria-disabled="occupe ? 'true' : 'false'">Définir le mot de passe</button>
  </form>
</template>

<script setup>
/**
 * Définir le mot de passe d'un compte (#656 b), `PUT /users/{user}/password` (lms#1275) : admin d'une école qui tient
 * ses comptes. La logique vit dans `useCompteMotDePasse` ; la saisie ne reste jamais à l'écran. Émet `fait` et
 * `incertain`.
 */
import { toRef } from 'vue'
import { useCompteMotDePasse } from '@/composables/useCompteActes'
import CompteChamp from '@/components/admin/CompteChamp.vue'

const props = defineProps({ ligne: { type: Object, required: true } })
const emit = defineEmits(['fait', 'incertain'])

const { saisie, erreurs, erreur, annonce, occupe, definir } = useCompteMotDePasse({
  ligne: toRef(props, 'ligne'),
  onFait: (detail) => emit('fait', detail),
  onIncertain: () => emit('incertain'),
})
</script>

<style scoped lang="scss">
@use '../../assets/styles/compte-formulaire';
</style>
