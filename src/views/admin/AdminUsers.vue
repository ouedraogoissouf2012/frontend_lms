<template>
  <DashboardLayout>
    <div class="admin-users-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Gestion des Utilisateurs</h1>
          <p class="page-subtitle">Enseignants, étudiants et autres utilisateurs de l'institution</p>
        </div>
        <button @click="loadAllUsers(true)" class="refresh-btn" :disabled="loading">
          <i class="fa fa-refresh btn-icon"></i>
          <span class="btn-text">Actualiser</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <i class="fa fa-users stat-icon"></i>
          <div class="stat-details">
            <span class="stat-value">{{ totalUsers }}</span>
            <span class="stat-label">Total Utilisateurs</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa fa-graduation-cap stat-icon"></i>
          <div class="stat-details">
            <span class="stat-value">{{ etudiants.length }}</span>
            <span class="stat-label">Étudiants</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa fa-user stat-icon"></i>
          <div class="stat-details">
            <span class="stat-value">{{ enseignants.length }}</span>
            <span class="stat-label">Enseignants</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa fa-building stat-icon"></i>
          <div class="stat-details">
            <span class="stat-value">{{ classes.length }}</span>
            <span class="stat-label">Classes</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="search-box">
          <i class="fa fa-search search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher par nom ou email..."
            class="search-input"
          />
        </div>
        <div class="filter-group">
          <select v-model="filterRole" class="filter-select">
            <option value="all">Tous les rôles</option>
            <option value="etudiant">Étudiants</option>
            <option value="enseignant">Enseignants</option>
          </select>
          <select v-model="filterClasse" class="filter-select">
            <option value="all">Toutes les classes</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.nom }}</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p class="loading-text">Chargement des utilisateurs...</p>
        <p v-if="loadingProgress" class="loading-progress">{{ loadingProgress }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <h3 class="error-title">Erreur de Chargement</h3>
        <p class="error-message">{{ error }}</p>
        <button @click="loadAllUsers()" class="retry-btn">Réessayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUsers.length === 0 && !loading" class="empty-state">
        <i class="fa fa-users empty-icon"></i>
        <h3 class="empty-title">Aucun Utilisateur Trouvé</h3>
        <p class="empty-message" v-if="searchQuery || filterRole !== 'all' || filterClasse !== 'all'">
          Aucun résultat pour les filtres sélectionnés. Essayez de modifier vos critères.
        </p>
        <p class="empty-message" v-else>
          Aucun utilisateur n'a été trouvé dans le système KLASSCI.
        </p>
      </div>

      <!-- Users Table -->
      <div v-else class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th @click="sortBy('name')" class="sortable">
                Nom
                <i v-if="sortField === 'name'" :class="sortAsc ? 'fa fa-sort-up' : 'fa fa-sort-down'"></i>
              </th>
              <th @click="sortBy('email')" class="sortable">
                Email
                <i v-if="sortField === 'email'" :class="sortAsc ? 'fa fa-sort-up' : 'fa fa-sort-down'"></i>
              </th>
              <th @click="sortBy('role')" class="sortable">
                Rôle
                <i v-if="sortField === 'role'" :class="sortAsc ? 'fa fa-sort-up' : 'fa fa-sort-down'"></i>
              </th>
              <th>Classe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user._uid" @click="selectUser(user)" class="user-row">
              <td>
                <div class="user-name-cell">
                  <div class="user-avatar" :class="'avatar-' + user.role">
                    <span>{{ getInitials(user) }}</span>
                  </div>
                  <span class="user-name">{{ user.name }}</span>
                </div>
              </td>
              <td class="user-email">{{ user.email || 'Non disponible' }}</td>
              <td>
                <span class="role-badge" :class="'role-' + user.role">
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td class="user-classe">{{ user.classe_nom || '-' }}</td>
              <td>
                <button class="action-btn" @click.stop="selectUser(user)">
                  <i class="fa fa-eye"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage = 1"
          >
            <i class="fa fa-angle-double-left"></i>
          </button>
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <i class="fa fa-angle-left"></i>
          </button>
          <span class="page-info">
            Page {{ currentPage }} / {{ totalPages }}
            <span class="page-total">({{ filteredUsers.length }} utilisateurs)</span>
          </span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <i class="fa fa-angle-right"></i>
          </button>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage = totalPages"
          >
            <i class="fa fa-angle-double-right"></i>
          </button>
        </div>
      </div>

      <!-- User Detail Modal -->
      <Teleport to="body">
        <div v-if="selectedUser" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <div class="modal-title-section">
                <div class="modal-avatar" :class="'avatar-' + selectedUser.role">
                  <span>{{ getInitials(selectedUser) }}</span>
                </div>
                <div>
                  <h2 class="modal-title">{{ selectedUser.name }}</h2>
                  <p class="modal-subtitle">{{ getRoleLabel(selectedUser.role) }}</p>
                </div>
              </div>
              <button @click="closeModal" class="close-btn">✕</button>
            </div>

            <div class="modal-body">
              <div class="info-section">
                <h3 class="section-title"><i class="fa fa-user"></i> Informations</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Nom complet:</span>
                    <span class="info-value">{{ selectedUser.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{{ selectedUser.email || 'Non disponible' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Rôle:</span>
                    <span class="info-value">
                      <span class="role-badge" :class="'role-' + selectedUser.role">
                        {{ getRoleLabel(selectedUser.role) }}
                      </span>
                    </span>
                  </div>
                  <div v-if="selectedUser.classe_nom" class="info-item">
                    <span class="info-label">Classe:</span>
                    <span class="info-value">{{ selectedUser.classe_nom }}</span>
                  </div>
                  <div v-if="selectedUser.klassci_id" class="info-item">
                    <span class="info-label">KLASSCI ID:</span>
                    <span class="info-value">#{{ selectedUser.klassci_id }}</span>
                  </div>
                  <div v-if="selectedUser.matricule" class="info-item">
                    <span class="info-label">Matricule:</span>
                    <span class="info-value">{{ selectedUser.matricule }}</span>
                  </div>
                  <div v-if="selectedUser.telephone" class="info-item">
                    <span class="info-label">Téléphone:</span>
                    <span class="info-value">{{ selectedUser.telephone }}</span>
                  </div>
                  <div v-if="selectedUser.specialization" class="info-item">
                    <span class="info-label">Spécialisation:</span>
                    <span class="info-value">{{ selectedUser.specialization }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button @click="closeModal" class="modal-btn modal-btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getInitials } from '@/utils/formatters'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import klassciService from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'
const PAGE_SIZE = 25

// Data
const etudiants = ref([])
const enseignants = ref([])
const classes = ref([])
const loading = ref(true)
const loadingProgress = ref('')
const error = ref(null)
const selectedUser = ref(null)

// Filters
const searchQuery = ref('')
const filterRole = ref('all')
const filterClasse = ref('all')
const currentPage = ref(1)
const sortField = ref('name')
const sortAsc = ref(true)

// Reset page on filter change
watch([searchQuery, filterRole, filterClasse], () => {
  currentPage.value = 1
})

// All users combined
const allUsers = computed(() => {
  const users = []

  // Add étudiants
  etudiants.value.forEach(e => {
    users.push({
      _uid: `etu-${e.id}`,
      klassci_id: e.id,
      name: e.name || e.nom || `${e.prenom || ''} ${e.nom || ''}`.trim(),
      email: e.email,
      role: 'etudiant',
      classe_id: e.classe_id,
      classe_nom: e.classe_nom,
      matricule: e.matricule,
      telephone: e.telephone,
    })
  })

  // Add enseignants
  enseignants.value.forEach(e => {
    users.push({
      _uid: `ens-${e.id || e.teacher_id}`,
      klassci_id: e.id || e.teacher_id,
      name: e.nom || e.name || `${e.prenom || ''} ${e.nom || ''}`.trim(),
      email: e.email,
      role: 'enseignant',
      classe_id: null,
      classe_nom: null,
      matricule: e.matricule,
      telephone: e.telephone,
      specialization: e.specialization,
    })
  })

  return users
})

const totalUsers = computed(() => allUsers.value.length)

// Filtered users
const filteredUsers = computed(() => {
  let result = allUsers.value

  // Filter by role
  if (filterRole.value !== 'all') {
    result = result.filter(u => u.role === filterRole.value)
  }

  // Filter by classe
  if (filterClasse.value !== 'all') {
    result = result.filter(u => u.classe_id === filterClasse.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    )
  }

  // Sort
  result.sort((a, b) => {
    const valA = (a[sortField.value] || '').toString().toLowerCase()
    const valB = (b[sortField.value] || '').toString().toLowerCase()
    const cmp = valA.localeCompare(valB)
    return sortAsc.value ? cmp : -cmp
  })

  return result
})

// Pagination
const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / PAGE_SIZE)))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredUsers.value.slice(start, start + PAGE_SIZE)
})

// Sort function
function sortBy(field) {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortField.value = field
    sortAsc.value = true
  }
}

