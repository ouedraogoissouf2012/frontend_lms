<template>
  <div>
    <div v-if="emploiTemps && emploiTemps.length > 0" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jour</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horaires</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enseignant</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salle</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(seance, idx) in emploiTemps" :key="idx" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ formatJour(seance.programmation?.jour) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ seance.matiere?.nom || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ seance.enseignant?.nom || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ seance.programmation?.salle || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="[
                'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                seance.type === 'cours' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              ]">
                {{ seance.type || 'cours' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-12 text-gray-500">
      <p>Aucun planning disponible pour cette semaine</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Onglet Planning de ClasseDetails (#H9 ≤300). Présentation pure : emploi du
 * temps de la semaine. `formatTime`/`formatJour` viennent de `utils/classeDetails`.
 * Le style (table, badges, couleurs) est centralisé dans la vue parente via `:deep()`.
 *
 * `jour` et `salle` vivent sous `seance.programmation`, jamais à la racine de
 * la séance — les lire à la racine rendait la colonne Jour vide et masquait
 * une salle pourtant présente derrière un « N/A » fabriqué.
 */
import { formatTime, formatJour } from '@/utils/classeDetails'

defineProps({
  emploiTemps: { type: Array, default: () => [] }
})
</script>
