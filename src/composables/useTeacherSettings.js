import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { toast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { STORAGE_KEYS } from '@/constants/storageKeys'
import { PASSWORD_CHANGE_UNAVAILABLE_MESSAGE } from '@/constants/passwordChange'

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
 *
 * Le changement de mot de passe n'est PAS implémentable côté LMS (aucun endpoint
 * backend, cf. `@/constants/passwordChange`) : la modale est en lecture seule et
 * n'affiche plus de faux succès.
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

  /**
   * Changement de mot de passe INDISPONIBLE : aucun endpoint backend à ce jour
   * (dette tracée, cf. `@/constants/passwordChange`). Aucune requête réseau,
   * aucun message de succès. Les champs et le bouton de la modale sont
   * désactivés ; cette fonction reste le garde-fou du chemin `@submit`.
   * REMPLACER ICI par l'appel API réel quand il existera.
   */
  function submitPasswordChange() {
    toast.info(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
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
    user, emailNotifications, seanceReminders, showPasswordModal, passwordForm,
    getRoleLabel, savePreferences, loadPreferences, submitPasswordChange, logout,
  }
}
