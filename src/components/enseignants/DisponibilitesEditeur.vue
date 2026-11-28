<template>
  <div class="dispo">
    <p v-if="d.erreur.value" class="dispo-erreur" role="alert">{{ d.erreur.value }}</p>
    <p class="dispo-annonce" role="status" aria-live="polite">{{ d.annonce.value }}</p>
    <p v-if="d.chargement.value" class="dispo-aide">Chargement…</p>

    <template v-else>
      <section aria-labelledby="dispo-semaine">
        <h3 id="dispo-semaine">La semaine type</h3>
        <div class="dispo-grille">
          <div v-for="jour in d.jours.value" :key="jour" class="dispo-jour" :data-jour="jour">
            <h4>{{ JOURS[jour] }}</h4>
            <button v-for="c in d.duJour(jour)" :key="c.cle" type="button" class="dispo-creneau" :class="{ 'dispo-creneau--non': !c.disponible }" data-creneau @click="d.ouvrirCreneau(c)">
              {{ c.debut }}–{{ c.fin }} · {{ c.disponible ? 'Disponible' : 'Indisponible' }}
            </button>
            <button type="button" class="dispo-btn" :data-ajouter="jour" @click="d.ouvrirSur(jour)">Ajouter <span class="sr-only">un créneau le {{ JOURS[jour].toLowerCase() }}</span></button>
          </div>
        </div>

        <div v-if="d.creneau.ouvert" class="dispo-saisie">
          <label>Début <input v-model="d.creneau.debut" type="time" data-champ="debut"></label>
          <label>Fin <input v-model="d.creneau.fin" type="time" data-champ="fin"></label>
          <label>
            Je suis
            <select v-model="d.creneau.disponible" data-champ="disponible">
              <option value="oui">disponible</option>
              <option value="non">indisponible</option>
            </select>
          </label>
          <p class="dispo-erreur">{{ d.erreurCreneau.value }}</p>
          <button type="button" class="dispo-btn" data-action="valider-creneau" @click="d.validerCreneau">Garder ce créneau</button>
          <button v-if="d.creneau.cle" type="button" class="dispo-btn" data-action="retirer-creneau" @click="d.retirerCreneau">Retirer ce créneau</button>
          <button type="button" class="dispo-btn" @click="d.fermer">Annuler</button>
        </div>
        <button type="button" class="dispo-btn dispo-btn--principal" data-action="enregistrer" :aria-disabled="d.occupe.value ? 'true' : 'false'" @click="d.enregistrer">Enregistrer la semaine</button>
      </section>

      <section aria-labelledby="dispo-exceptions">
        <h3 id="dispo-exceptions">Les exceptions datées</h3>
        <ul>
          <li v-for="e in d.exceptions.value" :key="e.id" data-exception>
            {{ jourFr(e.date) }} — {{ e.debut ? `${e.debut}–${e.fin}` : 'journée entière' }} · {{ e.disponible ? 'disponible' : 'indisponible' }}<template v-if="e.motif"> · {{ e.motif }}</template>
            <button type="button" class="dispo-btn" data-action="retirer-exception" @click="d.retirerException(e)">Retirer</button>
          </li>
        </ul>
        <form class="dispo-saisie" data-exception-form novalidate @submit.prevent="d.ajouterException">
          <label>Date <input v-model="d.nouvelleException.date" type="date" data-champ="exception-date"></label>
          <label>Début <input v-model="d.nouvelleException.debut" type="time" data-champ="exception-debut"></label>
          <label>Fin <input v-model="d.nouvelleException.fin" type="time" data-champ="exception-fin"></label>
          <label>
            Je suis
            <select v-model="d.nouvelleException.disponible" data-champ="exception-disponible">
              <option value="non">indisponible</option>
              <option value="oui">disponible</option>
            </select>
          </label>
          <label>Motif <input v-model="d.nouvelleException.motif" maxlength="150" data-champ="exception-motif"></label>
          <p class="dispo-erreur">{{ d.erreurException.value }}</p>
          <button type="submit" class="dispo-btn">Ajouter l’exception</button>
        </form>
      </section>
    </template>
  </div>
</template>

<script setup>
/**
 * #673 — l'éditeur des disponibilités d'un enseignant, partagé par « Mes disponibilités » (l'enseignant, pour lui-même)
 * et l'onglet de la fiche (la gestion, qui relit et corrige). La logique vit dans useDisponibilites.
 */
import { useDisponibilites } from '@/composables/useDisponibilites'

const props = defineProps({ enseignantId: { type: Number, required: true } })
const d = useDisponibilites(() => props.enseignantId)

const JOURS = Object.freeze({ 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche' })
const jourFr = (iso) => String(iso ?? '').split('-').reverse().join('/')
</script>

<style scoped>
.dispo { display: grid; gap: var(--spacing-md); color: var(--text-primary); }
.dispo-grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: var(--spacing-sm); }
.dispo-jour { display: grid; align-content: start; gap: var(--spacing-xs, 0.25rem); padding: var(--spacing-sm); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-secondary); }
.dispo-jour h4, .dispo h3 { margin: 0; }
.dispo-creneau { text-align: left; padding: var(--spacing-sm); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--card-bg); color: var(--text-primary); cursor: pointer; }
.dispo-creneau--non { border-style: dashed; color: var(--text-secondary); }
.dispo-saisie { display: flex; flex-wrap: wrap; align-items: end; gap: var(--spacing-sm); }
.dispo-saisie input, .dispo-saisie select { display: block; padding: var(--spacing-sm); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-secondary); color: var(--text-primary); }
.dispo-btn { padding: var(--spacing-sm) var(--spacing-md); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; }
.dispo-btn--principal { background: var(--btn-primary-bg); color: var(--btn-primary-text); }
.dispo-erreur { margin: 0; color: var(--error-text); }
.dispo-annonce:empty { display: none; }
.dispo-aide { margin: 0; color: var(--text-secondary); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
