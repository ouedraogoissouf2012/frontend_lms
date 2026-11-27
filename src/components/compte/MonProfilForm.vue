<template>
  <form class="mon-profil" novalidate @submit.prevent="enregistrer">
    <h2>Mon profil</h2>
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="compte-erreur" role="alert">{{ erreur }}</p>
    <p class="compte-annonce" role="status" aria-live="polite">{{ annonce }}</p>

    <div v-for="c in CHAMPS" :key="c.nom" class="compte-champ">
      <label :for="id(c.nom)">{{ c.etiquette }}</label>
      <input
        :id="id(c.nom)"
        v-model="saisie[c.nom]"
        :data-champ="c.nom"
        :type="c.type"
        :maxlength="c.max"
        :autocomplete="c.autocomplete"
        :aria-required="c.exige ? 'true' : undefined"
        :aria-invalid="erreurs[c.nom] ? 'true' : 'false'"
        :aria-describedby="`${id(c.nom)}-erreur`"
      >
      <p :id="`${id(c.nom)}-erreur`" class="compte-champ-erreur">{{ erreurs[c.nom] }}</p>
    </div>

    <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
    <button type="submit" class="compte-btn" :aria-disabled="occupe ? 'true' : 'false'">{{ BOUTON }}</button>
  </form>
</template>

<script setup>
/**
 * « Mon profil » (#674), partagé par les trois espaces : le nom affiché et le téléphone, `PATCH /auth/me`. La logique
 * vit dans useMonProfil. Le courriel, identifiant de connexion, ne se modifie pas ici.
 */
import { useId } from 'vue'
import { useMonProfil } from '@/composables/useMonProfil'

// Les bornes sont celles du serveur (lms_backend#1667).
const CHAMPS = Object.freeze([
  { nom: 'nom', etiquette: 'Nom affiché', type: 'text', max: 255, autocomplete: 'name', exige: true },
  { nom: 'telephone', etiquette: 'Téléphone (facultatif)', type: 'tel', max: 40, autocomplete: 'tel' },
])
const BOUTON = 'Enregistrer mon profil'

// Un id utilisable en sélecteur CSS, quel que soit le préfixe de useId.
const base = `profil-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`

const { saisie, erreurs, erreur, annonce, occupe, enregistrer } = useMonProfil()
</script>

<style scoped>
.mon-profil {
  display: grid;
  gap: var(--spacing-sm);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.mon-profil h2 {
  margin: 0;
  color: var(--text-primary);
}

.compte-erreur,
.compte-annonce,
.compte-champ-erreur {
  margin: 0;
}

.compte-erreur,
.compte-champ-erreur {
  color: var(--color-danger, var(--text-primary));
}

.compte-annonce {
  color: var(--text-primary);
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

.compte-btn {
  justify-self: start;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.compte-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
