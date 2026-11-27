<template>
  <div class="seance-appel">
    <button type="button" class="btn-appel" @click="ouvrirFenetre">
      <i class="fa fa-check-square-o" aria-hidden="true"></i> Faire l’appel
    </button>

    <Modal v-model="ouvert" title="Appel de la séance" size="lg">
      <p v-if="chargement" class="appel-etat">Chargement de la classe…</p>
      <p v-else-if="!eleves.length && !erreur" class="appel-etat">Aucun élève actif dans la classe de cette séance.</p>

      <table v-else-if="eleves.length" class="appel-table">
        <thead>
          <tr>
            <th scope="col">Élève</th>
            <th scope="col">Visio</th>
            <th scope="col">Présence</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="eleve in eleves" :key="eleve.user_id">
            <td>{{ eleve.nom }}</td>
            <td class="appel-visio">{{ libellePresenceVisio(eleve.presence_visio) }}</td>
            <td>
              <select v-model="marques[eleve.user_id]" :name="`marque-${eleve.user_id}`" class="form-input" :aria-label="`Présence de ${eleve.nom}`">
                <option :value="null">À marquer</option>
                <option v-for="m in MARQUES_DE_PRESENCE" :key="m.valeur" :value="m.valeur">{{ m.libelle }}</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="erreur" class="form-error" role="alert">{{ erreur }}</div>

      <template #footer>
        <button type="button" class="btn-secondary" @click="ouvert = false">Fermer</button>
        <button type="button" class="btn-primary" :disabled="envoi || chargement || !eleves.length" @click="soumettre">
          {{ envoi ? 'Enregistrement…' : 'Enregistrer l’appel' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
/**
 * « Faire l'appel » (lms_backend#1649, #719) : le bouton et sa fenêtre, montés sur les trois cartes de séances
 * (enseignant, coordinateur, gestion). Le bouton suit UNIQUEMENT `can_take_attendance === true`, calculé par le serveur
 * pour le compte qui lit (l'auteur ou la gestion, séance commencée ; jamais quand l'appel se fait hors du LMS) : ni le
 * rôle, ni la date, ni la source de l'école. Logique dans `useSeanceAppel`. Émet `saved` (l'appel relu).
 */
import { ref, toRef } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import { useSeanceAppel } from '@/composables/useSeanceAppel'
import { MARQUES_DE_PRESENCE, libellePresenceVisio } from '@/constants/presences'

const props = defineProps({
  seance: { type: Object, required: true },
})
const emit = defineEmits(['saved'])

const ouvert = ref(false)
const { eleves, marques, chargement, envoi, erreur, charger, enregistrer } = useSeanceAppel(toRef(props, 'seance'))

async function ouvrirFenetre() {
  ouvert.value = true
  await charger()
}

async function soumettre() {
  if (await enregistrer()) emit('saved', eleves.value)
}
</script>

<style scoped>
.seance-appel {
  display: inline-block;
}

.btn-appel,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--primary-color);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.appel-etat {
  color: var(--text-secondary);
}

.appel-table {
  width: 100%;
  border-collapse: collapse;
}

.appel-table th,
.appel-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-primary);
  text-align: left;
}

.appel-visio {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.form-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-error {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-danger);
}
</style>
