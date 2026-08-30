import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { toast } from '@/services/toast'
import { useConfirm } from '@/composables/useConfirm'
import { STORAGE_KEYS } from '@/constants/storageKeys'

/**
 * Couche logique de StudentSettings (#G10 ≤300) : expose l'utilisateur courant,
 * les préférences de notifications (email/visio) persistées en localStorage,
 * le mapping de rôle et la déconnexion. La vue ne fait plus que câbler.
 *
 * Parité STRICTE avec l'original (Options API) : console.log, libellés et
 * comportements conservés à l'identique.
 */
export function useStudentSettings() {
  const router = useRouter()

  // État
  const user = ref(null)
  const emailNotifications = ref(true)
  const visioReminders = ref(true)

  function getRoleLabel(role) {
    const labels = {
      'etudiant': 'Étudiant',
      'student': 'Étudiant',
      'enseignant': 'Enseignant',
      'teacher': 'Enseignant',
      'coordinateur': 'Coordinateur',
      'admin': 'Administrateur'
    }
    return labels[role] || role
  }

  function savePreferences() {
    const preferences = {
      emailNotifications: emailNotifications.value,
      visioReminders: visioReminders.value
    }
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences))
    console.log('[SETTINGS] Préférences sauvegardées:', preferences)
    toast.success('Vos préférences ont été sauvegardées')
  }

  function loadPreferences() {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
    if (saved) {
      const preferences = JSON.parse(saved)
      emailNotifications.value = preferences.emailNotifications ?? true
      visioReminders.value = preferences.visioReminders ?? true
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

  return { user, emailNotifications, visioReminders, getRoleLabel, savePreferences, logout }
}
