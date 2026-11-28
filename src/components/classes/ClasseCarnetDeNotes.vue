<template>
  <section class="carnet" aria-labelledby="carnet-titre">
    <h3 id="carnet-titre" class="carnet-titre">Carnet de notes</h3>
    <p v-if="!bilan.evaluations.length" class="carnet-vide">Aucune évaluation aux résultats publiés sur la période.</p>
    <template v-else>
      <ul class="carnet-legende" aria-label="Légende des cases">
        <li v-for="(explication, etat) in EXPLICATIONS_DES_ETATS" :key="etat">
          <span class="carnet-etat" :class="`carnet-etat--${etat}`">{{ libelleDeLEtat(etat) }}</span> : {{ explication }}
        </li>
      </ul>
      <div class="carnet-cadre" tabindex="0" role="region" aria-label="Carnet de notes, défilement horizontal">
        <table class="carnet-grille">
          <caption class="carnet-legende-table">Une ligne par élève, une colonne par évaluation ; seules les cases rendues comptent dans les moyennes.</caption>
          <thead>
            <tr>
              <th scope="col" class="carnet-nom">Élève</th>
              <th scope="col">Moyenne générale</th>
              <th v-for="colonne in colonnes" :key="colonne.id" scope="col" data-test="colonne">
                {{ colonne.titre }}
                <span v-if="colonne.matiere" class="carnet-matiere">{{ colonne.matiere }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="eleve in bilan.eleves" :key="eleve.compte_id ?? eleve.nom" data-test="ligne">
              <th scope="row" class="carnet-nom">{{ eleve.nom }}</th>
              <td>{{ afficherNote(eleve.moyenne_generale) }}</td>
              <td v-for="colonne in colonnes" :key="colonne.id" data-test="case">
                <span class="carnet-etat" :class="`carnet-etat--${etatDe(eleve, colonne.id)}`">
                  {{ contenuDeLaCase(caseDe(eleve, colonne.id)) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup>
/**
 * #692 (lms_backend#1698) : le carnet de notes de la classe, pour le personnel. Une case montre la
 * note rendue ou son état en toutes lettres (la couleur n'est qu'un appui). Sur téléphone, la
 * colonne des noms reste collée et seule la grille défile à l'horizontale, dans son cadre.
 */
import { computed } from 'vue'
import { afficherNote } from '@/utils/studentGrades'
import { EXPLICATIONS_DES_ETATS, caseDe, contenuDeLaCase, enteteDeLEvaluation, libelleDeLEtat } from '@/utils/carnetDeNotes'

const props = defineProps({
  bilan: { type: Object, required: true },
})

const colonnes = computed(() => props.bilan.evaluations.map((ev) => ({ id: ev.id, ...enteteDeLEvaluation(ev, props.bilan.matieres) })))

function etatDe(eleve, evaluationId) {
  return caseDe(eleve, evaluationId)?.etat ?? 'inconnu'
}
</script>

<style scoped>
.carnet {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.carnet-titre {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
}

.carnet-vide,
.carnet-legende,
.carnet-legende-table {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: left;
}

.carnet-legende {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  padding: 0;
  list-style: none;
}

.carnet-cadre {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  border: 1px solid var(--table-border);
  border-radius: 0.5rem;
}

.carnet-cadre:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.carnet-grille {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.carnet-grille th,
.carnet-grille td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--table-border);
  color: var(--text-primary);
  text-align: left;
  white-space: nowrap;
}

.carnet-grille thead th {
  background: var(--table-header-bg);
  font-weight: 600;
  vertical-align: bottom;
}

.carnet-matiere {
  display: block;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 400;
}

/* La colonne des noms reste visible quand la grille défile. Le nom est un en-tête de LIGNE : la fiche
   de classe impose son style à tout `th` avec `!important` (ClasseDetails.vue, « Tables ») ; d'où la
   même force ici, comme le classement (#683). */
.carnet-cadre .carnet-grille .carnet-nom {
  position: sticky;
  left: 0;
  z-index: 1;
  border-right: 1px solid var(--table-border);
}

.carnet-cadre .carnet-grille tbody th {
  background: var(--bg-primary) !important;
  color: var(--text-primary) !important;
  font-size: inherit;
  font-weight: 500;
  letter-spacing: normal;
  text-transform: none;
}

.carnet-etat {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.875rem;
}

.carnet-etat--a_corriger {
  border-color: var(--info-border);
  background: var(--info-bg);
  color: var(--info-text);
}

.carnet-etat--en_retard {
  border-color: var(--warning-border);
  background: var(--warning-bg);
  color: var(--warning-text);
}

.carnet-etat--manquant {
  border-color: var(--error-border);
  background: var(--error-bg);
  color: var(--error-text);
}
</style>
