<template>
  <div class="settings-section">
    <div class="section-header">
      <h2 class="section-title">Consentement visio</h2>
    </div>
    <div class="section-body">
      <p class="consent-settings__note">
        Vous pouvez retirer chaque autorisation à tout moment, y compris hors séance.
      </p>
      <ul class="consent-settings__liste">
        <li v-for="finalite in finalites" :key="finalite.key" class="consent-settings__ligne">
          <span>
            <strong>{{ finalite.label }}</strong>
            — {{ consent.choix.value[finalite.key] ? 'accepté' : 'refusé' }}
          </span>
          <BaseButton
            v-if="consent.choix.value[finalite.key]"
            variant="secondary"
            @click="consent.revoquer(finalite.key)"
          >
            Retirer
          </BaseButton>
        </li>
      </ul>
      <BaseButton variant="secondary" @click="consent.revoquerTout">
        Tout retirer
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
import { useVisioConsent } from '@/composables/useVisioConsent'
import { VISIO_CONSENT_FINALITES } from '@/constants/visioConsent'

const finalites = VISIO_CONSENT_FINALITES
const consent = useVisioConsent()
</script>

<style scoped>
.consent-settings__note {
  margin: 0 0 0.75rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.consent-settings__liste {
  list-style: none;
  margin: 0 0 0.75rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.consent-settings__ligne {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}
</style>
