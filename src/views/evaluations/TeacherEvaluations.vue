<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <!-- En-tête -->
      <div class="mb-8">
        <button
          @click="$router.back()"
          class="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Retour
        </button>
        <h1 class="text-3xl font-bold text-gray-900">Évaluations</h1>
        <p class="text-gray-600 mt-2">Gérez les évaluations en ligne de vos classes</p>
      </div>

      <!-- Filtres -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Classe</label>
            <select
              v-model="filters.classe_id"
              @change="loadEvaluationsKlassci"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les classes</option>
              <option
                v-for="classe in classes"
                :key="classe.id"
                :value="classe.id"
              >
                {{ classe.name || classe.libelle }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Matière</label>
            <select
              v-model="filters.matiere_id"
              @change="loadEvaluationsKlassci"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les matières</option>
              <option
                v-for="matiere in matieres"
                :key="matiere.id"
                :value="matiere.id"
              >
                {{ matiere.name || matiere.nom }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              v-model="filters.statut"
              @change="loadEvaluationsKlassci"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="planifiee">Planifiée</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
        <p class="text-gray-600 mt-4">Chargement des évaluations...</p>
      </div>

      <!-- Liste des évaluations KLASSCI -->
      <div v-else>
        <div v-if="evaluationsKlassci.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-gray-600 text-lg">Aucune évaluation trouvée dans KLASSCI</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="evaluation in evaluationsKlassci"
            :key="evaluation.id"
            class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-xl font-semibold text-gray-900">{{ evaluation.titre }}</h3>
                  <span
                    :class="getStatusClass(evaluation.status)"
                    class="px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {{ evaluation.status }}
                  </span>
                  <span
                    v-if="hasOnlineVersion(evaluation.id)"
                    class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    ✓ Version en ligne
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p class="text-sm text-gray-600">Matière</p>
                    <p class="font-medium">{{ evaluation.matiere?.nom || evaluation.matiere?.name || 'Non définie' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Classe</p>
                    <p class="font-medium">{{ evaluation.classe?.nom || evaluation.classe?.name || evaluation.classe?.libelle || 'Non définie' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Date</p>
                    <p class="font-medium">{{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}</p>
                  </div>
                  <div v-if="evaluation.programmation?.window">
                    <p class="text-sm text-gray-600">État</p>
                    <p class="font-medium">
                      <span v-if="!evaluation.programmation.window.has_started" class="flex items-center gap-1 text-orange-600">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                        </svg>
                        Prévu
                      </span>
                      <span v-else-if="evaluation.programmation.window.is_open" class="flex items-center gap-1 text-green-600">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        En cours ({{ evaluation.programmation.window.time_left_minutes }} min)
                      </span>
                      <span v-else class="flex items-center gap-1 text-gray-600">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                        Terminé
                      </span>
                    </p>
                  </div>
                  <div v-else>
                    <p class="text-sm text-gray-600">Coefficient / Barème</p>
                    <p class="font-medium">{{ evaluation.programmation?.coefficient || evaluation.coefficient || 1 }} - {{ evaluation.programmation?.bareme || evaluation.bareme || 20 }}/20</p>
                  </div>
                </div>

                <!-- Infos version en ligne si existe -->
                <div v-if="hasOnlineVersion(evaluation.id)" class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p class="text-sm text-blue-900 mb-2">
                    <strong>Version en ligne configurée</strong>
                  </p>
                  <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span class="text-blue-700">Questions: </span>
                      <span class="font-medium">{{ getOnlineVersion(evaluation.id)?.questions_count || 0 }}</span>
                    </div>
                    <div>
                      <span class="text-blue-700">Durée: </span>
                      <span class="font-medium">{{ getOnlineVersion(evaluation.id)?.duree_minutes }} min</span>
                    </div>
                    <div>
                      <span class="text-blue-700">Soumissions: </span>
                      <span class="font-medium">{{ getOnlineVersion(evaluation.id)?.submissions_count || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-4">
              <button
                v-if="!hasOnlineVersion(evaluation.id)"
                @click="createOnlineVersion(evaluation)"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Créer version en ligne
              </button>
              <button
                v-else
                @click="editOnlineVersion(evaluation)"
                class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Modifier les questions
              </button>
              <button
                v-if="hasOnlineVersion(evaluation.id) && getOnlineVersion(evaluation.id)?.submissions_count > 0"
                @click="syncToKlassci(evaluation)"
                :disabled="syncing === evaluation.id"
                class="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                {{ syncing === evaluation.id ? 'Synchronisation...' : 'Synchroniser les notes' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import klassciService from '@/services/klassci'
import evaluationService from '@/services/evaluation'

export default {
  name: 'TeacherEvaluations',
  data() {
    return {
      evaluationsKlassci: [],
      evaluationsLMS: [],
      classes: [],
      matieres: [],
      filters: {
        classe_id: '',
        matiere_id: '',
        statut: ''
      },
      loading: true,
      syncing: null
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // Charger les classes et matières
        const [classes, matieres] = await Promise.all([
          klassciService.getClasses(),
          klassciService.getMatieres()
        ])

        // klassciService retourne directement les données, pas un objet {success, data}
        this.classes = Array.isArray(classes) ? classes : []
        this.matieres = Array.isArray(matieres) ? matieres : []

        // Charger les évaluations
        await this.loadEvaluationsKlassci()
        await this.loadEvaluationsLMS()
      } catch (error) {
        console.error('Erreur chargement données:', error)
      } finally {
        this.loading = false
      }
    },

    async loadEvaluationsKlassci() {
      try {
        const result = await klassciService.getEvaluations(this.filters)
        if (result.success) {
          this.evaluationsKlassci = result.data
          console.log('✅ Évaluations KLASSCI récupérées:', this.evaluationsKlassci)
        }
      } catch (error) {
        console.error('Erreur chargement via /lms/evaluations, utilisation du dashboard:', error)

        // Fallback: utiliser les évaluations du dashboard enseignant
        try {
          const dashboard = await klassciService.getTeacherDashboard()
          if (dashboard && dashboard.evaluations) {
            this.evaluationsKlassci = dashboard.evaluations
            console.log('✅ Évaluations récupérées depuis le dashboard:', this.evaluationsKlassci)
            console.log('📋 Structure première évaluation:', this.evaluationsKlassci[0])
          }
        } catch (dashboardError) {
          console.error('Erreur chargement depuis dashboard:', dashboardError)
        }
      }
    },

    async loadEvaluationsLMS() {
      try {
        const result = await evaluationService.getEvaluations()
        if (result.success) {
          this.evaluationsLMS = result.data
          console.log('✅ Évaluations LMS récupérées:', this.evaluationsLMS.length)
        }
      } catch (error) {
        console.error('⚠️ Erreur chargement évaluations LMS (normal si aucune créée):', error.message)
        // C'est normal si aucune évaluation n'a encore été créée dans le LMS
        this.evaluationsLMS = []
      }
    },

    hasOnlineVersion(klassciEvaluationId) {
      return this.evaluationsLMS.some(e => e.klassci_evaluation_id === klassciEvaluationId)
    },

    getOnlineVersion(klassciEvaluationId) {
      const lmsEval = this.evaluationsLMS.find(e => e.klassci_evaluation_id === klassciEvaluationId)
      if (lmsEval) {
        return {
          ...lmsEval,
          questions_count: lmsEval.questions?.length || 0,
          submissions_count: lmsEval.submissions?.length || 0
        }
      }
      return null
    },

    getStatusClass(status) {
      const classes = {
        'planifiee': 'bg-blue-100 text-blue-800',
        'en_cours': 'bg-green-100 text-green-800',
        'terminee': 'bg-gray-100 text-gray-800',
        'brouillon': 'bg-yellow-100 text-yellow-800'
      }
      return classes[status] || 'bg-gray-100 text-gray-800'
    },

    formatDate(date) {
      if (!date) return 'Non définie'
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    createOnlineVersion(evaluationKlassci) {
      // Rediriger vers la page de création de questions uniquement
      this.$router.push({
        name: 'CreateQuestions',
        query: {
          klassci_id: evaluationKlassci.id
        }
      })
    },

    editOnlineVersion(evaluationKlassci) {
      const lmsEval = this.getOnlineVersion(evaluationKlassci.id)
      this.$router.push({
        name: 'EditQuestions',
        params: { id: lmsEval.id },
        query: {
          klassci_id: evaluationKlassci.id
        }
      })
    },

    async syncToKlassci(evaluationKlassci) {
      const lmsEval = this.getOnlineVersion(evaluationKlassci.id)
      if (!lmsEval) return

      if (!confirm(`Synchroniser ${lmsEval.submissions_count} note(s) vers KLASSCI ?`)) {
        return
      }

      this.syncing = evaluationKlassci.id
      try {
        const result = await evaluationService.syncToKlassci(lmsEval.id)
        if (result.success) {
          alert('Notes synchronisées avec succès vers KLASSCI !')
          await this.loadEvaluationsLMS()
        }
      } catch (error) {
        console.error('Erreur synchronisation:', error)
        alert('Erreur lors de la synchronisation')
      } finally {
        this.syncing = null
      }
    }
  }
}
</script>
