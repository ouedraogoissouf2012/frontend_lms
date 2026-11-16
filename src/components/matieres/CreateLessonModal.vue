<template>
  <Modal
    :model-value="visible"
    :title="editing ? 'Modifier la leçon' : 'Créer une nouvelle leçon'"
    size="lg"
    @close="$emit('close')"
  >
    <form id="create-lesson-modal-form" @submit.prevent="$emit('submit')" class="lesson-form">
      <!-- Titre -->
      <div class="form-group">
        <label for="lecon-titre" class="form-label required">Titre de la leçon</label>
        <input
          id="lecon-titre"
          v-model="lesson.title"
          type="text"
          class="form-input"
          placeholder="Ex: Introduction aux boucles"
          required
        />
      </div>

      <!-- Classe (back #1103) : choisie parmi les classes de la matière ; jamais supposée quand il y en a plusieurs -->
      <div class="form-group">
        <label for="lecon-classe" class="form-label required">Classe</label>
        <p v-if="!classes.length" class="form-help">Cette matière n’a aucune classe : la leçon ne peut pas être créée.</p>
        <select v-else id="lecon-classe" v-model.number="lesson.classe_id" class="form-select" required>
          <!-- Aucune classe choisie : `classe_id` reste null, aucune option ne correspond, la liste est vide. -->
          <option value="" disabled>Choisissez la classe</option>
          <option v-for="classe in classes" :key="classe.id" :value="classe.id">{{ classe.nom }}</option>
        </select>
        <p v-if="erreurClasse" class="form-help" role="alert">{{ erreurClasse }}</p>
      </div>

      <!-- Description -->
      <div class="form-group">
        <label for="lecon-description" class="form-label">Description</label>
        <textarea
          id="lecon-description"
          v-model="lesson.description"
          class="form-textarea"
          rows="3"
          placeholder="Décrivez brièvement le contenu de cette leçon..."
        ></textarea>
      </div>

      <!-- Prérequis -->
      <div class="form-group">
        <label for="lecon-prerequis" class="form-label">Prérequis</label>
        <textarea
          id="lecon-prerequis"
          v-model="lesson.prerequis"
          class="form-textarea"
          rows="2"
          placeholder="Connaissances nécessaires avant de suivre cette leçon..."
        ></textarea>
        <p class="form-help">Ex: Comprendre les variables, les types de données</p>
      </div>

      <!-- Niveau -->
      <div class="form-group">
        <label for="lecon-niveau" class="form-label required">Niveau de difficulté</label>
        <select id="lecon-niveau" v-model="lesson.niveau_difficulte" class="form-select">
          <option value="debutant">Débutant</option>
          <option value="intermediaire">Intermédiaire</option>
          <option value="avance">Avancé</option>
        </select>
      </div>

      <!-- Objectifs pédagogiques -->
      <div class="form-group">
        <label for="lecon-objectifs" class="form-label">Objectifs pédagogiques</label>
        <textarea
          id="lecon-objectifs"
          v-model="lesson.objectifs_pedagogiques"
          class="form-textarea"
          rows="3"
          placeholder="Que devront savoir faire les étudiants après cette leçon ?"
        ></textarea>
        <p class="form-help">Ex: Maîtriser les boucles while et for, Résoudre des problèmes d'itération</p>
      </div>

      <!-- Durée estimée -->
      <div class="form-group">
        <label for="lecon-duree" class="form-label">Durée estimée (minutes)</label>
        <input
          id="lecon-duree"
          v-model.number="lesson.duree_estimee_minutes"
          type="number"
          class="form-input"
          placeholder="60"
          min="5"
          max="600"
        />
        <p class="form-help">Temps nécessaire pour compléter toute la leçon</p>
      </div>
    </form>

    <template #footer>
      <BaseButton
        type="button"
        variant="secondary"
        class="btn-secondary"
        :disabled="creating"
        @click="$emit('close')"
      >
        Annuler
      </BaseButton>
      <BaseButton
        type="submit"
        form="create-lesson-modal-form"
        class="btn-primary"
        :disabled="creating || !lesson.title || !lesson.classe_id"
        :loading="creating"
      >
        {{ libelleBouton }}
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale de leçon de MatiereDetails (#H9 ≤300) : CRÉER et MODIFIER (#564) par le même formulaire.
 * Présentation pure : formulaire lié à l'objet `lesson` (mutation des propriétés, parité avec
 * l'ancien newLesson), dont la classe choisie parmi celles de la matière (back #1103).
 * Émet `close` et `submit`. CSS déplacé VERBATIM.
 */
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  lesson: { type: Object, required: true },
  creating: { type: Boolean, default: false },
  // Les classes de la matière (`classes_concernees`, ids LOCAUX) : la leçon part dans celle choisie.
  classes: { type: Array, default: () => [] },
  // Modification d'une leçon existante (#564) : même formulaire, autre titre et autre bouton.
  editing: { type: Boolean, default: false },
  // Le refus de la classe par le serveur, dit par le catalogue (D0), ou null.
  erreurClasse: { type: String, default: null }
})
defineEmits(['close', 'submit'])

const libelleBouton = computed(() => {
  if (props.creating) return props.editing ? 'Enregistrement...' : 'Création...'
  return props.editing ? 'Enregistrer' : 'Créer la leçon'
})
</script>

<style scoped>
.lesson-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-label.required::after {
  content: ' *';
  color: var(--red-500);
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: var(--input-bg, var(--card-bg));
  color: var(--text-primary);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-muted, #9ca3af);
  opacity: 1;
}

.form-help {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: var(--blue-500);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-info-strong);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--bg-tertiary, var(--hover-bg));
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
