<template>
  <div>
    <div class="widget-card mb-6">
      <div class="widget-header">
        <BuildingLibraryIcon class="widget-icon text-blue-600" />
        <h2 class="widget-title">Mon Profil</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4" v-if="dashboardData.classe">
        <div class="info-item">
          <p class="info-label">Classe</p>
          <p class="info-value">{{ dashboardData.classe.name || dashboardData.classe.libelle || 'N/A' }}</p>
        </div>
        <div class="info-item">
          <p class="info-label">Filière</p>
          <p class="info-value">{{ dashboardData.classe.filiere?.name || dashboardData.classe.filiere?.nom || dashboardData.classe.filiere?.libelle || 'N/A' }}</p>
        </div>
        <div class="info-item">
          <p class="info-label">Niveau</p>
          <p class="info-value">{{ dashboardData.classe.niveau?.name || dashboardData.classe.niveau?.nom || dashboardData.classe.niveau?.libelle || 'N/A' }}</p>
        </div>
      </div>
      <p v-else class="text-gray-500">Aucune classe assignée</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="widget-card">
        <div class="widget-header">
          <ChartBarIcon class="widget-icon text-green-600" />
          <h2 class="widget-title">Performance</h2>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <p class="stat-label">Moyenne Générale</p>
            <p class="stat-value text-blue-600">
              {{ dashboardData.statistiques?.moyenne_generale || 'N/A' }}
            </p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Taux de Présence</p>
            <p class="stat-value text-green-600">
              {{ dashboardData.statistiques?.taux_presence || '0' }}%
            </p>
          </div>
        </div>
      </div>

      <div class="widget-card">
        <div class="widget-header">
          <BookOpenIcon class="widget-icon text-purple-600" />
          <h2 class="widget-title">Activité</h2>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <p class="stat-label">Cours Suivis</p>
            <p class="stat-value text-purple-600">
              {{ dashboardData.cours?.length || 0 }}
            </p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Évaluations Effectuées</p>
            <p class="stat-value text-orange-600">
              {{ dashboardData.quiz?.length || 0 }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="widget-card mb-6" v-if="dashboardData.notes && dashboardData.notes.length > 0">
      <div class="widget-header">
        <DocumentTextIcon class="widget-icon text-indigo-600" />
        <h2 class="widget-title">Notes Récentes</h2>
      </div>
      <div class="space-y-3">
        <div
          v-for="note in dashboardData.notes.slice(0, 5)"
          :key="note.id"
          class="note-item"
        >
          <div class="note-info">
            <p class="note-title">{{ note.evaluation?.titre || 'Évaluation' }}</p>
            <p class="note-matiere">{{ note.matiere?.name || 'Matière inconnue' }}</p>
          </div>
          <div class="note-score">
            <p class="text-2xl font-bold text-blue-600">{{ note.note }}/20</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      <router-link
        :to="{ name: 'student-courses' }"
        class="action-card"
        aria-label="Accéder à la page Mes Cours"
      >
        <BookOpenIcon class="action-icon text-blue-600" aria-hidden="true" />
        <h3 class="action-title">Mes Cours</h3>
        <p class="action-description">Accéder à tous mes cours</p>
      </router-link>

      <router-link
        :to="{ name: 'student-evaluations-list' }"
        class="action-card"
        aria-label="Accéder à la page Évaluations"
      >
        <DocumentTextIcon class="action-icon text-orange-600" aria-hidden="true" />
        <h3 class="action-title">Évaluations</h3>
        <p class="action-description">Voir toutes mes évaluations</p>
      </router-link>

      <router-link
        :to="{ name: 'student-schedule', query: { filter: 'visio' } }"
        class="action-card"
        aria-label="Accéder à la page Visioconférences"
      >
        <VideoCameraIcon class="action-icon text-purple-600" aria-hidden="true" />
        <h3 class="action-title">Visioconférences</h3>
        <p class="action-description">Mes séances en ligne</p>
      </router-link>

      <router-link
        to="/forum"
        class="action-card"
        aria-label="Accéder au Forum"
      >
        <ChatBubbleLeftRightIcon class="action-icon text-green-600" aria-hidden="true" />
        <h3 class="action-title">Forum</h3>
        <p class="action-description">Poser une question</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
/**
 * Contenu du Dashboard Étudiant (#G1 ≤300). Présentation pure : profil,
 * widgets performance/activité, notes récentes et actions rapides. Reçoit
 * les données déjà chargées via la prop `dashboardData`.
 */
import {
  BuildingLibraryIcon,
  ChartBarIcon,
  BookOpenIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'

defineProps({
  dashboardData: { type: Object, required: true }
})
</script>
<style scoped>
.widget-card {
  background-color: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.widget-card:hover {
  box-shadow: var(--card-hover-shadow);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.widget-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.info-item {
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
}

.note-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.note-item:hover {
  background: var(--bg-tertiary);
}

.note-info {
  flex: 1;
}

.note-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.note-matiere {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.note-score {
  text-align: right;
}

.action-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  transition: all 0.2s;
  text-decoration: none;
  display: block;
}

.action-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-4px);
}

.action-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.75rem;
}

.action-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.action-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
