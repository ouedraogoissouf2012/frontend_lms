<template>
  <section v-if="offertes.length" class="compte-actions" aria-label="Actions sur le compte">
    <h3 class="section-title"><i class="fa fa-cog" aria-hidden="true"></i> Actions</h3>
    <div class="compte-actions-boutons">
      <button
        v-for="a in offertes"
        :key="a.cle"
        type="button"
        class="compte-btn"
        :data-action="a.cle"
        :aria-expanded="ouverte === a.cle ? 'true' : 'false'"
        @click="ouverte = ouverte === a.cle ? null : a.cle"
      >
        {{ a.libelle }}
      </button>
    </div>
    <!-- Un seul panneau ouvert, remonté à chaque ligne (clé) : la saisie d'un compte ne passe jamais à un autre. -->
    <component
      :is="a.composant"
      v-for="a in offertes.filter((x) => x.cle === ouverte)"
      :key="`${a.cle}-${ligne._uid ?? ligne.lms_id}`"
      :ligne="ligne"
      @fait="(detail) => $emit('fait', detail)"
      @incertain="$emit('incertain')"
    />
  </section>
</template>

<script setup>
/**
 * Les actions sur un compte de l'annuaire (#656, lot b) : modifier, désactiver, définir le mot de passe. Chacune n'est
 * offerte que si le serveur l'accepterait (`gestionDeCompte`, miroir de `GestionDeCompte::admet` et de
 * `DefinirLeMotDePasseRequest`) ; rien n'est rendu sinon (ligne sans id local, soi-même, rang égal).
 *
 * Émet `fait` (`{ acte }`) sur un succès et `incertain` quand l'acte a pu se faire sans réponse lisible : l'écran
 * décide de relire sa liste.
 */
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { peutGerer, peutDefinirMotDePasse } from '@/utils/gestionDeCompte'
import CompteModification from '@/components/admin/CompteModification.vue'
import CompteDesactivation from '@/components/admin/CompteDesactivation.vue'
import CompteMotDePasse from '@/components/admin/CompteMotDePasse.vue'

const props = defineProps({ ligne: { type: Object, default: null } })
defineEmits(['fait', 'incertain'])

const auth = useAuthStore()
const ouverte = ref(null)

const offertes = computed(() => {
  const acteur = auth.user
  if (!props.ligne || !peutGerer(acteur, props.ligne)) return []
  return [
    { cle: 'modifier', libelle: 'Modifier', composant: CompteModification },
    { cle: 'desactiver', libelle: 'Désactiver', composant: CompteDesactivation },
    ...(peutDefinirMotDePasse(acteur, props.ligne, auth.peutInscrireLocalement)
      ? [{ cle: 'mot-de-passe', libelle: 'Définir le mot de passe', composant: CompteMotDePasse }]
      : []),
  ]
})

// Une autre ligne : aucun panneau ouvert.
watch(() => props.ligne?._uid ?? props.ligne?.lms_id, () => { ouverte.value = null })
</script>

<style scoped lang="scss">
@use '../../assets/styles/compte-formulaire';

.compte-actions {
  display: grid;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.compte-actions h3 {
  margin: 0;
  font-weight: 600;
  color: var(--text-primary);
}

.compte-actions-boutons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
</style>
