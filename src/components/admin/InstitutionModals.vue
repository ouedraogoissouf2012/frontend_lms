<template>
      <Teleport to="body">
        <div v-if="showForm" class="modal-overlay" @click="$emit('close')">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <div class="modal-title-section">
                <i class="fa fa-university modal-icon"></i>
                <h2 class="modal-title">{{ editing ? 'Modifier l\'Institution' : 'Nouvelle Institution' }}</h2>
              </div>
              <button @click="$emit('close')" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <form @submit.prevent="$emit('save')">
                <!-- Slug -->
                <div class="form-group">
                  <label class="form-label">Slug (identifiant unique)</label>
                  <input
                    v-model="form.slug"
                    type="text"
                    class="form-input"
                    placeholder="ex: esbtp-abidjan"
                    :readonly="!!editing"
                    :class="{ 'input-readonly': !!editing }"
                    pattern="[a-z0-9\-]+"
                    required
                  />
                  <span class="form-hint">Minuscules, chiffres et tirets uniquement</span>
                </div>

                <!-- Name -->
                <div class="form-group">
                  <label class="form-label">Nom de l'institution</label>
                  <input
                    v-model="form.name"
                    type="text"
                    class="form-input"
                    placeholder="ex: ESBTP Abidjan"
                    required
                  />
                </div>

                <!-- KLASSCI API URL -->
                <div class="form-group">
                  <label class="form-label">URL API KLASSCI</label>
                  <input
                    v-model="form.klassci_api_url"
                    type="url"
                    class="form-input"
                    placeholder="https://esbtp-abidjan.klassci.com/api/lms"
                    required
                  />
                </div>

                <!-- KLASSCI API Token -->
                <div class="form-group">
                  <label class="form-label">Token API KLASSCI</label>
                  <input
                    v-model="form.klassci_api_token"
                    type="password"
                    class="form-input"
                    :placeholder="editing ? 'Laisser vide pour conserver l\'existant' : 'Token d\'authentification'"
                  />
                </div>

                <!-- Two columns -->
                <div class="form-row">
                  <!-- Logo URL -->
                  <div class="form-group">
                    <label class="form-label">URL du Logo</label>
                    <input
                      v-model="form.logo_url"
                      type="text"
                      class="form-input"
                      placeholder="https://..."
                    />
                  </div>

                  <!-- Primary Color -->
                  <div class="form-group">
                    <label class="form-label">Couleur primaire</label>
                    <div class="color-input-wrapper">
                      <input
                        v-model="form.primary_color"
                        type="color"
                        class="form-color-input"
                      />
                      <input
                        v-model="form.primary_color"
                        type="text"
                        class="form-input form-color-text"
                        placeholder="#3b82f6"
                        maxlength="7"
                      />
                    </div>
                  </div>
                </div>

                <!-- Active Toggle -->
                <div class="form-group">
                  <label class="form-label">Statut</label>
                  <label class="toggle-label">
                    <input v-model="form.is_active" type="checkbox" class="toggle-input" />
                    <span class="toggle-switch"></span>
                    <span class="toggle-text">{{ form.is_active ? 'Active' : 'Inactive' }}</span>
                  </label>
                </div>
              </form>

              <!-- Validation errors -->
              <div v-if="formErrors" class="form-errors">
                <div v-for="(errors, field) in formErrors" :key="field" class="form-error-item">
                  <strong>{{ field }} :</strong> {{ errors.join(', ') }}
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button @click="$emit('close')" class="modal-btn modal-btn-secondary">Annuler</button>
              <button @click="$emit('save')" class="modal-btn modal-btn-primary" :disabled="saving">
                <i v-if="saving" class="fa fa-spinner fa-spin"></i>
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Connection Test Result Modal -->
      <Teleport to="body">
        <div v-if="connectionResult" class="modal-overlay" @click="$emit('close-result')">
          <div class="modal-content modal-sm" @click.stop>
            <div class="modal-header">
              <h2 class="modal-title">Test de Connexion KLASSCI</h2>
              <button @click="$emit('close-result')" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div :class="['connection-status', connectionResult.success ? 'connection-success' : 'connection-error']">
                <i :class="connectionResult.success ? 'fa fa-check-circle' : 'fa fa-times-circle'" class="connection-icon"></i>
                <p class="connection-message">{{ connectionResult.message }}</p>
                <div v-if="connectionResult.data" class="connection-details">
                  <div class="detail-item">
                    <span class="detail-label">URL :</span>
                    <span class="detail-value">{{ connectionResult.data.api_url }}</span>
                  </div>
                  <div v-if="connectionResult.data.status_code" class="detail-item">
                    <span class="detail-label">Status :</span>
                    <span class="detail-value">{{ connectionResult.data.status_code }}</span>
                  </div>
                  <div v-if="connectionResult.data.response_time_ms" class="detail-item">
                    <span class="detail-label">Temps :</span>
                    <span class="detail-value">{{ connectionResult.data.response_time_ms }}ms</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="$emit('close-result')" class="modal-btn modal-btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      </Teleport>
</template>

<script setup>
/**
 * Modales d'AdminInstitutions (#G1 décompo) : formulaire create/edit (form passé en
 * prop, champs édités via v-model sur form.* — référence partagée avec le parent) et
 * modale de résultat de test de connexion KLASSCI. Actions remontées par events.
 */
defineProps({
  showForm: { type: Boolean, default: false },
  form: { type: Object, required: true },
  editing: { type: Boolean, default: false },
  formErrors: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  connectionResult: { type: Object, default: null }
})
defineEmits(['close', 'save', 'close-result'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-modal';

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--spacing-lg);
}
.modal-content {
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}
.modal-sm {
  max-width: 480px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
}
.modal-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
.modal-icon {
  font-size: 1.5rem;
  color: #3b82f6;
}
.modal-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.modal-body {
  padding: var(--spacing-xl);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--border-color);
}
.modal-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.modal-btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
.modal-btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}
.modal-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}
.modal-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
/* Form */
.form-group {
  margin-bottom: var(--spacing-lg);
}
.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}
.form-input {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}
.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.input-readonly {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-hint {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: 4px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}
.color-input-wrapper {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}
.form-color-input {
  width: 48px;
  height: 42px;
  padding: 2px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: none;
}
.form-color-text {
  flex: 1;
}
/* Toggle */
.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}
.toggle-input {
  display: none;
}
.toggle-switch {
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  position: relative;
  transition: background var(--transition-fast);
}
.toggle-switch::after {
  content: '';
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-input:checked + .toggle-switch {
  background: #22c55e;
}
.toggle-input:checked + .toggle-switch::after {
  transform: translateX(20px);
}
.toggle-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}
/* Form Errors */
.form-errors {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-lg);
}
.form-error-item {
  font-size: var(--font-size-sm);
  color: #dc2626;
  margin-bottom: var(--spacing-xs);
}
.form-error-item:last-child {
  margin-bottom: 0;
}
/* Connection Result */
.connection-status {
  text-align: center;
  padding: var(--spacing-xl);
}
.connection-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}
.connection-success .connection-icon {
  color: #22c55e;
}
.connection-error .connection-icon {
  color: #ef4444;
}
.connection-message {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}
.connection-details {
  text-align: left;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}
.detail-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
}
.detail-item + .detail-item {
  border-top: 1px solid var(--border-color);
}
.detail-label {
  color: var(--text-secondary);
  font-weight: 500;
}
.detail-value {
  color: var(--text-primary);
  font-family: monospace;
  word-break: break-all;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: var(--spacing-md);
  }
}
</style>