// Get role label
function getRoleLabel(role) {
  const labels = {
    etudiant: 'Étudiant',
    student: 'Étudiant',
    enseignant: 'Enseignant',
    teacher: 'Enseignant',
    coordinateur: 'Coordinateur',
    admin: 'Admin',
    superAdmin: 'Super Admin',
  }
  return labels[role] || role
}

// Select user
function selectUser(user) {
  selectedUser.value = user
}

// Close modal
function closeModal() {
  selectedUser.value = null
}

// Load all users
async function loadAllUsers(forceReload = false) {
  try {
    loading.value = true
    error.value = null
    loadingProgress.value = ''

    // Check cache
    if (!forceReload) {
      const cached = readCache('admin_users')
      if (cached && cached.etudiants?.length > 0) {
        etudiants.value = cached.etudiants
        enseignants.value = cached.enseignants || []
        classes.value = cached.classes || []
        loading.value = false
        refreshInBackground()
        return
      }
    }

    // 1. Load classes
    loadingProgress.value = 'Chargement des classes...'
    const classesData = await klassciService.getClasses()
    classes.value = Array.isArray(classesData) ? classesData : []

    // 2. Load enseignants
    loadingProgress.value = 'Chargement des enseignants...'
    const enseignantsData = await klassciService.getEnseignants()
    enseignants.value = Array.isArray(enseignantsData) ? enseignantsData : []

    // 3. Load étudiants for each class
    loadingProgress.value = 'Chargement des étudiants...'
    const allEtudiants = []

    for (const classe of classes.value) {
      try {
        loadingProgress.value = `Chargement des étudiants de ${classe.nom || 'classe ' + classe.id}...`
        const etudiantsData = await klassciService.getClasseEtudiants(classe.id)
        const studentsArray = Array.isArray(etudiantsData) ? etudiantsData : []
        studentsArray.forEach(etu => {
          etu.classe_id = classe.id
          etu.classe_nom = classe.name || classe.libelle || classe.nom || `Classe ${classe.id}`
          allEtudiants.push(etu)
        })
      } catch (err) {
        console.warn(`Impossible de charger les étudiants de la classe ${classe.id}:`, err.message)
      }
    }

    etudiants.value = allEtudiants

    // Save cache
    writeCache('admin_users', {
      etudiants: etudiants.value,
      enseignants: enseignants.value,
      classes: classes.value,
    })

    loading.value = false
    loadingProgress.value = ''
  } catch (err) {
    console.error('Erreur chargement utilisateurs:', err)
    error.value = err.message || 'Erreur lors du chargement des utilisateurs'
    loading.value = false
    loadingProgress.value = ''
  }
}

