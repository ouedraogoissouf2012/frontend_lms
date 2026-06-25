import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { toast } from '@/services/toast'
import { STORAGE_KEYS } from '@/constants/storageKeys'

const ROLE_LABELS = {
  'etudiant': 'Étudiant',
  'student': 'Étudiant',
  'enseignant': 'Enseignant',
  'teacher': 'Enseignant',
  'coordinateur': 'Coordinateur',
  'admin': 'Administrateur'
}

/**
 * Couche données des paramètres enseignant (#H11 ≤300) : utilisateur courant,
 * préférences de notifications (persistées localStorage), modale + formulaire
 * de changement de mot de passe, déconnexion. La vue ne fait plus que câbler.
 */
export function useTeacherSettings() {
  const router = useRouter()

  const user = ref(null)
  const emailNotifications = ref(true)
  const seanceReminders = ref(true)
  const showPasswordModal = ref(false)
  const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  function getRoleLabel(role) {
    return ROLE_LABELS[role] || role
  }

  function savePreferences() {
    const preferences = {
      emailNotifications: emailNotifications.value,
      seanceReminders: seanceReminders.value
    }
    localStorage.setItem(STORAGE_KEYS.TEACHER_PREFERENCES, JSON.stringify(preferences))
    console.log('[SETTINGS] Préférences sauvegardées:', preferences)
    toast.success('Vos préférences ont été sauvegardées')
  }

  function loadPreferences() {
    const saved = localStorage.getItem(STORAGE_KEYS.TEACHER_PREFERENCES)
    if (saved) {
      const preferences = JSON.parse(saved)
      emailNotifications.value = preferences.emailNotifications ?? true
      seanceReminders.value = preferences.seanceReminders ?? true
    }
  }

  function submitPasswordChange() {
    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    // TODO: Appel API pour changer le mot de passe
    // Pour l'instant, simulons le succès
    toast.success('Votre mot de passe a été changé avec succès')

    // Réinitialiser le formulaire et fermer le modal
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    showPasswordModal.value = false
  }

  function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      auth.logout()
      toast.success('Vous avez été déconnecté avec succès')
      router.push('/login')
    }
  }

  onMounted(() => {
    user.value = auth.getUser()
    loadPreferences()
  })

  return {
    user, emailNotifications, seanceReminders, showPasswordModal, passwordForm,
    getRoleLabel, savePreferences, loadPreferences, submitPasswordChange, logout,
  }
}
