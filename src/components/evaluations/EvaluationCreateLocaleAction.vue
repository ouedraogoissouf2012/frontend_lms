<template>
  <div v-if="disponible" class="evaluation-create">
    <button type="button" class="btn-create" @click="ouvert = true">
      <i class="fa fa-plus" aria-hidden="true"></i> Créer une évaluation
    </button>

    <Modal v-model="ouvert" title="Nouvelle évaluation" size="md" @close="fermer">
      <form class="evaluation-create-form" novalidate @submit.prevent="soumettre">
        <p class="form-hint">L'évaluation est créée sans question : ajoutez-les ensuite depuis sa carte.</p>

        <label class="form-label" for="evaluation-matiere">Matière</label>
        <select id="evaluation-matiere" v-model="form.matiereId" name="matiere" class="form-input">
          <option :value="null" disabled>Choisir une matière</option>
          <option v-for="m in matieresLocales" :key="m.id" :value="m.id">{{ m.nom }}</option>
        </select>
        <p v-if="erreurs.matiere" class="field-error">{{ erreurs.matiere }}</p>

        <label class="form-label" for="evaluation-classe">Classe</label>
        <select id="evaluation-classe" v-model="form.classeId" name="classe" class="form-input" :disabled="!form.matiereId">
          <option :value="null" disabled>Choisir une classe</option>
          <option v-for="c in classesDisponibles" :key="c.id" :value="c.id">{{ c.nom }}</option>
        </select>
        <p v-if="erreurs.classe" class="field-error">{{ erreurs.classe }}</p>

        <label class="form-label" for="evaluation-titre">Titre</label>
        <input id="evaluation-titre" v-model="form.titre" name="titre" type="text" class="form-input" maxlength="255" />
        <p v-if="erreurs.titre" class="field-error">{{ erreurs.titre }}</p>

        <label class="form-label" for="evaluation-debut">Date et heure</label>
        <input id="evaluation-debut" v-model="form.debut" name="debut" type="datetime-local" class="form-input" />
        <p v-if="erreurs.date" class="field-error">{{ erreurs.date }}</p>

        <div class="form-row">
          <div>
            <label class="form-label" for="evaluation-duree">Durée (min)</label>
            <input id="evaluation-duree" v-model.number="form.duree_minutes" name="duree" type="number" min="1" max="1440" class="form-input" />
          </div>
          <div>
            <label class="form-label" for="evaluation-coefficient">Coefficient</label>
            <input id="evaluation-coefficient" v-model.number="form.coefficient" name="coefficient" type="number" min="0" step="0.5" class="form-input" />
          </div>
          <div>
            <label class="form-label" for="evaluation-bareme">Barème</label>
            <input id="evaluation-bareme" v-model.number="form.bareme" name="bareme" type="number" min="0" class="form-input" />
          </div>
        </div>
        <p v-if="erreurs.duree" class="field-error">{{ erreurs.duree }}</p>

        <div v-if="erreur" class="form-error" role="alert">
          <span>{{ erreur }}</span>
          <button v-if="canRetry" type="submit" class="btn-retry" :disabled="envoi">Réessayer</button>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="fermer">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="envoi">{{ envoi ? 'Création…' : 'Créer l’évaluation' }}</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
/**
 * « Créer une évaluation » dans une école créée depuis le LMS (D72-b) : le bouton et son dialogue. Logique
 * dans `useCreationEvaluationLocale` ; caché sans catalogue local (D172). L'écran passe son catalogue
 * (`matieres`) ; émet `created` (l'évaluation) pour qu'il recharge sa liste.
 */
import { ref, toRef } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import { useCreationEvaluationLocale } from '@/composables/useCreationEvaluationLocale'

const props = defineProps({
  matieres: { type: Array, default: () => [] }
})
const emit = defineEmits(['created'])

const ouvert = ref(false)
const {
  disponible, matieresLocales, classesDisponibles, form, erreurs, erreur, canRetry, envoi, creer, reinitialiser,
} = useCreationEvaluationLocale({ matieres: toRef(props, 'matieres') })

function fermer() {
  ouvert.value = false
  reinitialiser()
}

async function soumettre() {
  const evaluation = await creer()
  if (evaluation) {
    ouvert.value = false
    emit('created', evaluation)
  }
}
</script>

<style scoped>
.evaluation-create {
  margin-top: 1rem;
}

.btn-create,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--primary-color);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled,
.btn-retry:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary,
.btn-retry {
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.evaluation-create-form {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.form-label {
  margin-top: 0.6rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.field-error,
.form-error {
  font-size: 0.85rem;
  color: var(--color-danger);
}

.form-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>
