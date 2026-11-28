<template>
  <section class="eleve" aria-labelledby="eleve-titre">
    <h3 id="eleve-titre" class="eleve-titre">Mes résultats dans la classe</h3>
    <dl class="eleve-chiffres">
      <div>
        <dt>Ma moyenne générale</dt>
        <dd>{{ afficherNote(ligne.moyenne_generale) }}</dd>
      </div>
      <div v-if="'rang' in ligne" data-test="rang">
        <dt>Mon rang</dt>
        <dd>{{ ligne.rang ?? '—' }}</dd>
      </div>
    </dl>
    <ul class="eleve-matieres">
      <li v-for="matiere in matieres" :key="matiere.matiere_id">
        <span>{{ matiere.libelle ?? 'Matière' }}</span>
        <strong>{{ afficherNote(moyenneEn(matiere.matiere_id)) }}</strong>
      </li>
    </ul>
    <template v-if="mesNotes.length">
      <h4 class="eleve-sous-titre">Mes notes</h4>
      <ul class="eleve-matieres" data-test="mes-notes">
        <li v-for="note in mesNotes" :key="note.id">
          <span>{{ note.titre }}<span v-if="note.matiere" class="eleve-matiere"> · {{ note.matiere }}</span></span>
          <strong>{{ note.contenu }}</strong>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup>
/**
 * #683 : la vue de l'élève. Le serveur ne lui rend que SA ligne ; son rang n'y est que si l'école
 * l'autorise : sans la clé, aucune case « Mon rang » n'est montrée (rien n'est deviné).
 * #692 : « Mes notes », ses cases du carnet (note rendue ou état en toutes lettres), si le serveur les rend.
 */
import { computed } from 'vue'
import { afficherNote } from '@/utils/studentGrades'
import { caseDe, contenuDeLaCase, enteteDeLEvaluation } from '@/utils/carnetDeNotes'

const props = defineProps({
  ligne: { type: Object, required: true },
  matieres: { type: Array, required: true },
  evaluations: { type: Array, default: () => [] },
})

const mesNotes = computed(() => (Array.isArray(props.ligne.cellules)
  ? props.evaluations.map((ev) => ({ id: ev.id, ...enteteDeLEvaluation(ev, props.matieres), contenu: contenuDeLaCase(caseDe(props.ligne, ev.id)) }))
  : []))

function moyenneEn(matiereId) {
  return (props.ligne.matieres ?? []).find((m) => m.matiere_id === matiereId)?.moyenne ?? null
}
</script>

<style scoped>
.eleve {
  padding: 1rem 1.25rem;
  border: 1px solid var(--card-border);
  border-radius: 0.75rem;
  background: var(--card-bg);
  color: var(--text-primary);
}

.eleve-titre {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.eleve-chiffres {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin: 0 0 1rem;
}

.eleve-chiffres dt {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.eleve-chiffres dd {
  margin: 0.25rem 0 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.eleve-matieres {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.eleve-sous-titre {
  margin: 1.25rem 0 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
}

.eleve-matiere {
  color: var(--text-secondary);
}

.eleve-matieres li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--table-border);
  padding-bottom: 0.25rem;
}
</style>
