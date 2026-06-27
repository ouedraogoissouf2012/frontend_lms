<template>
  <div class="details-section">
    <div class="detail-row">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      <div>
        <p class="detail-label">Matière</p>
        <p class="detail-value">{{ eventData.matiere?.nom || eventData.matiere_nom || 'N/A' }}</p>
      </div>
    </div>

    <div class="detail-row">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
      <div>
        <p class="detail-label">Enseignant</p>
        <p class="detail-value">{{ eventData.enseignant?.nom || eventData.enseignant_nom || 'N/A' }}</p>
      </div>
    </div>

    <div class="detail-row">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
      <div>
        <p class="detail-label">Classe</p>
        <p class="detail-value">{{ eventData.classe?.nom || eventData.classe_nom || 'N/A' }}</p>
      </div>
    </div>

    <div class="detail-row">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
      <div>
        <p class="detail-label">Date</p>
        <p class="detail-value">{{ formattedDate }}</p>
      </div>
    </div>

    <div class="detail-row">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p class="detail-label">Horaire</p>
        <p class="detail-value">{{ formattedTimeRange }}</p>
      </div>
    </div>

    <div class="detail-row">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
      <div>
        <p class="detail-label">Salle</p>
        <p class="detail-value">{{ eventData.programmation?.salle || eventData.salle || 'N/A' }}</p>
      </div>
    </div>

    <!-- Statut visio -->
    <div v-if="eventData.visio?.enabled || eventData.visio_enabled" class="visio-section">
      <h4 class="section-title">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
        Visioconférence
      </h4>
      <div class="detail-row">
        <p class="detail-label">Statut</p>
        <p class="detail-value">
          <span :class="['visio-status', eventData.visio?.status || eventData.visio_status]">
            {{ visioStatusText }}
          </span>
        </p>
      </div>
      <div v-if="eventData.visio?.participants_count || eventData.visio_participants_count" class="detail-row">
        <p class="detail-label">Participants</p>
        <p class="detail-value">{{ eventData.visio?.participants_count || eventData.visio_participants_count }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Section "détails séance" de la modale d'événement (H8 — décomposition
 * EventDetailModal.vue). Sous-composant présentationnel : reçoit `eventData` et les
 * valeurs déjà formatées (date, plage horaire, libellé statut visio). CSS verbatim.
 */
defineProps({
  eventData: { type: Object, required: true },
  formattedDate: { type: String, default: 'N/A' },
  formattedTimeRange: { type: String, default: 'N/A' },
  visioStatusText: { type: String, default: 'Non défini' }
})
</script>

<style scoped>
.details-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.detail-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--blue-500);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  margin: 0;
}

.visio-section,
.result-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.visio-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.visio-status.active {
  background-color: #dcfce7;
  color: #16a34a;
}

.visio-status.programmee {
  background-color: #dbeafe;
  color: #2563eb;
}

.visio-status.terminee {
  background-color: #f3f4f6;
  color: #6b7280;
}
</style>
