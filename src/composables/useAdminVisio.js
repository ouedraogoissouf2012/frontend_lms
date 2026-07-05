import { ref, computed, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'
import { buildJitsiUrl, getVisioRoomId } from '@/constants/visio'
import { notifyVisioError } from '@/services/visioFeedback'

/**
 * Couche données d'AdminVisio (#G1 ≤300) : dérive les visioconférences depuis les
 * séances KLASSCI (filtre visio_enabled), gère filtres (période/statut/recherche),
 * stats, statut temporel et formats, avec cache + rafraîchissement en arrière-plan.
 * La vue ne fait plus que câbler les composants de présentation.
 */
export function useAdminVisio() {
  const loading = ref(true)
  const error = ref(null)
  const visioconferences = ref([])

  const filters = ref({
    days: '7',
    status: '',
    search: ''
  })

  // Stats computées
  const stats = computed(() => {
    const allVisio = visioconferences.value
    return {
      active: allVisio.filter(v => v.status === 'active').length,
      scheduled: allVisio.filter(v => v.status === 'scheduled').length,
      completed: allVisio.filter(v => v.status === 'completed').length,
      total: allVisio.length
    }
  })

  // Filtrage des visioconférences
  const filteredVisioconferences = computed(() => {
    let result = visioconferences.value

    // Filtre par statut
    if (filters.value.status) {
      result = result.filter(v => v.status === filters.value.status)
    }

    // Filtre par recherche
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      result = result.filter(v =>
        (v.matiere || '').toLowerCase().includes(search) ||
        (v.classe || '').toLowerCase().includes(search) ||
        (v.enseignant || '').toLowerCase().includes(search)
      )
    }

    return result
  })

  async function loadVisioconferences() {
    loading.value = true
    error.value = null

    try {
      // Tenter de charger depuis le cache
      const cached = readCache('admin_visio')
      if (cached) {
        console.log('[CACHE] Visioconférences admin chargées depuis le cache')
        processVisioData(cached)
        loading.value = false
        refreshInBackground()
        return
      }

      // Charger depuis l'API - utiliser getSeances et filtrer celles avec visio_enabled
      const response = await klassciService.getSeances({
        days: filters.value.days
      })

      if (response.success) {
        const seances = response.data || []
        processVisioData(seances)

        // Mettre en cache
        writeCache('admin_visio', seances)
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des visioconférences')
      }
    } catch (err) {
      console.error('❌ Erreur chargement visioconférences:', err)
      error.value = err.message || 'Impossible de charger les visioconférences'
    } finally {
      loading.value = false
    }
  }

  function processVisioData(seances) {
    // Transformer les séances en données de visioconférence
    visioconferences.value = seances
      .filter(s => s.visio_enabled)
      .map(s => {
        const roomId = getVisioRoomId(s)
        return {
          id: s.id,
          matiere: s.matiere?.nom || 'N/A',
          classe: s.classe?.name || 'N/A',
          enseignant: `${s.enseignant?.nom || ''} ${s.enseignant?.prenom || ''}`.trim() || 'N/A',
          date_debut: s.date_debut,
          date_fin: s.date_fin,
          status: getSeanceStatus(s),
          room_id: roomId,
          room_name: s.room_name || roomId,
          participants_count: s.participants_count || 0
        }
      })
  }

  async function refreshInBackground() {
    try {
      const response = await klassciService.getSeances({
        days: filters.value.days
      })

      if (response.success) {
        const seances = response.data || []
        processVisioData(seances)

        writeCache('admin_visio', seances)
        console.log('[CACHE] Visioconférences admin rafraîchies en arrière-plan')
      }
    } catch (err) {
      console.warn('[CACHE] Erreur rafraîchissement:', err)
    }
  }

  function refreshData() {
    loadVisioconferences()
  }

  function filterVisioconferences() {
    // Le filtrage est géré par le computed filteredVisioconferences
  }

  function getSeanceStatus(seance) {
    const now = new Date()
    const debut = new Date(seance.date_debut)
    const fin = new Date(seance.date_fin)

    if (now >= debut && now <= fin) return 'active'
    if (now < debut) return 'scheduled'
    return 'completed'
  }

  function getStatusLabel(status) {
    const labels = {
      active: 'En cours',
      scheduled: 'Planifiée',
      completed: 'Terminée'
    }
    return labels[status] || 'Inconnu'
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  function formatTime(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function joinVisio(visio) {
    console.log('Rejoindre visio:', visio)
    const roomId = getVisioRoomId(visio)
    if (roomId) {
      window.open(buildJitsiUrl(roomId), '_blank')
    } else {
      notifyVisioError(null, 'Identifiant de salle visio introuvable.')
    }
  }

  function viewVisioDetails(visio) {
    // TODO: Ouvrir modal avec détails
    console.log('Voir détails visio:', visio)
  }

  onMounted(() => {
    loadVisioconferences()
  })

  return {
    loading, error, visioconferences, filters,
    stats, filteredVisioconferences,
    loadVisioconferences, refreshData, filterVisioconferences,
    getStatusLabel, formatDate, formatTime,
    joinVisio, viewVisioDetails,
  }
}
