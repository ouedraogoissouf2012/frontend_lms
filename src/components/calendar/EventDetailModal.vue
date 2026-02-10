<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-container" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h3 class="modal-title">
            {{ eventTitle }}
          </h3>
          <span :class="['status-badge', statusClass]">
            {{ statusLabel }}
          </span>
        </div>
        <button @click="$emit('close')" class="close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Détails séance -->
        <div v-if="isSeance" class="details-section">
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
              <p class="detail-value">{{ formatDate(event.start) }}</p>
            </div>
          </div>

          <div class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="detail-label">Horaire</p>
              <p class="detail-value">{{ formatTimeRange(event.start, event.end) }}</p>
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
                  {{ formatVisioStatus(eventData.visio?.status || eventData.visio_status) }}
                </span>
              </p>
            </div>
            <div v-if="eventData.visio?.participants_count || eventData.visio_participants_count" class="detail-row">
              <p class="detail-label">Participants</p>
              <p class="detail-value">{{ eventData.visio?.participants_count || eventData.visio_participants_count }}</p>
            </div>
          </div>
        </div>

        <!-- Détails évaluation -->
        <div v-else class="details-section">
          <div class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <div>
              <p class="detail-label">Matière</p>
              <p class="detail-value">{{ eventData.matiere_nom || 'N/A' }}</p>
            </div>
          </div>

          <div class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <div>
              <p class="detail-label">Classe</p>
              <p class="detail-value">{{ eventData.classe_nom || 'N/A' }}</p>
            </div>
          </div>

          <div class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <div>
              <p class="detail-label">Date</p>
              <p class="detail-value">{{ formatDate(event.start) }}</p>
            </div>
          </div>

          <div class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="detail-label">Durée</p>
              <p class="detail-value">{{ eventData.duree_minutes || 0 }} minutes</p>
            </div>
          </div>

          <div class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <div>
              <p class="detail-label">Barème</p>
              <p class="detail-value">{{ eventData.bareme || 20 }}/20</p>
            </div>
          </div>

          <div class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
            </svg>
            <div>
              <p class="detail-label">Coefficient</p>
              <p class="detail-value">{{ eventData.coefficient || 1 }}</p>
            </div>
          </div>

          <div v-if="eventData.questions_count" class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="detail-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p class="detail-label">Questions</p>
              <p class="detail-value">{{ eventData.questions_count }}</p>
            </div>
          </div>

          <!-- Résultat si soumis -->
          <div v-if="eventData.student_submission?.note_sur_20 !== undefined && eventData.student_submission?.note_sur_20 !== null" class="result-section">
            <h4 class="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              Résultat
            </h4>
            <div class="result-score">
              <span class="score-value">{{ eventData.student_submission.note_sur_20 }}</span>
              <span class="score-total">/20</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer avec actions -->
      <div class="modal-footer">
        <div class="action-buttons">
          <!-- Actions étudiant -->
          <template v-if="userRole === 'student'">
            <!-- Bouton rejoindre si visio active -->
            <button
              v-if="canJoinVisio"
              @click="emitAction('joinVisio')"
              class="action-btn primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Rejoindre la visio
            </button>
            <!-- Message si visio programmée mais pas encore démarrée -->
            <div v-else-if="isSeance && eventData.visio?.status === 'programmee'" class="waiting-message">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>En attente du démarrage par l'enseignant</span>
            </div>
            <button
              v-if="canStartEvaluation"
              @click="emitAction('startEvaluation')"
              class="action-btn primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Commencer l'évaluation
            </button>
            <button
              v-if="isSeance"
              @click="emitAction('hideSeance')"
              class="action-btn secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              Masquer
            </button>
          </template>

          <!-- Actions enseignant -->
          <template v-if="userRole === 'teacher'">
            <button
              v-if="canActivateVisio"
              @click="emitAction('activateVisio')"
              class="action-btn primary"
            >
              Activer la visio
            </button>
            <button
              v-if="canStartVisio"
              @click="emitAction('startVisio')"
              class="action-btn success"
            >
              Démarrer la visio
            </button>
            <button
              v-if="canEndVisio"
              @click="emitAction('endVisio')"
              class="action-btn danger"
            >
              Terminer la visio
            </button>
            <button
              @click="emitAction('viewParticipants')"
              class="action-btn secondary"
            >
              Voir participants
            </button>
            <button
              @click="emitAction('exportAttendance')"
              class="action-btn secondary"
            >
              Exporter présences
            </button>
          </template>

          <!-- Actions admin/coordinateur -->
          <template v-if="['admin', 'coordinator'].includes(userRole)">
            <button
              v-if="isSeance"
              @click="emitAction('toggleVisio')"
              class="action-btn primary"
            >
              {{ (eventData.visio?.enabled || eventData.visio_enabled) ? 'Désactiver' : 'Activer' }} visio
            </button>
            <button
              @click="emitAction('delete')"
              class="action-btn danger"
            >
              Supprimer
            </button>
          </template>

          <!-- Voir détails complets (tous les rôles) -->
          <button
            @click="emitAction('viewDetails')"
            class="action-btn outline"
          >
            Voir détails complets
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  userRole: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'action'])

