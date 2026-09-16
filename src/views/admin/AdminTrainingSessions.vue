<template>
  <DashboardLayout>
    <div class="admin-institutions-container">
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Sessions de formation</h1>
          <p class="page-subtitle">Programme, puis période datée. Une période naît brouillon.</p>
        </div>
        <button type="button" class="refresh-btn" :disabled="loading" @click="load()">
          Actualiser
        </button>
      </div>

      <p v-if="error" class="banner" role="alert">{{ error }}</p>
      <p v-if="notice" class="banner" role="status">{{ notice }}</p>

      <form class="card" @submit.prevent="onProgramme">
        <h2>Nouveau programme</h2>
        <label for="titre">Titre</label>
        <input id="titre" v-model="titre" required maxlength="191" class="field">
        <label for="description">Description</label>
        <textarea id="description" v-model="description" maxlength="5000" rows="3" class="field" />
        <button type="submit" class="refresh-btn" :disabled="saving">Créer le programme</button>
        <p v-if="dernierProgrammeId">Programme n° {{ dernierProgrammeId }} — servez-vous-en ci-dessous.</p>
      </form>

      <form class="card" @submit.prevent="onPeriode">
        <h2>Nouvelle période</h2>
        <label for="program_id">N° de programme</label>
        <input id="program_id" v-model="periode.program_id" type="number" min="1" required class="field">
        <label for="libelle">Libellé</label>
        <input id="libelle" v-model="periode.libelle" required maxlength="191" class="field">
        <label for="enrollment_opens_at">Ouverture des inscriptions</label>
        <input id="enrollment_opens_at" v-model="periode.enrollment_opens_at" type="date" class="field">
        <label for="enrollment_closes_at">Fermeture des inscriptions</label>
        <input id="enrollment_closes_at" v-model="periode.enrollment_closes_at" type="date" class="field">
        <label for="starts_on">Début</label>
        <input id="starts_on" v-model="periode.starts_on" type="date" class="field">
        <label for="ends_on">Fin</label>
        <input id="ends_on" v-model="periode.ends_on" type="date" class="field">
        <label for="certificate_available_at">Certificat disponible</label>
        <input id="certificate_available_at" v-model="periode.certificate_available_at" type="date" class="field">
        <label for="tarif">Tarif (unité la plus petite, optionnel)</label>
        <input id="tarif" v-model="periode.tarif" type="number" min="0" step="1" class="field">
        <label for="devise">Devise (3 lettres)</label>
        <input id="devise" v-model="periode.devise" maxlength="3" class="field">
        <button type="submit" class="refresh-btn" :disabled="saving">Créer la période</button>
      </form>

      <ContentLoader v-if="loading" text="Chargement des sessions..." />
      <p v-else-if="periodes.length === 0">Aucune période pour le moment.</p>

      <article v-for="p in periodes" :key="p.id" class="card">
        <h2>{{ p.libelle }}</h2>
        <p>{{ libelleStatut(p.status) }} · {{ libellePhase(p.phase) }}</p>
        <p>Programme n° {{ p.program_id }}</p>
        <p v-if="p.starts_on || p.ends_on">{{ p.starts_on || '—' }} → {{ p.ends_on || '—' }}</p>
      </article>

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
import {
  useAdminTrainingSessions,
  libellePhase,
  libelleStatut,
} from '@/composables/useAdminTrainingSessions'

const titre = ref('')
const description = ref('')
const periode = reactive({
  program_id: '',
  libelle: '',
  enrollment_opens_at: '',
  enrollment_closes_at: '',
  starts_on: '',
  ends_on: '',
  certificate_available_at: '',
  tarif: '',
  devise: '',
})

const {
  periodes, loading, error, notice, page, lastPage,
  dernierProgrammeId, saving,
  load, creerProgramme, creerPeriode,
} = useAdminTrainingSessions()

watch(dernierProgrammeId, (id) => {
  if (id && !periode.program_id) periode.program_id = String(id)
})

onMounted(() => {
  load()
})

async function onProgramme() {
  const ok = await creerProgramme(titre.value, description.value)
  if (ok) {
    titre.value = ''
    description.value = ''
  }
}

async function onPeriode() {
  const payload = {
    program_id: Number(periode.program_id),
    libelle: periode.libelle,
    enrollment_opens_at: periode.enrollment_opens_at,
    enrollment_closes_at: periode.enrollment_closes_at,
    starts_on: periode.starts_on,
    ends_on: periode.ends_on,
    certificate_available_at: periode.certificate_available_at,
  }
  if (periode.tarif !== '') payload.tarif = Number(periode.tarif)
  if (periode.devise) payload.devise = periode.devise
  const ok = await creerPeriode(payload)
  if (ok) {
    periode.libelle = ''
    periode.enrollment_opens_at = ''
    periode.enrollment_closes_at = ''
    periode.starts_on = ''
    periode.ends_on = ''
    periode.certificate_available_at = ''
    periode.tarif = ''
    periode.devise = ''
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

.banner,
.card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.field {
  display: block;
  width: 100%;
  margin: var(--spacing-sm) 0 var(--spacing-md);
  padding: var(--spacing-sm);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
</style>
