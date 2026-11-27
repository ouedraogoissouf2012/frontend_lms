<template>
  <form class="programme-edition" novalidate @submit.prevent="enregistrer">
    <h3>Modifier ou retirer une matière du programme</h3>
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="edition-erreur" role="alert">{{ erreur }}</p>
    <p class="edition-annonce" role="status" aria-live="polite">{{ annonce }}</p>

    <div class="edition-champ">
      <label :for="id('choix')">Matière du programme</label>
      <select
        :id="id('choix')"
        v-model="choix"
        data-champ="choix"
        :aria-invalid="erreurs.choix ? 'true' : 'false'"
        :aria-describedby="`${id('choix')}-erreur`"
      >
        <option value="">Choisissez une matière</option>
        <option v-for="m in programme" :key="m.id" :value="String(m.id)">{{ m.nom }}</option>
      </select>
      <p :id="`${id('choix')}-erreur`" class="edition-champ-erreur">{{ erreurs.choix }}</p>
    </div>

    <template v-if="choix">
      <div class="edition-champ">
        <label :for="id('enseignant')">Enseignant</label>
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
        <p :id="`${id('enseignant')}-erreur`" class="edition-champ-erreur">{{ erreurs.enseignant }}</p>
      </div>

      <div class="edition-champ">
        <label :for="id('coefficient')">Coefficient dans cette classe</label>
        <input
          :id="id('coefficient')"
          v-model="saisie.coefficient"
          data-champ="coefficient"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :aria-invalid="erreurs.coefficient ? 'true' : 'false'"
          :aria-describedby="`${id('coefficient')}-aide ${id('coefficient')}-erreur`"
        >
        <p :id="`${id('coefficient')}-aide`" class="edition-aide">{{ aideCoefficient }}</p>
        <p :id="`${id('coefficient')}-erreur`" class="edition-champ-erreur">{{ erreurs.coefficient }}</p>
      </div>

      <div class="edition-actions">
        <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
        <button type="submit" class="edition-btn" :aria-disabled="occupe ? 'true' : 'false'">Enregistrer</button>
        <button type="button" class="edition-btn is-danger" :aria-disabled="occupe ? 'true' : 'false'" @click="retirer">
          Retirer de la classe
        </button>
      </div>
    </template>
  </form>
</template>

<script setup>
/**
 * Le programme d'une classe, modifié ou réduit (#660, lms_backend#1653) : choisir une matière du programme, puis changer
 * son enseignant et son coefficient de classe, ou la retirer. La logique vit dans useProgrammeEdition. Émet `fait`
 * (la fiche est relue) et `incertaine` (l'écriture a pu se faire sans réponse lisible : la fiche est relue aussi).
 */
import { computed, useId } from 'vue'
import { useProgrammeEdition } from '@/composables/useProgrammeEdition'
import { toId } from '@/utils/toId'

const props = defineProps({
  classeId: { type: Number, required: true },
  // Les lignes du programme, telles que la fiche les lit (`matieres_disponibles`).
  programme: { type: Array, default: () => [] },
})

const emit = defineEmits(['fait', 'incertaine'])

const base = `programme-edition-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`

const { enseignants, choix, saisie, erreurs, erreur, annonce, occupe, enregistrer, retirer } = useProgrammeEdition({
  classeId: () => props.classeId,
  programme: () => props.programme,
  onFait: () => emit('fait'),
  onIncertaine: () => emit('incertaine'),
})

const aideCoefficient = computed(() => {
  const ligne = props.programme.find((m) => toId(m?.id) === toId(choix.value))
  return `Un entier de 1 à 20. Vide : le coefficient de la matière (${ligne?.coefficient ?? '—'}) s’applique.`
})
</script>

<style scoped>
.programme-edition {
  display: grid;
  gap: var(--spacing-sm);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.programme-edition h3 {
  margin: 0;
  color: var(--text-primary);
}

.edition-erreur,
.edition-annonce,
.edition-champ-erreur,
.edition-aide {
  margin: 0;
}

.edition-erreur,
.edition-champ-erreur {
  color: var(--color-danger, var(--text-primary));
}

.edition-annonce {
  color: var(--text-primary);
}

.edition-aide {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.edition-champ {
  display: grid;
  gap: var(--spacing-sm);
}

.edition-champ label {
  font-weight: 600;
  color: var(--text-primary);
}

.edition-champ select,
.edition-champ input {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.edition-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.edition-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.edition-btn.is-danger {
  border-color: var(--color-danger, var(--border-primary));
}

.edition-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
