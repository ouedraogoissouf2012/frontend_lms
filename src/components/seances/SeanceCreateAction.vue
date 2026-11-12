<template>
  <div v-if="disponible" class="seance-create">
    <button type="button" class="btn-create" @click="ouvert = true">
      <i class="fa fa-plus" aria-hidden="true"></i> Nouvelle séance
    </button>

    <Modal v-model="ouvert" title="Nouvelle séance" size="md" @close="fermer">
      <form class="seance-create-form" novalidate @submit.prevent="soumettre">
        <!-- D6 : la visio d'une séance locale attend un lot backend ; on le dit avant la création. -->
        <p class="form-hint">La visioconférence n'est pas encore disponible pour une séance créée ici.</p>

        <label class="form-label" for="seance-matiere">Matière</label>
        <select id="seance-matiere" v-model="form.matiereId" name="matiere" class="form-input">
          <option :value="null" disabled>Choisir une matière</option>
          <option v-for="m in matieresLocales" :key="m.id" :value="m.id">{{ m.nom }}</option>
        </select>
        <p v-if="erreurs.matiere" class="field-error">{{ erreurs.matiere }}</p>

        <label class="form-label" for="seance-classe">Classe</label>
        <select id="seance-classe" v-model="form.classeId" name="classe" class="form-input" :disabled="!form.matiereId">
          <option :value="null">Sans classe (aucun élève ne la verra)</option>
          <option v-for="c in classesDisponibles" :key="c.id" :value="c.id">{{ c.nom }}</option>
        </select>
        <p v-if="erreurs.classe" class="field-error">{{ erreurs.classe }}</p>

        <label class="form-label" for="seance-titre">Titre</label>
        <input id="seance-titre" v-model="form.titre" name="titre" type="text" class="form-input" maxlength="255" />
        <p v-if="erreurs.titre" class="field-error">{{ erreurs.titre }}</p>

        <label class="form-label" for="seance-debut">Début</label>
        <input id="seance-debut" v-model="form.debut" name="debut" type="datetime-local" class="form-input" />
        <p class="form-hint">La fin n'est pas saisie : elle sera estimée (début + 2 h) et dite comme telle.</p>
        <p v-if="erreurs.date_seance" class="field-error">{{ erreurs.date_seance }}</p>

        <div v-if="erreur" class="form-error" role="alert">
          <span>{{ erreur }}</span>
          <button v-if="canRetry" type="submit" class="btn-retry" :disabled="envoi">Réessayer</button>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="fermer">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="envoi">{{ envoi ? 'Création…' : 'Créer la séance' }}</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
/**
 * « Nouvelle séance » : le bouton et son dialogue, UNIQUES, montés sur les trois écrans de séances
 * (enseignant, coordinateur, gestion). Logique dans `useSeanceCreate` ; caché sans catalogue local
 * (D3). L'écran passe son catalogue s'il l'a déjà (`matieres`), sinon il est lu ici. Émet `created`
 * (la séance) : l'écran recharge sa liste, dont le cache a été purgé.
 */
import { ref, toRef, onMounted } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import { useSeanceCreate } from '@/composables/useSeanceCreate'

const props = defineProps({
  matieres: { type: Array, default: null }
})
const emit = defineEmits(['created'])

const ouvert = ref(false)
const {
  disponible, matieresLocales, classesDisponibles, form, erreurs, erreur, canRetry, envoi,
  chargerCatalogue, creer, reinitialiser,
} = useSeanceCreate(props.matieres !== null ? { matieres: toRef(props, 'matieres') } : {})

onMounted(chargerCatalogue)

function fermer() {
  ouvert.value = false
  reinitialiser()
}

async function soumettre() {
  const seance = await creer()
  if (seance) {
    ouvert.value = false
    emit('created', seance)
  }
}
</script>

<style scoped>
.seance-create {
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

.seance-create-form {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  margin-top: 0.6rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-input {
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
