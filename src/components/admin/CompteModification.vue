<template>
  <form class="compte-form" data-form="modifier" novalidate @submit.prevent="modifier">
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="compte-erreur" role="alert">{{ erreur }}</p>
    <CompteChamp v-model="saisie.nom" nom="nom" etiquette="Nom complet" :max="255" :erreur="erreurs.nom" />
    <CompteChamp v-model="saisie.courriel" nom="courriel" etiquette="Courriel" type="email" :max="255" :erreur="erreurs.courriel" />
    <CompteChamp v-model="saisie.role" nom="role" etiquette="Rôle" :options="optionsDeRole" :erreur="erreurs.role" />
    <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
    <button type="submit" class="compte-btn" :aria-disabled="occupe ? 'true' : 'false'">Enregistrer les modifications</button>
  </form>
</template>

<script setup>
/**
 * Modifier un compte (#656 b), `PUT /users/{user}`. La logique vit dans `useCompteModification` : seuls les champs
 * changés partent. Les rôles offerts sont ceux que l'acteur peut attribuer (`rolesAttribuables`, miroir
 * d'`AssignableRole`). Le rôle actuel s'affiche même s'il n'est pas offert, sans pouvoir être choisi. Émet `fait` et
 * `incertain`.
 */
import { computed, toRef } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getRoleDisplayName } from '@/constants/roles'
import { rolesAttribuables } from '@/utils/rolesAttribuables'
import { useCompteModification } from '@/composables/useCompteActes'
import CompteChamp from '@/components/admin/CompteChamp.vue'

const props = defineProps({ ligne: { type: Object, required: true } })
const emit = defineEmits(['fait', 'incertain'])

const auth = useAuthStore()
const roles = computed(() => rolesAttribuables(auth.user?.role))

const { saisie, erreurs, erreur, occupe, modifier } = useCompteModification({
  ligne: toRef(props, 'ligne'),
  roles,
  onFait: (detail) => emit('fait', detail),
  onIncertain: () => emit('incertain'),
})

const actuel = props.ligne.role_brut ?? ''
const optionsDeRole = computed(() => [
  ...(roles.value.includes(actuel) ? [] : [{ valeur: actuel, libelle: getRoleDisplayName(actuel), desactive: true }]),
  ...roles.value.map((r) => ({ valeur: r, libelle: getRoleDisplayName(r) })),
])
</script>

<style scoped lang="scss">
@use '../../assets/styles/compte-formulaire';
</style>
