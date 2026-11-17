// Test de capacité de la visio (lms_backend#1232) : le DIAGNOSTIC de la capture locale, pur et testé.
//
// Essai 3 : les participants entrent, l'ICE s'établit, mais aucune piste locale n'existe (rien ne part). Ce module
// tranche entre les causes au lieu de les supposer : un getUserMedia direct dans la page (réussi alors que Jitsi n'a
// aucune piste : la faute est à Jitsi ; en échec : au navigateur), le navigateur lancé, et l'état de l'application
// (pistes, coupures). Il garde aussi, du journal de la page, ce qui parle de la capture, sans jamais y laisser un
// jeton : l'artefact du run est lisible par tout compte qui voit le dépôt.

export const MOTIF_CAPTURE = /getUserMedia|NotAllowedError|NotFoundError|NotReadableError|OverconstrainedError|permission|createLocalTracks|local track|device|unsupported|camera|microphone/i
export const MESSAGES_MAX = 20
export const LONGUEUR_MAX = 200

/** Le texte sans aucun jeton : chaque jeton connu, puis tout paramètre jwt=, devient ***. */
export function masquer(texte, jetons) {
  let t = String(texte)
  for (const j of jetons) if (j) t = t.split(j).join('***')
  return t.replace(/jwt=[^&#\s"']+/gi, 'jwt=***')
}

/** Ajoute au journal un message de la page s'il parle de la capture : masqué AVANT d'être tronqué, plafonné. */
export function noterConsole(journal, type, texte, jetons) {
  if (journal.length >= MESSAGES_MAX) return journal
  if (type !== 'error' && type !== 'warning' && type !== 'pageerror') return journal
  if (!MOTIF_CAPTURE.test(String(texte))) return journal
  journal.push(`${type} : ${masquer(String(texte).slice(0, LONGUEUR_MAX), jetons)}`)
  return journal
}

const liste = (xs, rendu) => (Array.isArray(xs) ? (xs.length ? xs.map(rendu).join(', ') : 'aucune') : '—')

/** Les lignes du diagnostic, par participant : le getUserMedia direct, l'état de l'application, le journal. */
export function diagnosticsCapture(runners) {
  const lignes = []
  for (const r of runners) {
    const premier = r.participants.find((p) => p.capture)?.capture
    lignes.push(`- runner ${r.runner} : navigateur ${r.navigateur ?? '—'} ; agent ${premier?.userAgent ?? '—'}`)
  }
  for (const p of runners.flatMap((r) => r.participants).sort((a, b) => a.numero - b.numero)) {
    const c = p.capture
    const gum = !c?.gum ? '—'
      : c.gum.ok ? `obtenu (${liste(c.gum.pistes, (t) => `${t.kind} « ${t.label} »`)})`
        : `refusé (${c.gum.nom} : ${c.gum.message})`
    const redux = [...p.echantillons].reverse().find((e) => e.redux)?.redux
    const media = redux?.media
    lignes.push(`- participant ${p.numero} (${p.role}) : getUserMedia direct ${gum} ; `
      + `périphériques ${liste(c?.peripheriques, (k) => k)} ; `
      + `pistes de l’application ${liste(redux?.pistes, (t) => `${t.type}${t.muette ? ' (muette)' : ''}`)} ; `
      + `coupure audio ${media?.audioCoupe ?? '—'}, vidéo ${media?.videoCoupe ?? '—'}`)
    for (const m of p.journalCapture ?? []) lignes.push(`  - ${m}`)
  }
  return lignes.length ? lignes : ['- aucun relevé']
}
