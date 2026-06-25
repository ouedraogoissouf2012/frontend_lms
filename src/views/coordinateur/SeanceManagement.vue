<template>
  <DashboardLayout>
    <div class="seances-container">
      <!-- Header + bascule de vue -->
      <CoordinatorSeanceHeader v-model:view-mode="viewMode" />

      <!-- Calendar View -->
      <div v-if="viewMode === 'calendar'" class="calendar-section">
        <UniversalCalendar
          ref="calendarRef"
          user-role="coordinator"
          @event-action="handleCalendarAction"
        />
      </div>

      <!-- List View -->
      <template v-else>
        <!-- Filters -->
        <CoordinatorSeanceFilters
          :enseignants="enseignants"
          :classes="classes"
          v-model:days="filters.days"
          v-model:teacher-id="filters.teacher_id"
          v-model:classe-id="filters.classe_id"
          @change="loadSeances"
        />

        <!-- Loading -->
        <ContentLoader v-if="loading" text="Chargement des séances..." />

        <!-- Error -->
        <div v-else-if="error" class="error-state">
          <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
          <div class="error-content">
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
          <button @click="loadSeances" class="error-retry-btn">
            <i class="fa fa-refresh icon"></i>
            Réessayer
          </button>
        </div>

        <!-- Séances List -->
        <div v-else-if="seances && seances.length > 0" class="seances-list">
          <CoordinatorSeanceCard
            v-for="seance in seances"
            :key="seance.id"
            :seance="seance"
            @toggle="toggleSeanceVisio"
            @show-participants="showParticipants"
            @join="handleJoinVisio"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <span class="empty-icon">◷</span>
          <p class="empty-message">Aucune séance trouvée pour la période sélectionnée</p>
        </div>

        <!-- Stats -->
        <CoordinatorSeanceStats v-if="seances && seances.length > 0" :seances="seances" />
      </template>
    </div>

    <!-- Participants Modal -->
    <ParticipantsModal
      v-if="showParticipantsModal"
      :seance-id="selectedSeanceId"
      @close="showParticipantsModal = false"
    />

    <!-- Jitsi Modal -->

  </DashboardLayout>
</template>

<script setup>
/**
 * Gestion des Séances & Visioconférence (coordinateur) (#H6 ≤300).
 * Orchestrateur : données + logique dans useSeanceManagement ; l'UI compose
 * en-tête/bascule (CoordinatorSeanceHeader), filtres (CoordinatorSeanceFilters),
 * cartes (CoordinatorSeanceCard) et statistiques (CoordinatorSeanceStats), plus
 * la vue calendrier (UniversalCalendar) et la modal participants. Comportement
 * et rendu strictement identiques au `<script setup>` d'origine.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import UniversalCalendar from '@/components/calendar/UniversalCalendar.vue'
import ParticipantsModal from '@/components/visio/ParticipantsModal.vue'
import CoordinatorSeanceHeader from '@/components/seances/CoordinatorSeanceHeader.vue'
import CoordinatorSeanceFilters from '@/components/seances/CoordinatorSeanceFilters.vue'
import CoordinatorSeanceCard from '@/components/seances/CoordinatorSeanceCard.vue'
import CoordinatorSeanceStats from '@/components/seances/CoordinatorSeanceStats.vue'
import { useSeanceManagement } from '@/composables/useSeanceManagement'

const {
  loading, error, seances, classes, enseignants, filters, loadSeances,
  showParticipantsModal, selectedSeanceId, viewMode, calendarRef,
  toggleSeanceVisio, showParticipants, handleJoinVisio, handleCalendarAction,
} = useSeanceManagement()
</script>

<style scoped>
/* Container */
.seances-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Calendar Section */
.calendar-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
}

.error-icon {
  font-size: 4rem;
}

.error-content {
  text-align: center;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.error-message {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.error-retry-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  border: none;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: #4f46e5;
}

/* Séances List */
.seances-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
}

.empty-icon {
  font-size: 4rem;
  line-height: 1;
  margin: 0 auto 1rem;
  color: var(--text-tertiary);
  display: block;
}

.empty-message {
  font-size: 1rem;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .seances-container {
    padding: 1rem;
  }
}
</style>
