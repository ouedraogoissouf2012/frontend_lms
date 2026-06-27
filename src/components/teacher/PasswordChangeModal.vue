<template>
  <Modal v-model="show" title="Changer le mot de passe">
    <form @submit.prevent="$emit('submit')">
      <div class="form-group">
        <label class="form-label">Mot de passe actuel</label>
        <input
          type="password"
          v-model="currentPassword"
          class="form-input"
          placeholder="Entrez votre mot de passe actuel"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">Nouveau mot de passe</label>
        <input
          type="password"
          v-model="newPassword"
          class="form-input"
          placeholder="Entrez votre nouveau mot de passe"
          required
          minlength="6"
        />
      </div>
      <div class="form-group">
        <label class="form-label">Confirmer le mot de passe</label>
        <input
          type="password"
          v-model="confirmPassword"
          class="form-input"
          placeholder="Confirmez votre nouveau mot de passe"
          required
          minlength="6"
        />
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn-cancel" @click="show = false" aria-label="Annuler le changement de mot de passe">
        Annuler
      </button>
      <button type="submit" class="btn-primary" @click="$emit('submit')" aria-label="Confirmer le changement de mot de passe">
        Confirmer
      </button>
    </template>
  </Modal>
</template>

<script setup>
/** Modale de changement de mot de passe enseignant (#H11 ≤300). v-model de la
 *  visibilité + des 3 champs ; émet `submit` (validation/persistance au parent). */
import Modal from '@/components/ui/Modal.vue'

const show = defineModel({ type: Boolean, default: false })
const currentPassword = defineModel('currentPassword', { type: String, default: '' })
const newPassword = defineModel('newPassword', { type: String, default: '' })
const confirmPassword = defineModel('confirmPassword', { type: String, default: '' })
defineEmits(['submit'])
</script>

<style scoped>
/* Modal Form */
.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  font-size: 1rem;
  color: var(--text-primary);
  background: var(--card-bg);
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--blue-500);
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

.btn-primary, .btn-cancel {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, #1d4ed8 100%);
  transform: scale(1.02);
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}
</style>
