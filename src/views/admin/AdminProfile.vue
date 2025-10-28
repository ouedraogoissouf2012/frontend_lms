<template>
  <DashboardLayout>
    <div class="profile-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mon Profil</h1>
          <p class="page-subtitle">Consultez et gérez vos informations personnelles</p>
        </div>
      </div>

      <!-- Profile Content -->
      <div class="profile-content">
        <!-- Informations Personnelles Card -->
        <div class="profile-card">
          <div class="card-header">
            <UserIcon class="header-icon" />
            <h2 class="card-title">Informations Personnelles</h2>
          </div>
          <div class="card-body">
            <div class="profile-avatar">
              <div class="avatar-circle">
                <span class="avatar-initials">{{ userInitials }}</span>
              </div>
              <div class="avatar-info">
                <h3 class="user-name">{{ user?.nom }} {{ user?.prenom }}</h3>
                <p class="user-role">{{ getRoleLabel(user?.role) }}</p>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <EnvelopeIcon class="info-icon" />
                <div class="info-content">
                  <label class="info-label">Email</label>
                  <p class="info-value">{{ user?.email || 'Non renseigné' }}</p>
                </div>
              </div>

              <div class="info-item">
                <PhoneIcon class="info-icon" />
                <div class="info-content">
                  <label class="info-label">Téléphone</label>
                  <p class="info-value">{{ user?.telephone || 'Non renseigné' }}</p>
                </div>
              </div>

              <div class="info-item">
                <IdentificationIcon class="info-icon" />
                <div class="info-content">
                  <label class="info-label">ID Klassci</label>
                  <p class="info-value">{{ user?.klassci_id || 'Non renseigné' }}</p>
                </div>
              </div>

              <div class="info-item">
                <CalendarIcon class="info-icon" />
                <div class="info-content">
                  <label class="info-label">Membre depuis</label>
                  <p class="info-value">{{ formatDate(user?.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques Card -->
        <div class="profile-card">
          <div class="card-header">
            <ChartBarIcon class="header-icon" />
            <h2 class="card-title">Statistiques Système</h2>
          </div>
          <div class="card-body">
            <div class="stats-grid">
              <div class="stat-box">
                <UserGroupIcon class="stat-icon text-blue-500" />
                <div class="stat-content">
                  <p class="stat-value">{{ stats.enseignants || 0 }}</p>
                  <p class="stat-label">Enseignants</p>
                </div>
              </div>

              <div class="stat-box">
                <AcademicCapIcon class="stat-icon text-green-500" />
                <div class="stat-content">
                  <p class="stat-value">{{ stats.etudiants || 0 }}</p>
                  <p class="stat-label">Étudiants</p>
                </div>
              </div>

              <div class="stat-box">
                <BuildingLibraryIcon class="stat-icon text-purple-500" />
                <div class="stat-content">
                  <p class="stat-value">{{ stats.classes || 0 }}</p>
                  <p class="stat-label">Classes actives</p>
                </div>
              </div>

              <div class="stat-box">
                <BookOpenIcon class="stat-icon text-orange-500" />
                <div class="stat-content">
                  <p class="stat-value">{{ stats.matieres || 0 }}</p>
                  <p class="stat-label">Matières</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Permissions Card (si admin) -->
        <div v-if="user?.permissions && user.permissions.length > 0" class="profile-card">
          <div class="card-header">
            <ShieldCheckIcon class="header-icon" />
            <h2 class="card-title">Mes Permissions</h2>
          </div>
          <div class="card-body">
            <div class="permissions-grid">
              <span
                v-for="permission in user.permissions"
                :key="permission"
                class="permission-badge"
              >
                {{ permission }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="profile-card">
          <div class="card-header">
            <BoltIcon class="header-icon" />
            <h2 class="card-title">Actions Rapides</h2>
          </div>
          <div class="card-body">
            <div class="actions-grid">
              <router-link to="/admin/settings" class="action-button">
                <CogIcon class="action-icon" />
                <div class="action-content">
                  <span class="action-title">Paramètres</span>
                  <span class="action-description">Gérer mes préférences</span>
                </div>
              </router-link>

              <router-link to="/admin/users" class="action-button">
                <UserGroupIcon class="action-icon" />
                <div class="action-content">
                  <span class="action-title">Utilisateurs</span>
                  <span class="action-description">Gérer les utilisateurs</span>
                </div>
              </router-link>

              <router-link to="/admin/classes" class="action-button">
                <BuildingLibraryIcon class="action-icon" />
                <div class="action-content">
                  <span class="action-title">Classes</span>
                  <span class="action-description">Gérer les classes</span>
                </div>
              </router-link>

              <router-link to="/admin/matieres" class="action-button">
                <BookOpenIcon class="action-icon" />
                <div class="action-content">
                  <span class="action-title">Matières</span>
                  <span class="action-description">Gérer les matières</span>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { auth } from '@/services/api'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarIcon,
  ChartBarIcon,
  BookOpenIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon,
  BoltIcon,
  CogIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'AdminProfile',
  components: {
    DashboardLayout,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    IdentificationIcon,
    CalendarIcon,
    ChartBarIcon,
    BookOpenIcon,
    UserGroupIcon,
    AcademicCapIcon,
    BuildingLibraryIcon,
    ShieldCheckIcon,
    BoltIcon,
    CogIcon
  },
  data() {
    return {
      user: null,
      stats: {
        enseignants: 0,
        etudiants: 0,
        classes: 0,
        matieres: 0
      }
    }
  },
  computed: {
    userInitials() {
      if (!this.user) return '?'
      const nom = this.user.nom || ''
      const prenom = this.user.prenom || ''
      return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
    }
  },
  methods: {
    getRoleLabel(role) {
      const labels = {
        'etudiant': 'Étudiant',
        'student': 'Étudiant',
        'enseignant': 'Enseignant',
        'teacher': 'Enseignant',
        'coordinateur': 'Coordinateur',
        'superAdmin': 'Super Administrateur',
        'admin': 'Administrateur'
      }
      return labels[role] || role
    },

    formatDate(date) {
      if (!date) return 'Non disponible'
      const d = new Date(date)
      return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    async loadStats() {
      // TODO: Charger les statistiques depuis l'API
      // Pour l'instant, valeurs fictives
      this.stats = {
        enseignants: 25,
        etudiants: 350,
        classes: 15,
        matieres: 30
      }
    }
  },
  mounted() {
    this.user = auth.getUser()
    this.loadStats()
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
}

.header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #8b5cf6;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

/* Profile Avatar */
.profile-avatar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-primary);
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.avatar-initials {
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.avatar-info {
  flex: 1;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.user-role {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.info-item:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.info-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #8b5cf6;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 500;
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.stat-box:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Permissions Grid */
.permissions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.permission-badge {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
  border: 1px solid #8b5cf6;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #8b5cf6;
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  text-decoration: none;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.action-button:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
  border-color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.action-icon {
  width: 2rem;
  height: 2rem;
  color: #8b5cf6;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.action-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .info-grid,
  .stats-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }

  .profile-avatar {
    flex-direction: column;
    text-align: center;
  }

  .avatar-circle {
    width: 100px;
    height: 100px;
  }
}
</style>
