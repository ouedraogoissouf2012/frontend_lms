<template>
  <div>
    <div v-if="matieres && matieres.length > 0" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coefficient</th>
            <th v-if="afficheEnseignants" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enseignants</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="matiere in matieres" :key="matiere.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ matiere.nom }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ matiere.code }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                {{ matiere.coefficient }}
              </span>
            </td>
            <td v-if="afficheEnseignants" class="px-6 py-4">
              <div class="text-sm text-gray-900" v-if="matiere.enseignants && matiere.enseignants.length > 0">
                <div v-for="(ens, idx) in matiere.enseignants" :key="idx" class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ ens.nom }}
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="$emit('view-matiere', matiere.id)"
                class="text-green-600 hover:text-green-900"
              >
                Voir détails →
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-12 text-gray-500">
      <p>Aucune matière disponible pour cette classe</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Onglet Matières de ClasseDetails (#H9 ≤300). Présentation pure : table des
 * matières ; émet `view-matiere` au clic sur « Voir détails ». Le style (table,
 * badges, couleurs) est centralisé dans la vue parente via `:deep()`.
 *
 * La colonne « Enseignants » n'apparaît QUE si la charge utile la porte. Sur cet
 * écran, `/lms/classes/{id}` → `matieres_disponibles` livre
 * { id, nom, code, coefficient, couleur, heures, source } : aucun enseignant.
 * La colonne affichait donc « Non assigné » sur chaque ligne — une affirmation
 * sans mesure, qui peut être fausse (la matière a peut-être un enseignant, la
 * source ne le dit simplement pas). Le jour où elle le dira, la colonne
 * réapparaîtra d'elle-même.
 */
import { computed } from 'vue'

const props = defineProps({
  matieres: { type: Array, default: () => [] }
})

const afficheEnseignants = computed(() =>
  props.matieres.some((m) => Array.isArray(m?.enseignants) && m.enseignants.length > 0)
)
defineEmits(['view-matiere'])
</script>
