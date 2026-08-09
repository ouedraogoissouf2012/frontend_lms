import { ref, computed, onMounted, watch } from 'vue'
import klassciService from '@/services/klassci'
import { readCache, writeCache, invalidateEntity } from '@/services/cache'

const PAGE_SIZE = 25

/**
 * Couche données d'AdminUsers (#G1 ≤300) : agrège étudiants + enseignants KLASSCI
 * en une liste unifiée, gère filtres (rôle/classe/recherche), tri et pagination,
 * avec cache + rafraîchissement en arrière-plan. La vue ne fait plus que câbler.
 */
export function useAdminUsers() {
  // Données
  const etudiants = ref([])
  const enseignants = ref([])
  const classes = ref([])
  const loading = ref(true)
  const loadingProgress = ref('')
  const error = ref(null)
  const selectedUser = ref(null)

  // Filtres / tri / pagination
  const searchQuery = ref('')
  const filterRole = ref('all')
  const filterClasse = ref('all')
  const currentPage = ref(1)
  const sortField = ref('name')
  const sortAsc = ref(true)

  watch([searchQuery, filterRole, filterClasse], () => { currentPage.value = 1 })

  // Liste unifiée étudiants + enseignants
  const allUsers = computed(() => {
    const users = []
    etudiants.value.forEach(e => {
      users.push({
        _uid: `etu-${e.id}`, klassci_id: e.id,
        name: e.name || e.nom || `${e.prenom || ''} ${e.nom || ''}`.trim(),
        email: e.email, role: 'etudiant',
        classe_id: e.classe_id, classe_nom: e.classe_nom,
        matricule: e.matricule, telephone: e.telephone,
      })
    })
    enseignants.value.forEach(e => {
      users.push({
        _uid: `ens-${e.id || e.teacher_id}`, klassci_id: e.id || e.teacher_id,
        name: e.nom || e.name || `${e.prenom || ''} ${e.nom || ''}`.trim(),
        email: e.email, role: 'enseignant',
        classe_id: null, classe_nom: null,
        matricule: e.matricule, telephone: e.telephone, specialization: e.specialization,
      })
    })
    return users
  })

  const totalUsers = computed(() => allUsers.value.length)

  const filteredUsers = computed(() => {
    let result = allUsers.value
    if (filterRole.value !== 'all') result = result.filter(u => u.role === filterRole.value)
    if (filterClasse.value !== 'all') result = result.filter(u => u.classe_id === filterClasse.value)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      result = result.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)))
    }
    result.sort((a, b) => {
      const valA = (a[sortField.value] || '').toString().toLowerCase()
      const valB = (b[sortField.value] || '').toString().toLowerCase()
      const cmp = valA.localeCompare(valB)
      return sortAsc.value ? cmp : -cmp
    })
    return result
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / PAGE_SIZE)))
  const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return filteredUsers.value.slice(start, start + PAGE_SIZE)
  })

  function sortBy(field) {
    if (sortField.value === field) sortAsc.value = !sortAsc.value
    else { sortField.value = field; sortAsc.value = true }
  }
  const selectUser = (user) => { selectedUser.value = user }
  const closeModal = () => { selectedUser.value = null }

  // Récupère classes + enseignants + étudiants (par classe) depuis KLASSCI
  async function fetchAll(onProgress) {
    const classesData = await klassciService.getClasses()
    classes.value = Array.isArray(classesData) ? classesData : []
    const enseignantsData = await klassciService.getEnseignants()
    enseignants.value = Array.isArray(enseignantsData) ? enseignantsData : []
    const allEtudiants = []
    for (const classe of classes.value) {
      try {
        onProgress?.(`Chargement des étudiants de ${classe.nom || 'classe ' + classe.id}...`)
        const etudiantsData = await klassciService.getClasseEtudiants(classe.id)
        const arr = Array.isArray(etudiantsData) ? etudiantsData : []
        arr.forEach(etu => {
          etu.classe_id = classe.id
          etu.classe_nom = classe.name || classe.libelle || classe.nom || `Classe ${classe.id}`
          allEtudiants.push(etu)
        })
      } catch (err) {
        console.warn(`Impossible de charger les étudiants de la classe ${classe.id}:`, err.message)
      }
    }
    etudiants.value = allEtudiants
    writeCache('admin_users', { etudiants: etudiants.value, enseignants: enseignants.value, classes: classes.value })
  }

  async function loadAllUsers(forceReload = false) {
    try {
      loading.value = true; error.value = null; loadingProgress.value = ''
      if (forceReload) {
        // #237 : le force-reload re-fetche classes + enseignants (+ étudiants) ;
        // on invalide leurs clés sœurs pour que les vues admin/coordinateur/
        // enseignant ne servent plus une version périmée.
        invalidateEntity('classes')
        invalidateEntity('enseignants')
      }
      if (!forceReload) {
        const cached = readCache('admin_users')
        if (cached && cached.etudiants?.length > 0) {
          etudiants.value = cached.etudiants
          enseignants.value = cached.enseignants || []
          classes.value = cached.classes || []
          loading.value = false
          fetchAll().catch(() => {}) // rafraîchissement en arrière-plan
          return
        }
      }
      loadingProgress.value = 'Chargement des données...'
      await fetchAll((p) => { loadingProgress.value = p })
      loading.value = false; loadingProgress.value = ''
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err)
      error.value = err.message || 'Erreur lors du chargement des utilisateurs'
      loading.value = false; loadingProgress.value = ''
    }
  }

  onMounted(() => { loadAllUsers() })

  return {
    etudiants, enseignants, classes, loading, loadingProgress, error, selectedUser,
    searchQuery, filterRole, filterClasse, currentPage, sortField, sortAsc,
    totalUsers, filteredUsers, totalPages, paginatedUsers,
    sortBy, selectUser, closeModal, loadAllUsers,
  }
}
