<template>
  <div class="tuteurs">
    <p v-if="tuteurs.length === 0 && !formulaire" class="tuteurs-vide">Aucun tuteur n’est lié à cet élève.</p>

    <ul v-else class="tuteurs-liste">
      <li v-for="t in tuteurs" :key="t.id" class="tuteur">
        <div>
          <p class="tuteur-nom">{{ t.nom }} <span class="tuteur-relation">{{ libelleDe(RELATIONS, t.relation) }}</span></p>
          <p class="tuteur-coordonnees">{{ coordonnees(t) }}</p>
        </div>
        <div v-if="modifiable" class="tuteur-actions">
          <button type="button" class="btn-secondaire" :data-test="`modifier-tuteur-${t.id}`" @click="ouvrir(t)">Modifier</button>
          <button type="button" class="btn-secondaire" :data-test="`retirer-tuteur-${t.id}`" :disabled="enCours" @click="actions.retirer(t)">
            Retirer
          </button>
        </div>
      </li>
    </ul>

    <form v-if="formulaire" class="tuteur-formulaire" data-test="formulaire-tuteur" @submit.prevent="soumettre">
      <template v-if="formulaire.id === null">
        <div class="tuteur-champ">
          <label for="tuteur-relation">Relation *</label>
          <select id="tuteur-relation" v-model="formulaire.saisie.relation" required data-champ-tuteur="relation">
            <option v-for="r in RELATIONS" :key="r.valeur" :value="r.valeur">{{ r.libelle }}</option>
          </select>
        </div>
        <div class="tuteur-champ">
          <label for="tuteur-nom">Nom *</label>
          <input id="tuteur-nom" v-model="formulaire.saisie.nom" required maxlength="150" data-champ-tuteur="nom" />
        </div>
      </template>
      <div v-for="c in COORDONNEES_TUTEUR" :key="c.nom" class="tuteur-champ">
        <label :for="`tuteur-${c.nom}`">{{ c.libelle }}</label>
        <input :id="`tuteur-${c.nom}`" v-model="formulaire.saisie[c.nom]" :type="c.type ?? 'text'" :data-champ-tuteur="c.nom" />
      </div>
      <div class="tuteur-boutons">
        <button type="submit" class="btn-principal" :disabled="enCours">Enregistrer</button>
        <button type="button" class="btn-secondaire" @click="formulaire = null">Annuler</button>
      </div>
    </form>

    <button v-else-if="modifiable" type="button" class="btn-principal" data-test="ajouter-tuteur" @click="ouvrir(null)">
      Ajouter un tuteur
    </button>
  </div>
</template>

<script setup>
/**
 * front#664 : les tuteurs d'un élève. Ajouter (relation et nom requis), modifier les coordonnées (la relation ne se
 * modifie pas ici), retirer après confirmation : pour qui peut écrire (`modifiable`). Les gestes viennent de
 * useFicheEleve (`actions`), qui rendent `true` quand le serveur a accepté.
 */
import { ref } from 'vue'
import { COORDONNEES_TUTEUR, RELATIONS, coordonneesDe, libelleDe } from '@/utils/dossierEleve'

const props = defineProps({
  tuteurs: { type: Array, default: () => [] },
  modifiable: { type: Boolean, default: false },
  enCours: { type: Boolean, default: false },
  /** { ajouter(saisie), modifier(id, coordonnees), retirer(tuteur) } : chacun rend Promise<boolean> */
  actions: { type: Object, required: true },
})

const formulaire = ref(null)

function ouvrir(tuteur) {
  const saisie = Object.fromEntries(COORDONNEES_TUTEUR.map(({ nom }) => [nom, tuteur?.[nom] ?? '']))
  formulaire.value = tuteur
    ? { id: tuteur.id, saisie }
    : { id: null, saisie: { relation: RELATIONS[0].valeur, nom: '', ...saisie } }
}

async function soumettre() {
  const { id, saisie } = formulaire.value
  const ok = id === null
    ? await props.actions.ajouter({ relation: saisie.relation, nom: saisie.nom.trim(), ...coordonneesDe(saisie) })
    : await props.actions.modifier(id, coordonneesDe(saisie))
  if (ok) formulaire.value = null
}

function coordonnees(t) {
  return [t.telephone, t.courriel, t.profession].filter(Boolean).join(' · ') || 'Aucune coordonnée'
}
</script>

<style scoped>
.tuteurs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tuteurs-vide,
.tuteur-coordonnees {
  margin: 0;
  color: var(--text-secondary);
}

.tuteurs-liste {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tuteur {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
}

.tuteur-nom {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: var(--text-primary);
}

.tuteur-relation {
  font-weight: 400;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.tuteur-actions,
.tuteur-boutons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tuteur-formulaire {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem 1.5rem;
}

.tuteur-boutons {
  grid-column: 1 / -1;
}

.tuteur-champ {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tuteur-champ label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.tuteur-champ input,
.tuteur-champ select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-principal,
.btn-secondaire {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-primary);
  align-self: flex-start;
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

.btn-principal:disabled,
.btn-secondaire:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
