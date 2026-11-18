// Test de capacité de la visio (lms_backend#1232) : le GESTE d'un vrai enseignant, et la page d'accueil.
//
// Essai 4 : aucune piste locale, alors que getUserMedia réussit dans la même page. Cause lue dans le bundle servi
// (visio.klassci.com, app.bundle.min.js?v=9365) : une surcharge `config.prejoinConfig.enabled=false` passée par l'URL,
// hors iframe, fait écrire à Jitsi « Using prejoinConfig.enabled config URL overwrite implies starting without
// media. » et pose `disableInitialGUM = true` ; createInitialLocalTracks ne demande alors aucun périphérique.
// L'outil n'envoie plus cette surcharge (plan.mjs). L'enseignant allume ensuite micro et caméra comme un humain :
// par les boutons de la barre d'outils, jamais par l'API de l'application. Un bouton introuvable ou sans effet est
// DIT dans le relevé, sans repli silencieux.

// Sélecteurs lus dans le DOM servi, indépendants de la langue : le conteneur du bouton (« audio-preview »,
// « video-preview ») et la classe du bouton (« toolbox-button »), qui porte aria-pressed = coupé.
export const BOUTONS = Object.freeze({
  micro: '.audio-preview .toolbox-button',
  camera: '.video-preview .toolbox-button',
})
// La page d'accueil (prejoin), si le serveur l'affiche : on la passe comme un humain, par « Rejoindre ».
export const PREJOIN = Object.freeze({
  ecran: '[data-testid="prejoin.screen"]',
  rejoindre: '[data-testid="prejoin.joinMeeting"]',
})
export const DELAI_GESTE_MS = 5000
export const ATTENTE_EFFET_MS = 3000

/** Seul un appareil COUPÉ (aria-pressed="true") se clique : cliquer un appareil actif le couperait. */
export function doitCliquer(ariaPressed) {
  return ariaPressed === 'true'
}

// Exécuté DANS la page : les pistes locales que l'application a créées (lecture seule du store).
export function pistesDuStore() {
  const pistes = window.APP?.store?.getState?.()?.['features/base/tracks']
  return Array.isArray(pistes) ? pistes.filter((t) => t.local).map((t) => ({ type: t.mediaType ?? null, muette: t.muted ?? null })) : null
}

/** Le geste : survol (la barre d'outils apparaît), puis clic sur chaque appareil coupé. Rend le constat complet. */
export async function allumerMicroEtCamera(page) {
  const geste = { pistesAvant: await page.evaluate(pistesDuStore).catch(() => null), boutons: {}, pistesApres: null }
  await page.mouse.move(320, 180)
  for (const [appareil, selecteur] of Object.entries(BOUTONS)) {
    const bouton = page.locator(selecteur).first()
    if ((await page.locator(selecteur).count()) === 0) {
      geste.boutons[appareil] = { trouve: false }
      continue
    }
    const avant = await bouton.getAttribute('aria-pressed')
    const constat = { trouve: true, avant, clic: doitCliquer(avant), erreur: null, apres: null }
    if (constat.clic) await bouton.click({ timeout: 5000 }).catch((e) => { constat.erreur = String(e?.message ?? e).split('\n')[0] })
    geste.boutons[appareil] = constat
  }
  await page.waitForTimeout(ATTENTE_EFFET_MS)
  for (const [appareil, selecteur] of Object.entries(BOUTONS)) {
    if (geste.boutons[appareil].trouve) geste.boutons[appareil].apres = await page.locator(selecteur).first().getAttribute('aria-pressed').catch(() => null)
  }
  geste.pistesApres = await page.evaluate(pistesDuStore).catch(() => null)
  return geste
}

const pistes = (xs) => (Array.isArray(xs) ? (xs.length ? xs.map((t) => `${t.type}${t.muette ? ' (muette)' : ''}`).join(', ') : 'aucune') : '—')

/** La ligne du relevé : pistes avant et après le geste, et ce que chaque bouton a fait. */
export function ligneGeste(geste) {
  if (!geste) return 'geste : aucun'
  if (geste.erreurOutil) return `geste : erreur de l’outil (${geste.erreurOutil})`
  const boutons = Object.entries(geste.boutons ?? {}).map(([appareil, b]) => {
    if (!b.trouve) return `${appareil} introuvable`
    const action = b.clic ? (b.erreur ? `clic en échec (${b.erreur})` : 'cliqué') : 'déjà actif, non cliqué'
    return `${appareil} ${action} (aria-pressed ${b.avant} → ${b.apres ?? '—'})`
  })
  return `geste : pistes avant ${pistes(geste.pistesAvant)} ; ${boutons.join(' ; ')} ; pistes après ${pistes(geste.pistesApres)}`
}
