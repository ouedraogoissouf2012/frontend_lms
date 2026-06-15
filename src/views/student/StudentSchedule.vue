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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import UniversalCalendar from '@/components/calendar/UniversalCalendar.vue'
import { lmsService } from '@/services/lms'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

// Utilisateur courant réactif depuis le store (#19) — plus de localStorage('user')
const currentUser = computed(() => useAuthStore().currentUser)

async function handleEventAction({ type, data }) {
  console.log('[StudentSchedule] Action:', type, data)

  switch (type) {
    case 'joinVisio':
      // Etudiant rejoint la visio - appeler API puis ouvrir Jitsi
      try {
        // Appeler l'API pour enregistrer la participation
        await lmsService.joinVisio(data.id)
        console.log('[StudentSchedule] Rejoint visio:', data.id)
        // Ouvrir Jitsi
        const roomId = data.visio?.room_id || data.visio_room_id || `seance_${data.id}`
        const userName = encodeURIComponent(currentUser.value?.name || 'Etudiant')
        const jitsiLink = `https://meet.jit.si/${roomId}#config.prejoinConfig.enabled=false&userInfo.displayName=${userName}`
        window.open(jitsiLink, '_blank')
      } catch (error) {
        console.error('[StudentSchedule] Erreur rejoindre visio:', error)
        // Si la visio n'est pas active, afficher message
        if (error.response?.status === 400) {
          alert('La visio n\'est pas encore active. Attendez que l\'enseignant la demarre.')
        } else {
          alert('Erreur lors de la connexion a la visio')
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
  color: #2563eb;
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
    color: #2563eb;
  }
}
</style>
