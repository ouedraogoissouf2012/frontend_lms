<template>
  <DashboardLayout>
    <div class="heures-container">
      <h1 class="page-title">Mes heures</h1>
      <p class="page-subtitle">
        Une séance compte sa durée prévue quand vous avez démarré sa visio et qu’elle s’est terminée.
        <template v-if="depuis">Heures comptées depuis le {{ jourLisible(depuis) }}.</template>
      </p>

      <label class="heures-mois">
        Mois
        <input v-model="mois" type="month" name="mois" class="form-input" @change="charger">
      </label>

      <p class="heures-region" :class="{ 'heures-message': erreur }" role="alert">{{ erreur }}</p>
      <p v-if="chargement" class="heures-etat">Chargement…</p>
      <template v-else-if="!erreur">
        <p class="heures-totaux">
          <strong>{{ dureeLisible(totaux.minutes) }}</strong> — {{ totaux.comptees }} séance(s) comptée(s),
          {{ totaux.non_comptees }} non comptée(s)
        </p>
        <p v-if="!seances.length" class="heures-etat">Aucune séance passée ce mois-ci.</p>
        <table v-else class="heures-table">
          <thead>
            <tr>
              <th scope="col">Séance</th>
              <th scope="col">Date</th>
              <th scope="col">Statut</th>
              <th scope="col">Durée comptée</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in seances" :key="s.seance_id">
              <td>{{ s.titre || 'Séance' }}</td>
              <td>{{ dateLisible(s.date_seance) }}</td>
              <td>{{ libelleStatutHeures(s.statut) }}</td>
              <td>{{ dureeLisible(s.minutes) }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * « Mes heures » (lms_backend#1682, #688) : les séances passées d'un mois, leur statut et leur durée comptée, et les
 * totaux. Route gardée par `peutInscrireLocalement`. Logique dans `useMesHeures` ; la règle vit au serveur.
 */
import { onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useMesHeures } from '@/composables/useMesHeures'
import { dureeLisible, jourLisible, libelleStatutHeures } from '@/constants/heures'

defineOptions({ name: 'TeacherHeures' })

const { mois, seances, totaux, depuis, chargement, erreur, charger } = useMesHeures()

const DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

function dateLisible(iso) {
  return iso ? DATE.format(new Date(iso)) : '—'
}

onMounted(charger)
</script>

<style scoped>
.heures-container {
  max-width: 56rem;
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

.heures-mois {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
  color: var(--text-primary);
}

.heures-totaux {
  color: var(--text-primary);
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