const eventData = computed(() => props.event.extendedProps?.data || {})
const isSeance = computed(() => props.event.extendedProps?.eventType === 'seance')

const eventTitle = computed(() => {
  return eventData.value.titre || props.event.title || 'Événement'
})

const statusClass = computed(() => {
  if (isSeance.value) {
    const visioStatus = eventData.value.visio?.status || eventData.value.visio_status
    if (visioStatus === 'active') return 'status-active'
    if (visioStatus === 'programmee') return 'status-scheduled'
    return 'status-ended'
  } else {
    const status = eventData.value.status
    if (status === 'en_cours') return 'status-active'
    if (status === 'terminee') return 'status-ended'
    return 'status-scheduled'
  }
})

const statusLabel = computed(() => {
  if (isSeance.value) {
    const visioStatus = eventData.value.visio?.status || eventData.value.visio_status
    return formatVisioStatus(visioStatus)
  } else {
    const status = eventData.value.status
    if (status === 'en_cours') return 'En cours'
    if (status === 'terminee') return 'Terminée'
    return 'Programmée'
  }
})

// Capacités selon le rôle
const canJoinVisio = computed(() => {
  // Debug log pour comprendre pourquoi le bouton n'apparaît pas
  console.log('[EventDetailModal] canJoinVisio check:', {
    isSeance: isSeance.value,
    userRole: props.userRole,
    visio: eventData.value.visio,
    visioStatus: eventData.value.visio?.status
  })

  if (!isSeance.value) {
    console.log('[EventDetailModal] Pas une séance')
    return false
  }
  if (props.userRole !== 'student') {
    console.log('[EventDetailModal] Pas un étudiant, role =', props.userRole)
    return false
  }

  // Vérifier que la visio existe et est active
  const visio = eventData.value.visio
  if (!visio) {
    console.log('[EventDetailModal] Pas de visio')
    return false
  }

  // L'étudiant peut rejoindre seulement si la visio est en cours (status = 'active')
  const canJoin = visio.status === 'active'
  console.log('[EventDetailModal] canJoin =', canJoin, 'visio.status =', visio.status)
  return canJoin
})

const canStartEvaluation = computed(() => {
  if (isSeance.value || props.userRole !== 'student') return false
  const status = eventData.value.status
  return status !== 'terminee' && !eventData.value.student_submission?.note_sur_20
})

const canActivateVisio = computed(() => {
  if (!isSeance.value || props.userRole !== 'teacher') return false
  return !(eventData.value.visio?.enabled || eventData.value.visio_enabled)
})

const canStartVisio = computed(() => {
  if (!isSeance.value || props.userRole !== 'teacher') return false
  const visioEnabled = eventData.value.visio?.enabled || eventData.value.visio_enabled
  const visioStatus = eventData.value.visio?.status || eventData.value.visio_status
  return visioEnabled && visioStatus !== 'active'
})

const canEndVisio = computed(() => {
  if (!isSeance.value || props.userRole !== 'teacher') return false
  const visioStatus = eventData.value.visio?.status || eventData.value.visio_status
  return visioStatus === 'active'
})

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function formatTimeRange(start, end) {
  if (!start) return 'N/A'
  const startTime = new Date(start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const endTime = end ? new Date(end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
  return endTime ? `${startTime} - ${endTime}` : startTime
}

function formatVisioStatus(status) {
  const statusMap = {
    'active': 'En direct',
    'programmee': 'Programmée',
    'terminee': 'Terminée'
  }
  return statusMap[status] || 'Non défini'
}

function emitAction(type) {
  emit('action', {
    type,
    data: eventData.value
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: var(--bg-primary, white);
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #111827);
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-active {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-scheduled {
  background-color: #dbeafe;
  color: #2563eb;
}

.status-ended {
  background-color: #f3f4f6;
  color: #6b7280;
}

.close-btn {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #111827);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

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
  color: var(--color-primary, #3b82f6);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  margin: 0 0 0.25rem 0;
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-primary, #111827);
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
  color: var(--text-primary, #111827);
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

.result-score {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary, #3b82f6);
  text-align: center;
  margin: 1rem 0;
}

.score-value {
  color: var(--color-primary, #3b82f6);
}

.score-total {
  font-size: 1.5rem;
  color: var(--text-secondary, #6b7280);
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-secondary, #f9fafb);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn.primary {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.action-btn.primary:hover {
  background: var(--color-primary-hover, #2563eb);
}

.action-btn.success {
  background: #10b981;
  color: white;
}

.action-btn.success:hover {
  background: #059669;
}

.action-btn.danger {
  background: #ef4444;
  color: white;
}

.action-btn.danger:hover {
  background: #dc2626;
}

.action-btn.secondary {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #111827);
  border: 1px solid var(--border-color, #e5e7eb);
}

.action-btn.secondary:hover {
  background: var(--bg-primary, white);
  border-color: var(--color-primary, #3b82f6);
}

.action-btn.outline {
  background: transparent;
  color: var(--color-primary, #3b82f6);
  border: 1px solid var(--color-primary, #3b82f6);
}

.action-btn.outline:hover {
  background: var(--color-primary, #3b82f6);
  color: white;
}

/* Message d'attente pour l'étudiant */
.waiting-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.waiting-message svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
