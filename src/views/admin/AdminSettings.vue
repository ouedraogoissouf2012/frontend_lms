<template>
  <DashboardLayout>
    <div class="settings-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Paramètres</h1>
          <p class="page-subtitle">Gérez vos préférences et informations personnelles</p>
        </div>
      </div>

      <!-- Settings Sections -->
      <div class="settings-content">
        <!-- Informations Personnelles -->
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

        <!-- Préférences d'affichage -->
        <div class="settings-section">
          <div class="section-header">
            <AdjustmentsHorizontalIcon class="section-icon" />
            <h2 class="section-title">Préférences d'affichage</h2>
          </div>
          <div class="section-body">
            <div class="preference-item">
              <div class="preference-info">
                <label class="preference-label">Thème</label>
                <p class="preference-description">Choisir entre le mode clair et sombre</p>
              </div>
              <div class="preference-control">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="settings-section">
          <div class="section-header">
            <BellIcon class="section-icon" />
            <h2 class="section-title">Notifications</h2>
          </div>
          <div class="section-body">
            <div class="preference-item">
              <div class="preference-info">
                <label class="preference-label">Notifications par email</label>
                <p class="preference-description">Recevoir des notifications importantes du système</p>
              </div>
              <div class="preference-control">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="emailNotifications" @change="savePreferences">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="preference-item">
              <div class="preference-info">
                <label class="preference-label">Alertes système</label>
                <p class="preference-description">Recevoir des alertes pour les événements critiques</p>
              </div>
              <div class="preference-control">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="systemAlerts" @change="savePreferences">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Sécurité -->
        <div class="settings-section">
          <div class="section-header">
            <LockClosedIcon class="section-icon" />
            <h2 class="section-title">Sécurité</h2>
          </div>
          <div class="section-body">
            <button class="btn-secondary" @click="showPasswordModal = true" aria-label="Ouvrir le formulaire de changement de mot de passe">
              <KeyIcon class="w-5 h-5" aria-hidden="true" />
              <span>Changer le mot de passe</span>
            </button>
          </div>
        </div>

        <!-- Permissions -->
        <div v-if="user?.permissions && user.permissions.length > 0" class="settings-section">
          <div class="section-header">
            <ShieldCheckIcon class="section-icon" />
            <h2 class="section-title">Vos Permissions</h2>
          </div>
          <div class="section-body">
            <div class="permissions-grid">
              <span v-for="permission in user.permissions" :key="permission" class="permission-badge">
                <CheckCircleIcon class="w-4 h-4" />
                {{ permission }}
              </span>
            </div>
          </div>
        </div>

        <!-- Déconnexion -->
        <div class="settings-section">
          <div class="section-header">
            <ArrowRightOnRectangleIcon class="section-icon" />
            <h2 class="section-title">Session</h2>
          </div>
          <div class="section-body">
            <button class="btn-danger" @click="logout" aria-label="Se déconnecter de l'application">
              <ArrowRightOnRectangleIcon class="w-5 h-5" aria-hidden="true" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Changement de mot de passe -->
      <Modal v-model="showPasswordModal" title="Changer le mot de passe">
        <form @submit.prevent="submitPasswordChange">
          <div class="form-group">
            <label class="form-label">Mot de passe actuel</label>
            <input
              type="password"
              v-model="passwordForm.currentPassword"
              class="form-input"
              placeholder="Entrez votre mot de passe actuel"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label">Nouveau mot de passe</label>
            <input
              type="password"
              v-model="passwordForm.newPassword"
              class="form-input"
              placeholder="Entrez votre nouveau mot de passe"
              required
              minlength="6"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Confirmer le mot de passe</label>
            <input
              type="password"
              v-model="passwordForm.confirmPassword"
              class="form-input"
              placeholder="Confirmez votre nouveau mot de passe"
              required
              minlength="6"
            />
          </div>
        </form>

        <template #footer>
          <button type="button" class="btn-cancel" @click="showPasswordModal = false" aria-label="Annuler le changement de mot de passe">
            Annuler
          </button>
          <button type="submit" class="btn-primary" @click="submitPasswordChange" aria-label="Confirmer le changement de mot de passe">
            Confirmer
          </button>
        </template>
      </Modal>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import Modal from '@/components/ui/Modal.vue'
import { auth } from '@/services/api'
import { toast } from '@/services/toast'
import { STORAGE_KEYS } from '@/constants/storageKeys'
import {
  UserIcon,
  AdjustmentsHorizontalIcon,
  BellIcon,
  LockClosedIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'AdminSettings',
  components: {
    DashboardLayout,
    ThemeToggle,
    Modal,
    UserIcon,
    AdjustmentsHorizontalIcon,
    BellIcon,
    LockClosedIcon,
    KeyIcon,
    ArrowRightOnRectangleIcon,
    ShieldCheckIcon,
    CheckCircleIcon
  },
  data() {
    return {
      user: null,
      emailNotifications: true,
      systemAlerts: true,
      showPasswordModal: false,
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
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

    savePreferences() {
      const preferences = {
        emailNotifications: this.emailNotifications,
        systemAlerts: this.systemAlerts
      }
      localStorage.setItem(STORAGE_KEYS.ADMIN_PREFERENCES, JSON.stringify(preferences))
      console.log('[SETTINGS] Préférences sauvegardées:', preferences)
      toast.success('Vos préférences ont été sauvegardées')
    },

    loadPreferences() {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PREFERENCES)
      if (saved) {
        const preferences = JSON.parse(saved)
        this.emailNotifications = preferences.emailNotifications ?? true
        this.systemAlerts = preferences.systemAlerts ?? true
      }
    },

    submitPasswordChange() {
      // Validation
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas')
        return
      }

      if (this.passwordForm.newPassword.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères')
        return
      }

      // TODO: Appel API pour changer le mot de passe
      // Pour l'instant, simulons le succès
      toast.success('Votre mot de passe a été changé avec succès')

      // Réinitialiser le formulaire et fermer le modal
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      this.showPasswordModal = false
    },

    logout() {
      if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        auth.logout()
        toast.success('Vous avez été déconnecté avec succès')
        this.$router.push('/login')
      }
    }
  },
  mounted() {
    this.user = auth.getUser()
    this.loadPreferences()
  }
}
</script>

<style scoped>
.settings-container {
  max-width: 1024px;
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

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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

/* Preferences */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.preference-info {
  flex: 1;
}

.preference-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.25rem;
}

.preference-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.preference-control {
  margin-left: 1rem;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #3b82f6;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* Buttons */
.btn-secondary, .btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: scale(1.02);
}

/* Modal Form */
.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  font-size: 1rem;
  color: var(--text-primary);
  background: var(--card-bg);
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3B82F6;
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

.btn-primary, .btn-cancel {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: scale(1.02);
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .preference-control {
    margin-left: 0;
  }
}

/* Permissions Grid */
.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.permission-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0369a1;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid #bae6fd;
  transition: all 0.2s;
}

.permission-badge:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(3, 105, 161, 0.1);
}

.permission-badge svg {
  flex-shrink: 0;
}

:root[data-theme="dark"] .permission-badge {
  background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%);
  color: #7dd3fc;
  border-color: #0c4a6e;
}

:root[data-theme="dark"] .permission-badge:hover {
  background: linear-gradient(135deg, #075985 0%, #0369a1 100%);
  box-shadow: 0 4px 6px rgba(125, 211, 252, 0.1);
}
</style>
