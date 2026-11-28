<template>
  <form class="transfert" novalidate @submit.prevent="transferer">
    <h3>Transférer un élève vers une autre classe</h3>
    <!-- Régions présentes dès le montage : une région ajoutée plus tard n'est pas annoncée. -->
    <p class="transfert-erreur" role="alert">{{ erreur }}</p>
    <p class="transfert-annonce" role="status" aria-live="polite">{{ annonce }}</p>

    <div class="transfert-champ">
      <label :for="id('eleve')">Élève</label>
      <select :id="id('eleve')" v-model="eleve" data-champ="eleve">
        <option value="">Choisissez un élève</option>
        <option v-for="e in etudiants" :key="e.id" :value="String(e.id)">{{ getFullName(e) || e.email }}</option>
      </select>
    </div>

    <div class="transfert-champ">
      <label :for="id('cible')">Nouvelle classe</label>
      <select
        :id="id('cible')"
        v-model="cible"
        data-champ="cible"
        :aria-invalid="erreurCible ? 'true' : 'false'"
        :aria-describedby="`${id('cible')}-erreur`"
      >
        <option value="">Choisissez une classe</option>
        <option v-for="c in cibles" :key="c.id" :value="String(c.id)">{{ c.libelle }}</option>
      </select>
      <p :id="`${id('cible')}-erreur`" class="transfert-champ-erreur">{{ erreurCible }}</p>
    </div>

    <!-- aria-disabled, pas disabled : le bouton cliqué garde le focus clavier. -->
    <button type="submit" class="transfert-btn" :aria-disabled="occupe ? 'true' : 'false'">Transférer</button>
  </form>
</template>

<script setup>
/**
 * Transférer un élève de cette classe vers une autre classe de l'école (#659, lms_backend#1652). La logique vit dans
 * useTransfertDEleve. Émet `transfere` (la fiche est relue) et `incertaine` (relue aussi).
 */
import { onMounted, useId } from 'vue'
import { useTransfertDEleve } from '@/composables/useTransfertDEleve'
import { getFullName } from '@/utils/formatters'

const props = defineProps({
  classeId: { type: Number, required: true },
  // Les élèves ACTIFS de la classe, tels que la fiche les lit (`etudiants`).
  etudiants: { type: Array, default: () => [] },
})

const emit = defineEmits(['transfere', 'incertaine'])

const base = `transfert-${useId().replace(/[^\w-]/g, '-')}`
const id = (nom) => `${base}-${nom}`

const { cibles, eleve, cible, erreur, erreurCible, annonce, occupe, charger, transferer } = useTransfertDEleve({
  classeId: () => props.classeId,
  onTransfere: () => emit('transfere'),
  onIncertaine: () => emit('incertaine'),
})

onMounted(charger)
</script>

<style scoped>
.transfert {
  display: grid;
  gap: var(--spacing-sm);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.transfert h3 {
  margin: 0;
  color: var(--text-primary);
}

.transfert-erreur,
.transfert-annonce,
.transfert-champ-erreur {
  margin: 0;
}

.transfert-erreur,
.transfert-champ-erreur {
  color: var(--color-danger, var(--text-primary));
}

.transfert-annonce {
  color: var(--text-primary);
}

.transfert-champ {
  display: grid;
  gap: var(--spacing-sm);
}

.transfert-champ label {
  font-weight: 600;
  color: var(--text-primary);
}

.transfert-champ select {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.transfert-btn {
  justify-self: start;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-danger, var(--border-primary));
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.transfert-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
