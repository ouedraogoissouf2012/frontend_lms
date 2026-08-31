<template>
  <Modal v-model="modelValue" title="Changer le mot de passe">
    <PasswordChangeUnavailableNotice />

    <form @submit.prevent="submitPasswordChange">
      <div class="form-group">
        <label class="form-label">Mot de passe actuel</label>
        <input
          type="password"
          v-model="passwordForm.currentPassword"
          class="form-input"
          placeholder="Entrez votre mot de passe actuel"
          disabled
        />
      </div>
      <div class="form-group">
        <label class="form-label">Nouveau mot de passe</label>
        <input
          type="password"
          v-model="passwordForm.newPassword"
          class="form-input"
          placeholder="Entrez votre nouveau mot de passe"
          disabled
        />
      </div>
      <div class="form-group">
        <label class="form-label">Confirmer le mot de passe</label>
        <input
          type="password"
          v-model="passwordForm.confirmPassword"
          class="form-input"
          placeholder="Confirmez votre nouveau mot de passe"
          disabled
        />
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn-cancel" @click="modelValue = false" aria-label="Fermer">
        Fermer
      </button>
      <button
        type="submit"
        class="btn-primary"
        disabled
        @click="submitPasswordChange"
        aria-label="Changement de mot de passe indisponible depuis le LMS"
      >
        Confirmer
      </button>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale de changement de mot de passe de StudentSettings (#H10 ≤300).
 * Auto-contenue : visibilité en v-model, formulaire local.
 *
 * DETTE TRACÉE : il n'existe AUCUN endpoint backend de changement de mot de
 * passe (cf. `@/constants/passwordChange`). L'ancien « succès » était simulé
 * côté client — un mensonge à l'utilisateur, retiré. Les champs et le bouton
 * sont désactivés et une bannière explique où faire la démarche.
 * REMPLACER ICI par l'appel API réel (et réactiver champs, bouton et
 * validations) le jour où l'endpoint existera.
 */
import { ref } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import PasswordChangeUnavailableNotice from '@/components/ui/PasswordChangeUnavailableNotice.vue'
import { toast } from '@/composables/useToast'
import { PASSWORD_CHANGE_UNAVAILABLE_MESSAGE } from '@/constants/passwordChange'

const modelValue = defineModel({ type: Boolean, default: false })

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

/** Garde-fou : jamais d'appel réseau, jamais de succès annoncé. */
function submitPasswordChange() {
  toast.info(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
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

/* Champs désactivés : la fonctionnalité n'existe pas côté backend. */
.form-input:disabled {
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  cursor: not-allowed;
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

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, var(--color-info-stronger) 100%);
  transform: scale(1.02);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}
</style>
