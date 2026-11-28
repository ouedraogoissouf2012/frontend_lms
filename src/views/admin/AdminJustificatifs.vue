<template>
  <DashboardLayout>
    <div class="justificatifs-container">
      <h1 class="page-title">Justificatifs d’absence</h1>
      <p class="page-subtitle">Validez un justificatif pour excuser les absences visées, ou refusez-le avec un motif que l’élève lira.</p>

      <div class="justificatifs-onglets" role="tablist" aria-label="États des justificatifs">
        <button
          v-for="e in ETATS_DE_JUSTIFICATIF"
          :key="e.valeur"
          type="button"
          role="tab"
          class="justificatifs-onglet"
          :class="{ actif: onglet === e.valeur }"
          :aria-selected="onglet === e.valeur ? 'true' : 'false'"
          @click="choisir(e.valeur)"
        >
          {{ e.libelle }} ({{ compteurs[e.valeur] }})
        </button>
      </div>

      <p class="justificatifs-region" :class="{ 'justificatifs-message is-error': erreur }" role="alert">{{ erreur }}</p>
      <p v-if="!justificatifs.length && !envoi" class="justificatifs-etat">Aucun justificatif dans cet onglet.</p>

      <ul class="justificatifs-liste">
        <li v-for="j in justificatifs" :key="j.id" class="justificatif">
          <div class="justificatif-tete">
            <strong>{{ j.eleve_nom || `Élève n° ${j.eleve_id}` }}</strong>
            <span class="justificatif-date">{{ j.seances.length }} séance(s)</span>
          </div>
          <p class="justificatif-motif">{{ j.motif }}</p>
          <p v-if="j.motif_rejet" class="justificatif-motif">Motif du refus : {{ j.motif_rejet }}</p>
          <div class="justificatif-actions">
            <button v-if="j.piece" type="button" class="btn-secondary" :disabled="envoi" @click="ouvrirPiece(j.id)">Voir la pièce</button>
            <template v-if="j.etat === 'en_attente'">
              <button type="button" class="btn-primary" :disabled="envoi" @click="valider(j.id)">Valider</button>
              <input
                v-model="motifs[j.id]"
                class="form-input"
                maxlength="1000"
                :name="`motif-rejet-${j.id}`"
                :aria-label="`Motif du refus pour ${j.eleve_nom || 'cet élève'}`"
                placeholder="Motif du refus"
              >
              <button type="button" class="btn-secondary" :disabled="envoi" @click="rejeter(j.id, motifs[j.id])">Refuser</button>
            </template>
          </div>
        </li>
      </ul>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * La file des justificatifs d'absence (lms_backend#1681, #687), pour la gestion de l'école : onglets par état avec
 * leurs compteurs, la pièce par le client authentifié, Valider, Refuser avec un motif obligatoire. Route gardée par
 * `peutInscrireLocalement`. La logique vit dans `useJustificatifsGestion`.
 */
import { onMounted, reactive } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useJustificatifsGestion } from '@/composables/useJustificatifsGestion'
import { ETATS_DE_JUSTIFICATIF } from '@/constants/justificatifs'

defineOptions({ name: 'AdminJustificatifs' })

const { onglet, page, justificatifs, compteurs, envoi, erreur, charger, valider, rejeter, ouvrirPiece } = useJustificatifsGestion()
const motifs = reactive({})

function choisir(etat) {
  onglet.value = etat
  page.value = 1
  charger()
}

onMounted(charger)
</script>

<style scoped>
.justificatifs-container {
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
.justificatifs-etat,
.justificatif-date {
  color: var(--text-secondary);
}

.justificatifs-onglets {
  display: flex;
  gap: 0.5rem;
  margin: 1.25rem 0;
}

.justificatifs-onglet {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.justificatifs-onglet.actif {
  background: var(--primary-color);
  color: var(--white);
}

.justificatifs-liste {
  margin: 0;
  padding: 0;
  list-style: none;
}

.justificatif {
  margin-bottom: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  background: var(--card-bg);
  color: var(--text-primary);
}

.justificatif-tete {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.justificatif-motif {
  margin: 0.5rem 0;
}

.justificatif-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
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

.form-input {
  flex: 1;
  min-width: 12rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.justificatifs-region {
  margin: 0;
}

.justificatifs-message {
  margin: 0.75rem 0;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--color-danger);
}
</style>
