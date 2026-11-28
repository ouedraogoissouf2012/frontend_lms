<template>
  <div v-if="seance.can_be_edited === true" class="seance-edit">
    <button type="button" class="btn-edit" @click="ouvrirFenetre">
      <i class="fa fa-pencil" aria-hidden="true"></i> Modifier
    </button>

    <Modal v-model="ouvert" title="Modifier la séance" size="md" @close="fermer">
      <form class="seance-edit-form" novalidate @submit.prevent="soumettre">
        <p class="form-label">Matière</p>
        <p class="form-static">{{ matiereNom }}</p>

        <label class="form-label" :for="`seance-edit-classe-${seance.id}`">Classe</label>
        <select :id="`seance-edit-classe-${seance.id}`" v-model="form.classeId" name="classe" class="form-input">
          <option :value="null">Sans classe (aucun élève ne la verra)</option>
          <option v-for="c in classesDisponibles" :key="c.id" :value="c.id">{{ c.nom }}</option>
        </select>
        <p v-if="erreurs.classe" class="field-error">{{ erreurs.classe }}</p>

        <label class="form-label" :for="`seance-edit-titre-${seance.id}`">Titre</label>
        <input :id="`seance-edit-titre-${seance.id}`" v-model="form.titre" name="titre" type="text" class="form-input" maxlength="255" />
        <p v-if="erreurs.titre" class="field-error">{{ erreurs.titre }}</p>

        <label class="form-label" :for="`seance-edit-type-${seance.id}`">Type</label>
        <select :id="`seance-edit-type-${seance.id}`" v-model="form.type" name="type" class="form-input">
          <option value="">Sans type</option>
          <option v-for="t in TYPES_DE_SEANCE" :key="t.valeur" :value="t.valeur">{{ t.libelle }}</option>
        </select>
        <p v-if="erreurs.type" class="field-error">{{ erreurs.type }}</p>

        <label class="form-label" :for="`seance-edit-debut-${seance.id}`">Début</label>
        <input :id="`seance-edit-debut-${seance.id}`" v-model="form.debut" name="debut" type="datetime-local" class="form-input" />
        <p v-if="erreurs.date_seance" class="field-error">{{ erreurs.date_seance }}</p>

        <label class="form-label" :for="`seance-edit-fin-${seance.id}`">Fin (facultative)</label>
        <input :id="`seance-edit-fin-${seance.id}`" v-model="form.fin" name="fin" type="datetime-local" class="form-input" />
        <p class="form-hint">Sans fin, elle est estimée (début + 2 h) et dite comme telle.</p>
        <p v-if="erreurs.fin" class="field-error">{{ erreurs.fin }}</p>

        <div v-if="erreur" class="form-error" role="alert">
          <span>{{ erreur }}</span>
          <button v-if="canRetry" type="submit" class="btn-retry" :disabled="envoi">Réessayer</button>
        </div>
        <SeanceConflits
          v-if="conflits.length" :conflits="conflits" :peut-forcer="peutForcer" :envoi="envoi"
          libelle-forcer="Enregistrer quand même" @forcer="soumettreQuandMeme"
        />

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="fermer">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="envoi">{{ envoi ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
/**
 * « Modifier » une séance locale (lms_backend#1121) : le bouton et sa fenêtre, montés sur les trois cartes de
 * séances (enseignant, coordinateur, gestion). Le bouton suit UNIQUEMENT `can_be_edited === true`, calculé par le
 * serveur pour le compte qui lit (faux pour toute séance que l'école ne gère pas elle-même) : ni le rôle, ni le
 * catalogue, ni la date. La présentation ne connaît pas le mode de l'école (garde OCP).
 * Logique dans `useSeanceEdit`. Émet `updated` (la séance relue) : l'écran recharge sa liste, dont le cache a été
 * purgé.
 */
import { ref, toRef } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import SeanceConflits from '@/components/seances/SeanceConflits.vue'
import { useSeanceEdit } from '@/composables/useSeanceEdit'
import { TYPES_DE_SEANCE } from '@/constants/typesDeSeance'

const props = defineProps({
  seance: { type: Object, required: true }
})
const emit = defineEmits(['updated'])

const ouvert = ref(false)
const {
  form, erreurs, erreur, canRetry, envoi, conflits, peutForcer, matiereNom, classesDisponibles,
  ouvrir, modifier, modifierQuandMeme,
} = useSeanceEdit(toRef(props, 'seance'))

async function ouvrirFenetre() {
  ouvert.value = true
  await ouvrir()
}

function fermer() {
  ouvert.value = false
}

function terminer(relue) {
  if (relue) {
    ouvert.value = false
    emit('updated', relue)
  }
}

async function soumettre() {
  terminer(await modifier())
}

async function soumettreQuandMeme() {
  terminer(await modifierQuandMeme())
}
</script>

<style scoped>
.seance-edit {
  display: inline-flex;
}

.btn-edit,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--primary-color);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
}

.btn-edit {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.seance-edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--text-primary);
}

.form-static {
  color: var(--text-secondary);
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.field-error,
.form-error {
  color: var(--color-danger);
  font-size: 0.9rem;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.btn-secondary,
.btn-retry {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
}
</style>
