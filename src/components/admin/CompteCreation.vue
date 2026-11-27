<template>
  <form class="compte-creation" novalidate @submit.prevent="creer">
    <h2>Nouvel utilisateur</h2>
    <p class="creation-aide">
      Le compte naît dans votre établissement, avec un mot de passe initial : transmettez à la personne son courriel et
      ce mot de passe.
    </p>
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="creation-erreur" role="alert">{{ erreur }}</p>
    <p class="creation-annonce" role="status" aria-live="polite">{{ annonce }}</p>

    <div v-for="c in CHAMPS" :key="c.nom" class="creation-champ">
      <label :for="id(c.nom)">{{ c.etiquette }}</label>
      <select
        v-if="c.nom === 'role'"
        :id="id(c.nom)"
        v-model="saisie.role"
        data-champ="role"
        aria-required="true"
        :aria-invalid="erreurs.role ? 'true' : 'false'"
        :aria-describedby="decrit(c)"
      >
        <option value="" disabled>Choisir un rôle</option>
        <option v-for="r in roles" :key="r" :value="r">{{ getRoleDisplayName(r) }}</option>
      </select>
      <input
        v-else
        :id="id(c.nom)"
        v-model="saisie[c.nom]"
        :data-champ="c.nom"
        :type="c.type"
        :maxlength="c.max"
        :autocomplete="c.autocomplete"
        aria-required="true"
        :aria-invalid="erreurs[c.nom] ? 'true' : 'false'"
        :aria-describedby="decrit(c)"
      >
      <p v-if="c.aide" :id="`${id(c.nom)}-aide`" class="creation-aide">{{ c.aide }}</p>
      <p :id="`${id(c.nom)}-erreur`" class="creation-champ-erreur">{{ erreurs[c.nom] }}</p>
    </div>

    <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
    <button type="submit" class="creation-btn" :aria-disabled="occupe ? 'true' : 'false'">{{ BOUTON }}</button>
  </form>
</template>

<script setup>
/**
 * « Nouvel utilisateur » (#648) : l'admin d'une école autonome crée un compte, `POST /users`. La logique vit dans
 * useCompteCreation. Les rôles offerts sont ceux que l'acteur peut attribuer (rolesAttribuables, miroir de la règle
 * serveur). Émet `cree` (le compte relu du serveur) et `incertain` (la création a pu se faire sans réponse lisible) :
 * dans les deux cas, l'écran relit sa liste.
 */
import { computed, useId } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getRoleDisplayName } from '@/constants/roles'
import { rolesAttribuables } from '@/utils/rolesAttribuables'
import { useCompteCreation } from '@/composables/useCompteCreation'

const emit = defineEmits(['cree', 'incertain'])

// Les bornes sont celles de CreateUserRequest. Les libellés sont recopiés par l'outil E2E (parcours-creation-compte).
const CHAMPS = Object.freeze([
  { nom: 'nom', etiquette: 'Nom complet', type: 'text', max: 255, autocomplete: 'off' },
  { nom: 'courriel', etiquette: 'Courriel', type: 'email', max: 255, autocomplete: 'off' },
  { nom: 'role', etiquette: 'Rôle' },
  { nom: 'motDePasse', etiquette: 'Mot de passe initial', type: 'password', autocomplete: 'new-password', aide: '8 caractères au moins.' },
  { nom: 'confirmation', etiquette: 'Confirmer le mot de passe', type: 'password', autocomplete: 'new-password' },
])

const BOUTON = 'Créer le compte'

const auth = useAuthStore()
const roles = computed(() => rolesAttribuables(auth.user?.role))

// Un id utilisable en sélecteur CSS, quel que soit le préfixe de useId.
const base = `compte-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`
const decrit = (c) => [c.aide ? `${id(c.nom)}-aide` : null, `${id(c.nom)}-erreur`].filter(Boolean).join(' ')

const { saisie, erreurs, erreur, annonce, occupe, creer } = useCompteCreation({
  roles,
  onCree: (compte) => emit('cree', compte),
  onIncertain: () => emit('incertain'),
})
</script>

<style scoped>
.compte-creation {
  display: grid;
  gap: var(--spacing-sm);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.compte-creation h2 {
  margin: 0;
  color: var(--text-primary);
}

.creation-erreur,
.creation-annonce,
.creation-champ-erreur,
.creation-aide {
  margin: 0;
}

.creation-erreur,
.creation-champ-erreur {
  color: var(--color-danger, var(--text-primary));
}

.creation-annonce {
  color: var(--text-primary);
}

.creation-aide {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.creation-champ {
  display: grid;
  gap: var(--spacing-sm);
}

.creation-champ label {
  font-weight: 600;
  color: var(--text-primary);
}

.creation-champ input,
.creation-champ select {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.creation-btn {
  justify-self: start;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.creation-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
