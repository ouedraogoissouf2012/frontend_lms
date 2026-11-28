<template>
  <DashboardLayout>
    <div class="edt-page">
      <RouterLink :to="{ name: 'AdminEmploisDuTemps' }">← Tous les emplois du temps</RouterLink>
      <h1 class="edt-titre">{{ emploi ? emploi.titre : 'Emploi du temps' }}</h1>
      <p v-if="emploi" class="edt-aide">
        {{ libelleDeClasse(emploi.classe_id) }}, du {{ jourFr(emploi.du) }} au {{ jourFr(emploi.au) }} —
        {{ emploi.en_vigueur ? 'en vigueur' : 'suspendu' }}
      </p>

      <p v-if="erreur" class="edt-erreur" role="alert">{{ erreur }}</p>
      <p class="edt-annonce" role="status" aria-live="polite">{{ annonce }}</p>
      <ContentLoader v-if="chargement" />

      <template v-else-if="emploi">
        <section class="edt-carte" aria-labelledby="edt-grille">
          <h2 id="edt-grille">La semaine type</h2>
          <p class="edt-aide">Cliquez sur un créneau pour le modifier, ou ajoutez-en un sur un jour.</p>
          <GrilleHebdomadaire :lignes="lignes" :jours="jours" :nom-matiere="nomMatiere" :nom-enseignant="nomEnseignant" @editer="ouvrirLigne" @ajouter="ouvrirSur" />
          <CreneauFormulaire
            v-if="creneau.ouvert"
            :creneau="creneau"
            :erreurs="erreursCreneau"
            :matieres="matieres"
            :enseignants="enseignants"
            @valider="validerLigne"
            @retirer="retirerLigne"
            @annuler="fermer"
          />
          <p v-if="modifiee" class="edt-aide">La grille a des créneaux pas encore enregistrés.</p>
          <div class="edt-actions">
            <button type="button" class="edt-btn edt-btn--principal" data-action="enregistrer" :aria-disabled="occupe ? 'true' : 'false'" @click="enregistrer">Enregistrer la grille</button>
            <button type="button" class="edt-btn" data-action="generer" :aria-disabled="occupee || modifiee ? 'true' : 'false'" @click="!modifiee && generer()">Générer les séances</button>
          </div>
          <p v-if="modifiee" class="edt-aide">Enregistrez la grille avant de générer ses séances.</p>
        </section>

        <p v-if="erreurAction" class="edt-erreur" role="alert">{{ erreurAction }}</p>
        <p class="edt-annonce" aria-live="polite">{{ annonceAction }}</p>
        <RapportDeGeneration v-if="rapport" :rapport="rapport" />

        <form class="edt-carte" data-copie novalidate @submit.prevent="copier">
          <h2>Copier vers une autre classe ou une autre plage</h2>
          <div class="edt-champs">
            <div class="edt-champ">
              <label for="edt-copie-classe">Classe</label>
              <select id="edt-copie-classe" v-model="copie.classe" data-champ="copie-classe">
                <option value="" disabled>Choisir une classe</option>
                <option v-for="c in classes" :key="c.id" :value="String(c.id)">{{ c.libelle }}</option>
              </select>
            </div>
            <div class="edt-champ">
              <label for="edt-copie-du">Du</label>
              <input id="edt-copie-du" v-model="copie.du" type="date" data-champ="copie-du">
            </div>
            <div class="edt-champ">
              <label for="edt-copie-au">Au</label>
              <input id="edt-copie-au" v-model="copie.au" type="date" data-champ="copie-au">
            </div>
          </div>
          <p class="edt-aide">Chaque matière doit être au programme de la classe choisie ; l’enseignant redevient celui de son programme.</p>
          <div class="edt-actions">
            <button type="submit" class="edt-btn" :aria-disabled="occupee ? 'true' : 'false'">Copier</button>
          </div>
        </form>

        <form class="edt-carte" data-entete novalidate @submit.prevent="modifier">
          <h2>Titre, plage et état</h2>
          <div class="edt-champs">
            <div class="edt-champ">
              <label for="edt-entete-titre">Titre</label>
              <input id="edt-entete-titre" v-model="entete.titre" data-champ="entete-titre" maxlength="150">
            </div>
            <div class="edt-champ">
              <label for="edt-entete-du">Du</label>
              <input id="edt-entete-du" v-model="entete.du" type="date" data-champ="entete-du">
            </div>
            <div class="edt-champ">
              <label for="edt-entete-au">Au</label>
              <input id="edt-entete-au" v-model="entete.au" type="date" data-champ="entete-au">
            </div>
          </div>
          <label><input v-model="entete.enVigueur" type="checkbox" data-champ="entete-en-vigueur"> En vigueur</label>
          <div class="edt-actions">
            <button type="submit" class="edt-btn" :aria-disabled="occupee ? 'true' : 'false'">Enregistrer</button>
            <button type="button" class="edt-btn" data-action="supprimer" @click="supprimer">Supprimer l’emploi du temps</button>
          </div>
        </form>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * #676 — la grille hebdomadaire d'un emploi du temps (gestion, école qui gère son propre catalogue) : composer la
 * semaine type et l'enregistrer d'un bloc ; générer les séances et lire le rapport ; copier ; modifier ; supprimer.
 * La logique vit dans useGrilleEmploiDuTemps et useActionsDEmploiDuTemps.
 */
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import GrilleHebdomadaire from '@/components/emploiDuTemps/GrilleHebdomadaire.vue'
import CreneauFormulaire from '@/components/emploiDuTemps/CreneauFormulaire.vue'
import RapportDeGeneration from '@/components/emploiDuTemps/RapportDeGeneration.vue'
import { useGrilleEmploiDuTemps } from '@/composables/useGrilleEmploiDuTemps'
import { useActionsDEmploiDuTemps } from '@/composables/useActionsDEmploiDuTemps'
import { useClassesDeLEcole } from '@/composables/useClassesDeLEcole'
import { jourFr } from '@/utils/emploiDuTemps'
import '@/components/emploiDuTemps/emploiDuTemps.css'

const route = useRoute()
const {
  emploi, lignes, matieres, enseignants, chargement, erreur, annonce, occupe, modifiee, jours, nomMatiere, nomEnseignant,
  retenirEntete, charger, validerLigne, retirerLigne, enregistrer, creneau, erreursCreneau, ouvrirSur, ouvrirLigne, fermer,
} = useGrilleEmploiDuTemps(() => Number(route.params.id))
const { rapport, erreurAction, annonceAction, occupee, copie, entete, remplirEntete, generer, copier, modifier, supprimer } = useActionsDEmploiDuTemps({ emploi, retenirEntete })
const { classes, chargerClasses, libelleDeClasse } = useClassesDeLEcole()

chargerClasses()
watch(emploi, (e) => e && remplirEntete(e))
// Une copie ouvre le nouvel emploi du temps sur la MÊME vue (vue-router la réutilise) : un autre id se relit.
// MUTATION F4 : plus de relecture quand l'id change
</script>
