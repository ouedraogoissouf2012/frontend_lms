// Parcours FONCTIONNELS de l'E2E (D-fonctionnels) : le socle commun à toutes les fonctions (leçon, quiz, devoir,
// séance). Une étape est une ACTION par l'interface, puis une RELECTURE (l'API, avec le jeton du compte, ou
// l'écran suivant). Le verdict ne vient QUE de la relecture : un clic sans relecture n'est jamais VERT.
//
// Les verdicts :
//   - VERT : la relecture CONFIRME l'effet de l'action ;
//   - ROUGE : le produit refuse l'action (motif affiché ou statut), ou la relecture la CONTREDIT ;
//   - NON TESTÉ, toujours nommé : une étape requise n'est pas verte, la fonction n'a pas de sujet ici,
//     ou l'OUTIL a échoué (sélecteur, attente). Un échec de l'outil n'est jamais compté comme un défaut du produit.

export const VERDICTS = Object.freeze(['VERT', 'ROUGE', 'NON TESTÉ'])

const message = (e) => String(e?.message ?? e).split('\n')[0].slice(0, 200)

/**
 * Le moteur d'une fonction, pour une école.
 * @param {{ ecole: string, fonction: string }} contexte
 */
export function moteurFonctionnel({ ecole, fonction }) {
  const cases = []
  const verdicts = new Map()

  /**
   * Joue une étape et range sa case.
   * @param {{ cle: string, compte: string, libelle: string, requiert?: string[], page?: object,
   *   action: Function, relecture: Function }} etape
   *   - `action()` rend `{}` (fait), `{ rouge }` (refusé par le produit) ou `{ nonTeste }` ;
   *   - `relecture()` rend `{ confirme: true, preuve }` ou `{ confirme: false, ecart }`.
   */
  async function etape({ cle, compte, libelle, requiert = [], page, action, relecture }) {
    if (typeof relecture !== 'function') throw new Error(`étape « ${cle} » sans relecture : elle ne serait jamais jugée`)
    for (const r of requiert) if (!verdicts.has(r)) throw new Error(`étape « ${cle} » : l'étape requise « ${r} » n'a pas été jouée avant`)
    const cas = { ecole, fonction, etape: cle, compte, libelle }
    const ranger = (verdict, champs) => {
      const c = { ...cas, verdict, ...champs }
      cases.push(c)
      verdicts.set(cle, verdict)
      return c
    }

    const bloquante = requiert.find((r) => verdicts.get(r) !== 'VERT')
    if (bloquante) return ranger('NON TESTÉ', { defaut: `étape requise « ${bloquante} » non verte (${verdicts.get(bloquante)}) : la chaîne de l'objet s'arrête` })

    const api = []
    const surReponse = (r) => {
      const u = new URL(r.url())
      if (u.pathname.startsWith('/api/')) api.push({ statut: r.status(), methode: r.request().method(), chemin: u.pathname })
    }
    page?.on('response', surReponse)
    let fait
    try {
      fait = (await action()) ?? {}
    } catch (e) {
      return ranger('NON TESTÉ', { defaut: `échec de l'outil pendant l'action (sélecteur ou attente) : ${message(e)}`, api })
    } finally {
      page?.off('response', surReponse)
    }
    if (fait.rouge) return ranger('ROUGE', { defaut: fait.rouge, api })
    if (fait.nonTeste) return ranger('NON TESTÉ', { defaut: fait.nonTeste, api })

    let relu
    try {
      relu = await relecture()
    } catch (e) {
      return ranger('NON TESTÉ', { defaut: `relecture impossible (outil) : ${message(e)}`, api })
    }
    return relu?.confirme === true
      ? ranger('VERT', { preuve: relu.preuve ?? null, api })
      : ranger('ROUGE', { defaut: `la relecture contredit l'action : ${relu?.ecart ?? 'aucun écart nommé'}`, api })
  }

  return { cases, etape }
}

/**
 * Relit l'API AVEC le jeton du compte connecté dans cette page (sessionStorage, comme le front).
 * @returns {Promise<{ statut: number, corps: any }>}
 */
export async function lireApi(page, chemin) {
  return page.evaluate(async (url) => {
    const jeton = sessionStorage.getItem('token')
    const r = await fetch(url, { headers: { Accept: 'application/json', Authorization: `Bearer ${jeton}` } })
    let corps = null
    try { corps = await r.json() } catch { /* corps non JSON : seul le statut compte */ }
    return { statut: r.status, corps }
  }, `/api${chemin}`)
}

/** La section du résumé : une ligne par (école, fonction, étape, compte). */
export function resumeFonctionnel(cases, titre) {
  const n = (v) => cases.filter((c) => c.verdict === v).length
  const cellule = (t) => String(t ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')
  return [
    `## Parcours fonctionnels — ${titre}`, '',
    `Étapes : ${cases.length} — VERT ${n('VERT')}, ROUGE ${n('ROUGE')}, NON TESTÉ ${n('NON TESTÉ')}`, '',
    '| fonction | étape | compte | verdict | preuve ou défaut |', '|---|---|---|---|---|',
    ...cases.map((c) => `| ${c.fonction} | ${cellule(c.libelle)} | ${c.compte} | ${c.verdict} | ${cellule(c.preuve ?? c.defaut)} |`),
  ].join('\n') + '\n'
}
