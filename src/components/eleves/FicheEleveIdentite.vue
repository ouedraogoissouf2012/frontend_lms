<template>
  <div class="identite">
    <form v-if="edition" class="identite-formulaire" data-test="formulaire-identite" @submit.prevent="soumettre">
      <div v-for="c in CHAMPS_IDENTITE" :key="c.nom" class="identite-champ">
        <label :for="`identite-${c.nom}`">{{ c.libelle }}<span v-if="c.requis" aria-hidden="true"> *</span></label>
        <select v-if="c.options" :id="`identite-${c.nom}`" v-model="saisie[c.nom]" :data-champ="c.nom">
          <option value="">—</option>
          <option v-for="o in c.options" :key="o.valeur" :value="o.valeur">{{ o.libelle }}</option>
        </select>
        <input
          v-else
          :id="`identite-${c.nom}`"
          v-model="saisie[c.nom]"
          :type="c.type ?? 'text'"
          :required="c.requis"
          :data-champ="c.nom"
        />
        <p v-if="c.aide" class="identite-aide">{{ c.aide }}</p>
      </div>

      <div v-if="doublon" class="identite-doublon" role="alert" data-test="doublon">
        <p>{{ doublon.message || 'Un élève de l’établissement porte déjà ce nom.' }}</p>
        <ul>
          <li v-for="c in doublon.candidats" :key="c.eleve_id">{{ c.nom }} {{ c.prenoms }}<span v-if="c.matricule"> — {{ c.matricule }}</span></li>
        </ul>
        <div class="identite-actions">
          <button type="button" class="btn-principal" data-test="confirmer-doublon" :disabled="enCours" @click="confirmer">
            Enregistrer quand même
          </button>
          <button type="button" class="btn-secondaire" @click="$emit('renoncer-doublon')">Revoir la saisie</button>
        </div>
      </div>

      <div v-else class="identite-actions">
        <button type="submit" class="btn-principal" :disabled="enCours">Enregistrer</button>
        <button type="button" class="btn-secondaire" @click="edition = false">Annuler</button>
      </div>
    </form>

    <template v-else-if="dossier">
      <dl class="identite-lecture">
        <template v-for="c in CHAMPS_IDENTITE" :key="c.nom">
          <dt>{{ c.libelle }}</dt>
          <dd>{{ affiche(c) }}</dd>
        </template>
      </dl>
      <button v-if="modifiable" type="button" class="btn-secondaire" data-test="modifier-identite" @click="ouvrir">
        Modifier l’identité
      </button>
    </template>

    <div v-else class="identite-vide" data-test="aucun-dossier">
      <p>Aucun dossier n’est encore ouvert pour cet élève.</p>
      <button v-if="modifiable" type="button" class="btn-principal" data-test="creer-dossier" @click="ouvrir">Créer le dossier</button>
    </div>
  </div>
</template>

<script setup>
/**
 * front#664 : l'identité d'un élève, en lecture, et en formulaire pour qui peut l'écrire (`modifiable`). Un doublon
 * possible (409) s'affiche dans le formulaire avec ses candidats ; la saisie est gardée.
 */
import { ref } from 'vue'
import { CHAMPS_IDENTITE, libelleDe, versCorps, versSaisie } from '@/utils/dossierEleve'

const props = defineProps({
  dossier: { type: Object, default: null },
  modifiable: { type: Boolean, default: false },
  enCours: { type: Boolean, default: false },
  doublon: { type: Object, default: null },
  /** (identite) => Promise<boolean> */
  enregistrer: { type: Function, required: true },
  /** () => Promise<boolean> : renvoie la saisie gardée avec la confirmation du doublon */
  confirmerDoublon: { type: Function, required: true },
})
defineEmits(['renoncer-doublon'])

const edition = ref(false)
const saisie = ref(versSaisie(null))

function ouvrir() {
  saisie.value = versSaisie(props.dossier)
  edition.value = true
}

async function soumettre() {
  if (await props.enregistrer(versCorps(saisie.value))) edition.value = false
}

async function confirmer() {
  if (await props.confirmerDoublon()) edition.value = false
}

function affiche(champ) {
  const valeur = props.dossier?.[champ.nom]
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  if (champ.options) return libelleDe(champ.options, valeur)
  if (champ.type === 'date') return new Date(valeur).toLocaleDateString('fr-FR')
  return valeur
}
</script>

<style scoped>
.identite-lecture {
  display: grid;
  grid-template-columns: minmax(10rem, max-content) 1fr;
  gap: 0.5rem 1.5rem;
  margin: 0 0 1.25rem 0;
}

.identite-lecture dt {
  color: var(--text-secondary);
}

.identite-lecture dd {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.identite-formulaire {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem 1.5rem;
}

.identite-champ {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.identite-champ label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.identite-champ input,
.identite-champ select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.identite-aide {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.identite-doublon,
.identite-actions,
.identite-vide {
  grid-column: 1 / -1;
}

.identite-doublon {
  padding: 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.identite-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.identite-vide p {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
}

.btn-principal,
.btn-secondaire {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-primary);
}

.btn-principal {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--white);
}

.btn-secondaire {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-principal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
