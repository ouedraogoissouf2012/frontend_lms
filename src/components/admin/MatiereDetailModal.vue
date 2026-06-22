<template>
  <!-- Modal Détails Matière (optional full details) -->
  <Teleport to="body">
    <div v-if="matiere" class="modal-overlay" @click="$emit('close')">
      <div class="modal-container modal-matiere" @click.stop>
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-header-content">
            <BookOpenIcon class="modal-icon" />
            <div>
              <h2 class="modal-title">{{ matiere?.nom }}</h2>
              <p class="modal-subtitle">{{ matiere?.code }}</p>
            </div>
          </div>
          <button @click="$emit('close')" class="modal-close">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Modal Body - Details -->
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Coefficient</span>
              <span class="detail-value">{{ matiere?.coefficient || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Heures totales</span>
              <span class="detail-value">{{ matiere?.heures_total || 0 }}h</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Séances programmées</span>
              <span class="detail-value">{{ matiere?.nb_seances_programmees || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Couleur</span>
              <div class="color-preview" :style="{ backgroundColor: matiere?.couleur }"></div>
            </div>
          </div>

          <div v-if="matiere?.description" class="detail-section">
            <h3 class="detail-section-title">Description</h3>
            <p class="detail-description">{{ matiere.description }}</p>
          </div>

          <div v-if="matiere?.combinaisons?.length > 0" class="detail-section">
            <h3 class="detail-section-title">Combinaisons Filière/Niveau</h3>
            <div class="combinaisons-list">
              <div
                v-for="(combi, idx) in matiere.combinaisons"
                :key="idx"
                class="combinaison-item"
              >
                <span class="combinaison-filiere">
                  {{ combi.filiere?.nom || combi.filiere?.code || '-' }}
                </span>
                <span class="combinaison-separator">→</span>
                <span class="combinaison-niveau">
                  {{ combi.niveau?.nom || combi.niveau?.code || '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * Modale détail Matière (#G1 décompo) : détails d'une matière (coef, heures,
 * séances, couleur, description, combinaisons filière/niveau).
 */
import { BookOpenIcon, XMarkIcon } from '@heroicons/vue/24/outline'

defineProps({
  matiere: { type: Object, default: null }
})
defineEmits(['close'])
</script>

<style scoped lang="scss">
/* Chrome de base (overlay/container/header/body + @media .modal-container) :
   @use matiere-modal. Rendu identique à MatiereModals.vue ; ci-dessous le spécifique. */
@use '../../assets/styles/matiere-modal';

.modal-matiere {
  max-width: 700px;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.detail-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}
.color-preview {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  border: 2px solid var(--border-color);
}
/* Detail Section */
.detail-section {
  margin-top: 2rem;
}
.detail-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}
.detail-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
/* Combinaisons List */
.combinaisons-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.combinaison-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--hover-bg);
  border-radius: 0.5rem;
}
.combinaison-filiere,
.combinaison-niveau {
  padding: 0.375rem 0.75rem;
  background: var(--card-bg);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}
.combinaison-separator {
  color: var(--text-tertiary);
}

/* .modal-container @media est fourni par matiere-modal ; ici la spécificité grille. */
@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
