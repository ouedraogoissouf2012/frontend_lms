import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { toast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
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
 * préférences de notifications (persistées localStorage), ouverture de la modale
 * de changement de mot de passe, déconnexion. La vue ne fait plus que câbler. Le
 * changement lui-même vit dans MonMotDePasseModal / useMonMotDePasse (#674).
 */
export function useTeacherSettings() {
  const router = useRouter()

  const user = ref(null)
  const emailNotifications = ref(true)
  const seanceReminders = ref(true)
  const showPasswordModal = ref(false)

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

  async function logout() {
    const ok = await useConfirm().confirm('Êtes-vous sûr de vouloir vous déconnecter ?')
    if (!ok) return
    auth.logout()
    toast.success('Vous avez été déconnecté avec succès')
    router.push('/login')
  }

  onMounted(() => {
    user.value = auth.getUser()
    loadPreferences()
  })

  return {
    user, emailNotifications, seanceReminders, showPasswordModal,
    getRoleLabel, savePreferences, loadPreferences, logout,
  }
}
