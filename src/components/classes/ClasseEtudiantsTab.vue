<template>
  <div>
    <div v-if="etudiants && etudiants.length > 0" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="etudiant in etudiants" :key="etudiant.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ etudiant.matricule }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ getFullName(etudiant) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ etudiant.email }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="[
                'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                etudiant.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              ]">
                {{ etudiant.statut || 'Actif' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-12 text-gray-500">
      <p>Aucun étudiant inscrit dans cette classe</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Onglet Étudiants de ClasseDetails (#H9 ≤300). Présentation pure : table des
 * étudiants. Le style (table, badges, couleurs) est centralisé dans la vue
 * parente via `:deep()`.
 *
 * Le nom passe par `getFullName` : le roster de `/lms/classes/{id}` porte
 * `nom_complet`, et non `nom`. Lire la clé absente laissait la colonne « Nom »
 * VIDE alors que matricule et email s'affichaient — le helper couvre les trois
 * formes rencontrées (`name`, `nom_complet`, `prenom`+`nom`) et rend une chaîne
 * vide plutôt qu'un nom inventé quand aucune n'est présente.
 */
import { getFullName } from '@/utils/formatters'

defineProps({
  etudiants: { type: Array, default: () => [] }
})
</script>
