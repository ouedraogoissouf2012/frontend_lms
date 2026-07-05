<template>
  <Modal
    :model-value="Boolean(enseignant)"
    size="lg"
    class="enseignant-detail-modal"
    @close="$emit('close')"
  >
    <template #header>
      <div v-if="enseignant" class="modal-title-section">
        <div class="modal-avatar">
          <span>{{ getInitials(enseignant) }}</span>
        </div>
        <div>
          <h2 class="modal-title">{{ enseignant.nom }} {{ enseignant.prenom }}</h2>
          <p class="modal-subtitle">{{ enseignant.email }}</p>
        </div>
      </div>
    </template>

    <template v-if="enseignant">
      <!-- Informations Personnelles -->
      <div class="info-section">
        <h3 class="section-title"><i class="fa fa-user"></i> Informations Personnelles</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">{{ enseignant.email || 'Non disponible' }}</span>
          </div>
          <div v-if="enseignant.matricule" class="info-item">
            <span class="info-label">Matricule:</span>
            <span class="info-value">{{ enseignant.matricule }}</span>
          </div>
          <div v-if="enseignant.specialization" class="info-item">
            <span class="info-label">Spécialisation:</span>
            <span class="info-value">{{ enseignant.specialization }}</span>
          </div>
          <div v-if="enseignant.status" class="info-item">
            <span class="info-label">Statut:</span>
            <span class="info-value">{{ enseignant.status }}</span>
          </div>
          <div v-if="enseignant.telephone" class="info-item">
            <span class="info-label">Téléphone:</span>
            <span class="info-value">{{ enseignant.telephone }}</span>
          </div>
          <div v-if="enseignant.teacher_id" class="info-item">
            <span class="info-label">Teacher ID:</span>
            <span class="info-value">{{ enseignant.teacher_id }}</span>
          </div>
        </div>
      </div>

      <!-- Statistiques globales (si disponibles) -->
      <div v-if="enseignant.statistiques" class="info-section">
        <h3 class="section-title"><i class="fa fa-bar-chart"></i> Statistiques Globales</h3>
        <EnseignantStatsGrid :stats="enseignant.statistiques" />
      </div>

      <!-- Classes Assignées -->
      <div class="info-section">
        <h3 class="section-title"><i class="fa fa-users"></i> Classes Assignées ({{ getEnseignantUniqueClasses(enseignant).length }})</h3>
        <EnseignantClassesList :classes="getEnseignantUniqueClasses(enseignant)" />
      </div>

      <!-- Matières Enseignées -->
      <div class="info-section">
        <h3 class="section-title"><i class="fa fa-book"></i> Matières Enseignées ({{ safeMatieres.length }})</h3>
        <EnseignantMatieresList :matieres="safeMatieres" />
      </div>
    </template>

    <template #footer>
      <BaseButton variant="secondary" class="modal-btn modal-btn-secondary" @click="$emit('close')">
        Fermer
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale de détail d'un enseignant (#G1 décompo — extraite d'AdminEnseignants).
 * Présentation : reçoit l'enseignant, émet close. Rendu conditionné par enseignant.
 * Le shell (header/avatar/footer) et les sections de body sont composés depuis des
 * sous-composants présentationnels (Stats / Classes / Matières), chacun avec son CSS.
 */
import { computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { getInitials } from '@/utils/formatters'
import { getEnseignantUniqueClasses } from '@/utils/enseignants'
import EnseignantStatsGrid from '@/components/admin/EnseignantStatsGrid.vue'
import EnseignantClassesList from '@/components/admin/EnseignantClassesList.vue'
import EnseignantMatieresList from '@/components/admin/EnseignantMatieresList.vue'

const props = defineProps({ enseignant: { type: Object, default: null } })
defineEmits(['close'])

const safeMatieres = computed(() =>
  Array.isArray(props.enseignant?.matieres)
    ? props.enseignant.matieres.filter(matiere => matiere && typeof matiere === 'object')
    : []
)
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-modal';

.modal-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.modal-avatar {
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-xl);
  color: white;
}

.modal-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.modal-subtitle {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin: 0;
}

.info-section {
  margin-bottom: var(--spacing-xl);
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: var(--font-size-md);
  color: var(--text-primary);
  font-weight: 500;
}

.modal-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-btn-secondary {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
