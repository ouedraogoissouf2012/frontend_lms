<template>
  <DashboardLayout>
    <div class="admin-institutions-container">
      <div class="header-section">
        <div class="header-content">
          <h1 ref="titre" class="page-title" tabindex="-1">Demandes d'ouverture</h1>
          <p class="page-subtitle">Valider ou refuser une école autonome</p>
        </div>
        <button type="button" class="refresh-btn" :aria-disabled="peutRecharger ? 'false' : 'true'" @click="peutRecharger && load()">
          Actualiser
        </button>
      </div>

      <!-- Région présente DÈS le montage et jamais masquée : seule la présentation suit l'erreur. -->
      <p class="annonce" :class="{ 'error-banner': error }" role="alert">{{ error }}</p>

      <!-- L'annonce vit dans une région présente DÈS le montage et jamais masquée ; la
           boîte du lien, elle, n'existe qu'avec un lien (des contrôles n'ont rien à faire
           dans une région annoncée). -->
      <div class="lien-zone" :class="{ 'lien-box': lienActivation }">
        <p class="annonce" role="status" aria-live="polite">{{ messageValidation }}</p>
        <p v-if="motifRetenue === 'validation'" id="raison-en-vol" class="lien-raison">
          Une validation est en cours : attendez son lien d'activation avant d'en valider une autre.
        </p>
        <template v-if="lienActivation">
          <p id="lien-avertissement" class="lien-warn">Ce lien ne sera plus affiché. Copiez-le maintenant.</p>
          <input
            ref="champLien"
            :value="lienActivation"
            readonly
            class="lien-input"
            aria-label="Lien d'activation"
            aria-describedby="lien-avertissement"
          >
          <button type="button" class="refresh-btn" @click="copier">Copier le lien</button>
          <button type="button" class="refresh-btn" @click="onTransmis">J'ai transmis le lien</button>
          <p id="raison-validation" class="lien-raison">
            Les autres demandes ne peuvent pas être validées tant que ce lien n'est pas marqué
            transmis : valider l'effacerait, et il ne peut pas être réémis.
          </p>
        </template>
      </div>

      <ContentLoader v-if="loading" text="Chargement des demandes..." />

      <p v-else-if="demandes.length === 0 && !lienActivation">Aucune demande en attente.</p>

      <div v-else class="table-wrap">
        <article v-for="d in demandes" :key="d.id" class="demande">
          <h2>{{ d.nom_ecole }}</h2>
          <p>{{ d.nom_demandeur }} — {{ d.email_demandeur }}</p>
          <p v-if="d.telephone_demandeur">{{ d.telephone_demandeur }}</p>
          <p>{{ d.usage_prevu }}</p>
          <p class="meta">{{ d.created_at }} · souhait : {{ d.slug_souhaite || '—' }}</p>

          <label :for="'slug-' + d.id">Slug à l'ouverture</label>
          <input :id="'slug-' + d.id" v-model="slugs[d.id]" class="lien-input">

          <!-- aria-disabled, pas disabled : le bouton garde le focus clavier, et la raison
               du refus est lue avec lui. -->
          <button
            type="button"
            class="refresh-btn"
            :aria-disabled="peutValider(d.id) ? 'false' : 'true'"
            :aria-describedby="peutValider(d.id) ? undefined : idRaisonValidation"
            @click="onValider(d)"
          >
            Valider
          </button>

          <label :for="'motif-' + d.id">Motif du refus</label>
          <textarea :id="'motif-' + d.id" v-model="motifs[d.id]" minlength="10" rows="3" class="lien-input" />
          <button
            type="button"
            class="refresh-btn"
            :aria-disabled="peutRefuser(d.id) ? 'false' : 'true'"
            @click="onRefuser(d)"
          >
            Refuser
          </button>
        </article>
      </div>

      <p v-if="lastPage > 1">
        <button type="button" class="refresh-btn" :aria-disabled="peutRecharger && page > 1 ? 'false' : 'true'" @click="peutRecharger && page > 1 && load(page - 1)">Précédent</button>
        Page {{ page }} / {{ lastPage }}
        <button type="button" class="refresh-btn" :aria-disabled="peutRecharger && page < lastPage ? 'false' : 'true'" @click="peutRecharger && page < lastPage && load(page + 1)">Suivant</button>
      </p>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { toast } from '@/composables/useToast'
import { useAdminSchoolRequests } from '@/composables/useAdminSchoolRequests'
import { useGardeLienAffiche } from '@/composables/useGardeLienAffiche'

const slugs = reactive({})
const motifs = reactive({})
const champLien = ref(null)
const titre = ref(null)

const {
  demandes, loading, error, page, lastPage, peutValider, peutRefuser, motifRetenue,
  lienActivation, messageValidation,
  load, valider, refuser, fermerLien,
} = useAdminSchoolRequests()

// C1 : quitter l'écran ou recharger ne détruit plus le lien en silence.
useGardeLienAffiche(motifRetenue)

/** Une seule source pour la raison lue avec un « Valider » refusé : le motif du composable. */
const idRaisonValidation = computed(() => ({ lien: 'raison-validation', validation: 'raison-en-vol' })[motifRetenue.value])
// Remarque 6 : pas de relecture de la liste pendant une validation en vol.
const peutRecharger = computed(() => !loading.value && motifRetenue.value !== 'validation')

