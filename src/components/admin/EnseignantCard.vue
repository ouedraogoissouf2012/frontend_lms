<template>
  <div class="enseignant-card" @click="$emit('view', enseignant)">
    <!-- Avatar & Header -->
    <div class="enseignant-header">
      <div class="enseignant-avatar">
        <span>{{ getInitials(enseignant) }}</span>
      </div>
      <div class="enseignant-info">
        <h3 class="enseignant-name">{{ enseignant.nom }} {{ enseignant.prenom }}</h3>
        <p class="enseignant-email">{{ enseignant.email || 'Email non disponible' }}</p>
      </div>
    </div>

    <!-- Enseignant Details -->
    <div class="enseignant-details">
      <!-- Matières -->
      <div class="detail-row">
        <i class="fa fa-bars detail-icon"></i>
        <span class="detail-label">Matières:</span>
        <span class="detail-value">{{ (enseignant.matieres?.length || 0) }}</span>
      </div>

      <!-- Classes -->
      <div class="detail-row">
        <i class="fa fa-th-large detail-icon"></i>
        <span class="detail-label">Classes:</span>
        <span class="detail-value">{{ getEnseignantClassesCount(enseignant) }}</span>
      </div>

      <!-- Téléphone -->
      <div v-if="enseignant.telephone" class="detail-row">
        <span class="detail-icon">☎</span>
        <span class="detail-label">Téléphone:</span>
        <span class="detail-value">{{ enseignant.telephone }}</span>
      </div>

      <!-- KLASSCI ID -->
      <div v-if="enseignant.klassci_id" class="detail-row">
        <span class="detail-icon">#</span>
        <span class="detail-label">KLASSCI ID:</span>
        <span class="detail-value">{{ enseignant.klassci_id }}</span>
      </div>
    </div>

    <!-- Tags -->
    <div class="enseignant-tags">
      <span v-if="enseignant.matieres?.length > 0" class="tag tag-matiere">
        {{ enseignant.matieres.length }} matière{{ enseignant.matieres.length > 1 ? 's' : '' }}
      </span>
      <span v-if="getEnseignantClassesCount(enseignant) > 0" class="tag tag-classe">
        {{ getEnseignantClassesCount(enseignant) }} classe{{ getEnseignantClassesCount(enseignant) > 1 ? 's' : '' }}
      </span>
    </div>

    <!-- View Details Button -->
    <button class="view-details-btn">
      <span>Voir détails</span>
      <span class="arrow">→</span>
    </button>
  </div>
</template>

<script setup>
/**
 * Carte d'un enseignant dans la grille AdminEnseignants (#G1 ≤300). Présentation
 * pure : reçoit l'enseignant en prop, émet `view` au clic. Les comptages utilisent
 * la logique métier pure (#28) ; le formatage des initiales vient de formatters.
 */
import { getInitials } from '@/utils/formatters'
import { getEnseignantClassesCount } from '@/utils/enseignants'

defineProps({
  enseignant: { type: Object, required: true },
})
defineEmits(['view'])
</script>

<style scoped lang="scss">
.enseignant-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.enseignant-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

/* Enseignant Header */
.enseignant-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.enseignant-avatar {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-lg);
  color: white;
}

.enseignant-info {
  flex: 1;
  overflow: hidden;
}

.enseignant-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.enseignant-email {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Enseignant Details */
.enseignant-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.detail-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  color: var(--text-secondary);
}

.detail-label {
  color: var(--text-secondary);
  min-width: 80px;
}

.detail-value {
  color: var(--text-primary);
  font-weight: 500;
  flex: 1;
}

/* Tags */
.enseignant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
}

.tag {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.tag-matiere {
  background: var(--sky-100);
  color: var(--sky-700);
}

:global(.dark) .tag-matiere {
  background: rgba(14, 165, 233, 0.2);
  color: var(--sky-300);
}

.tag-classe {
  background: var(--emerald-50);
  color: var(--emerald-700);
}

:global(.dark) .tag-classe {
  background: rgba(34, 197, 94, 0.2);
  color: var(--success-border);
}

/* View Details Button */
.view-details-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: var(--hover-bg);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-top: var(--spacing-sm);
}

.view-details-btn:hover {
  background: var(--blue-500);
  color: white;
  transform: translateY(-2px);
}

:global(.dark) .view-details-btn:hover {
  background: var(--primary-gradient);
}

.arrow {
  font-size: 1.25rem;
}
</style>