// Background refresh
async function refreshInBackground() {
  try {
    const classesData = await klassciService.getClasses()
    classes.value = Array.isArray(classesData) ? classesData : []

    const enseignantsData = await klassciService.getEnseignants()
    enseignants.value = Array.isArray(enseignantsData) ? enseignantsData : []

    const allEtudiants = []
    for (const classe of classes.value) {
      try {
        const etudiantsData = await klassciService.getClasseEtudiants(classe.id)
        const studentsArray = Array.isArray(etudiantsData) ? etudiantsData : []
        studentsArray.forEach(etu => {
          etu.classe_id = classe.id
          etu.classe_nom = classe.name || classe.libelle || classe.nom || `Classe ${classe.id}`
          allEtudiants.push(etu)
        })
      } catch {
        // Ignorer les erreurs en background
      }
    }

    etudiants.value = allEtudiants

    writeCache('admin_users', {
      etudiants: etudiants.value,
      enseignants: enseignants.value,
      classes: classes.value,
    })
  } catch {
    // Ignorer les erreurs en background
  }
}

onMounted(() => {
  loadAllUsers()
})
</script>

<style scoped>
.admin-users-container {
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

.btn-icon {
  font-size: 1.25rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  font-size: 2rem;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border-radius: var(--radius-lg);
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Filters */
.filters-section {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 0.9rem;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: var(--font-size-md);
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.filter-group {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-select {
  padding: 10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

.loading-progress {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.error-message {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.retry-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
}

.retry-btn:hover {
  opacity: 0.9;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-message {
  color: var(--text-secondary);
  max-width: 400px;
}

/* Users Table */
.users-table-wrapper {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: var(--bg-secondary);
}

.users-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.users-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.users-table th.sortable:hover {
  color: var(--text-primary);
}

.users-table th i {
  margin-left: 4px;
  font-size: 0.7rem;
}

.users-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.user-row {
  cursor: pointer;
  transition: background var(--transition-fast);
}

.user-row:hover {
  background: var(--hover-bg);
}

.user-name-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.avatar-etudiant {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.avatar-enseignant {
  background: linear-gradient(135deg, #10b981, #059669);
}

.user-name {
  font-weight: 500;
  white-space: nowrap;
}

.user-email {
  color: var(--text-secondary);
}

.user-classe {
  color: var(--text-secondary);
}

/* Role Badge */
.role-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.role-etudiant,
.role-student {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.role-enseignant,
.role-teacher {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.role-coordinateur {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.role-admin,
.role-superAdmin {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

/* Action Button */
.action-btn {
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.page-btn {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: 0 var(--spacing-md);
}

.page-total {
  color: var(--text-tertiary);
}

/* Modal */
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

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
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

.modal-btn-secondary:hover {
  background: var(--hover-bg);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-users-container {
    padding: var(--spacing-md);
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .users-table th:nth-child(4),
  .users-table td:nth-child(4) {
    display: none;
  }
}
</style>
