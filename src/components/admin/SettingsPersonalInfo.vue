<template>
  <div class="settings-section">
    <div class="section-header">
      <UserIcon class="section-icon" />
      <h2 class="section-title">Informations Personnelles</h2>
    </div>
    <div class="section-body">
      <div class="info-grid">
        <div class="info-item">
          <label class="info-label">Nom complet</label>
          <p class="info-value">{{ user?.nom }} {{ user?.prenom }}</p>
        </div>
        <div class="info-item">
          <label class="info-label">Email</label>
          <p class="info-value">{{ user?.email || 'Non renseigné' }}</p>
        </div>
        <div class="info-item">
          <label class="info-label">Téléphone</label>
          <p class="info-value">{{ user?.telephone || 'Non renseigné' }}</p>
        </div>
        <div class="info-item">
          <label class="info-label">Rôle</label>
          <p class="info-value">{{ getRoleLabel(user?.role) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Informations Personnelles » d'AdminSettings (#H3 ≤300). Présentation
 * pure : affiche l'utilisateur et le libellé de rôle reçus en props. Aucun appel API.
 */
import { UserIcon } from '@heroicons/vue/24/outline'

defineProps({
  user: { type: Object, default: null },
  getRoleLabel: { type: Function, required: true },
})
</script>

<style scoped>
.settings-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.section-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--text-secondary);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin: 0;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
