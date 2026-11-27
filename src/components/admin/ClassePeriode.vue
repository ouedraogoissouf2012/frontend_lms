<template>
  <div class="periode">
    <p class="periode-valeur">{{ libelle }}</p>

    <!-- Région présente dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="periode-erreur" role="alert">{{ erreur }}</p>

    <form v-if="ouvert" class="periode-form" novalidate @submit.prevent="enregistrer">
      <label :for="idChamp" class="periode-label">Période de la classe</label>
      <select :id="idChamp" ref="champ" v-model="choix" class="periode-choix" :aria-describedby="idAide">
        <option value="">Aucune période</option>
        <option v-for="p in periodes" :key="p.id" :value="String(p.id)">
          {{ p.status === 'brouillon' ? `${p.libelle} (brouillon)` : p.libelle }}
        </option>
      </select>
      <p :id="idAide" class="periode-aide">{{ AIDE }}</p>
      <div class="periode-actions">
        <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
        <button type="submit" class="periode-btn" :aria-disabled="occupe ? 'true' : 'false'">Enregistrer</button>
        <button type="button" class="periode-btn periode-annuler" @click="fermer">Annuler</button>
      </div>
    </form>

    <button v-else ref="bouton" type="button" class="periode-btn periode-modifier" @click="ouvrirFormulaire">
      Choisir la période
    </button>
  </div>
</template>

<script setup>
/**
 * La période d'une classe locale, affichée et choisie sur sa carte (#657). La logique vit dans
 * useClassePeriode ; les périodes proposées (brouillon ou publiées) sont chargées UNE fois par l'écran
 * et reçues en prop. Ce composant émet `rattachee` avec la période RELUE du serveur.
 */
import { computed, nextTick, ref, useId } from 'vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useClassePeriode } from '@/composables/useClassePeriode'
import { libellePeriode } from '@/composables/usePeriodesRecevables'

const props = defineProps({
  classe: { type: Object, required: true },
  periodes: { type: Array, default: () => [] },
})

const emit = defineEmits(['rattachee'])

const AIDE = "Seules les périodes en brouillon ou publiées reçoivent une classe. Une période en brouillon n'ouvre pas encore les codes d'inscription."
const idChamp = `periode-${useId().replace(/[^\w-]/g, '-')}`
const idAide = `${idChamp}-aide`
const champ = ref(null)
const bouton = ref(null)

const { ouvert, choix, erreur, occupe, incertaine, ouvrir, annuler, enregistrer: envoyer } =
  useClassePeriode(() => props.classe, (id) => emit('rattachee', id))

const libelle = computed(() => (incertaine.value ? ERROR_MESSAGES.periodeIncertaine : libellePeriode(props.classe, props.periodes)))

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
.periode {
  margin: var(--spacing-sm) 0 var(--spacing-md);
}

.periode-valeur {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.periode-erreur {
  margin: 0;
  color: var(--color-danger, var(--text-primary));
}

.periode-form {
  display: grid;
  gap: var(--spacing-sm);
  max-width: 28rem;
}

.periode-label {
  font-weight: 600;
  color: var(--text-primary);
}

.periode-choix {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  color: var(--text-primary);
  max-width: 24rem;
}

.periode-aide {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.periode-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.periode-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.periode-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
