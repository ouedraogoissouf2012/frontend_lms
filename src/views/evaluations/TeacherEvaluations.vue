<template>
  <DashboardLayout>
    <div class="evaluations-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <DocumentTextIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">Évaluations</h1>
            <p class="page-subtitle">Gérez les évaluations en ligne de vos classes</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des évaluations..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <i class="fa fa-exclamation-triangle error-icon"></i>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadData" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Filters Card -->
        <div class="filters-card">
          <div class="filters-grid">
            <!-- Filtre Classe -->
            <div class="filter-item">
              <label class="filter-label">
                <UserGroupIcon class="w-4 h-4" />
                Classe
              </label>
              <select v-model="filters.classe_id" @change="applyFilters" class="filter-select">
                <option value="">Toutes les classes</option>
                <option v-for="classe in classes" :key="classe.id" :value="classe.id">
                  {{ classe.name || classe.libelle }}
                </option>
              </select>
            </div>

            <!-- Filtre Matière -->
            <div class="filter-item">
              <label class="filter-label">
                <BookOpenIcon class="w-4 h-4" />
                Matière
              </label>
              <select v-model="filters.matiere_id" @change="applyFilters" class="filter-select">
                <option value="">Toutes les matières</option>
                <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
                  {{ matiere.name || matiere.nom }}
                </option>
              </select>
            </div>

            <!-- Filtre Statut -->
            <div class="filter-item">
              <label class="filter-label">
                <FlagIcon class="w-4 h-4" />
                Statut
              </label>
              <select v-model="filters.statut" @change="applyFilters" class="filter-select">
                <option value="">Tous les statuts</option>
                <option value="planifiee">Planifiée</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
              </select>
            </div>

            <!-- Reset -->
            <div class="filter-item filter-actions">
              <button @click="resetFilters" class="btn-reset">
                <XMarkIcon class="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>

          <!-- Bouton masquer/supprimer les évaluations expirées sans version en ligne -->
          <div v-if="expiredWithoutOnlineCount > 0" class="expired-cleanup-bar">
            <div class="expired-info">
              <ClockIcon class="w-5 h-5 text-amber-500" />
              <span>
                <strong>{{ expiredWithoutOnlineCount }}</strong> évaluation(s) expirée(s) sans version en ligne
              </span>
            </div>
            <div class="expired-actions">
              <button
                v-if="!hideExpired"
                @click="hideExpired = true"
                class="btn-hide-expired"
              >
                <XMarkIcon class="w-4 h-4" />
                Masquer
              </button>
              <button
                v-else
                @click="hideExpired = false"
                class="btn-show-expired"
              >
                <EyeIcon class="w-4 h-4" />
                Afficher
              </button>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <DocumentTextIcon class="stat-icon text-blue-600" />
              <span class="stat-label">Total</span>
            </div>
            <p class="stat-value">{{ stats.total }}</p>
            <p class="stat-change">évaluations</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <ClockIcon class="stat-icon text-green-600" />
              <span class="stat-label">En cours</span>
            </div>
            <p class="stat-value">{{ stats.enCours }}</p>
            <p class="stat-change">actives</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <CheckCircleIcon class="stat-icon text-gray-600" />
              <span class="stat-label">Terminées</span>
            </div>
            <p class="stat-value">{{ stats.terminees }}</p>
            <p class="stat-change">ce mois</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <ComputerDesktopIcon class="stat-icon text-purple-600" />
              <span class="stat-label">En ligne</span>
            </div>
            <p class="stat-value">{{ stats.avecVersionEnLigne }}</p>
            <p class="stat-change">configurées</p>
          </div>
        </div>

        <!-- Evaluations List -->
        <div v-if="filteredEvaluations.length > 0" class="evaluations-list">
          <EvaluationCard
            v-for="evaluation in filteredEvaluations"
            :key="evaluation.id"
            :evaluation="evaluation"
            :syncing="syncing"
            @create="createOnlineVersion"
            @edit="editOnlineVersion"
            @view-results="viewResults"
            @publish="publishEvaluation"
            @preview="previewEvaluation"
            @sync="syncToKlassci"
            @delete="deleteEvaluation"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <DocumentTextIcon class="empty-icon" />
          <h3 class="empty-title">Aucune évaluation trouvée</h3>
          <p class="empty-message">
            {{ filters.classe_id || filters.matiere_id || filters.statut
              ? 'Aucune évaluation ne correspond à vos filtres'
              : 'Vos évaluations apparaîtront ici' }}
          </p>
          <button
            v-if="filters.classe_id || filters.matiere_id || filters.statut"
            @click="resetFilters"
            class="btn-empty"
          >
            Réinitialiser les filtres
          </button>
        </div>
      <!-- Modal: Create Online Version -->
      <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">Créer version en ligne</h2>
            <button @click="closeCreateModal" class="modal-close">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-info">
              <p class="info-text">
                <strong>Évaluation KLASSCI:</strong> {{ selectedEvaluation?.titre }}
              </p>
              <p class="info-text">
                <strong>Matière:</strong> {{ selectedEvaluation?.matiere?.nom || selectedEvaluation?.matiere?.name }}
              </p>
              <p class="info-text">
                <strong>Classe:</strong> {{ selectedEvaluation?.classe?.nom || selectedEvaluation?.classe?.libelle }}
              </p>
            </div>

            <form @submit.prevent="submitCreateOnlineVersion" class="modal-form">
              <div class="form-group">
                <label class="form-label required">Type d'évaluation</label>
                <select v-model="onlineForm.type" required class="form-select">
                  <option value="qcm">QCM uniquement</option>
                  <option value="qcm_multiple">QCM à choix multiples</option>
                  <option value="mixte">Mixte (QCM + réponses courtes)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label required">Durée (en minutes)</label>
                <input
                  v-model.number="onlineForm.duree_minutes"
                  type="number"
                  min="5"
                  max="240"
                  required
                  class="form-input"
                  placeholder="60"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Description / Consignes</label>
                <textarea
                  v-model="onlineForm.description"
                  rows="3"
                  class="form-textarea"
                  placeholder="Instructions pour les étudiants..."
                ></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" @click="closeCreateModal" class="btn-cancel">
                  Annuler
                </button>
                <button type="submit" :disabled="creating" class="btn-submit">
                  <ArrowPathIcon v-if="creating" class="w-5 h-5 animate-spin" />
                  <PlusIcon v-else class="w-5 h-5" />
                  {{ creating ? 'Création...' : 'Créer et ajouter des questions' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      </template>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import evaluationService from '@/services/evaluation'
// #28 : données déléguées au composable ; carte d'évaluation extraite en sous-composant
import { useTeacherEvaluations } from '@/composables/useTeacherEvaluations'
import EvaluationCard from '@/components/evaluations/EvaluationCard.vue'
import {
  DocumentTextIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  FlagIcon,
  XMarkIcon,
  PlusIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

// Données, filtres & dérivés délégués au composable (#28, tranche 2)
const {
  evaluationsLMS,
  classes,
  matieres,
  loading,
  error,
  hideExpired,
  filters,
  expiredWithoutOnlineCount,
  filteredEvaluations,
  stats,
  loadData,
  loadEvaluationsLMS,
  applyFilters,
  resetFilters
} = useTeacherEvaluations()

// État UI local aux actions (modale de création de version en ligne)
const syncing = ref(null)
const showCreateModal = ref(false)
const selectedEvaluation = ref(null)
const creating = ref(false)
const onlineForm = reactive({
  type: 'qcm',
  duree_minutes: 60,
  description: ''
})

// Statut (label/tooltip/badge/icône) + formatDate : déplacés dans EvaluationCard (#28).

// Create online version
function createOnlineVersion(evaluation) {
  selectedEvaluation.value = evaluation
  onlineForm.type = 'qcm'
  onlineForm.duree_minutes = 60
  onlineForm.description = ''
  showCreateModal.value = true
}

// Close modal
function closeCreateModal() {
  showCreateModal.value = false
  selectedEvaluation.value = null
  onlineForm.type = 'qcm'
  onlineForm.duree_minutes = 60
  onlineForm.description = ''
}

// Submit create online version
async function submitCreateOnlineVersion() {
  if (!selectedEvaluation.value) return

  // Vérifier côté frontend qu'une version en ligne n'existe pas déjà
  const alreadyExists = evaluationsLMS.value.some(
    e => e.klassci_evaluation_id === selectedEvaluation.value.id
  )
  if (alreadyExists) {
    alert('⚠ Une version en ligne existe déjà pour cette évaluation.')
    closeCreateModal()
    return
  }

  creating.value = true
  try {
    const newEvaluation = {
      klassci_evaluation_id: selectedEvaluation.value.id,
      klassci_matiere_id: selectedEvaluation.value.matiere?.id,
      klassci_classe_id: selectedEvaluation.value.classe?.id,
      titre: selectedEvaluation.value.titre,
      description: onlineForm.description || selectedEvaluation.value.description || '',
      type: onlineForm.type,
      date_evaluation: selectedEvaluation.value.programmation?.date_evaluation || selectedEvaluation.value.date_evaluation,
      duree_minutes: onlineForm.duree_minutes,
      coefficient: selectedEvaluation.value.programmation?.coefficient || selectedEvaluation.value.coefficient || 1,
      bareme: selectedEvaluation.value.programmation?.bareme || selectedEvaluation.value.bareme || 20,
      questions: []
    }

    console.log('[CREATE] Création évaluation LMS:', newEvaluation)
    const result = await evaluationService.createEvaluation(newEvaluation)

    if (result.success) {
      console.log('[SUCCESS] Évaluation créée:', result.data)
      alert('✓ Version en ligne créée! Vous pouvez maintenant ajouter des questions.')
      
      // Reload evaluations
      await loadEvaluationsLMS()
      
      // Close modal
      closeCreateModal()
      
      // TODO: Rediriger vers page d'édition des questions
      // router.push({ name: 'EditQuestions', params: { id: result.data.id } })
    }
  } catch (err) {
    console.error('[ERREUR] Création évaluation:', err)
    if (err.response?.status === 409) {
      alert('⚠ Une version en ligne existe déjà pour cette évaluation.')
      await loadEvaluationsLMS()
      closeCreateModal()
    } else {
      alert('⚠ Erreur lors de la création de la version en ligne')
    }
  } finally {
    creating.value = false
  }
}

// Edit online version
function editOnlineVersion(evaluation) {
  if (!evaluation.online_version) return

  router.push({
    name: 'EditQuestions',
    params: { id: evaluation.online_version.id },
    query: {
      klassci_id: evaluation.id
    }
  })
}

// View results
function viewResults(evaluation) {
  if (!evaluation.online_version) return

  router.push({
    name: 'EvaluationCorrections',
    params: { id: evaluation.online_version.id }
  })
}

// Sync to KLASSCI
async function syncToKlassci(evaluation) {
  if (!evaluation.online_version) return

  const submissionsCount = evaluation.online_version.submissions_count || 0
  if (submissionsCount === 0) {
    alert('Aucune soumission à synchroniser')
    return
  }

  if (!confirm(`Synchroniser ${submissionsCount} note(s) vers KLASSCI ?`)) {
    return
  }

  syncing.value = evaluation.id
  try {
    const result = await evaluationService.syncToKlassci(evaluation.online_version.id)
    if (result.success) {
      alert('✓ Notes synchronisées avec succès vers KLASSCI !')
      await loadEvaluationsLMS()
    }
  } catch (err) {
    console.error('[ERREUR] Synchronisation:', err)
    alert('⚠ Erreur lors de la synchronisation')
  } finally {
    syncing.value = null
  }
}

// Publish evaluation
async function publishEvaluation(evaluation) {
  if (!evaluation.online_version) return

  const questionsCount = evaluation.online_version.questions_count || 0
  if (questionsCount === 0) {
    alert('Impossible de publier : ajoutez d\'abord des questions à cette évaluation.')
    return
  }

  if (!confirm(`Publier "${evaluation.titre}" ? Les étudiants pourront la voir.`)) {
    return
  }

  try {
    const result = await evaluationService.publishEvaluation(evaluation.online_version.id)
    if (result.success) {
      alert('Évaluation publiée avec succès !')
      await loadEvaluationsLMS()
    }
  } catch (err) {
    console.error('[ERREUR] Publication:', err)
    const message = err.response?.data?.message || 'Erreur lors de la publication'
    alert(message)
  }
}

// Preview evaluation
function previewEvaluation(evaluation) {
  if (!evaluation.online_version) return

  router.push({
    name: 'PreviewEvaluation',
    params: { id: evaluation.online_version.id }
  })
}

// Delete evaluation
async function deleteEvaluation(evaluation) {
  if (!evaluation.online_version) return

  if (!confirm(`Supprimer la version en ligne de "${evaluation.titre}" ? Cette action est irréversible.`)) {
    return
  }

  try {
    const result = await evaluationService.deleteEvaluation(evaluation.online_version.id)
    if (result.success) {
      alert('Version en ligne supprimée.')
      await loadEvaluationsLMS()
    }
  } catch (err) {
    console.error('[ERREUR] Suppression:', err)
    const message = err.response?.data?.message || 'Erreur lors de la suppression'
    alert(message)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.evaluations-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

/* Error State */
.error-state {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  font-size: 2rem;
  line-height: 1;
}

.error-title {
  font-size: 1rem;
  font-weight: 600;
  color: #c00;
  margin: 0 0 0.25rem 0;
}

.error-message {
  font-size: 0.875rem;
  color: #900;
  margin: 0;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #b91c1c;
}

/* Filters Card */
.filters-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  align-items: end;
}

.expired-cleanup-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 0.5rem;
  gap: 1rem;
}

.expired-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.expired-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-hide-expired,
.btn-show-expired {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-hide-expired:hover,
.btn-show-expired:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--primary-color);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.btn-reset:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Statistics */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.stat-change {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Evaluations List */
.evaluations-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
}

.empty-icon {
  width: 6rem;
  height: 6rem;
  color: var(--text-tertiary);
  margin: 0 auto 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-message {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.btn-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-empty:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .evaluations-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .eval-info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .eval-actions {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }

  .online-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Modal Styles */
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
  padding: 1rem;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-text {
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0.25rem 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-submit {
  background: #3b82f6;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #2563eb;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
