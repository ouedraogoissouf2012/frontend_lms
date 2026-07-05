<template>
  <DashboardLayout>
    <div class="schedule-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <i class="material-icons page-icon">calendar_month</i>
          <div>
            <h1 class="page-title">Emploi du Temps</h1>
            <p class="page-subtitle">Gerez vos seances et evaluations sur le calendrier</p>
          </div>
        </div>
      </div>

      <!-- Universal Calendar Component -->
      <UniversalCalendar
        ref="calendarRef"
        user-role="teacher"
        :user-id="currentUser?.klassci_id"
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
import { useTrackedVisioJoin } from '@/composables/useTrackedVisioJoin'
import { notifyVisioError } from '@/services/visioFeedback'

const router = useRouter()
const calendarRef = ref(null)
const { joinTrackedVisio } = useTrackedVisioJoin('Enseignant')

// Utilisateur courant réactif depuis le store (#19) — plus de localStorage('user')
const currentUser = computed(() => useAuthStore().currentUser)

async function handleEventAction({ type, data }) {
  console.log('[TeacherSchedule] Action:', type, data)

  switch (type) {
    case 'joinVisio':
      try {
        await joinTrackedVisio(data, {
          displayName: currentUser.value?.name || 'Enseignant',
        })
      } catch (error) {
        console.error('[TeacherSchedule] Room visio absente:', error)
        notifyVisioError(error, 'Erreur lors de la connexion a la visio')
      }
      break

    case 'startVisio':
      // Enseignant demarre la visio - appeler API puis ouvrir Jitsi
      try {
        const result = await lmsService.startVisio(data.id)
        if (result.success) {
          await joinTrackedVisio(data, {
            roomSource: result.data,
            displayName: currentUser.value?.name || 'Enseignant',
          })
          console.log('[TeacherSchedule] Visio demarree avec tracking:', data.id)
          // Rafraichir le calendrier
          if (calendarRef.value?.refreshEvents) {
            await calendarRef.value.refreshEvents()
          }
        } else {
          notifyVisioError(new Error(result.message || 'Impossible de demarrer la visio'))
        }
      } catch (error) {
        console.error('[TeacherSchedule] Erreur demarrage visio:', error)
        notifyVisioError(error, 'Erreur lors du demarrage de la visio')
      }
      break

    case 'activateVisio':
      // Activer la visio pour une seance (sans la demarrer)
      try {
        await lmsService.activateVisio(data.id)
        console.log('[TeacherSchedule] Visio activee:', data.id)
        if (calendarRef.value?.refreshEvents) {
          await calendarRef.value.refreshEvents()
        }
      } catch (error) {
        console.error('[TeacherSchedule] Erreur activation visio:', error)
        notifyVisioError(error, 'Erreur lors de l\'activation de la visio')
      }
      break

    case 'viewEvaluationResults':
      // Voir les resultats d'une evaluation
      router.push(`/teacher/evaluations/${data.id}/results`)
      break

    case 'editEvaluation':
      // Modifier une evaluation (si pas encore soumise)
      router.push(`/teacher/evaluations/${data.id}/edit`)
      break

    case 'viewDetails':
      // Voir les details d'une seance
      router.push(`/seances/${data.id}`)
      break

    case 'viewAttendance':
      // Voir la liste de presence
      router.push(`/attendance/seances/${data.id}`)
      break

    case 'endVisio':
      // Terminer la visio
      try {
        await lmsService.endVisio(data.id)
        console.log('[TeacherSchedule] Visio terminee:', data.id)
        // Rafraichir le calendrier pour mettre a jour le statut
        if (calendarRef.value?.refreshEvents) {
          await calendarRef.value.refreshEvents()
        }
      } catch (error) {
        console.error('[TeacherSchedule] Erreur fin visio:', error)
        notifyVisioError(error, 'Erreur lors de la terminaison de la visio')
      }
      break

    case 'viewParticipants':
      // Voir les participants - rediriger vers la page de presence
      router.push(`/attendance/seances/${data.id}`)
      break

    case 'exportAttendance':
      // Exporter la presence - rediriger vers la page avec option export
      router.push(`/attendance/seances/${data.id}?export=true`)
      break

    case 'enableVisio':
    case 'toggleVisio':
      // Activer/desactiver la visio - rediriger vers les details
      router.push(`/seances/${data.id}`)
      break

    default:
      console.warn('[TeacherSchedule] Action non geree:', type)
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
</style>
