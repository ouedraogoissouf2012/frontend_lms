<template>
  <div class="enseignants-list-container">
    <h2>Liste des Enseignants</h2>

    <!-- Filtres -->
    <div class="filters">
      <label>
        <input type="checkbox" v-model="withDetails" />
        Afficher les détails (classes, matières, statistiques)
      </label>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      Chargement des enseignants...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error">
      ⚠️ {{ error }}
    </div>

    <!-- Liste des enseignants -->
    <div v-else-if="enseignants && enseignants.length > 0" class="enseignants-grid">
      <div
        v-for="enseignant in enseignants"
        :key="enseignant.id"
        class="enseignant-card"
      >
        <div class="enseignant-header">
          <h3>{{ enseignant.nom }}</h3>
          <span class="badge">{{ enseignant.role }}</span>
        </div>

        <div class="enseignant-info">
          <p><strong>Email:</strong> {{ enseignant.email }}</p>
          <p v-if="enseignant.matricule"><strong>Matricule:</strong> {{ enseignant.matricule }}</p>
          <p v-if="enseignant.specialization"><strong>Spécialisation:</strong> {{ enseignant.specialization }}</p>
          <p><strong>Statut:</strong> {{ enseignant.status }}</p>
        </div>

        <!-- Détails enrichis (si with_details=true) -->
        <div v-if="enseignant.statistiques" class="enseignant-stats">
          <h4>📊 Statistiques</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Classes</span>
              <span class="stat-value">{{ enseignant.statistiques.total_classes }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Matières</span>
              <span class="stat-value">{{ enseignant.statistiques.total_matieres }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Heures prévues</span>
              <span class="stat-value">{{ enseignant.statistiques.total_heures_prevues }}h</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Heures effectuées</span>
              <span class="stat-value">{{ enseignant.statistiques.total_heures_effectuees }}h</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Taux réalisation</span>
              <span class="stat-value">{{ enseignant.statistiques.taux_realisation_global.toFixed(1) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Séances effectuées</span>
              <span class="stat-value">{{ enseignant.statistiques.nb_seances_effectuees }}/{{ enseignant.statistiques.nb_seances_total }}</span>
            </div>
          </div>

          <!-- Classes -->
          <div v-if="enseignant.classes && enseignant.classes.length > 0" class="classes-list">
            <h5>📚 Classes enseignées</h5>
            <ul>
              <li v-for="classe in enseignant.classes" :key="classe.id">
                {{ classe.nom }} - {{ classe.filiere.nom }} {{ classe.niveau.nom }}
              </li>
            </ul>
          </div>

          <!-- Matières -->
          <div v-if="enseignant.matieres && enseignant.matieres.length > 0" class="matieres-list">
            <h5>📖 Matières enseignées</h5>
            <div v-for="matiere in enseignant.matieres" :key="matiere.id" class="matiere-item">
              <strong>{{ matiere.nom }}</strong> ({{ matiere.code }})
              <span class="matiere-progress">
                {{ matiere.heures_effectuees }}h / {{ matiere.heures_prevues }}h
                ({{ matiere.taux_realisation.toFixed(0) }}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Aucun enseignant -->
    <div v-else class="empty-state">
      Aucun enseignant trouvé
    </div>
  </div>
</template>

<script>
import klassciService from '@/services/klassci'

export default {
  name: 'EnseignantsListExample',

  data() {
    return {
      loading: false,
      error: null,
      enseignants: [],
      withDetails: false
    }
  },

  watch: {
    withDetails() {
      this.loadEnseignants()
    }
  },

  mounted() {
    this.loadEnseignants()
  },

  methods: {
    async loadEnseignants() {
      try {
        this.loading = true
        this.error = null

        console.log('[EnseignantsListExample] Chargement avec withDetails:', this.withDetails)

        const response = await klassciService.getLmsEnseignants({
          with_details: this.withDetails
        })

        console.log('[EnseignantsListExample] Réponse:', response)

        if (response.success) {
          this.enseignants = response.data
          console.log(`[EnseignantsListExample] ${this.enseignants.length} enseignants chargés`)
        } else {
          this.error = response.message || 'Erreur lors du chargement des enseignants'
        }
      } catch (err) {
        console.error('[EnseignantsListExample] Erreur:', err)
        this.error = err.message || 'Erreur lors du chargement des enseignants'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.enseignants-list-container {
  padding: 2rem;
}

h2 {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.filters {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--card-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--border-primary);
}

.filters label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
}

.loading, .error, .empty-state {
  padding: 2rem;
  text-align: center;
  background: var(--card-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--border-primary);
}

.error {
  color: #ef4444;
  border-color: #ef4444;
}

.enseignants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.enseignant-card {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  transition: all 0.2s ease;
}

.enseignant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.enseignant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.enseignant-header h3 {
  color: var(--text-primary);
  font-size: 1.25rem;
  margin: 0;
}

.badge {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.enseignant-info {
  margin-bottom: 1rem;
}

.enseignant-info p {
  color: var(--text-secondary);
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.enseignant-info strong {
  color: var(--text-primary);
  font-weight: 600;
}

.enseignant-stats {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.enseignant-stats h4 {
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-primary);
}

.stat-label {
  display: block;
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.classes-list, .matieres-list {
  margin-top: 1rem;
}

.classes-list h5, .matieres-list h5 {
  color: var(--text-primary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.classes-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.classes-list li {
  color: var(--text-secondary);
  font-size: 0.875rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.matiere-item {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.matiere-item strong {
  display: block;
  color: var(--text-primary);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.matiere-progress {
  color: var(--text-secondary);
  font-size: 0.75rem;
}
</style>
