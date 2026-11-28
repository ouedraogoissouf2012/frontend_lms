<template>
  <div class="gestes">
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="gestes-erreur" role="alert">{{ erreur }}</p>
    <p class="gestes-annonce" role="status" aria-live="polite">{{ annonce }}</p>

    <div class="gestes-actions">
      <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
      <button type="button" class="gestes-btn" :aria-expanded="ouvert ? 'true' : 'false'" :aria-disabled="occupe ? 'true' : 'false'" @click="ouvert ? (ouvert = false) : ouvrir()">
        Modifier la classe
      </button>
      <button type="button" class="gestes-btn" :class="{ 'is-danger': !archivee }" :aria-disabled="occupe ? 'true' : 'false'" @click="basculerArchive">
        {{ archivee ? 'Désarchiver' : 'Archiver' }}
      </button>
    </div>

    <form v-if="ouvert" class="gestes-form" novalidate @submit.prevent="enregistrer">
      <div v-for="c in CHAMPS_VUS" :key="c.nom" class="gestes-champ">
        <label :for="id(c.nom)">{{ c.libelle }}</label>
        <textarea
          v-if="c.nom === 'description'"
          :id="id(c.nom)"
          v-model="saisie[c.nom]"
          :data-champ="c.nom"
          :aria-invalid="erreurs[c.nom] ? 'true' : 'false'"
          :aria-describedby="`${id(c.nom)}-erreur`"
        />
        <input
          v-else
          :id="id(c.nom)"
          v-model="saisie[c.nom]"
          :data-champ="c.nom"
          type="text"
          autocomplete="off"
          :aria-invalid="erreurs[c.nom] ? 'true' : 'false'"
          :aria-describedby="`${id(c.nom)}-erreur`"
        >
        <p :id="`${id(c.nom)}-erreur`" class="gestes-champ-erreur">{{ erreurs[c.nom] }}</p>
      </div>
      <div class="gestes-actions">
        <button type="submit" class="gestes-btn" :aria-disabled="occupe ? 'true' : 'false'">Enregistrer</button>
        <button type="button" class="gestes-btn" @click="ouvert = false">Annuler</button>
      </div>
    </form>
  </div>
</template>

<script setup>
/**
 * Modifier, archiver ou désarchiver une classe locale (#659, lms_backend#1652). La logique vit dans useClasseGestes.
 * Émet `ligne` (la ligne de la collection, à jour) et `incertaine` (l'écriture a pu se faire sans réponse lisible :
 * la liste est relue).
 */
import { computed, useId } from 'vue'
import { useClasseGestes } from '@/composables/useClasseGestes'

const props = defineProps({
  classe: { type: Object, required: true },
})

const emit = defineEmits(['ligne', 'incertaine'])

const CHAMPS_VUS = Object.freeze([
  { nom: 'libelle', libelle: 'Libellé' },
  { nom: 'code', libelle: 'Code de la classe (facultatif)' },
  { nom: 'description', libelle: 'Description (facultative)' },
])

const base = `classe-gestes-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`

const archivee = computed(() => Boolean(props.classe?.archivee_le))

const { ouvert, saisie, erreurs, erreur, annonce, occupe, ouvrir, enregistrer, basculerArchive } = useClasseGestes({
  classe: () => props.classe,
  onLigne: (ligne) => emit('ligne', ligne),
  onIncertaine: () => emit('incertaine'),
})
</script>

<style scoped>
.gestes {
  display: grid;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.gestes-erreur,
.gestes-annonce,
.gestes-champ-erreur {
  margin: 0;
}

.gestes-erreur,
.gestes-champ-erreur {
  color: var(--color-danger, var(--text-primary));
}

.gestes-annonce {
  color: var(--text-primary);
}

.gestes-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.gestes-form,
.gestes-champ {
  display: grid;
  gap: var(--spacing-sm);
}

.gestes-champ label {
  font-weight: 600;
  color: var(--text-primary);
}

.gestes-champ input,
.gestes-champ textarea {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.gestes-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.gestes-btn.is-danger {
  border-color: var(--color-danger, var(--border-primary));
}

.gestes-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