watch(demandes, (list) => {
  for (const d of list) {
    if (slugs[d.id] === undefined) slugs[d.id] = d.slug_souhaite || ''
  }
}, { immediate: true })

onMounted(() => {
  load()
})

/*
 * Focus (D17) : le bouton cliqué disparaît à chaque issue (la carte quitte la liste, la
 * boîte du lien se ferme). Le focus va là où l'action continue, jamais sur <body>.
 */
async function onValider(d) {
  if (!peutValider(d.id)) return
  if (await valider(d.id, slugs[d.id])) {
    await nextTick()
    champLien.value?.focus()
  }
}

async function onRefuser(d) {
  if (!peutRefuser(d.id)) return
  if (await refuser(d.id, motifs[d.id])) {
    await nextTick()
    titre.value?.focus()
  }
}

async function onTransmis() {
  fermerLien()
  await nextTick()
  titre.value?.focus()
}

/**
 * Copie le lien d'activation, et le DIT — dans tous les cas (#410).
 *
 * Ce bouton porte un secret affiché une seule fois, jamais réaffiché, et qui ne
 * peut pas être réémis : `ActivationTokenService::emettre()` n'est appelé qu'à
 * la validation, et le back refuse de rejouer une demande déjà tranchée
 * (`SchoolRequestDecisionService:195`). C'est le pire endroit du produit pour un
 * échec muet — or la version précédente se taisait trois fois : aucune
 * confirmation de succès, un garde qui ne faisait RIEN quand le presse-papier
 * était absent, et un `await` non gardé dont le rejet partait en silence.
 *
 * DEUX chemins de copie, parce qu'un seul ne couvre pas le cas qui nous occupe.
 * Le second n'est pas une consigne donnée à l'utilisateur : il copie vraiment.
 */
async function copier() {
  // Capturé AVANT l'attente : la boîte peut se fermer pendant que le presse-papier répond.
  const lien = lienActivation.value
  if (!lien) return

  const issue = (await ecrireDansLePressePapier(lien)) ? 'copie' : copierParSelection()
  if (issue === 'copie') {
    toast.success('Lien copié. Transmettez-le maintenant : il ne sera plus affiché.')
  } else if (issue === 'selectionne') {
    // La sélection posée par `copierParSelection` demeure : il reste une touche à presser.
    toast.warning('Copie automatique impossible. Le lien est sélectionné : faites Ctrl+C.')
  } else {
    // #418 : le champ a disparu, rien n'est sélectionné. Le dire, sans l'affirmer.
    toast.error("Copie impossible : le lien n'est plus affiché. S'il n'a pas été transmis, il ne peut pas être réaffiché.")
  }
}

/**
 * Chemin moderne. Répond « est-ce copié ? » — et rien d'autre.
 *
 * Deux échecs y convergent : `navigator.clipboard` est absent hors contexte
 * sécurisé (origine `http://`, adresse IP), et `writeText` REJETTE quand la
 * permission est refusée ou que le document n'a pas le focus.
 *
 * @param {string} texte
 * @returns {Promise<boolean>}
 */
async function ecrireDansLePressePapier(texte) {
  if (!navigator.clipboard) return false

  try {
    await navigator.clipboard.writeText(texte)

    return true
  } catch {
    return false
  }
}

/**
 * Chemin de repli : sélectionner le champ, puis `execCommand('copy')`.
 *
 * `execCommand` est déprécié, mais c'est la SEULE voie qui copie encore là où
 * `navigator.clipboard` n'existe pas — et ce cas est réel, pas théorique.
 * MESURÉ dans un Chrome réel sur un contexte non sécurisé (`isSecureContext`
 * faux, `navigator.clipboard` indéfini) : `execCommand('copy')` rend `true`, et
 * un Ctrl+V authentique recolle ensuite le lien au caractère près. Ce n'est donc
 * pas un geste symbolique, le texte atteint bien le presse-papier du système.
 *
 * La sélection est posée AVANT la copie et laissée en place : si `execCommand`
 * échoue à son tour, l'utilisateur n'a plus qu'un Ctrl+C à faire. Le champ est
 * en lecture seule, le sélectionner ne risque aucune modification.
 *
 * @returns {'copie' | 'selectionne' | 'absent'} « absent » : le champ n'existe plus, RIEN
 *   n'est sélectionné (#418 : l'écran affirmait le contraire).
 */
function copierParSelection() {
  const champ = champLien.value
  if (!champ) return 'absent'

  champ.focus()
  champ.select()

  try {
    return document.execCommand('copy') ? 'copie' : 'selectionne'
  } catch {
    return 'selectionne'
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

.admin-institutions-container {
  padding: var(--spacing-xl);
  max-width: 52rem;
  margin: 0 auto;
}

.error-banner,
.lien-box,
.demande {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.annonce {
  margin: 0;
}

.lien-raison {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.refresh-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}

.lien-warn {
  color: var(--color-danger-text);
  font-weight: 600;
}

.lien-input {
  width: 100%;
  margin: var(--spacing-sm) 0;
  padding: var(--spacing-sm);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.meta {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}
</style>
