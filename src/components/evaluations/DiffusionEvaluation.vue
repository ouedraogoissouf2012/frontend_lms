<template>
  <section class="diffusion-card" aria-labelledby="diffusion-titre">
    <h2 id="diffusion-titre" class="diffusion-titre">Diffusion des résultats</h2>

    <div class="diffusion-ligne">
      <div>
        <p class="diffusion-label">Notes</p>
        <p class="diffusion-etat" :class="notesPubliees ? 'etat-publie' : 'etat-cache'">
          {{ notesPubliees ? 'Notes publiées' : 'Notes non publiées' }}
        </p>
      </div>
      <button
        type="button"
        data-test="publier"
        class="btn-diffusion"
        :class="notesPubliees ? 'btn-secondaire' : 'btn-principal'"
        :disabled="enCours"
        @click="basculerNotes"
      >
        {{ notesPubliees ? 'Retirer la publication' : 'Publier les notes' }}
      </button>
    </div>

    <div class="diffusion-corrige">
      <label for="mode-corrige" class="diffusion-label">Ouverture du corrigé</label>
      <div class="diffusion-champs">
        <select id="mode-corrige" v-model="mode" data-test="mode-corrige" class="diffusion-champ">
          <option v-for="m in MODES_DU_CORRIGE" :key="m.valeur" :value="m.valeur">{{ m.libelle }}</option>
        </select>
        <input
          v-if="mode === 'at_date'"
          id="date-corrige"
          v-model="date"
          type="datetime-local"
          data-test="date-corrige"
          class="diffusion-champ"
          aria-label="Date d'ouverture du corrigé"
        />
        <button
          type="button"
          data-test="enregistrer"
          class="btn-diffusion btn-secondaire"
          :disabled="!enregistrable"
          @click="enregistrerCorrige"
        >
          Enregistrer
        </button>
      </div>
      <p class="diffusion-aide">{{ PLANCHER_DU_CORRIGE }}</p>
    </div>
  </section>
</template>

<script setup>
/**
 * front#693 : l'enseignant publie les notes de son évaluation et règle l'ouverture du corrigé
 * (contrat back #1773). Présentationnel : la logique vit dans useDiffusionEvaluation. Émet `maj`
 * avec l'évaluation que le serveur a rendue.
 */
import { toRef } from 'vue'
import { useDiffusionEvaluation } from '@/composables/useDiffusionEvaluation'
import { MODES_DU_CORRIGE, PLANCHER_DU_CORRIGE } from '@/utils/diffusionDesResultats'

const props = defineProps({
  evaluation: { type: Object, required: true },
})
const emit = defineEmits(['maj'])

const { enCours, mode, date, notesPubliees, enregistrable, basculerNotes, enregistrerCorrige } =
  useDiffusionEvaluation(toRef(props, 'evaluation'), (e) => emit('maj', e))
</script>

<style scoped>
.diffusion-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.diffusion-titre {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.diffusion-ligne {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.diffusion-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
  display: block;
}

.diffusion-etat {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
}

.etat-publie {
  color: var(--color-success-text);
}

.etat-cache {
  color: var(--text-primary);
}

.diffusion-champs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.diffusion-champ {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.diffusion-aide {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0.5rem 0 0 0;
}

.btn-diffusion {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: opacity 0.2s;
}

.btn-diffusion:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-principal {
  background: var(--primary-color);
  color: var(--white);
}

.btn-secondaire {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}
</style>
