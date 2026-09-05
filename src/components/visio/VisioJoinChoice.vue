<template>
  <div class="mode-choix" role="dialog" aria-labelledby="mode-choix-titre">
    <div class="mode-choix__carte">
      <h2 id="mode-choix-titre" class="mode-choix__titre">Comment souhaitez-vous suivre&nbsp;?</h2>
      <p class="mode-choix__sous-titre">
        Vous pouvez changer d'avis&nbsp;: ce choix sera retenu pour vos prochains cours.
      </p>

      <ul class="mode-choix__liste">
        <li v-for="option in options" :key="option.mode">
          <button
            type="button"
            class="mode-choix__option"
            :class="{ 'mode-choix__option--actif': option.mode === profil.choisi.value }"
            :aria-pressed="option.mode === profil.choisi.value"
            @click="profil.choisir(option.mode)"
          >
            <span class="mode-choix__nom">
              {{ option.nom }}
              <span v-if="option.mode === profil.suggere.value" class="mode-choix__badge">
                conseillé pour votre connexion
              </span>
            </span>
            <span class="mode-choix__detail">{{ option.detail }}</span>
            <span class="mode-choix__cout">{{ formaterCout(option.mo) }}</span>
          </button>
        </li>
      </ul>

      <p class="mode-choix__note">
        Estimation de la <strong>vidéo reçue</strong> uniquement, calculée depuis les paliers publiés
        par Jitsi. L'audio s'y ajoute&nbsp;; il n'est pas compté ici faute de chiffre officiel.
      </p>

      <div class="mode-choix__actions">
        <BaseButton variant="secondary" @click="$emit('annuler')">Ne pas rejoindre</BaseButton>
        <BaseButton variant="primary" @click="$emit('rejoindre', profil.choisi.value)">
          Rejoindre le cours
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useNetworkProfile } from '@/composables/useNetworkProfile'
import { VISIO_MODES, megaoctetsParHeure } from '@/constants/visioNetwork'

/**
 * Choix du mode reseau AVANT l'entree en salle (#328).
 *
 * ## Pourquoi cet ecran existe
 *
 * #327 a desactive le pre-join natif de Jitsi. C'etait le SEUL endroit ou
 * l'apprenant pouvait couper sa camera avant de depenser sa data. Le retirer
 * sans le remplacer aurait fait payer le silence a l'utilisateur.
 *
 * ## Pourquoi des megaoctets et pas des francs
 *
 * La seule source de prix disponible est une moyenne 2023 tous forfaits
 * confondus : impropre a un affichage utilisateur. Un apprenant convertit
 * lui-meme des megaoctets en fonction de SON forfait ; il ne peut pas
 * dis-convertir un prix faux.
 *
 * L'ordre de grandeur qui donne son sens a ces nombres : l'UIT mesure une
 * consommation mobile reelle d'environ 2 Go par mois dans les economies a
 * faible revenu, tous usages confondus.
 */
defineEmits(['rejoindre', 'annuler'])

const profil = useNetworkProfile()

const options = computed(() => [
  {
    mode: VISIO_MODES.AUDIO,
    nom: 'Audio seul',
    detail: 'Aucune video recue ni envoyee. Le moins couteux, et le plus sur en cas de coupure.',
    mo: megaoctetsParHeure(VISIO_MODES.AUDIO),
  },
  {
    mode: VISIO_MODES.ECONOME,
    nom: 'Economie de donnees',
    // Honnetete : Jitsi n'offre aucun reglage pour recevoir l'ecran partage en
    // refusant les cameras. On promet UN flux, pas « les diapositives ».
    detail: 'Un seul flux video recu, celui de la personne qui parle ou de l ecran partage.',
    mo: megaoctetsParHeure(VISIO_MODES.ECONOME),
  },
  {
    mode: VISIO_MODES.COMPLET,
    nom: 'Video complete',
    detail: 'Votre camera est active et vous recevez plusieurs flux.',
    mo: megaoctetsParHeure(VISIO_MODES.COMPLET),
  },
])

/** 2 Go = enveloppe mensuelle mediane mesuree par l'UIT sur la cible. */
const ENVELOPPE_MENSUELLE_MO = 2048

function formaterCout(mo) {
  if (mo === 0) return 'Aucune video : 0 Mo/h'
  const part = Math.round((mo / ENVELOPPE_MENSUELLE_MO) * 100)
  return `environ ${mo} Mo par heure — ${part}% d une enveloppe de 2 Go`
}
</script>

<style scoped>
.mode-choix {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--overlay-bg, rgba(0, 0, 0, 0.6));
}

.mode-choix__carte {
  width: 100%;
  max-width: 32rem;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  border-radius: 10px;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.mode-choix__titre {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
}

.mode-choix__sous-titre {
  margin: 0 0 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.mode-choix__liste {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mode-choix__option {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  color: inherit;
}

.mode-choix__option--actif {
  border-color: var(--color-primary);
}

.mode-choix__nom {
  font-weight: 600;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.mode-choix__badge {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
  background: var(--color-primary-bg, var(--bg-primary));
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.mode-choix__detail,
.mode-choix__note {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.mode-choix__cout {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.mode-choix__note {
  margin: 0 0 1rem;
}

.mode-choix__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
