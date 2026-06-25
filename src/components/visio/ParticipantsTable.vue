<template>
  <!-- Tableau des étudiants -->
  <div class="bg-white rounded-lg border border-gray-300 overflow-hidden">
    <!-- En-tête du tableau -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-300">
        <thead class="bg-gray-100">
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
              NOM
            </th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              STATUT
            </th>
            <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
              DURÉE
            </th>
            <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
              REJOINT
            </th>
            <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
              QUITTÉ
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr
            v-for="student in students"
            :key="student.user_id"
            :class="[
              student.is_present ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100',
              'transition-colors duration-150'
            ]"
          >
            <!-- NOM -->
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
              <div class="flex items-center">
                <div class="h-10 w-10 flex-shrink-0">
                  <div :class="[
                    'h-10 w-10 rounded-full flex items-center justify-center text-white font-bold',
                    student.is_present ? 'bg-green-600' : 'bg-red-600'
                  ]">
                    {{ getInitials(student.nom + ' ' + student.prenom) }}
                  </div>
                </div>
                <div class="ml-4">
                  <div class="font-medium text-gray-900">{{ student.nom }} {{ student.prenom }}</div>
                  <div class="text-gray-500 text-xs">{{ student.email }}</div>
                </div>
              </div>
            </td>

            <!-- STATUT -->
            <td class="whitespace-nowrap px-3 py-4 text-sm">
              <div class="flex items-center">
                <span class="text-lg mr-2">{{ student.status_icon }}</span>
                <div>
                  <div class="font-medium text-gray-900">{{ student.status }}</div>
                  <div v-if="stats.visio_status === 'terminee' && student.percentage > 0" class="text-xs text-gray-500">
                    {{ student.percentage }}% de présence
                  </div>
                </div>
              </div>
            </td>

            <!-- DURÉE -->
            <td class="whitespace-nowrap px-3 py-4 text-sm text-center">
              <div v-if="student.is_present" class="font-medium text-gray-900">
                {{ student.duration_formatted }}
              </div>
              <div v-else class="text-gray-400">-</div>
            </td>

            <!-- REJOINT -->
            <td class="whitespace-nowrap px-3 py-4 text-sm text-center">
              <div v-if="student.joined_at" class="font-medium text-gray-900">
                {{ student.joined_at }}
              </div>
              <div v-else class="text-gray-400">-</div>
            </td>

            <!-- QUITTÉ -->
            <td class="whitespace-nowrap px-3 py-4 text-sm text-center">
              <div v-if="student.left_at === 'En cours'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                <span class="relative flex h-2 w-2 mr-1.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                En cours
              </div>
              <div v-else-if="student.left_at" class="font-medium text-gray-900">
                {{ student.left_at }}
              </div>
              <div v-else class="text-gray-400">-</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Aucun étudiant -->
    <div v-if="students.length === 0" class="text-center py-12 bg-gray-50">
      <svg class="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <p class="text-gray-600 font-medium text-lg">Aucun étudiant dans cette classe</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Tableau présentationnel de présence de ParticipantsModal (#H13 ≤300) : lignes
 * étudiants (nom/statut/durée/rejoint/quitté) + état vide. Aucune logique ;
 * `getInitials` est injecté en prop (fonction pure du composable) pour préserver
 * le calcul d'initiales VERBATIM. Markup/classes Tailwind déplacés VERBATIM.
 */
defineProps({
  students: { type: Array, default: () => [] },
  stats: { type: Object, required: true },
  getInitials: { type: Function, required: true },
})
</script>
