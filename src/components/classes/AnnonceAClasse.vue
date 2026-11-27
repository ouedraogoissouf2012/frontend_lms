<template>
  <form class="annonce-form" novalidate @submit.prevent="envoyer">
    <h3>Annoncer à la classe</h3>
    <p class="annonce-aide">
      Chaque élève inscrit dans la classe reçoit l’annonce dans ses notifications, et par courriel si l’établissement en
      envoie.
    </p>
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="annonce-erreur" role="alert">{{ erreur }}</p>
    <p class="annonce-statut" role="status" aria-live="polite">{{ annonce }}</p>

    <div class="annonce-champ">
      <label :for="id('titre')">Titre</label>
      <input
        :id="id('titre')"
        v-model="saisie.titre"
        data-champ="titre"
        type="text"
        maxlength="150"
        aria-required="true"
        :aria-invalid="erreurs.titre ? 'true' : 'false'"
        :aria-describedby="`${id('titre')}-erreur`"
      >
      <p :id="`${id('titre')}-erreur`" class="annonce-champ-erreur">{{ erreurs.titre }}</p>
    </div>

    <div class="annonce-champ">
      <label :for="id('message')">Message</label>
      <textarea
        :id="id('message')"
        v-model="saisie.message"
        data-champ="message"
        rows="5"
        maxlength="2000"
        aria-required="true"
        :aria-invalid="erreurs.message ? 'true' : 'false'"
        :aria-describedby="`${id('message')}-aide ${id('message')}-erreur`"
      ></textarea>
      <p :id="`${id('message')}-aide`" class="annonce-aide">2 000 caractères au plus.</p>
      <p :id="`${id('message')}-erreur`" class="annonce-champ-erreur">{{ erreurs.message }}</p>
    </div>

    <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
    <button type="submit" class="annonce-btn" :aria-disabled="occupe ? 'true' : 'false'">Envoyer l’annonce</button>
  </form>
</template>

<script setup>
/**
 * L'onglet « Annonce » de la fiche de classe (#690) : le personnel de l'école annonce à toute la classe,
 * `POST /annonces` (lms#1650). `classeId` est l'id de l'ESPACE SOURCE de l'école (`idEspaceSource` de la fiche) ; le
 * serveur juge si l'acteur peut annoncer à CETTE classe (un enseignant, à ses seules classes). La logique vit dans
 * `useAnnonce`. Émet `envoyee` (l'annonce relue du serveur).
 */
import { toRef, useId } from 'vue'
import { useAnnonce } from '@/composables/useAnnonce'

const props = defineProps({ classeId: { type: Number, required: true } })
const emit = defineEmits(['envoyee'])

const { saisie, erreurs, erreur, annonce, occupe, envoyer } = useAnnonce({
  classeId: toRef(props, 'classeId'),
  onEnvoyee: (envoyee) => emit('envoyee', envoyee),
})

// Un id utilisable en sélecteur CSS, quel que soit le préfixe de useId.
const base = `annonce-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`
</script>

<style scoped>
.annonce-form {
  display: grid;
  gap: var(--spacing-sm);
  max-width: 48rem;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.annonce-form h3 {
  margin: 0;
  color: var(--text-primary);
}

.annonce-aide,
.annonce-erreur,
.annonce-statut,
.annonce-champ-erreur {
  margin: 0;
}

.annonce-aide {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.annonce-erreur,
.annonce-champ-erreur {
  color: var(--color-danger, var(--text-primary));
}

.annonce-statut {
  color: var(--text-primary);
}

.annonce-champ {
  display: grid;
  gap: var(--spacing-sm);
}

.annonce-champ label {
  font-weight: 600;
  color: var(--text-primary);
}

.annonce-champ input,
.annonce-champ textarea {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font: inherit;
}

.annonce-btn {
  justify-self: start;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.annonce-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
