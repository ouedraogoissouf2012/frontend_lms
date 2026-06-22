<template>
  <Teleport to="body">
    <div v-if="user" class="modal-overlay" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title-section">
            <div class="modal-avatar" :class="'avatar-' + user.role">
              <span>{{ getInitials(user) }}</span>
            </div>
            <div>
              <h2 class="modal-title">{{ user.name }}</h2>
              <p class="modal-subtitle">{{ getRoleLabel(user.role) }}</p>
            </div>
          </div>
          <button @click="$emit('close')" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="info-section">
            <h3 class="section-title"><i class="fa fa-user"></i> Informations</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nom complet:</span>
                <span class="info-value">{{ user.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">{{ user.email || 'Non disponible' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Rôle:</span>
                <span class="info-value">
                  <span class="role-badge" :class="'role-' + user.role">
                    {{ getRoleLabel(user.role) }}
                  </span>
                </span>
              </div>
              <div v-if="user.classe_nom" class="info-item">
                <span class="info-label">Classe:</span>
                <span class="info-value">{{ user.classe_nom }}</span>
              </div>
              <div v-if="user.klassci_id" class="info-item">
                <span class="info-label">KLASSCI ID:</span>
                <span class="info-value">#{{ user.klassci_id }}</span>
              </div>
              <div v-if="user.matricule" class="info-item">
                <span class="info-label">Matricule:</span>
                <span class="info-value">{{ user.matricule }}</span>
              </div>
              <div v-if="user.telephone" class="info-item">
                <span class="info-label">Téléphone:</span>
                <span class="info-value">{{ user.telephone }}</span>
              </div>
              <div v-if="user.specialization" class="info-item">
                <span class="info-label">Spécialisation:</span>
                <span class="info-value">{{ user.specialization }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="$emit('close')" class="modal-btn modal-btn-secondary">Fermer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * Modale de détail d'un utilisateur (#G1 décompo — extraite d'AdminUsers.vue).
 * Présentation pure : reçoit l'utilisateur, émet `close`. Le rendu est conditionné
 * par `user` (null = fermée), comme l'original (v-if="selectedUser").
 */
import { getInitials } from '@/utils/formatters'
import { getRoleLabel } from '@/utils/userRoles'

defineProps({
  user: { type: Object, default: null }
})
defineEmits(['close'])
</script>

<style scoped lang="scss">
// Styles partagés (hover) + badges/avatars communs table↔modale (source unique)
@use '../../assets/styles/admin-shared';
@use '../../assets/styles/admin-badges';

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-xl);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.modal-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 4px 0 0 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all var(--transition-fast);
}

.modal-body {
  padding: var(--spacing-xl);
}

.info-section {
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-title i {
  color: var(--primary-color);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--border-color);
}

.modal-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  border-radius: var(--radius-lg);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>