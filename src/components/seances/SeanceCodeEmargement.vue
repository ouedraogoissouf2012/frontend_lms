<template>
  <section class="code-emargement" aria-labelledby="code-emargement-titre">
    <h3 id="code-emargement-titre" class="code-titre">Code d’émargement</h3>

    <div class="code-generer">
      <label class="code-champ">
        Valable
        <select v-model.number="duree" name="duree-code" class="form-input">
          <option v-for="d in DUREES_DE_CODE" :key="d.minutes" :value="d.minutes">{{ d.libelle }}</option>
        </select>
      </label>
      <label class="code-champ">
        En retard après (minutes, facultatif)
        <input v-model="retard" name="retard-code" type="number" min="0" max="240" class="form-input" placeholder="—">
      </label>
      <button type="button" class="btn-primary" :disabled="envoi" @click="generer">Générer un code</button>
    </div>

    <div v-if="codeAffiche" class="code-affiche" role="status">
      <img :src="codeAffiche.qr" alt="QR du code d’émargement" class="code-qr">
      <div>
        <p class="code-clair">{{ codeAffiche.code }}</p>
        <p class="code-aide">À dicter ou à scanner. Il ne sera plus affiché après la fermeture de cette fenêtre.</p>
      </div>
    </div>

    <ul v-if="codes.length" class="code-liste">
      <li v-for="c in codes" :key="c.id" class="code-ligne">
        <span>{{ etatDuCode(c) }}</span>
        <span>{{ c.signatures }} / {{ c.attendus }} signatures ({{ c.taux }} %)</span>
        <button v-if="c.valable" type="button" class="btn-secondary" :disabled="envoi" @click="revoquer(c.id)">Révoquer</button>
      </li>
    </ul>

    <div v-if="erreur" class="form-error" role="alert">{{ erreur }}</div>
  </section>
</template>

<script setup>
/**
 * Le code d'émargement d'une séance (lms_backend#1680, #335), dans la fenêtre « Faire l'appel » : même capacité que
 * l'appel (`can_take_attendance`), aucune lecture du mode. Générer, montrer le code et son QR UNE fois, lister les
 * codes et leurs statistiques, révoquer. Les signatures arrivent dans l'appel comme marques d'origine « code ».
 * Logique dans `useCodesEmargement`.
 */
import { onMounted, toRef } from 'vue'
import { DUREES_DE_CODE, useCodesEmargement } from '@/composables/useCodesEmargement'

const props = defineProps({
  seance: { type: Object, required: true },
})

const { codes, codeAffiche, duree, retard, envoi, erreur, charger, generer, revoquer } = useCodesEmargement(toRef(props, 'seance'))

const HEURE = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

function etatDuCode(c) {
  if (c.revoque_le) return 'Révoqué'
  return c.valable ? `Valable jusqu’à ${HEURE.format(new Date(c.expire_le))}` : 'Expiré'
}

onMounted(charger)
</script>

<style scoped>
.code-emargement {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.code-titre {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--text-primary);
}

.code-generer {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}

.code-champ {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.code-affiche {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 1rem;
}

.code-qr {
  width: 10rem;
  height: 10rem;
  image-rendering: pixelated;
  background: var(--white);
}

.code-clair {
  margin: 0;
  font-family: monospace;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--text-primary);
}

.code-aide {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.code-liste {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.code-ligne {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.4rem 0;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.btn-primary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--primary-color);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.form-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-error {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-danger);
}
</style>
