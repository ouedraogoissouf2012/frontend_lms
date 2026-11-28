<template>
  <form ref="formulaire" class="matiere-modification" novalidate tabindex="-1" @submit.prevent="enregistrer">
    <h2>Modifier « {{ matiere.nom }} »</h2>
    <!-- Région présente dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="modif-erreur" role="alert">{{ erreur }}</p>

    <div v-for="c in CHAMPS" :key="c.nom" class="modif-champ">
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
      <p v-if="c.aide" :id="`${id(c.nom)}-aide`" class="modif-aide">{{ c.aide }}</p>
      <p :id="`${id(c.nom)}-erreur`" class="modif-champ-erreur">{{ erreurs[c.nom] }}</p>
    </div>

    <div class="modif-actions">
      <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
      <button type="submit" class="modif-btn" :aria-disabled="occupe ? 'true' : 'false'">Enregistrer</button>
      <button type="button" class="modif-btn" @click="$emit('fermer')">Fermer sans enregistrer</button>
    </div>
  </form>
</template>

<script setup>
/**
 * Modifier une matière de l'école (#660), `PATCH /matieres/{matiere}`. Rendu seulement pour une matière qui porte
 * `edition` (ses valeurs brutes, lms_backend#1653) ; la logique vit dans useMatiereModification. Émet `modifiee` (la
 * matière relue du serveur), `incertaine` (la liste doit être relue) et `fermer`. Le focus arrive sur le formulaire.
 */
import { onMounted, ref, useId } from 'vue'
import { CHAMPS_DU_FORMULAIRE as CHAMPS } from '@/composables/useMatiereCreation'
import { useMatiereModification } from '@/composables/useMatiereModification'

const props = defineProps({
  matiere: { type: Object, required: true },
})

const emit = defineEmits(['modifiee', 'incertaine', 'fermer'])

const formulaire = ref(null)
const base = `matiere-modif-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`
const decrit = (c) => [c.aide ? `${id(c.nom)}-aide` : null, `${id(c.nom)}-erreur`].filter(Boolean).join(' ')

const { saisie, erreurs, erreur, occupe, enregistrer } = useMatiereModification(() => props.matiere, {
  onModifiee: (relue) => emit('modifiee', relue),
  onIncertaine: () => emit('incertaine'),
})

onMounted(() => formulaire.value?.focus())
</script>

<style scoped>
.matiere-modification {
  display: grid;
  gap: var(--spacing-sm);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.matiere-modification h2 {
  margin: 0;
  color: var(--text-primary);
}

.modif-erreur,
.modif-champ-erreur,
.modif-aide {
  margin: 0;
}

.modif-erreur,
.modif-champ-erreur {
  color: var(--color-danger, var(--text-primary));
}

.modif-aide {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.modif-champ {
  display: grid;
  gap: var(--spacing-sm);
}

.modif-champ label {
  font-weight: 600;
  color: var(--text-primary);
}

.modif-champ input,
.modif-champ textarea {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modif-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.modif-btn {
  justify-self: start;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.modif-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
