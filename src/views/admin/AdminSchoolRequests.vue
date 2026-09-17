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
 * Copie le lien d'activation, et le DIT — dans les deux cas (#410).
 *
 * Ce bouton porte un secret affiché une seule fois, jamais réaffiché, et qui ne
 * peut pas être réémis : `ActivationTokenService::emettre()` n'est appelé qu'à
 * la validation, et le back refuse de rejouer une demande déjà tranchée
 * (`SchoolRequestDecisionService:195`). C'est le pire endroit du produit pour un
 * échec muet — or la version précédente se taisait trois fois : aucune
 * confirmation de succès, un garde qui ne faisait RIEN quand le presse-papier
 * était absent, et un `await` non gardé dont le rejet partait en silence.
 *
 * Le repli ne demande pas à l'utilisateur de se débrouiller : il SÉLECTIONNE le
 * champ. Un Ctrl+C fonctionne alors sans aucune permission.
 */
async function copier() {
  if (!lienActivation.value) return

  if (await ecrireDansLePressePapier(lienActivation.value)) {
    toast.success('Lien copié. Transmettez-le maintenant : il ne sera plus affiché.')

    return
  }

  selectionnerLeLien()
  toast.warning('Copie automatique impossible. Le lien est sélectionné : faites Ctrl+C.')
}

/**
 * Répond « est-ce copié ? » — et rien d'autre. Deux échecs, une seule réponse :
 * `navigator.clipboard` est absent hors contexte sécurisé (origine `http://`,
 * adresse IP), et `writeText` REJETTE quand la permission est refusée ou que le
 * document n'a pas le focus. L'appelant décide quoi dire ; ici on ne décide que
 * du fait.
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

/** Repli qui MARCHE : le champ est en lecture seule, le sélectionner suffit. */
function selectionnerLeLien() {
  const champ = champLien.value
  if (!champ) return

  champ.focus()
  champ.select()
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
