// K3 (D519, D526) : les ACTIONS d'écriture de l'école KLASSCI, jouées PAR L'ÉCRAN, jugées par le journal
// du faux KLASSCI « école » (e2e/faux-klassci-ecole.mjs). Un vert exige que l'écriture soit ARRIVÉE à
// KLASSCI, avec les clés attendues et le bon nombre de notes ; un toast de succès ne suffit pas.
//
// Une seule écriture KLASSCI a un écran : les notes d'une évaluation (« Synchroniser les notes » sur
// /teacher/evaluations, useTeacherEvaluationActions.syncToKlassci). Les présences et le statut d'un cours
// (`POST /cours/{id}/presences`, `PUT /cours/{id}/statut`) n'ont AUCUN appelant front : déclarés « sans
// écran » dans le corps de la PR, jamais joués ici.
import { readFileSync } from 'node:fs'

const BOUTON = 'Synchroniser les notes'
// Le corps envoyé par le back pour chaque note (EvaluationKlassciSyncController, D519 : clés seules).
const CLES_NOTE = ['etudiant_id', 'note', 'commentaire', 'is_absent']

function lignes(journal) {
  try {
    return readFileSync(journal, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  } catch {
    return []
  }
}

/**
 * La synchronisation des notes, par l'écran de l'enseignant.
 * @returns {Promise<object>} une case du parcours (verdict VERT ou ROUGE, et ce qui a été vu)
 */
export async function synchroniserLesNotes(page, jeu, base) {
  const cas = { compte: 'enseignant', role: 'enseignant', chemin: '/teacher/evaluations (action : synchroniser les notes)', attendu: 'ouvert' }
  const refus = jeu.manques?.evaluation ?? jeu.manques?.copie
  if (refus) return { ...cas, verdict: 'ROUGE', defaut: `état non monté par le produit : ${refus}` }
  const attendu = jeu.ecritures?.notes
  if (!attendu) return { ...cas, verdict: 'ROUGE', defaut: 'état non monté : aucune copie remise dans le jeu' }

  const avant = lignes(jeu.journal_klassci).length
  const api = []
  const surReponse = (r) => {
    const u = new URL(r.url())
    if (u.pathname.startsWith('/api/')) api.push({ statut: r.status(), chemin: u.pathname })
  }
  page.on('response', surReponse)
  try {
    await page.goto(`${base}/teacher/evaluations`, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    const bouton = page.getByRole('button', { name: BOUTON })
    if (!(await bouton.count())) {
      const carte = (await page.locator('#app').innerText().catch(() => '')).includes(attendu.titre)
      return { ...cas, verdict: 'ROUGE', api,
        defaut: `bouton « ${BOUTON} » absent (carte de l'évaluation ${carte ? 'affichée' : 'absente'}) : aucune note ne peut partir vers KLASSCI` }
    }
    await bouton.first().click()
    await page.getByRole('button', { name: 'Confirmer' }).click({ timeout: 10000 })
    await page.waitForResponse((r) => r.url().includes('/sync-klassci'), { timeout: 30000 }).catch(() => {})
    await page.waitForTimeout(1000)
  } finally {
    page.off('response', surReponse)
  }

  const envoyees = lignes(jeu.journal_klassci).slice(avant)
    .filter((l) => l.methode === 'POST' && l.chemin === `/evaluations/${attendu.evaluation_klassci}/notes`)
  const vu = envoyees.map((l) => `HTTP ${l.statut}, ${l.nb_notes ?? 0} note(s), clés [${(l.cles_notes ?? []).join(', ')}]`).join(' ; ')
  const defauts = []
  if (envoyees.length !== 1) defauts.push(`${envoyees.length} envoi(s) de notes au journal de KLASSCI, 1 attendu${vu ? ` : ${vu}` : ''}`)
  else {
    const [l] = envoyees
    if (l.statut !== 200) defauts.push(`KLASSCI a rendu HTTP ${l.statut}`)
    if (l.nb_notes !== attendu.nb_notes) defauts.push(`${l.nb_notes ?? 0} note(s) envoyée(s), ${attendu.nb_notes} attendue(s)`)
    const manquantes = CLES_NOTE.filter((k) => !(l.cles_notes ?? []).includes(k))
    if (manquantes.length) defauts.push(`clés absentes d'une note : ${manquantes.join(', ')}`)
  }
  const sync = api.filter((a) => a.chemin.endsWith('/sync-klassci'))
  if (sync.some((a) => a.statut >= 400)) defauts.push(`le LMS a rendu ${sync.map((a) => a.statut).join(', ')} sur sync-klassci`)
  return { ...cas, verdict: defauts.length ? 'ROUGE' : 'VERT', defaut: defauts.join(' ; ') || `vu au journal de KLASSCI : ${vu}`, api }
}
