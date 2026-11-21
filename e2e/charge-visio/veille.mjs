// Test de capacité de la visio (lms_backend#1232) : la VEILLE, qui ARRÊTE le test si un service du serveur se
// dégrade (accord du user : « arrêt immédiat si un service du serveur se dégrade »).
//
// Toutes les 10 s, elle sonde les points PUBLICS du serveur partagé (le front et l'API du LMS, la page de la visio).
// Une cible est dégradée après 2 échecs de suite, ou 2 latences de suite au-delà de 3 fois sa latence de référence
// (la médiane de ses 3 premières sondes réussies, prises avant la charge). La veille annule alors le run entier : les
// navigateurs meurent, la salle se vide. La superviseure (docker stats) et le user peuvent aussi l'annuler à la main.
//
// Usage : node veille.mjs (env : CIBLES = URL séparées par des virgules, FIN_EPOCH_S, GITHUB_TOKEN,
// GITHUB_REPOSITORY, GITHUB_RUN_ID). La décision est pure et testée ; la boucle n'appelle que des GET publics.

import { pathToFileURL } from 'node:url'

export const SEUIL_SUCCESSIFS = 2
export const FACTEUR_LATENCE = 3

/**
 * La décision sur l'historique d'UNE cible (les sondes dans l'ordre).
 * @param {{ ok: boolean, latenceMs: number|null }[]} historique
 * @returns {{ arreter: boolean, raison: string|null, referenceMs: number|null }}
 */
export function decision(historique) {
  const reussies = historique.filter((s) => s.ok && Number.isFinite(s.latenceMs)).slice(0, 3).map((s) => s.latenceMs)
  const referenceMs = reussies.length === 3 ? [...reussies].sort((a, b) => a - b)[1] : null
  const dernieres = historique.slice(-SEUIL_SUCCESSIFS)
  if (dernieres.length === SEUIL_SUCCESSIFS && dernieres.every((s) => !s.ok)) {
    return { arreter: true, raison: `${SEUIL_SUCCESSIFS} échecs de suite`, referenceMs }
  }
  if (referenceMs !== null && dernieres.length === SEUIL_SUCCESSIFS
    && dernieres.every((s) => s.ok && s.latenceMs > FACTEUR_LATENCE * referenceMs)) {
    return { arreter: true, raison: `${SEUIL_SUCCESSIFS} latences de suite > ${FACTEUR_LATENCE} × ${referenceMs} ms`, referenceMs }
  }
  return { arreter: false, raison: null, referenceMs }
}

async function sonder(url) {
  const debut = Date.now()
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(8000) })
    return { ok: r.status < 500, statut: r.status, latenceMs: Date.now() - debut }
  } catch (e) {
    return { ok: false, statut: null, latenceMs: null, erreur: String(e?.name ?? e) }
  }
}

async function annulerLeRun(raison) {
  const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env
  console.log(`::error::ARRÊT IMMÉDIAT : ${raison}`)
  const r = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
  })
  console.log(`annulation demandée : HTTP ${r.status}`)
}

async function principal() {
  const cibles = String(process.env.CIBLES ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const finEpochS = Number(process.env.FIN_EPOCH_S)
  if (cibles.length === 0 || !Number.isFinite(finEpochS)) throw new Error('CIBLES et FIN_EPOCH_S sont requis')
  const historiques = new Map(cibles.map((c) => [c, []]))
  while (Date.now() / 1000 < finEpochS + 60) {
    for (const cible of cibles) {
      const s = await sonder(cible)
      historiques.get(cible).push(s)
      const d = decision(historiques.get(cible))
      console.log(JSON.stringify({ t: new Date().toISOString(), cible, ...s, reference: d.referenceMs }))
      if (d.arreter) {
        await annulerLeRun(`${cible} : ${d.raison}`)
        return
      }
    }
    await new Promise((r) => setTimeout(r, 10_000))
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((e) => { console.error(e); process.exit(1) })
}
