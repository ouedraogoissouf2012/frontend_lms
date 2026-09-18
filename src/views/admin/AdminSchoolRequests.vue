<template>
  <DashboardLayout>
    <div class="admin-institutions-container">
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Demandes d'ouverture</h1>
          <p class="page-subtitle">Valider ou refuser une école autonome</p>
        </div>
        <button type="button" class="refresh-btn" :disabled="loading" @click="load()">
          Actualiser
        </button>
      </div>

      <p v-if="error" class="error-banner" role="alert">{{ error }}</p>

      <div v-if="lienActivation" class="lien-box" role="status">
        <p>{{ messageValidation }}</p>
        <p class="lien-warn">Ce lien ne sera plus affiché. Copiez-le maintenant.</p>
        <input ref="champLien" :value="lienActivation" readonly class="lien-input">
        <button type="button" class="refresh-btn" @click="copier">Copier le lien</button>
        <button type="button" class="refresh-btn" @click="fermerLien">J'ai transmis le lien</button>
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

          <button
            type="button"
            class="refresh-btn"
            :disabled="actingId === d.id"
            @click="valider(d.id, slugs[d.id])"
          >
            Valider
          </button>

          <label :for="'motif-' + d.id">Motif du refus</label>
          <textarea :id="'motif-' + d.id" v-model="motifs[d.id]" minlength="10" rows="3" class="lien-input" />
          <button
            type="button"
            class="refresh-btn"
            :disabled="actingId === d.id"
            @click="refuser(d.id, motifs[d.id])"
          >
            Refuser
          </button>
        </article>
      </div>

      <p v-if="lastPage > 1">
        <button type="button" class="refresh-btn" :disabled="page <= 1" @click="load(page - 1)">Précédent</button>
        Page {{ page }} / {{ lastPage }}
        <button type="button" class="refresh-btn" :disabled="page >= lastPage" @click="load(page + 1)">Suivant</button>
      </p>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { toast } from '@/composables/useToast'
import { useAdminSchoolRequests } from '@/composables/useAdminSchoolRequests'

const slugs = reactive({})
const motifs = reactive({})
const champLien = ref(null)

const {
  demandes, loading, error, page, lastPage, actingId,
  lienActivation, messageValidation,
  load, valider, refuser, fermerLien,
} = useAdminSchoolRequests()

watch(demandes, (list) => {
  for (const d of list) {
    if (slugs[d.id] === undefined) slugs[d.id] = d.slug_souhaite || ''
  }
}, { immediate: true })

onMounted(() => {
  load()
})

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
  if (!lienActivation.value) return

  if (await ecrireDansLePressePapier(lienActivation.value) || copierParSelection()) {
    toast.success('Lien copié. Transmettez-le maintenant : il ne sera plus affiché.')

    return
  }

  // Les deux chemins ont échoué, mais la sélection posée par `copierParSelection`
  // demeure : il ne reste qu'une touche à presser.
  toast.warning('Copie automatique impossible. Le lien est sélectionné : faites Ctrl+C.')
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
 * @returns {boolean}
 */
function copierParSelection() {
  const champ = champLien.value
  if (!champ) return false

  champ.focus()
  champ.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
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
