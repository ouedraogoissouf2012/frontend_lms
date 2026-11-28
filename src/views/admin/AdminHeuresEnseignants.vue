<template>
  <DashboardLayout>
    <div class="heures-container">
      <h1 class="page-title">Heures des enseignants</h1>
      <p class="page-subtitle">
        Une séance compte sa durée prévue quand son enseignant a démarré sa visio et qu’elle s’est terminée.
        <template v-if="depuis">Heures comptées depuis le {{ jourLisible(depuis) }}.</template>
      </p>

      <form class="heures-filtres" @submit.prevent="charger">
        <label>Du <input v-model="filtres.du" type="date" name="du" class="form-input" required></label>
        <label>Au <input v-model="filtres.au" type="date" name="au" class="form-input" required></label>
        <label>
          Enseignant
          <select v-model="filtres.enseignant_id" name="enseignant" class="form-input">
            <option value="">Tous</option>
            <option v-for="e in listes.enseignants" :key="e.id" :value="e.id">{{ nomDe(e) }}</option>
          </select>
        </label>
        <label>
          Classe
          <select v-model="filtres.classe_id" name="classe" class="form-input">
            <option value="">Toutes</option>
            <option v-for="c in listes.classes" :key="c.id" :value="c.id">{{ c.libelle || c.name }}</option>
          </select>
        </label>
        <label>
          Matière
          <select v-model="filtres.matiere_id" name="matiere" class="form-input">
            <option value="">Toutes</option>
            <option v-for="m in listes.matieres" :key="m.id" :value="m.id">{{ m.libelle || m.nom || m.name }}</option>
          </select>
        </label>
        <button type="submit" class="btn-primary" :disabled="chargement">Afficher</button>
        <button type="button" class="btn-secondary" :disabled="chargement" @click="exporter">Exporter (CSV)</button>
      </form>

      <p class="heures-region" :class="{ 'heures-message': erreur }" role="alert">{{ erreur }}</p>
      <p v-if="!enseignants.length && !chargement" class="heures-etat">Aucune séance passée sur cette période.</p>
      <table v-else class="heures-table">
        <thead>
          <tr>
            <th scope="col">Enseignant</th>
            <th scope="col">Séances</th>
            <th scope="col">Comptées</th>
            <th scope="col">Heures</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in enseignants" :key="e.enseignant_id">
            <td>{{ e.nom || `Enseignant n° ${e.enseignant_id}` }}</td>
            <td>{{ e.seances }}</td>
            <td>{{ e.comptees }}</td>
            <td>{{ dureeLisible(e.minutes) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * « Heures des enseignants » (lms_backend#1682, #688), pour la gestion : une plage (le mois courant par défaut), les
 * filtres enseignant, classe et matière, le tableau par enseignant et l'export CSV. Route gardée par
 * `peutInscrireLocalement`. Logique dans `useHeuresEnseignants`, listes des filtres comprises.
 */
import { onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useHeuresEnseignants } from '@/composables/useHeuresEnseignants'
import { dureeLisible, jourLisible } from '@/constants/heures'

defineOptions({ name: 'AdminHeuresEnseignants' })

const { filtres, enseignants, depuis, listes, chargement, erreur, charger, chargerListes, exporter } = useHeuresEnseignants()

function nomDe(e) {
  return e.name || [e.prenom, e.nom].filter(Boolean).join(' ') || `Enseignant n° ${e.id}`
}

onMounted(() => {
  charger()
  chargerListes()
})
</script>

<style scoped>
.heures-container {
  max-width: 64rem;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 0.5rem;
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle,
.heures-etat {
  color: var(--text-secondary);
}

.heures-filtres {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  margin: 1rem 0;
  color: var(--text-primary);
}

.heures-filtres label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.heures-table {
  width: 100%;
  border-collapse: collapse;
}

.heures-table th,
.heures-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-primary);
  text-align: left;
}

.form-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.btn-primary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--primary-color);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.heures-region {
  margin: 0;
}

.heures-message {
  margin: 0.75rem 0;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--color-danger);
}
</style>
