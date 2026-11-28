<template>
  <section class="edt-carte" aria-labelledby="rapport-titre" data-rapport>
    <h3 id="rapport-titre">Génération des séances</h3>
    <p class="edt-annonce">{{ compte(rapport.creees, 'séance créée', 'séances créées') }}.</p>
    <template v-if="rapport.ignorees.length">
      <p class="edt-aide">{{ compte(rapport.ignorees.length, 'séance n’a pas été créée', 'séances n’ont pas été créées') }} :</p>
      <ul>
        <li v-for="(i, n) in rapport.ignorees" :key="`${i.date}-${i.ligne_id}-${n}`" data-ignoree>
          le {{ jourFr(i.date) }} : {{ motifIgnoree(i.motif) }}
          <template v-if="i.conflits?.length">
            —
            <RouterLink v-for="id in i.conflits" :key="id" :to="`/seances/${id}`">voir la séance en conflit</RouterLink>
          </template>
        </li>
      </ul>
      <p class="edt-aide">Une séance en conflit n’est jamais forcée : déplacez le créneau ou la séance, puis générez de nouveau.</p>
    </template>
  </section>
</template>

<script setup>
/** #676 — le rapport du serveur après « Générer les séances » : créées, et chaque séance ignorée avec son motif. */
import { compte, jourFr, motifIgnoree } from '@/utils/emploiDuTemps'

defineProps({
  rapport: { type: Object, required: true },
})
</script>
