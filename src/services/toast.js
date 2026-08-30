import { useToast } from '@/composables/useToast'

/**
 * Service de toasts — ADAPTATEUR de compatibilité vers useToast (source UNIQUE).
 *
 * Historique : cette classe montait un `<Toast>` par `createApp().mount()` dans son
 * propre conteneur DOM (#toast-container), EN PARALLÈLE du hack `window.$toast` et
 * du composable useToast → TROIS mécanismes de toast concurrents (un par-ci, un
 * par-là), chacun avec son propre rendu et ses propres bugs.
 *
 * On unifie SANS casser les appelants : l'API publique (`success/error/warning/info`
 * + `show`, 15 consommateurs) est conservée à l'identique, mais chaque appel délègue
 * désormais à useToast → rendu par l'UNIQUE `<ToastContainer>` monté dans App.vue.
 * Fini le createApp par toast et le conteneur DOM dupliqué.
 *
 * DETTE tracée (Lot F3) : migrer les 15 consommateurs vers `useToast()` directement,
 * puis supprimer cet adaptateur. Cf. [[useToast]].
 *
 * NB durée : l'ancien service posait 3000 ms par défaut ; on le préserve ici pour
 * ne PAS changer le ressenti des écrans existants (useToast, lui, vaut 5000 ms par
 * défaut pour les nouveaux appelants directs).
 */
const LEGACY_DURATION = 3000

export const toast = {
  show: (options = {}) => useToast().show({ duration: LEGACY_DURATION, ...options }),
  success: (message, title = 'Succès') =>
    useToast().show({ message, title, type: 'success', duration: LEGACY_DURATION }),
  error: (message, title = 'Erreur') =>
    useToast().show({ message, title, type: 'error', duration: LEGACY_DURATION }),
  warning: (message, title = 'Attention') =>
    useToast().show({ message, title, type: 'warning', duration: LEGACY_DURATION }),
  info: (message, title = 'Information') =>
    useToast().show({ message, title, type: 'info', duration: LEGACY_DURATION }),
}

export default toast
