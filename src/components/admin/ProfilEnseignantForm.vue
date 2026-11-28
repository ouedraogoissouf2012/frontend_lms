<template>
  <form class="profil" novalidate @submit.prevent="enregistrer">
    <p v-if="erreur" class="profil-erreur" role="alert">{{ erreur }}</p>
    <p class="profil-annonce" role="status" aria-live="polite">{{ annonce }}</p>
    <div class="profil-champs">
      <label>Matricule <input v-model="saisie.matricule" maxlength="50" data-champ="matricule"></label>
      <label>Spécialité <input v-model="saisie.specialite" maxlength="150" data-champ="specialite"></label>
      <label>Titre <input v-model="saisie.titre" maxlength="50" data-champ="titre"></label>
      <label>
        Grade
        <select v-model="saisie.grade" data-champ="grade">
          <option value="">Non précisé</option>
          <option v-for="(libelle, cle) in GRADES" :key="cle" :value="cle">{{ libelle }}</option>
        </select>
      </label>
      <label>Diplôme <input v-model="saisie.diplome" maxlength="150" data-champ="diplome"></label>
      <label>Université <input v-model="saisie.universite" maxlength="150" data-champ="universite"></label>
      <label>Date de début <input v-model="saisie.date_debut" type="date" data-champ="date_debut"></label>
      <label>
        Statut
        <select v-model="saisie.statut" data-champ="statut">
          <option value="">Non précisé</option>
          <option value="en_activite">En activité</option>
          <option value="inactif">Inactif</option>
        </select>
      </label>
      <label>Charge hebdomadaire maximale (heures) <input v-model="saisie.charge_hebdo_max" type="number" min="1" max="60" data-champ="charge_hebdo_max"></label>
    </div>
    <p class="profil-erreur">{{ erreurCharge }}</p>
    <button type="submit" class="profil-btn" :aria-disabled="occupe ? 'true' : 'false'">Enregistrer le profil</button>
  </form>
</template>

<script setup>
/**
 * #673 — le profil d'un enseignant, lu et écrit par la gestion d'une école qui gère son propre catalogue (la même porte
 * que le serveur). Le matricule est facultatif et unique dans l'école (`matricule_deja_pris`, dit par le catalogue).
 * Le profil est écrit en entier : un champ vidé part nul.
 */
import { onMounted, reactive, ref } from 'vue'
import { profilEnseignantService } from '@/services/profilEnseignant'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const props = defineProps({ enseignantId: { type: Number, required: true } })

const GRADES = Object.freeze({ assistant: 'Assistant', maitre_assistant: 'Maître-assistant', maitre_de_conferences: 'Maître de conférences', professeur: 'Professeur' })
const CHAMPS = ['matricule', 'specialite', 'titre', 'grade', 'diplome', 'universite', 'date_debut', 'statut', 'charge_hebdo_max']
const saisie = reactive(Object.fromEntries(CHAMPS.map((c) => [c, ''])))
const erreur = ref('')
const erreurCharge = ref('')
const annonce = ref('')
const occupe = ref(false)

const remplir = (p) => CHAMPS.forEach((c) => { saisie[c] = p[c] == null ? '' : String(p[c]) })

onMounted(async () => {
  try {
    remplir(await profilEnseignantService.lireProfil(props.enseignantId))
  } catch (err) {
    erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
  }
})

async function enregistrer() {
  if (occupe.value) return
  erreur.value = ''
  annonce.value = ''
  const charge = String(saisie.charge_hebdo_max ?? '').trim()
  erreurCharge.value = charge !== '' && !/^([1-9]|[1-5]\d|60)$/.test(charge) ? ERROR_MESSAGES.profilChargeIllisible : ''
  if (erreurCharge.value) return
  occupe.value = true
  try {
    remplir(await profilEnseignantService.ecrireProfil(props.enseignantId, { ...saisie, charge_hebdo_max: charge }))
    annonce.value = 'Profil enregistré.'
  } catch (err) {
    erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
  } finally {
    occupe.value = false
  }
}
</script>

<style scoped>
.profil { display: grid; gap: var(--spacing-sm); color: var(--text-primary); }
.profil-champs { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: var(--spacing-sm); }
.profil-champs label { display: grid; gap: var(--spacing-xs, 0.25rem); font-weight: 600; }
.profil-champs input, .profil-champs select { padding: var(--spacing-sm); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-secondary); color: var(--text-primary); font-weight: 400; }
.profil-erreur { margin: 0; color: var(--error-text); }
.profil-annonce:empty { display: none; }
.profil-btn { justify-self: start; padding: var(--spacing-sm) var(--spacing-md); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--btn-primary-bg); color: var(--btn-primary-text); cursor: pointer; }
</style>
