<template>
  <form class="programme-rattachement" novalidate @submit.prevent="rattacher">
    <h3>Rattacher une matière</h3>
    <p class="programme-aide">
      Rattacher une matière déjà au programme remplace son enseignant.
    </p>
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="programme-erreur" role="alert">{{ erreur }}</p>
    <p class="programme-annonce" role="status" aria-live="polite">{{ annonce }}</p>

    <div class="programme-champs">
      <div class="programme-champ">
        <label :for="id('matiere')">{{ ETIQUETTE_MATIERE }}</label>
        <select
          :id="id('matiere')"
          v-model="saisie.matiere"
          data-champ="matiere"
          aria-required="true"
          :aria-invalid="erreurs.matiere ? 'true' : 'false'"
          :aria-describedby="`${id('matiere')}-erreur`"
        >
          <option value="" disabled>Choisir une matière</option>
          <option v-for="m in matieres" :key="m.id" :value="m.id">{{ m.nom }}</option>
        </select>
        <p :id="`${id('matiere')}-erreur`" class="programme-champ-erreur">{{ erreurs.matiere }}</p>
      </div>

      <div class="programme-champ">
        <label :for="id('enseignant')">{{ ETIQUETTE_ENSEIGNANT }}</label>
        <select
          :id="id('enseignant')"
          v-model="saisie.enseignant"
          data-champ="enseignant"
          :aria-invalid="erreurs.enseignant ? 'true' : 'false'"
          :aria-describedby="`${id('enseignant')}-erreur`"
        >
          <option value="">Sans enseignant</option>
          <option v-for="e in enseignants" :key="e.id" :value="e.id">{{ e.nom }}</option>
        </select>
        <p :id="`${id('enseignant')}-erreur`" class="programme-champ-erreur">{{ erreurs.enseignant }}</p>
      </div>
    </div>

    <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
    <button type="submit" class="programme-btn" :aria-disabled="occupe ? 'true' : 'false'">{{ BOUTON }}</button>
  </form>
</template>

<script setup>
/**
 * « Rattacher une matière » (#654) : compose le programme d'une classe, `POST /classes/{classe}/matieres`. La logique
 * vit dans useProgrammeRattachement. Émet `rattachee` et `incertaine` : dans les deux cas, la fiche est relue. Les
 * libellés sont recopiés par l'outil E2E (e2e/parcours-catalogue.mjs).
 */
import { useId } from 'vue'
import { useProgrammeRattachement } from '@/composables/useProgrammeRattachement'

const props = defineProps({
  classeId: { type: Number, required: true },
  // Le programme affiché par la fiche : sert à dire « enseignant remplacé » plutôt que « rattachée ».
  programme: { type: Array, default: () => [] },
})
const emit = defineEmits(['rattachee', 'incertaine'])

const ETIQUETTE_MATIERE = 'Matière'
const ETIQUETTE_ENSEIGNANT = 'Enseignant'
const BOUTON = 'Rattacher'

// Un id utilisable en sélecteur CSS, quel que soit le préfixe de useId.
const base = `programme-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`

const { matieres, enseignants, saisie, erreurs, erreur, annonce, occupe, rattacher } = useProgrammeRattachement({
  classeId: () => props.classeId,
  programme: () => props.programme,
  onRattachee: () => emit('rattachee'),
  onIncertaine: () => emit('incertaine'),
})
</script>

<style scoped>
.programme-rattachement {
  display: grid;
  gap: var(--spacing-sm);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.programme-rattachement h3 {
  margin: 0;
  color: var(--text-primary);
}

.programme-aide,
.programme-erreur,
.programme-annonce,
.programme-champ-erreur {
  margin: 0;
}

.programme-aide {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.programme-erreur,
.programme-champ-erreur {
  color: var(--color-danger, var(--text-primary));
}

.programme-annonce {
  color: var(--text-primary);
}

.programme-champs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--spacing-md);
}

.programme-champ {
  display: grid;
  gap: var(--spacing-sm);
}

.programme-champ label {
  font-weight: 600;
  color: var(--text-primary);
}

.programme-champ select {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.programme-btn {
  justify-self: start;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.programme-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
