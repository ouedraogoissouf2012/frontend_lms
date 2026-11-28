<template>
  <section class="fiche-eleve">
    <ContentLoader v-if="chargement" text="Chargement de la fiche…" />

    <div v-else-if="erreur" class="fiche-erreur" role="alert">{{ erreur }}</div>

    <template v-else>
      <header class="fiche-entete">
        <h1 class="fiche-titre">{{ titre }}</h1>
        <p v-if="dossier?.matricule" class="fiche-matricule">Matricule {{ dossier.matricule }}</p>
        <p v-if="raisonLectureSeule" class="fiche-lecture-seule" data-test="lecture-seule">{{ raisonLectureSeule }}</p>
      </header>

      <div class="fiche-onglets" role="tablist" aria-label="Fiche de l’élève">
        <button
          v-for="o in ONGLETS"
          :key="o.id"
          type="button"
          role="tab"
          class="fiche-onglet"
          :class="{ actif: onglet === o.id }"
          :aria-selected="onglet === o.id"
          :data-test="`onglet-${o.id}`"
          @click="onglet = o.id"
        >
          {{ o.libelle }}
        </button>
      </div>

      <div role="tabpanel" class="fiche-panneau">
        <FicheEleveIdentite
          v-if="onglet === 'identite'"
          :dossier="dossier"
          :modifiable="modifiable"
          :en-cours="enCours"
          :doublon="doublon"
          :enregistrer="enregistrerIdentite"
          :confirmer-doublon="confirmerDoublon"
          @renoncer-doublon="renoncerAuDoublon"
        />
        <FicheEleveTuteurs
          v-else
          :tuteurs="tuteurs"
          :modifiable="modifiable && dossier !== null"
          :en-cours="enCours"
          :actions="tuteursActions"
        />
      </div>
    </template>
  </section>
</template>

<script setup>
/**
 * front#664 : la fiche d'un élève (contrat back #1797). Onglets Identité et Tuteurs. Les onglets dont la route serveur
 * n'existe pas encore (Classes, Notes, Présences, Documents) ne sont pas affichés : aucun faux contenu. La donnée et
 * les gestes vivent dans useFicheEleve.
 */
import { computed, onMounted, ref } from 'vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import FicheEleveIdentite from '@/components/eleves/FicheEleveIdentite.vue'
import FicheEleveTuteurs from '@/components/eleves/FicheEleveTuteurs.vue'
import { useFicheEleve } from '@/composables/useFicheEleve'
import { nomComplet } from '@/utils/dossierEleve'

const ONGLETS = Object.freeze([{ id: 'identite', libelle: 'Identité' }, { id: 'tuteurs', libelle: 'Tuteurs' }])

const props = defineProps({
  eleveId: { type: Number, required: true },
})

const onglet = ref('identite')
const {
  chargement, erreur, dossier, tuteurs, enCours, doublon, modifiable, raisonLectureSeule,
  charger, enregistrerIdentite, confirmerDoublon, renoncerAuDoublon, tuteursActions,
} = useFicheEleve(props.eleveId)

const titre = computed(() => nomComplet(dossier.value) || 'Fiche de l’élève')

onMounted(charger)
</script>

<style scoped>
.fiche-eleve {
  max-width: 64rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.fiche-entete {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.fiche-titre {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
}

.fiche-matricule {
  margin: 0;
  color: var(--text-secondary);
}

.fiche-lecture-seule,
.fiche-erreur {
  margin: 0.5rem 0 0 0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.fiche-onglets {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.fiche-onglet {
  padding: 0.625rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
}

.fiche-onglet.actif {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.fiche-panneau {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}
</style>
