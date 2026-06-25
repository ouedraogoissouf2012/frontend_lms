import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'

/**
 * Couche donnees de TeacherClasses (#H9 ≤300). Charge les classes de
 * l enseignant, les enrichit (effectifs, nb matieres) et gere cache +
 * rafraichissement en arriere-plan. La vue ne fait plus que cabler.
 */
export function useTeacherClasses() {
  const classes = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadClasses() {
    // Verifier le cache
    const cachedData = readCache('teacher_classes')
    if (cachedData !== null) {
      console.log('[CACHE] Classes chargées depuis le cache')
      classes.value = cachedData
      loading.value = false
      // Rafraîchir en arrière-plan
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('[CLASSES] Chargement des classes enseignant...')
      // Utiliser getClasses() et getMatieres() pour support coordinateur
      const [rawClasses, dashboardMatieres] = await Promise.all([
        klassciService.getClasses(),
        klassciService.getMatieres()
      ])

      console.log('[CLASSES] Classes brutes:', rawClasses.length)
      console.log('[CLASSES] Matières disponibles:', dashboardMatieres.length)

      // Debug: afficher la structure d'une matière pour comprendre le lien avec les classes
      if (dashboardMatieres.length > 0) {
        console.log("[DEBUG] Structure d'une matière:", dashboardMatieres[0])
      }
      if (rawClasses.length > 0) {
        console.log("[DEBUG] Structure d'une classe:", rawClasses[0])
      }

      // Enrichir chaque classe avec les compteurs
      const enrichedClasses = await Promise.all(
        rawClasses.map(async (classe) => {
          try {
            // Récupérer les étudiants de la classe
            const etudiants = await klassciService.getClasseEtudiants(classe.id)
            const nbEtudiants = etudiants?.length || 0

            // SOLUTION SIMPLE: teacher-dashboard retourne déjà les matières de l'enseignant
            // Comme les matières KLASSCI n'ont pas de lien direct avec les classes,
            // on affiche toutes les matières pour chaque classe
            const nbMatieres = dashboardMatieres.length

            // Déterminer places_totales
            const placesTotales = classe.effectif_max ||
                                  classe.capacite ||
                                  classe.places_totales ||
                                  classe.effectif ||
                                  (nbEtudiants > 0 ? Math.max(nbEtudiants, 30) : 30)

            console.log(`[CLASSE ${classe.id} "${classe.name}"] Étudiants: ${nbEtudiants}/${placesTotales}, Matières: ${nbMatieres}`)

            return {
              ...classe,
              places_occupees: nbEtudiants,
              places_totales: placesTotales,
              nb_matieres: nbMatieres
            }
          } catch (err) {
            console.warn(`[WARN] Impossible d'enrichir classe ${classe.id}:`, err.message)
            return {
              ...classe,
              places_occupees: 0,
              places_totales: 30,
              nb_matieres: dashboardMatieres.length
            }
          }
        })
      )

      classes.value = enrichedClasses

      // Mettre en cache
      writeCache('teacher_classes', classes.value)

      console.log('[OK] Classes enrichies:', classes.value)
    } catch (err) {
      console.error('[ERREUR] Erreur chargement classes:', err)
      error.value = 'Impossible de charger vos classes. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement des classes...')
      // Utiliser getClasses() et getMatieres() pour support coordinateur
      const [rawClasses, dashboardMatieres] = await Promise.all([
        klassciService.getClasses(),
        klassciService.getMatieres()
      ])

      // Enrichir chaque classe avec les compteurs
      const enrichedClasses = await Promise.all(
        rawClasses.map(async (classe) => {
          try {
            const etudiants = await klassciService.getClasseEtudiants(classe.id)
            const nbEtudiants = etudiants?.length || 0

            const nbMatieres = dashboardMatieres.length

            const placesTotales = classe.effectif_max ||
                                  classe.capacite ||
                                  classe.places_totales ||
                                  classe.effectif ||
                                  (nbEtudiants > 0 ? Math.max(nbEtudiants, 30) : 30)

            return {
              ...classe,
              places_occupees: nbEtudiants,
              places_totales: placesTotales,
              nb_matieres: nbMatieres
            }
          } catch (err) {
            return {
              ...classe,
              places_occupees: 0,
              places_totales: 30,
              nb_matieres: dashboardMatieres.length
            }
          }
        })
      )

      classes.value = enrichedClasses

      writeCache('teacher_classes', classes.value)

      console.log('[BACKGROUND] Classes rafraîchies')
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
  }

  onMounted(() => {
    loadClasses()
  })

  return { classes, loading, error, loadClasses }
}
