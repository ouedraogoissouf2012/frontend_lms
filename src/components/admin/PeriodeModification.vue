<template>
  <div class="modif">
    <p v-if="incertaine" class="modif-incertaine">{{ ERROR_MESSAGES.periodeIncertaine }}</p>
    <!-- Région présente dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="modif-erreur" role="alert">{{ erreur }}</p>

    <form v-if="ouvert" class="modif-form" novalidate @submit.prevent="enregistrer">
      <label :for="`${base}-libelle`" class="modif-label">Libellé</label>
      <input
        :id="`${base}-libelle`"
        ref="premier"
        v-model="champs.libelle"
        class="modif-champ"
        type="text"
        maxlength="191"
        autocomplete="off"
        :aria-invalid="erreursChamps.libelle ? 'true' : 'false'"
        :aria-describedby="erreursChamps.libelle ? `${base}-libelle-err` : undefined"
      >
      <p v-if="erreursChamps.libelle" :id="`${base}-libelle-err`" class="modif-champ-erreur">{{ erreursChamps.libelle.join(' ') }}</p>

      <template v-for="[cle, libelle] in DATES_DE_PERIODE" :key="cle">
        <label :for="`${base}-${cle}`" class="modif-label">{{ libelle }}</label>
        <input
          :id="`${base}-${cle}`"
          v-model="champs[cle]"
          class="modif-champ"
          type="date"
          :aria-invalid="erreursChamps[cle] ? 'true' : 'false'"
          :aria-describedby="erreursChamps[cle] ? `${base}-${cle}-err` : undefined"
        >
        <p v-if="erreursChamps[cle]" :id="`${base}-${cle}-err`" class="modif-champ-erreur">{{ erreursChamps[cle].join(' ') }}</p>
      </template>

      <div class="modif-actions">
        <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
        <button type="submit" class="modif-btn" :aria-disabled="occupe ? 'true' : 'false'">Enregistrer</button>
        <!-- Pas « Annuler » : sur la carte, « Annuler » est la transition irréversible d'une période publiée. -->
        <button type="button" class="modif-btn" @click="fermer">Fermer sans enregistrer</button>
      </div>
    </form>

    <button v-else ref="bouton" type="button" class="modif-btn modif-ouvrir" @click="ouvrirFormulaire">Modifier</button>
  </div>
</template>

<script setup>
/**
 * Modifier une période sur sa carte (#658) : libellé et cinq dates. La logique vit dans
 * useModificationDePeriode ; ce composant émet `modifiee` avec la période RELUE du serveur.
 * Rendu seulement pour une période modifiable (la carte en décide, `MODIFIABLES`).
 */
import { nextTick, ref, useId } from 'vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { DATES_DE_PERIODE, useModificationDePeriode } from '@/composables/useModificationDePeriode'

const props = defineProps({
  periode: { type: Object, required: true },
})

const emit = defineEmits(['modifiee'])

const base = `periode-${useId().replace(/[^\w-]/g, '-')}`
const premier = ref(null)
const bouton = ref(null)

const { ouvert, champs, erreursChamps, erreur, occupe, incertaine, ouvrir, annuler, enregistrer: envoyer } =
  useModificationDePeriode(() => props.periode, (relue) => emit('modifiee', relue))

async function ouvrirFormulaire() {
  ouvrir()
  await nextTick()
  premier.value?.focus()
}

async function rendreLeFocus() {
  await nextTick()
  bouton.value?.focus()
}

function fermer() {
  annuler()
  rendreLeFocus()
}

async function enregistrer() {
  if (await envoyer()) rendreLeFocus()
}
</script>

<style scoped>
.modif {
  margin: var(--spacing-sm) 0;
}

.modif-erreur,
.modif-champ-erreur {
  margin: 0;
  color: var(--color-danger, var(--text-primary));
}

.modif-incertaine {
  margin: 0;
  color: var(--text-secondary);
}

.modif-form {
  display: grid;
  gap: var(--spacing-sm);
  max-width: 28rem;
}

.modif-label {
  font-weight: 600;
  color: var(--text-primary);
}

.modif-champ {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  color: var(--text-primary);
}

.modif-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.modif-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
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
