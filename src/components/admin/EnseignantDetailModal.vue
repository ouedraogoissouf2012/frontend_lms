<template>
      <Teleport to="body">
        <div v-if="enseignant" class="modal-overlay" @click="$emit('close')">
          <div class="modal-content" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-title-section">
                <div class="modal-avatar">
                  <span>{{ getInitials(enseignant) }}</span>
                </div>
                <div>
                  <h2 class="modal-title">{{ enseignant.nom }} {{ enseignant.prenom }}</h2>
                  <p class="modal-subtitle">{{ enseignant.email }}</p>
                </div>
              </div>
              <button @click="$emit('close')" class="close-btn">✕</button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
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
                <div class="stats-detail-grid">
                  <div class="stat-detail-card">
                    <i class="fa fa-building stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ enseignant.statistiques.total_classes }}</span>
                      <span class="stat-detail-label">Classes</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-book stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ enseignant.statistiques.total_matieres }}</span>
                      <span class="stat-detail-label">Matières</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-check-circle stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ enseignant.statistiques.total_heures_effectuees }}h</span>
                      <span class="stat-detail-label">Heures effectuées</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-clock-o stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ enseignant.statistiques.total_heures_prevues }}h</span>
                      <span class="stat-detail-label">Heures prévues</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-pie-chart stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ enseignant.statistiques.taux_realisation_global.toFixed(1) }}%</span>
                      <span class="stat-detail-label">Taux réalisation</span>
                    </div>
                  </div>
                  <div class="stat-detail-card">
                    <i class="fa fa-calendar-check-o stat-detail-icon"></i>
                    <div class="stat-detail-content">
                      <span class="stat-detail-value">{{ enseignant.statistiques.nb_seances_effectuees }}/{{ enseignant.statistiques.nb_seances_total }}</span>
                      <span class="stat-detail-label">Séances</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Classes Assignées -->
              <div class="info-section">
                <h3 class="section-title"><i class="fa fa-users"></i> Classes Assignées ({{ getEnseignantUniqueClasses(enseignant).length }})</h3>
                <div v-if="getEnseignantUniqueClasses(enseignant).length > 0" class="classes-detail-list">
                  <div
                    v-for="classe in getEnseignantUniqueClasses(enseignant)"
                    :key="classe.id"
                    class="classe-detail-card"
                  >
                    <div class="classe-detail-name">{{ classe.nom || 'Classe sans nom' }}</div>
                    <div v-if="classe.filiere || classe.niveau" class="classe-detail-info">
                      <span v-if="classe.filiere" class="badge badge-filiere">{{ classe.filiere }}</span>
                      <span v-if="classe.niveau" class="badge badge-niveau">{{ classe.niveau }}</span>
                    </div>
                  </div>
                </div>
                <p v-else class="no-data">Aucune classe assignée</p>
              </div>

              <!-- Matières Enseignées -->
              <div class="info-section">
                <h3 class="section-title"><i class="fa fa-book"></i> Matières Enseignées ({{ enseignant.matieres?.length || 0 }})</h3>
                <div v-if="enseignant.matieres?.length > 0" class="matieres-detail-list">
                  <div
                    v-for="matiere in enseignant.matieres"
                    :key="matiere.id"
                    class="matiere-detail-card"
                  >
                    <div class="matiere-detail-header">
                      <h4 class="matiere-detail-name">{{ matiere.nom || 'Matière sans nom' }}</h4>
                      <span v-if="matiere.code" class="matiere-code">{{ matiere.code }}</span>
                    </div>

                    <!-- Stats de la matière si disponibles -->
                    <div v-if="matiere.heures_prevues" class="matiere-detail-stats">
                      <div class="matiere-stat">
                        <span class="matiere-stat-label">Heures:</span>
                        <span class="matiere-stat-value">{{ matiere.heures_effectuees }}h / {{ matiere.heures_prevues }}h</span>
                      </div>
                      <div class="matiere-stat">
                        <span class="matiere-stat-label">Taux:</span>
                        <span class="matiere-stat-value">{{ matiere.taux_realisation.toFixed(0) }}%</span>
                      </div>
                      <div class="matiere-stat">
                        <span class="matiere-stat-label">Séances:</span>
                        <span class="matiere-stat-value">{{ matiere.nb_seances_effectuees }}/{{ matiere.nb_seances_total }}</span>
                      </div>
                    </div>

                    <!-- Classes pour cette matière -->
                    <div v-if="matiere.classes && matiere.classes.length > 0" class="matiere-classes">
                      <span class="matiere-classes-label">Classes:</span>
                      <span
                        v-for="(c, idx) in matiere.classes"
                        :key="c.id"
                        class="matiere-classe-tag"
                      >{{ c.nom }}<span v-if="idx < matiere.classes.length - 1">,</span></span>
                    </div>
                  </div>
                </div>
                <p v-else class="no-data">Aucune matière assignée</p>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button @click="$emit('close')" class="modal-btn modal-btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      </Teleport>
</template>

<script setup>
/**
 * Modale de détail d'un enseignant (#G1 décompo — extraite d'AdminEnseignants).
 * Présentation : reçoit l'enseignant, émet close. Rendu conditionné par enseignant.
 */
import { getInitials } from '@/utils/formatters'
import { getEnseignantUniqueClasses } from '@/utils/enseignants'

defineProps({ enseignant: { type: Object, default: null } })
defineEmits(['close'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

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

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  line-height: 1;
}

.modal-body {
  padding: var(--spacing-xl);
  overflow-y: auto;
  flex: 1;
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

.no-data {
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

.modal-footer {
  padding: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
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

/* Stats Detail Grid */
.stats-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.stat-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-detail-icon {
  font-size: 1.5rem;
}

.stat-detail-content {
  display: flex;
  flex-direction: column;
}

.stat-detail-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-detail-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Classes Detail */
.classes-detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.classe-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.classe-detail-name {
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.classe-detail-info {
  display: flex;
  gap: var(--spacing-xs);
}

.badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.badge-filiere {
  background: #dbeafe;
  color: #1e40af;
}

.badge-niveau {
  background: #fef3c7;
  color: #92400e;
}

/* Matières Detail */
.matieres-detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.matiere-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.matiere-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-md);
}

.matiere-detail-name {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.matiere-code {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background: var(--card-bg);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.matiere-detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--card-bg);
  border-radius: var(--radius-md);
}

.matiere-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.matiere-stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.matiere-stat-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.matiere-classes {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  font-size: var(--font-size-sm);
}

.matiere-classes-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.matiere-classe-tag {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .stats-detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .matiere-detail-stats {
    grid-template-columns: 1fr;
  }

  .classe-detail-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
