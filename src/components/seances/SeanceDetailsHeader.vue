<template>
  <div class="bg-white shadow rounded-lg p-6 mb-6">
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <button
            @click="$router.back()"
            class="text-gray-600 hover:text-gray-900"
          >
            ← Retour
          </button>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ seance.matiere?.nom || 'Séance' }}
          </h1>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-600">Date</p>
            <p class="font-semibold text-gray-900">{{ formatDate(seance.programmation?.date) }}</p>
          </div>
          <div>
            <p class="text-gray-600">Horaire</p>
            <p class="font-semibold text-gray-900">
              {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
              <span class="text-gray-500">({{ seance.duree_minutes }} min)</span>
            </p>
          </div>
          <div>
            <p class="text-gray-600">Enseignant</p>
            <p class="font-semibold text-gray-900">
              {{ seance.enseignant?.nom || (participants?.teacher ? `${participants.teacher.prenom || ''} ${participants.teacher.nom || ''}`.trim() || participants.teacher.nom : 'Non assigné') }}
            </p>
          </div>
          <div>
            <p class="text-gray-600">Classe</p>
            <p class="font-semibold text-gray-900">{{ seance.classe?.nom }}</p>
          </div>
          <div v-if="seance.programmation?.salle">
            <p class="text-gray-600">Salle</p>
            <p class="font-semibold text-gray-900">{{ seance.programmation.salle }}</p>
          </div>
        </div>
      </div>

      <!-- Bouton Masquer (étudiants uniquement) -->
      <button
        v-if="!isTeacher"
        @click="$emit('hide')"
        class="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2"
        title="Masquer cette séance de ma liste"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
        Masquer cette séance
      </button>
    </div>
  </div>
</template>

<script setup>
import { formatDateWeekday, formatTime as fmtTime } from '@/utils/formatters'
/**
 * En-tête de SeanceDetails (#H6 ≤300) : retour, titre matière, grille
 * d'infos (date/horaire/enseignant/classe/salle) et bouton « Masquer »
 * (étudiants). Présentation pure extraite VERBATIM ; émet `hide`.
 * `formatDate`/`formatTime` redéfinis localement (copie verbatim) pour
 * l'indépendance du composant.
 */
defineProps({
  seance: { type: Object, required: true },
  participants: { type: Object, default: () => ({ teacher: null, students: [], total: 0 }) },
  isTeacher: { type: Boolean, default: false }
})

defineEmits(['hide'])

// #283 : délèguent aux formatters canoniques (replis locaux conservés).
function formatDate(date) {
  return formatDateWeekday(date, { fallback: 'Non défini' })
}

function formatTime(isoTimestamp) {
  return fmtTime(isoTimestamp, { fallback: 'Non défini' })
}
</script>

<style scoped lang="scss">
@use '../../assets/styles/seance-details';
</style>
