<template>
  <DashboardLayout>
    <div class="edt-page">
      <h1 class="edt-titre">Emplois du temps</h1>
      <p class="edt-aide">La semaine type de chaque classe : composez sa grille, puis générez ses séances.</p>

      <p v-if="erreur" class="edt-erreur" role="alert">{{ erreur }}</p>
      <ContentLoader v-if="chargement" />

      <template v-else>
        <section v-if="alertes.sans_emploi_du_temps.length || alertes.expires.length" class="edt-carte" aria-labelledby="edt-alertes">
          <h2 id="edt-alertes">À traiter</h2>
          <template v-if="alertes.sans_emploi_du_temps.length">
            <p class="edt-aide">Classes sans emploi du temps en vigueur aujourd’hui :</p>
            <ul>
              <li v-for="c in alertes.sans_emploi_du_temps" :key="`s${c.classe_id}`" data-alerte="sans">{{ c.libelle ?? libelleDeClasse(c.classe_id) }}</li>
            </ul>
          </template>
          <template v-if="alertes.expires.length">
            <p class="edt-aide">Emplois du temps en vigueur dont la plage est passée :</p>
            <ul>
              <li v-for="e in alertes.expires" :key="`e${e.id}`" data-alerte="expire">
                <RouterLink :to="{ name: 'AdminEmploiDuTemps', params: { id: e.id } }">{{ e.titre }}</RouterLink>
                ({{ libelleDeClasse(e.classe_id) }}, fini le {{ jourFr(e.au) }})
              </li>
            </ul>
          </template>
        </section>

        <section class="edt-carte" aria-labelledby="edt-liste">
          <h2 id="edt-liste">Les emplois du temps</h2>
          <div class="edt-champ">
            <label for="edt-filtre">Classe</label>
            <select id="edt-filtre" v-model="filtre" data-champ="filtre-classe">
              <option value="">Toutes les classes</option>
              <option v-for="c in classes" :key="c.id" :value="String(c.id)">{{ c.libelle }}</option>
            </select>
          </div>
          <p v-if="classesErreur" class="edt-erreur">{{ classesErreur }}</p>
          <p v-if="!emplois.length" class="edt-aide">{{ ERROR_MESSAGES.emploisDuTempsAucun }}</p>
          <table v-else class="edt-tableau" data-emplois>
            <thead>
              <tr><th>Classe</th><th>Titre</th><th>Plage</th><th>État</th><th>Créneaux</th></tr>
            </thead>
            <tbody>
              <tr v-for="e in emplois" :key="e.id">
                <td data-entete="Classe">{{ libelleDeClasse(e.classe_id) }}</td>
                <td data-entete="Titre"><RouterLink :to="{ name: 'AdminEmploiDuTemps', params: { id: e.id } }">{{ e.titre }}</RouterLink></td>
                <td data-entete="Plage">du {{ jourFr(e.du) }} au {{ jourFr(e.au) }}</td>
                <td data-entete="État">{{ e.en_vigueur ? 'En vigueur' : 'Suspendu' }}</td>
                <td data-entete="Créneaux">{{ e.lignes.length }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <form class="edt-carte" data-creation novalidate @submit.prevent="creer">
          <h2>Nouvel emploi du temps</h2>
          <p v-if="erreurCreation" class="edt-erreur" role="alert">{{ erreurCreation }}</p>
          <div class="edt-champs">
            <div class="edt-champ">
              <label for="edt-classe">Classe</label>
              <select id="edt-classe" v-model="saisie.classe" data-champ="classe" aria-describedby="edt-classe-erreur" :aria-invalid="erreurs.classe ? 'true' : 'false'">
                <option value="" disabled>Choisir une classe</option>
                <option v-for="c in classes" :key="c.id" :value="String(c.id)">{{ c.libelle }}</option>
              </select>
              <p id="edt-classe-erreur" class="edt-champ-erreur">{{ erreurs.classe }}</p>
            </div>
            <div class="edt-champ">
              <label for="edt-titre">Titre</label>
              <input id="edt-titre" v-model="saisie.titre" data-champ="titre" maxlength="150" aria-describedby="edt-titre-erreur" :aria-invalid="erreurs.titre ? 'true' : 'false'">
              <p id="edt-titre-erreur" class="edt-champ-erreur">{{ erreurs.titre }}</p>
            </div>
            <div class="edt-champ">
              <label for="edt-du">Du</label>
              <input id="edt-du" v-model="saisie.du" type="date" data-champ="du" aria-describedby="edt-plage-erreur">
            </div>
            <div class="edt-champ">
              <label for="edt-au">Au</label>
              <input id="edt-au" v-model="saisie.au" type="date" data-champ="au" aria-describedby="edt-plage-erreur">
            </div>
          </div>
          <p id="edt-plage-erreur" class="edt-champ-erreur">{{ erreurs.plage }}</p>
          <div class="edt-actions">
            <button type="submit" class="edt-btn edt-btn--principal" :aria-disabled="occupe ? 'true' : 'false'">Créer et composer la grille</button>
          </div>
        </form>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * #676 — l'écran « Emplois du temps » (gestion, école qui gère son propre catalogue) : les alertes du serveur, UN
 * tableau lisible sur téléphone (décision du 28/11), le filtre par classe et la création. La logique vit dans
 * useEmploisDuTemps.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { useEmploisDuTemps } from '@/composables/useEmploisDuTemps'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { jourFr } from '@/utils/emploiDuTemps'
import '@/components/emploiDuTemps/emploiDuTemps.css'

const { classes, classesErreur, libelleDeClasse, emplois, alertes, chargement, erreur, filtre, saisie, erreurs, erreurCreation, occupe, creer } = useEmploisDuTemps()
</script>
