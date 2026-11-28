<template>
  <DashboardLayout>
    <div class="absences-container">
      <h1 class="page-title">Mes absences</h1>
      <p class="page-subtitle">Cochez les absences à justifier, expliquez le motif et joignez un justificatif si vous en avez un.</p>

      <!-- Régions présentes DÈS le montage et jamais masquées : seule la présentation suit le contenu. -->
      <p class="absences-region" :class="{ 'absences-message is-error': erreur }" role="alert">{{ erreur }}</p>
      <p class="absences-region" :class="{ 'absences-message': message }" role="status" aria-live="polite">{{ message }}</p>

      <p v-if="chargement" class="absences-etat">Chargement…</p>
      <p v-else-if="!absences.length" class="absences-etat">Aucune absence à justifier.</p>

      <form v-else class="absences-card" @submit.prevent="deposer">
        <fieldset class="absences-liste">
          <legend>Absences</legend>
          <label v-for="a in absences" :key="a.seance_id" class="absence-ligne">
            <input v-model="selection" type="checkbox" :value="a.seance_id" :disabled="!a.justifiable">
            <span>{{ dateLisible(a.date_seance) }} — {{ a.titre || 'Séance' }}</span>
            <span v-if="a.justificatif_etat" class="absence-etat">{{ libelleEtatJustificatif(a.justificatif_etat) }}</span>
          </label>
        </fieldset>

        <label for="motif-absence">Motif</label>
        <textarea id="motif-absence" v-model="motif" class="absences-champ" rows="3" maxlength="1000" required></textarea>

        <label for="piece-absence">Justificatif (facultatif : PDF ou photo, 10 Mo au plus)</label>
        <input id="piece-absence" type="file" class="absences-champ" :accept="PIECES_ACCEPTEES" @change="piece = $event.target.files?.[0] ?? null">

        <!-- aria-disabled, pas disabled : un bouton désactivé perd le focus clavier. -->
        <button type="submit" class="absences-btn" :aria-disabled="envoi ? 'true' : 'false'">
          {{ envoi ? 'Envoi…' : 'Envoyer le justificatif' }}
        </button>
      </form>

      <h2 class="absences-sous-titre">Mes justificatifs</h2>
      <p v-if="!justificatifs.length" class="absences-etat">Aucun justificatif déposé.</p>
      <ul v-else class="absences-depots">
        <li v-for="j in justificatifs" :key="j.id" class="absences-depot">
          <strong>{{ libelleEtatJustificatif(j.etat) }}</strong>
          <span>{{ j.seances.length }} séance(s) — {{ j.motif }}</span>
          <span v-if="j.motif_rejet" class="absence-refus">Motif du refus : {{ j.motif_rejet }}</span>
        </li>
      </ul>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * « Mes absences » (lms_backend#1681, #687) : l'élève justifie ses absences et suit ses justificatifs. Route gardée
 * par `peutInscrireLocalement` ; la notification de décision y mène. La logique vit dans `useMesAbsences` ; le
 * serveur reste juge de ce qui est justifiable.
 */
import { onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useMesAbsences } from '@/composables/useMesAbsences'
import { libelleEtatJustificatif, PIECES_ACCEPTEES } from '@/constants/justificatifs'

defineOptions({ name: 'StudentAbsences' })

const { absences, justificatifs, selection, motif, piece, chargement, envoi, erreur, message, charger, deposer } = useMesAbsences()

const DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

function dateLisible(iso) {
  return iso ? DATE.format(new Date(iso)) : 'Date inconnue'
}

onMounted(charger)
</script>

<style scoped>
.absences-container {
  max-width: 40rem;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 0.5rem;
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle,
.absences-etat {
  color: var(--text-secondary);
}

.absences-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  color: var(--text-primary);
}

.absences-liste {
  margin: 0;
  padding: 0;
  border: none;
}

.absence-ligne {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
}

.absence-etat,
.absence-refus {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.absences-champ {
  padding: 0.6rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.absences-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.absences-btn[aria-disabled='true'] {
  cursor: wait;
  opacity: 0.7;
}

.absences-sous-titre {
  margin: 2rem 0 0.75rem;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.absences-depots {
  margin: 0;
  padding: 0;
  list-style: none;
}

.absences-depot {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-primary);
}

.absences-region {
  margin: 0;
}

.absences-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--text-primary);
}
</style>
