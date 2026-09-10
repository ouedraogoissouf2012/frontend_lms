import { onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { dashboard as lmsDashboardService } from '@/services/api'
import { useCachedResource } from '@/composables/useCachedResource'
import { mapTeacherStats } from '@/utils/teacherStats'

/**
 * Les compteurs du LMS, ou `null` si le LMS n'a pas répondu.
 *
 * Cette source est COMPLÉMENTAIRE : elle porte ce que KLASSCI n'a jamais eu
 * (les leçons sont une table du LMS). Son échec ne doit donc pas faire échouer
 * l'écran — les compteurs qu'elle alimente deviennent simplement « non
 * mesurés », ce que `mapTeacherStats` traduit en `null` puis en « — ».
 *
 * L'échec de KLASSCI, lui, n'est PAS avalé : il remonte et l'écran affiche son
 * erreur. Avaler les deux rendrait un écran entièrement à zéro sans rien dire —
 * exactement le défaut qu'on corrige.
 */
async function compteursLocaux() {
  try {
    const reponse = await lmsDashboardService.getTeacherDashboard()
    return reponse?.data ?? null
  } catch {
    return null
  }
}

/**
 * Couche données des statistiques enseignant (#H11 ≤300).
 *
 * Chaque compteur est demandé à la source qui le DÉTIENT : le référentiel
 * académique à KLASSCI, les leçons au LMS. L'ancien mapping interrogeait
 * KLASSCI pour les huit, dont six clés qu'il n'envoie pas — six tuiles
 * affichaient donc `0` pour toujours. Voir {@link ../utils/teacherStats.js}
 * pour la mesure et le raisonnement.
 */
export function useTeacherStats() {
  // #224 : stale-while-revalidate (useCachedResource) — sert les stats en cache
  // même périmées + revalide en arrière-plan (plus de blocage à l'expiration).
  const { data: stats, loading, error, load } = useCachedResource(
    'teacher_stats',
    async () => {
      const [klassci, local] = await Promise.all([
        klassciService.getTeacherDashboard(),
        compteursLocaux(),
      ])

      return mapTeacherStats(klassci, local)
    },
    { immediate: false },
  )

  function loadStats() {
    return load()
  }

  onMounted(() => {
    loadStats()
  })

  return { stats, loading, error, loadStats }
}
