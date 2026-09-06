<template>
  <section class="consent" aria-labelledby="consent-titre">
    <h3 id="consent-titre" class="consent__titre">Enregistrement de la séance</h3>
    <p class="consent__politique">{{ politique }}</p>
    <p class="consent__note">
      Refuser est un choix normal : vous suivez le cours, vous n'êtes simplement pas capté.
    </p>
    <ul class="consent__liste">
      <li v-for="finalite in finalites" :key="finalite.key">
        <label class="consent__item">
          <input
            type="checkbox"
            :checked="consent.choix.value[finalite.key]"
            @change="basculer(finalite.key, $event.target.checked)"
          >
          <span>
            <span class="consent__nom">{{ finalite.label }}</span>
            <span class="consent__detail">{{ finalite.detail }}</span>
          </span>
        </label>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { useVisioConsent } from '@/composables/useVisioConsent'
import { VISIO_CAPTURE_POLICY, VISIO_CONSENT_FINALITES } from '@/constants/visioConsent'

const politique = VISIO_CAPTURE_POLICY
const finalites = VISIO_CONSENT_FINALITES
const consent = useVisioConsent()

function basculer(key, accepte) {
  consent.enregistrer({ ...consent.choix.value, [key]: accepte })
}
</script>

<style scoped>
.consent {
  margin: 0 0 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.consent__titre {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}

.consent__politique,
.consent__note,
.consent__detail {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.consent__liste {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.consent__item {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  cursor: pointer;
}

.consent__nom {
  display: block;
  font-weight: 600;
}

.consent__detail {
  display: block;
  margin: 0;
}
</style>
