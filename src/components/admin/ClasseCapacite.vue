<template>
  <div class="capacite">
    <p class="capacite-valeur">{{ libelle }}</p>

    <!-- Région présente dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="capacite-erreur" role="alert">{{ erreur }}</p>

    <form v-if="ouvert" class="capacite-form" novalidate @submit.prevent="enregistrer">
      <label :for="idChamp" class="capacite-label">Capacité (nombre d’élèves)</label>
      <!-- text + inputmode : un champ vide reste vide (sans limite), jamais converti en 0. -->
      <input
        :id="idChamp"
        ref="champ"
        v-model="saisie"
        class="capacite-saisie"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :aria-invalid="invalide ? 'true' : 'false'"
        :aria-describedby="idAide"
      >
      <p :id="idAide" class="capacite-aide">{{ AIDE }}</p>
      <div class="capacite-actions">
        <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
        <button type="submit" class="capacite-btn" :aria-disabled="occupe ? 'true' : 'false'">Enregistrer</button>
        <button type="button" class="capacite-btn capacite-annuler" @click="fermer">Annuler</button>
      </div>
    </form>

    <button v-else ref="bouton" type="button" class="capacite-btn capacite-modifier" @click="ouvrirFormulaire">
      Modifier la capacité
    </button>
  </div>
</template>

<script setup>
/**
 * La capacité d'une classe locale, affichée et réglée sur sa carte (#631). La logique vit dans
 * useClasseCapacite ; ce composant émet `regle` avec la capacité RELUE du serveur, que la liste garde.
 */
import { computed, nextTick, ref, useId } from 'vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { libelleCapacite, useClasseCapacite } from '@/composables/useClasseCapacite'

const props = defineProps({
  classe: { type: Object, required: true },
})

const emit = defineEmits(['regle'])

const AIDE = "Laissez vide pour ne pas limiter. Baisser la capacité n'exclut aucun élève déjà inscrit : seules les nouvelles adhésions sont refusées."
// Un id utilisable en sélecteur CSS, quel que soit le préfixe de useId.
const idChamp = `capacite-${useId().replace(/[^\w-]/g, '-')}`
const idAide = `${idChamp}-aide`
const champ = ref(null)
const bouton = ref(null)

const { ouvert, saisie, erreur, invalide, occupe, incertaine, ouvrir, annuler, enregistrer: envoyer } =
  useClasseCapacite(() => props.classe, (effectif) => emit('regle', effectif))

const libelle = computed(() => (incertaine.value ? ERROR_MESSAGES.capaciteIncertaine : libelleCapacite(props.classe)))

async function ouvrirFormulaire() {
  ouvrir()
  await nextTick()
  champ.value?.focus()
}

// Le focus revient au bouton qui a ouvert le formulaire.
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
.capacite {
  margin: var(--spacing-sm) 0 var(--spacing-md);
}

.capacite-valeur {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.capacite-erreur {
  margin: 0;
  color: var(--color-danger, var(--text-primary));
}

.capacite-form {
  display: grid;
  gap: var(--spacing-sm);
  max-width: 28rem;
}

.capacite-label {
  font-weight: 600;
  color: var(--text-primary);
}

.capacite-saisie {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  color: var(--text-primary);
  max-width: 10rem;
}

.capacite-aide {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.capacite-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.capacite-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.capacite-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
