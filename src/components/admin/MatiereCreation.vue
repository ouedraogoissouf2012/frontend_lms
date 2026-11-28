<template>
  <form class="matiere-creation" novalidate @submit.prevent="creer">
    <h2>Nouvelle matière</h2>
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="creation-erreur" role="alert">{{ erreur }}</p>
    <p class="creation-annonce" role="status" aria-live="polite">{{ annonce }}</p>

    <div v-for="c in CHAMPS" :key="c.nom" class="creation-champ">
      <label :for="id(c.nom)">{{ c.etiquette }}</label>
      <textarea
        v-if="c.nom === 'description'"
        :id="id(c.nom)"
        v-model="saisie[c.nom]"
        :data-champ="c.nom"
        :maxlength="c.max"
        rows="2"
        :aria-invalid="erreurs[c.nom] ? 'true' : 'false'"
        :aria-describedby="decrit(c)"
      />
      <input
        v-else
        :id="id(c.nom)"
        v-model="saisie[c.nom]"
        :data-champ="c.nom"
        type="text"
        :inputmode="c.entier ? 'numeric' : undefined"
        :maxlength="c.max"
        autocomplete="off"
        :aria-required="c.exige ? 'true' : undefined"
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
 * « Nouvelle matière » (#654) : crée une matière de l'école, `POST /matieres`. La logique vit dans useMatiereCreation.
 * Émet `creee` (la matière relue du serveur) et `incertaine` (la création a pu se faire sans réponse lisible) : dans les
 * deux cas, l'écran relit sa liste. Les libellés sont recopiés par l'outil E2E (e2e/parcours-catalogue.mjs).
 */
import { useId } from 'vue'
import { CHAMPS_DU_FORMULAIRE as CHAMPS, useMatiereCreation } from '@/composables/useMatiereCreation'

const emit = defineEmits(['creee', 'incertaine'])

const BOUTON = 'Créer la matière'

// Un id utilisable en sélecteur CSS, quel que soit le préfixe de useId.
const base = `matiere-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`
const decrit = (c) => [c.aide ? `${id(c.nom)}-aide` : null, `${id(c.nom)}-erreur`].filter(Boolean).join(' ')

const { saisie, erreurs, erreur, annonce, occupe, creer } = useMatiereCreation({
  onCreee: (matiere) => emit('creee', matiere),
  onIncertaine: () => emit('incertaine'),
})
</script>

<style scoped>
.matiere-creation {
  display: grid;
  gap: var(--spacing-sm);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.matiere-creation h2 {
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
.creation-champ textarea {
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
