<template>
  <DashboardLayout>
    <div class="admin-institutions-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Gestion des Institutions</h1>
          <p class="page-subtitle">Administration globale des institutions KLASSCI</p>
        </div>
        <div class="header-actions">
          <button @click="loadInstitutions" class="refresh-btn" :disabled="loading">
            <i class="fa fa-refresh btn-icon"></i>
            <span class="btn-text">Actualiser</span>
          </button>
          <button @click="openCreateModal" class="create-btn">
            <i class="fa fa-plus btn-icon"></i>
            <span class="btn-text">Nouvelle Institution</span>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <i class="fa fa-university stat-icon"></i>
          <div class="stat-details">
            <span class="stat-value">{{ overview.total_institutions || 0 }}</span>
            <span class="stat-label">Institutions</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa fa-check-circle stat-icon stat-icon-green"></i>
          <div class="stat-details">
            <span class="stat-value">{{ overview.active_institutions || 0 }}</span>
            <span class="stat-label">Actives</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa fa-users stat-icon stat-icon-blue"></i>
          <div class="stat-details">
            <span class="stat-value">{{ overview.total_users || 0 }}</span>
            <span class="stat-label">Utilisateurs</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa fa-book stat-icon stat-icon-purple"></i>
          <div class="stat-details">
            <span class="stat-value">{{ totalContent }}</span>
            <span class="stat-label">Contenus</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des institutions..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <h3 class="error-title">Erreur de Chargement</h3>
        <p class="error-message">{{ error }}</p>
        <button @click="loadInstitutions" class="retry-btn">Ressayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="institutionsList.length === 0" class="empty-state">
        <i class="fa fa-university empty-icon"></i>
        <h3 class="empty-title">Aucune Institution</h3>
        <p class="empty-message">Aucune institution n'a encore ete creee.</p>
        <button @click="openCreateModal" class="retry-btn" style="margin-top: 16px;">Creer une institution</button>
      </div>

      <!-- Institutions Table -->
      <div v-else class="table-container">
        <table class="institutions-table">
          <thead>
            <tr>
              <th>Institution</th>
              <th>Slug</th>
              <th>Statut</th>
              <th class="text-center">Utilisateurs</th>
              <th class="text-center">Cours</th>
              <th class="text-center">Evaluations</th>
              <th>Derniere activite</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inst in institutionsList" :key="inst.id" class="table-row">
              <td>
                <div class="inst-name-cell">
                  <div class="inst-avatar" :style="{ backgroundColor: inst.primary_color || '#3b82f6' }">
                    {{ inst.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="inst-name">{{ inst.name }}</div>
                    <div class="inst-url">{{ inst.klassci_api_url }}</div>
                  </div>
                </div>
              </td>
              <td>
                <code class="slug-badge">{{ inst.slug }}</code>
              </td>
              <td>
                <span :class="['status-badge', inst.is_active ? 'status-active' : 'status-inactive']">
                  {{ inst.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-center">{{ inst.stats.users_count }}</td>
              <td class="text-center">{{ inst.stats.lessons_count }}</td>
              <td class="text-center">{{ inst.stats.evaluations_count }}</td>
              <td>{{ formatDate(inst.stats.last_activity) }}</td>
              <td>
                <div class="actions-cell">
                  <button @click="openEditModal(inst)" class="action-btn" title="Modifier">
                    <i class="fa fa-pencil"></i>
                  </button>
                  <button
                    @click="toggleStatus(inst)"
                    class="action-btn"
                    :class="inst.is_active ? 'action-btn-green' : 'action-btn-gray'"
                    :title="inst.is_active ? 'Desactiver' : 'Activer'"
                  >
                    <i :class="inst.is_active ? 'fa fa-toggle-on' : 'fa fa-toggle-off'"></i>
                  </button>
                  <button
                    @click="testConnection(inst)"
                    class="action-btn action-btn-blue"
                    :disabled="testingId === inst.id"
                    title="Tester connexion KLASSCI"
                  >
                    <i :class="testingId === inst.id ? 'fa fa-spinner fa-spin' : 'fa fa-plug'"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create/Edit Modal -->
      <Teleport to="body">
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <div class="modal-title-section">
                <i class="fa fa-university modal-icon"></i>
                <h2 class="modal-title">{{ editingInstitution ? 'Modifier l\'Institution' : 'Nouvelle Institution' }}</h2>
              </div>
              <button @click="closeModal" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <form @submit.prevent="saveInstitution">
                <!-- Slug -->
                <div class="form-group">
                  <label class="form-label">Slug (identifiant unique)</label>
                  <input
                    v-model="form.slug"
                    type="text"
                    class="form-input"
                    placeholder="ex: esbtp-abidjan"
                    :readonly="!!editingInstitution"
                    :class="{ 'input-readonly': !!editingInstitution }"
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
                    :placeholder="editingInstitution ? 'Laisser vide pour conserver l\'existant' : 'Token d\'authentification'"
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
              <button @click="closeModal" class="modal-btn modal-btn-secondary">Annuler</button>
              <button @click="saveInstitution" class="modal-btn modal-btn-primary" :disabled="saving">
                <i v-if="saving" class="fa fa-spinner fa-spin"></i>
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Connection Test Result Modal -->
      <Teleport to="body">
        <div v-if="connectionResult" class="modal-overlay" @click="connectionResult = null">
          <div class="modal-content modal-sm" @click.stop>
            <div class="modal-header">
              <h2 class="modal-title">Test de Connexion KLASSCI</h2>
              <button @click="connectionResult = null" class="close-btn">&times;</button>
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
              <button @click="connectionResult = null" class="modal-btn modal-btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { institutions as institutionsApi } from '@/services/api'

// State
const institutionsList = ref([])
const overview = ref({})
const loading = ref(true)
const error = ref(null)

// Modal state
const showModal = ref(false)
const editingInstitution = ref(null)
const saving = ref(false)
const formErrors = ref(null)

// Connection test state
const testingId = ref(null)
const connectionResult = ref(null)

// Form
const form = ref({
  slug: '',
  name: '',
  klassci_api_url: '',
  klassci_api_token: '',
  logo_url: '',
  primary_color: '#3b82f6',
  is_active: true,
})

// Computed
const totalContent = computed(() => {
  return (overview.value.total_lessons || 0) + (overview.value.total_evaluations || 0)
})

// Load institutions
async function loadInstitutions() {
  try {
    loading.value = true
    error.value = null
    const response = await institutionsApi.getAll()
    if (response.success) {
      institutionsList.value = response.data.institutions
      overview.value = response.data.overview
    }
  } catch (err) {
    console.error('Erreur chargement institutions:', err)
    error.value = err.response?.data?.message || err.message || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

// Open create modal
function openCreateModal() {
  editingInstitution.value = null
  formErrors.value = null
  form.value = {
    slug: '',
    name: '',
    klassci_api_url: '',
    klassci_api_token: '',
    logo_url: '',
    primary_color: '#3b82f6',
    is_active: true,
  }
  showModal.value = true
}

// Open edit modal
function openEditModal(inst) {
  editingInstitution.value = inst
  formErrors.value = null
  form.value = {
    slug: inst.slug,
    name: inst.name,
    klassci_api_url: inst.klassci_api_url,
    klassci_api_token: '',
    logo_url: inst.logo_url || '',
    primary_color: inst.primary_color || '#3b82f6',
    is_active: inst.is_active,
  }
  showModal.value = true
}

// Save institution (create or update)
async function saveInstitution() {
  try {
    saving.value = true
    formErrors.value = null

    const payload = { ...form.value }
    // Ne pas envoyer un token vide en update (conserve l'existant)
    if (editingInstitution.value && !payload.klassci_api_token) {
      delete payload.klassci_api_token
    }
    // Nettoyer logo_url vide
    if (!payload.logo_url) {
      payload.logo_url = null
    }

    if (editingInstitution.value) {
      await institutionsApi.update(editingInstitution.value.id, payload)
    } else {
      await institutionsApi.create(payload)
    }

    showModal.value = false
    await loadInstitutions()
  } catch (err) {
    if (err.response?.status === 422 && err.response?.data?.errors) {
      formErrors.value = err.response.data.errors
    } else {
      formErrors.value = { general: [err.response?.data?.message || err.message || 'Erreur'] }
    }
  } finally {
    saving.value = false
  }
}

// Toggle active/inactive
async function toggleStatus(inst) {
  try {
    await institutionsApi.toggle(inst.id)
    await loadInstitutions()
  } catch (err) {
    alert(err.response?.data?.message || 'Erreur lors du changement de statut')
  }
}

// Test KLASSCI connection
async function testConnection(inst) {
  try {
    testingId.value = inst.id
    const response = await institutionsApi.testConnection(inst.id)
    connectionResult.value = response
  } catch (err) {
    connectionResult.value = {
      success: false,
      message: err.response?.data?.message || 'Erreur de connexion',
      data: err.response?.data?.data || null,
    }
  } finally {
    testingId.value = null
  }
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'Aucune'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Close modal
function closeModal() {
  showModal.value = false
  editingInstitution.value = null
  formErrors.value = null
}

onMounted(() => {
  loadInstitutions()
})
</script>

<style scoped>
.admin-institutions-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.page-subtitle {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-icon {
  font-size: 1rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  font-size: 1.5rem;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border-radius: var(--radius-lg);
}

.stat-icon-green {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.stat-icon-blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.stat-icon-purple {
  background: linear-gradient(135deg, #a855f7, #9333ea);
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

/* Error & Empty States */
.error-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
  margin-bottom: var(--spacing-lg);
}

.error-title,
.empty-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.error-message,
.empty-message {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
}

.retry-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Table */
.table-container {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.institutions-table {
  width: 100%;
  border-collapse: collapse;
}

.institutions-table thead {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.institutions-table th {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  white-space: nowrap;
}

.institutions-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.table-row {
  transition: background var(--transition-fast);
}

.table-row:hover {
  background: var(--hover-bg);
}

.table-row:last-child td {
  border-bottom: none;
}

.text-center {
  text-align: center;
}

/* Institution name cell */
.inst-name-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.inst-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.inst-name {
  font-weight: 600;
  color: var(--text-primary);
}

.inst-url {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Slug badge */
.slug-badge {
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-family: monospace;
  color: var(--text-secondary);
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.status-active {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.status-inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

/* Actions */
.actions-cell {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.9rem;
}

.action-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  color: var(--text-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn-green {
  color: #16a34a;
}

.action-btn-gray {
  color: #9ca3af;
}

.action-btn-blue {
  color: #3b82f6;
}

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

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
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

.modal-btn-secondary:hover {
  background: var(--hover-bg);
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

/* Responsive */
@media (max-width: 1024px) {
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .institutions-table {
    min-width: 800px;
  }
}

@media (max-width: 768px) {
  .admin-institutions-container {
    padding: var(--spacing-md);
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-direction: column;
  }
}
</style>
