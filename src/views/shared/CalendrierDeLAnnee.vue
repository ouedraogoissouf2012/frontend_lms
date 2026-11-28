<template>
  <DashboardLayout>
    <div class="cal-page">
      <h1 class="cal-titre">Calendrier de l’année</h1>
      <p class="cal-aide">Rentrée, examens, vacances, fermetures… les dates de l’école.</p>

      <p v-if="erreur" class="cal-erreur" role="alert">{{ erreur }}</p>
      <p class="cal-annonce" role="status" aria-live="polite">{{ annonce }}</p>

      <section class="cal-carte" aria-labelledby="cal-mois">
        <div class="cal-entete">
          <h2 id="cal-mois" class="cal-mois">{{ libelleDuMois }}</h2>
          <div class="cal-actions">
            <button type="button" class="cal-btn" data-action="mois-precedent" @click="aller(-1)">Mois précédent</button>
            <button type="button" class="cal-btn" data-action="aujourdhui" @click="revenir">Ce mois-ci</button>
            <button type="button" class="cal-btn" data-action="mois-suivant" @click="aller(1)">Mois suivant</button>
          </div>
          <div class="cal-actions" role="group" aria-label="Affichage">
            <button type="button" class="cal-btn" data-vue="mois" :aria-pressed="vue === 'mois' ? 'true' : 'false'" @click="vue = 'mois'">Mois</button>
            <button type="button" class="cal-btn" data-vue="liste" :aria-pressed="vue === 'liste' ? 'true' : 'false'" @click="vue = 'liste'">Liste</button>
          </div>
        </div>

        <ContentLoader v-if="chargement" />
        <template v-else-if="!erreur">
          <CalendarView v-if="vue === 'mois'" ref="vueDuMois" :options="optionsDuMois" />
          <ListeDuCalendrier v-else :evenements="evenements" :est-gestion="estGestion" :libelle-de-classe="libelleDeClasse" @modifier="ouvrir" @supprimer="supprimer" />
        </template>

        <div v-if="estGestion && !saisie.ouvert" class="cal-actions">
          <button type="button" class="cal-btn cal-btn--principal" data-action="publier" @click="ouvrir()">Publier un événement</button>
        </div>
      </section>

      <EvenementFormulaire
        v-if="estGestion && saisie.ouvert"
        :saisie="saisie"
        :erreurs="erreurs"
        :erreur="erreurEcriture"
        :classes="classes"
        :occupe="occupe"
        @enregistrer="enregistrer"
        @annuler="fermer"
      />
      <p v-if="estGestion && erreurClasses" class="cal-erreur">{{ erreurClasses }}</p>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * #678 — l'écran « Calendrier de l'année » (lms_backend#1671), ouvert à tout membre de l'école, dans les deux
 * volets : la plage lue suit le mois affiché ; vue MOIS (FullCalendar, en journées entières) et vue LISTE. Seule la
 * gestion voit l'écriture ; le serveur fait foi. La logique vit dans useCalendrierDeLAnnee et useEvenementDuCalendrier.
 */
import { computed, ref } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import frLocale from '@fullcalendar/core/locales/fr'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import CalendarView from '@/components/calendar/CalendarView.vue'
import ListeDuCalendrier from '@/components/calendrier/ListeDuCalendrier.vue'
import EvenementFormulaire from '@/components/calendrier/EvenementFormulaire.vue'
import { useCalendrierDeLAnnee } from '@/composables/useCalendrierDeLAnnee'
import { useEvenementDuCalendrier } from '@/composables/useEvenementDuCalendrier'
import { TYPES_FERMANT_LES_JOURS, enJourneesEntieres } from '@/utils/calendrierDeLAnnee'
import '@/components/calendrier/calendrier.css'
import '@/components/calendar/joursFermes.css'

const { estGestion, vue, evenements, classes, chargement, erreur, erreurClasses, annonce, plage, libelleDuMois, libelleDeClasse, charger, changerDeMois, moisCourant } = useCalendrierDeLAnnee()
const { saisie, erreurs, erreurEcriture, occupe, ouvrir, fermer, enregistrer, supprimer } = useEvenementDuCalendrier({ apres: charger, annonce })

const vueDuMois = ref(null)

const optionsDuMois = computed(() => ({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  initialDate: plage.value.du,
  locale: frLocale,
  headerToolbar: false,
  height: 'auto',
  events: evenements.value.map((e) => enJourneesEntieres(e, {
    classNames: [`evenement-${e.type}`, ...(TYPES_FERMANT_LES_JOURS.includes(e.type) ? ['jour-ferme'] : [])],
  })),
  eventClick: (info) => {
    const e = evenements.value.find((x) => x.id === info.event.extendedProps.evenementId)
    if (estGestion.value && e) ouvrir(e)
  },
}))

/** Le mois change : la vue FullCalendar suit, puis la plage est relue. */
async function aller(decalage) {
  await changerDeMois(decalage)
  vueDuMois.value?.getApi()?.gotoDate(plage.value.du)
}

async function revenir() {
  await moisCourant()
  vueDuMois.value?.getApi()?.gotoDate(plage.value.du)
}
</script>
