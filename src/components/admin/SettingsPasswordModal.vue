<template>
  <Modal v-model="show" title="Changer le mot de passe">
    <PasswordChangeUnavailableNotice />

    <form @submit.prevent="emit('submit')">
      <div class="form-group">
        <label class="form-label">Mot de passe actuel</label>
        <input
          type="password"
          v-model="form.currentPassword"
          class="form-input"
          placeholder="Entrez votre mot de passe actuel"
          disabled
        />
      </div>
      <div class="form-group">
        <label class="form-label">Nouveau mot de passe</label>
        <input
          type="password"
          v-model="form.newPassword"
          class="form-input"
          placeholder="Entrez votre nouveau mot de passe"
          disabled
        />
      </div>
      <div class="form-group">
        <label class="form-label">Confirmer le mot de passe</label>
        <input
          type="password"
          v-model="form.confirmPassword"
          class="form-input"
          placeholder="Confirmez votre nouveau mot de passe"
          disabled
        />
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn-cancel" @click="show = false" aria-label="Fermer">
        Fermer
      </button>
      <button
        type="submit"
        class="btn-primary"
        disabled
        @click="emit('submit')"
        aria-label="Changement de mot de passe indisponible depuis le LMS"
      >
        Confirmer
      </button>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale de changement de mot de passe d'AdminSettings (#H3 ≤300). Présentation
 * pure : l'ouverture est en v-model (defineModel `show`), le formulaire est l'objet
 * réactif `form` reçu en prop (mutation partagée, parité), et l'envoi est délégué
 * au parent via l'événement `submit`.
 *
 * DETTE TRACÉE : aucun endpoint backend de changement de mot de passe n'existe
 * (cf. `@/constants/passwordChange`) — champs et bouton désactivés, bannière
 * explicative. Réactiver ici le jour où l'API existera.
 */
import Modal from '@/components/ui/Modal.vue'
import PasswordChangeUnavailableNotice from '@/components/ui/PasswordChangeUnavailableNotice.vue'

defineProps({
  form: { type: Object, required: true },
})

const show = defineModel('show', { type: Boolean, default: false })

const emit = defineEmits(['submit'])
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
