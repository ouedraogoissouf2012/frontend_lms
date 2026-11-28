<template>
  <Modal v-model="ouverte" title="Changer mon mot de passe">
    <form class="mon-mot-de-passe" novalidate @submit.prevent="changer">
      <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
      <p class="compte-erreur" role="alert">{{ erreur }}</p>
      <p class="compte-annonce" role="status" aria-live="polite">{{ annonce }}</p>

      <div v-for="c in CHAMPS" :key="c.nom" class="compte-champ">
        <label :for="id(c.nom)">{{ c.etiquette }}</label>
        <input
          :id="id(c.nom)"
          v-model="saisie[c.nom]"
          :data-champ="c.nom"
          type="password"
          :autocomplete="c.autocomplete"
          aria-required="true"
          :aria-invalid="erreurs[c.nom] ? 'true' : 'false'"
          :aria-describedby="decrit(c)"
        >
        <p v-if="c.aide" :id="`${id(c.nom)}-aide`" class="compte-aide">{{ c.aide }}</p>
        <p :id="`${id(c.nom)}-erreur`" class="compte-champ-erreur">{{ erreurs[c.nom] }}</p>
      </div>

      <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
      <button type="submit" class="compte-btn" :aria-disabled="occupe ? 'true' : 'false'">{{ BOUTON }}</button>
    </form>

    <template #footer>
      <button type="button" class="compte-btn-secondaire" @click="ouverte = false">Fermer</button>
    </template>
  </Modal>
</template>

<script setup>
/**
 * « Changer mon mot de passe » (#674), partagée par les trois espaces (admin, enseignant, élève). La logique vit dans
 * useMonMotDePasse : `PUT /auth/me/password`. Après un changement, les AUTRES sessions du compte sont fermées par le
 * serveur ; celle-ci reste ouverte, et l'annonce le dit.
 */
import { computed, useId } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import { useMonMotDePasse } from '@/composables/useMonMotDePasse'

const props = defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['update:show'])

const ouverte = computed({ get: () => props.show, set: (v) => emit('update:show', v) })

const CHAMPS = Object.freeze([
  { nom: 'actuel', etiquette: 'Mot de passe actuel', autocomplete: 'current-password' },
  { nom: 'nouveau', etiquette: 'Nouveau mot de passe', autocomplete: 'new-password', aide: '8 caractères au moins, différent de l’actuel.' },
  { nom: 'confirmation', etiquette: 'Confirmer le nouveau mot de passe', autocomplete: 'new-password' },
])
const BOUTON = 'Changer le mot de passe'

// Un id utilisable en sélecteur CSS, quel que soit le préfixe de useId.
const base = `mdp-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`
const decrit = (c) => [c.aide ? `${id(c.nom)}-aide` : null, `${id(c.nom)}-erreur`].filter(Boolean).join(' ')

const { saisie, erreurs, erreur, annonce, occupe, changer } = useMonMotDePasse()
</script>

<style scoped>
.mon-mot-de-passe {
  display: grid;
  gap: var(--spacing-sm);
}

.compte-erreur,
.compte-annonce,
.compte-champ-erreur,
.compte-aide {
  margin: 0;
}

.compte-erreur,
.compte-champ-erreur {
  color: var(--color-danger, var(--text-primary));
}

.compte-annonce {
  color: var(--text-primary);
}

.compte-aide {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.compte-champ {
  display: grid;
  gap: var(--spacing-xs);
}

.compte-champ label {
  font-weight: 600;
  color: var(--text-primary);
}

.compte-champ input {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.compte-btn,
.compte-btn-secondaire {
  justify-self: start;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}

.compte-btn {
  border: 1px solid var(--color-info-strong);
  background: var(--color-info-strong);
  color: var(--white);
}

.compte-btn-secondaire {
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.compte-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
