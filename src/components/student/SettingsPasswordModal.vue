<template>
  <Modal v-model="modelValue" title="Changer le mot de passe">
    <form @submit.prevent="submitPasswordChange">
      <div class="form-group">
        <label class="form-label">Mot de passe actuel</label>
        <input
          type="password"
          v-model="passwordForm.currentPassword"
          class="form-input"
          placeholder="Entrez votre mot de passe actuel"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">Nouveau mot de passe</label>
        <input
          type="password"
          v-model="passwordForm.newPassword"
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
          v-model="passwordForm.confirmPassword"
          class="form-input"
          placeholder="Confirmez votre nouveau mot de passe"
          required
          minlength="6"
        />
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn-cancel" @click="modelValue = false" aria-label="Annuler le changement de mot de passe">
        Annuler
      </button>
      <button type="submit" class="btn-primary" @click="submitPasswordChange" aria-label="Confirmer le changement de mot de passe">
        Confirmer
      </button>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale de changement de mot de passe de StudentSettings (#H10 ≤300).
 * Auto-contenue : visibilité en v-model, formulaire local, validations.
 *
 * DETTE PRÉ-EXISTANTE CONSERVÉE VERBATIM : aucun appel API réel (TODO d'origine) —
 * le succès est simulé côté client. Comportement strictement identique à l'original.
 */
import { ref } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import { toast } from '@/services/toast'

const modelValue = defineModel({ type: Boolean, default: false })

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

function submitPasswordChange() {
  // Validation
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error('Les mots de passe ne correspondent pas')
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    toast.error('Le mot de passe doit contenir au moins 6 caractères')
    return
  }

  // TODO: Appel API pour changer le mot de passe
  // Pour l'instant, simulons le succès
  toast.success('Votre mot de passe a été changé avec succès')

  // Réinitialiser le formulaire et fermer le modal
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  modelValue.value = false
}
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
  background: linear-gradient(135deg, var(--color-info-strong) 0%, var(--color-info-stronger) 100%);
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
