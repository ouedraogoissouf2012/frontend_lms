<template>
  <div class="classement-cadre">
    <table class="classement">
      <caption class="classement-legende">Classement, du premier au dernier ; « — » : aucune note comptée.</caption>
      <thead>
        <tr>
          <th scope="col">Rang</th>
          <th scope="col">Élève</th>
          <th scope="col">Moyenne générale</th>
          <th v-for="matiere in bilan.matieres" :key="matiere.matiere_id" scope="col">
            {{ matiere.libelle ?? 'Matière' }} <span class="classement-coef">(coef. {{ matiere.coefficient }})</span>
          </th>
          <th scope="col">Notes manquantes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="eleve in lignes" :key="eleve.compte_id ?? eleve.nom">
          <td>{{ eleve.rang ?? '—' }}</td>
          <th scope="row">{{ eleve.nom }}</th>
          <td>{{ afficherNote(eleve.moyenne_generale) }}</td>
          <td v-for="matiere in bilan.matieres" :key="matiere.matiere_id">
            {{ afficherNote(moyenneEn(eleve, matiere.matiere_id)) }}
          </td>
          <td>{{ eleve.notes_manquantes?.length ?? 0 }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
/**
 * #683 : le classement d'une classe. Trié par rang (ex aequo côte à côte), les élèves non classés
 * en dernier ; une moyenne absente s'affiche « — », jamais 0.
 */
import { computed } from 'vue'
import { afficherNote } from '@/utils/studentGrades'

const props = defineProps({
  bilan: { type: Object, required: true },
})

const lignes = computed(() => [...(props.bilan.eleves ?? [])].sort((a, b) => {
  if (a.rang == null) return b.rang == null ? 0 : 1
  return b.rang == null ? -1 : a.rang - b.rang
}))

function moyenneEn(eleve, matiereId) {
  return (eleve.matieres ?? []).find((m) => m.matiere_id === matiereId)?.moyenne ?? null
}
</script>

<style scoped>
.classement-cadre {
  overflow-x: auto;
}

.classement {
  width: 100%;
  border-collapse: collapse;
}

.classement-legende {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: left;
}

.classement th,
.classement td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--table-border);
  color: var(--text-primary);
  text-align: left;
  white-space: nowrap;
}

.classement thead th {
  background: var(--table-header-bg);
  font-weight: 600;
}

.classement tbody tr:hover {
  background: var(--table-row-hover);
}

.classement-coef {
  color: var(--text-secondary);
  font-weight: 400;
}
</style>
