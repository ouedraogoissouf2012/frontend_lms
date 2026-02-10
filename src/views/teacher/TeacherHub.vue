<template>
  <DashboardLayout>
    <div class="hub-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mon Espace</h1>
          <p class="page-subtitle">Accedez rapidement a vos classes, matieres et lecons</p>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement de votre espace..." />

      <!-- Hub Grid -->
      <div v-else class="hub-grid">
        <!-- Section Classes -->
        <router-link to="/teacher/classes" class="hub-card">
          <div class="card-icon classes-icon">
            <UserGroupIcon class="icon" />
          </div>
          <div class="card-content">
            <h2 class="card-title">Mes Classes</h2>
            <p class="card-description">Les classes auxquelles vous enseignez</p>
            <div class="card-stat">
              <span class="stat-number">{{ stats.classes }}</span>
              <span class="stat-label">classe(s)</span>
            </div>
          </div>
          <div class="card-footer">
            <span>Voir mes classes</span>
            <ArrowRightIcon class="arrow-icon" />
          </div>
        </router-link>

        <!-- Section Matieres -->
        <router-link to="/teacher/matieres" class="hub-card">
          <div class="card-icon matieres-icon">
            <BookOpenIcon class="icon" />
          </div>
          <div class="card-content">
            <h2 class="card-title">Mes Matieres</h2>
            <p class="card-description">Les matieres que vous enseignez</p>
            <div class="card-stat">
              <span class="stat-number">{{ stats.matieres }}</span>
              <span class="stat-label">matiere(s)</span>
            </div>
          </div>
          <div class="card-footer">
            <span>Voir mes matieres</span>
            <ArrowRightIcon class="arrow-icon" />
          </div>
        </router-link>

        <!-- Section Lecons -->
        <router-link to="/teacher/lessons" class="hub-card">
          <div class="card-icon lecons-icon">
            <AcademicCapIcon class="icon" />
          </div>
          <div class="card-content">
            <h2 class="card-title">Mes Lecons</h2>
            <p class="card-description">Les lecons que vous avez creees</p>
            <div class="card-stat">
              <span class="stat-number">{{ stats.lecons }}</span>
              <span class="stat-label">lecon(s)</span>
            </div>
          </div>
          <div class="card-footer">
            <span>Voir mes lecons</span>
            <ArrowRightIcon class="arrow-icon" />
          </div>
        </router-link>
      </div>

      <!-- Quick Stats -->
      <div v-if="!loading" class="quick-stats">
        <h3 class="section-title">Apercu rapide</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <CalendarIcon class="stat-icon text-blue-500" />
            <div>
              <p class="stat-value">{{ stats.seancesAVenir }}</p>
              <p class="stat-label">Seances a venir</p>
            </div>
          </div>
          <div class="stat-card">
            <ClipboardDocumentCheckIcon class="stat-icon text-orange-500" />
            <div>
              <p class="stat-value">{{ stats.evaluations }}</p>
              <p class="stat-label">Evaluations actives</p>
            </div>
          </div>
          <div class="stat-card">
            <UsersIcon class="stat-icon text-green-500" />
            <div>
              <p class="stat-value">{{ stats.etudiants }}</p>
              <p class="stat-label">Etudiants total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { klassciService } from '@/services/klassci'
import { lmsService } from '@/services/lms'
import {
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon
} from '@heroicons/vue/24/outline'

const loading = ref(true)
const stats = ref({
  classes: 0,
  matieres: 0,
  lecons: 0,
  seancesAVenir: 0,
  evaluations: 0,
  etudiants: 0
})

async function loadStats() {
  loading.value = true

  try {
    // Charger les donnees en parallele
    const [classes, matieres, dashboard, seances] = await Promise.all([
      klassciService.getClasses().catch(() => []),
      klassciService.getMatieres().catch(() => []),
      klassciService.getTeacherDashboard().catch(() => ({})),
      lmsService.getMyTeachingSeances().catch(() => ({ data: [] }))
    ])

    // Compter les classes
    stats.value.classes = Array.isArray(classes) ? classes.length : 0

    // Compter les matieres
    stats.value.matieres = Array.isArray(matieres) ? matieres.length : 0

    // Compter les lecons depuis le dashboard
    stats.value.lecons = dashboard?.nb_lecons || dashboard?.total_lessons || 0

    // Compter les seances a venir
    const seancesData = seances?.data || []
    const now = new Date()
    stats.value.seancesAVenir = seancesData.filter(s => {
      const dateSeance = new Date(s.programmation?.date || s.date_seance)
      return dateSeance >= now
    }).length

    // Compter les evaluations actives
    stats.value.evaluations = dashboard?.nb_evaluations || dashboard?.evaluations_count || 0

    // Compter les etudiants total (depuis les classes)
    let totalEtudiants = 0
    for (const classe of (Array.isArray(classes) ? classes : [])) {
      try {
        const etudiants = await klassciService.getClasseEtudiants(classe.id)
        totalEtudiants += etudiants?.length || 0
      } catch (e) {
        // Ignorer les erreurs
      }
    }
    stats.value.etudiants = totalEtudiants

    console.log('[HUB] Stats chargees:', stats.value)
  } catch (error) {
    console.error('[HUB] Erreur chargement stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.hub-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Hub Grid - 3 colonnes */
.hub-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

/* Hub Card - Carte entiere cliquable */
.hub-card {
  background: var(--card-bg);
  border-radius: 1rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-decoration: none;
  cursor: pointer;
}

.hub-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
  border-color: var(--primary-color, #3b82f6);
}

.hub-card:hover .card-footer {
  background: var(--primary-color, #3b82f6);
  color: white;
}

.hub-card:hover .arrow-icon {
  transform: translateX(4px);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.card-icon .icon {
  width: 32px;
  height: 32px;
  color: white;
}

.classes-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.matieres-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.lecons-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.card-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.card-stat {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  margin-top: auto;
}

.card-footer .arrow-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.2s ease;
}

/* Quick Stats Section */
.quick-stats {
  margin-top: 1rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--card-shadow);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.stat-card .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stat-card .stat-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .hub-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hub-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.5rem;
  }
}

/* Text color utilities */
.text-blue-500 {
  color: #3b82f6;
}

.text-orange-500 {
  color: #f59e0b;
}

.text-green-500 {
  color: #10b981;
}
</style>
