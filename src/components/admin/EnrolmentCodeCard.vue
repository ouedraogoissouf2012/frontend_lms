<template>
  <article class="code-card">
    <h2>{{ classe.libelle }}</h2>
    <p class="code-etat">{{ libelleEtat }}</p>

    <!-- Le code se DICTE : affiché en clair, sélectionnable, jamais journalisé. Libellé
         VISIBLE (dt) : un aria-label posé sur un <p> est ignoré par les lecteurs d'écran. -->
    <dl v-if="code" class="code-bloc">
      <dt class="code-libelle">Code d'inscription</dt>
      <dd class="code-valeur">{{ code }}</dd>
    </dl>

    <div class="code-actions">
      <button type="button" class="code-btn" :disabled="busy" @click="$emit('emettre')">
        {{ peutRegenerer ? 'Régénérer' : 'Émettre un code' }}
      </button>
      <button v-if="code" type="button" class="code-btn is-danger" :disabled="busy" @click="$emit('retirer')">
        Retirer
      </button>
    </div>
  </article>
</template>

<script setup>
/**
 * Une classe locale et son code d'inscription (#391, ADR-803-03). Présentation pure :
 * reçoit la classe (forme de `GET /classes`), émet `emettre` / `retirer`. « Retirer »
 * n'est proposé que pour un code actif : sans code émis, le serveur répondrait 409 ; un code
 * déjà retiré serait re-retiré sans erreur, ce qui n'aurait pas de sens pour le personnel.
 */
import { computed } from 'vue'

const props = defineProps({
  classe: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})

defineEmits(['emettre', 'retirer'])

const ETATS = Object.freeze({
  actif: 'Code actif',
  retire: 'Code retiré : personne ne peut plus rejoindre avec lui.',
  absent: 'Aucun code émis.',
  // Après un échec sans relecture possible : le code a peut-être changé côté serveur.
  inconnu: 'État du code inconnu : actualisez la liste avant de le dicter.',
})

const etat = computed(() => props.classe.code_inscription?.etat ?? 'absent')
const libelleEtat = computed(() => ETATS[etat.value] ?? ETATS.absent)
const code = computed(() => (etat.value === 'actif' ? props.classe.code_inscription?.valeur ?? null : null))
const peutRegenerer = computed(() => etat.value === 'actif' || etat.value === 'inconnu')
</script>

<style scoped>
.code-card {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.code-etat {
  color: var(--text-secondary);
}

.code-bloc {
  margin: var(--spacing-sm) 0;
}

.code-libelle {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.code-valeur {
  margin-inline-start: 0;
  font-family: monospace;
  font-size: 1.5rem;
  letter-spacing: 0.2em;
  color: var(--text-primary);
  user-select: all;
  margin: var(--spacing-sm) 0;
}

.code-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.code-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.code-btn.is-danger {
  border-color: var(--color-danger, var(--border-primary));
}

.code-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
