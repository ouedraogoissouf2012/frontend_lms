<template>
  <DashboardLayout>
    <div class="schedule-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <i class="material-icons page-icon">calendar_month</i>
          <div>
            <h1 class="page-title">Mon Emploi du Temps</h1>
            <p class="page-subtitle">Consultez vos cours et évaluations sur le calendrier</p>
          </div>
        </div>
      </div>

      <!-- Universal Calendar Component -->
      <UniversalCalendar
        user-role="student"
        :user-id="currentUser?.klassci_etudiant_id"
        @event-action="handleEventAction"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import UniversalCalendar from '@/components/calendar/UniversalCalendar.vue'
import { lmsService } from '@/services/lms'
import { useAuthStore } from '@/stores/auth'
import { useTrackedVisioJoin } from '@/composables/useTrackedVisioJoin'
import { notifyVisioError, notifyVisioWarning } from '@/services/visioFeedback'

const router = useRouter()
const { joinTrackedVisio } = useTrackedVisioJoin('Etudiant')

// Utilisateur courant réactif depuis le store (#19) — plus de localStorage('user')
const currentUser = computed(() => useAuthStore().currentUser)

async function handleEventAction({ type, data }) {
  console.log('[StudentSchedule] Action:', type, data)

  switch (type) {
    case 'joinVisio':
      try {
        await joinTrackedVisio(data, {
          displayName: currentUser.value?.name || 'Etudiant',
        })
        console.log('[StudentSchedule] Rejoint visio avec tracking:', data.id)
      } catch (error) {
        console.error('[StudentSchedule] Erreur rejoindre visio:', error)
        // Si la visio n'est pas active, afficher message
        if (error.response?.status === 400) {
          notifyVisioWarning('La visio n\'est pas encore active. Attendez que l\'enseignant la demarre.')
        } else if (error.message) {
          notifyVisioError(error, error.message)
        } else {
          notifyVisioError(error, 'Erreur lors de la connexion a la visio')
        }
      }
      break

    case 'startEvaluation':
      router.push(`/student/evaluations/${data.id}/take`)
      break

    case 'hideSeance':
      try {
        await lmsService.hideSeance(data.id)
      } catch (error) {
        console.error('[StudentSchedule] Erreur masquage séance:', error)
      }
      break

    case 'viewDetails':
      router.push(`/seances/${data.id}`)
      break

    default:
      console.warn('[StudentSchedule] Action non gérée:', type)
  }
}
</script>

<style scoped>
.schedule-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  font-size: 2.5rem;
  line-height: 1;
  flex-shrink: 0;
  color: var(--color-info-strong);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

@media (max-width: 768px) {
  .schedule-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-icon {
    font-size: 2rem;
    color: var(--color-info-strong);
  }
}
</style>
