// Test de capacité de la visio (lms_backend#1232) : l'élève met l'enseignant EN GRAND (option `scene` du plan).
//
// Test 1 : chaque élève recevait la vidéo de l'enseignant en 180 p (68 kb/s). Lu dans le bundle servi (v=9365) : sans
// choix explicite, Jitsi affiche la mosaïque dès 3 participants ; chaque vignette est petite, le pont envoie la couche
// basse. Un vrai élève regarde l'enseignant en grand. Le geste passe par l'INTERFACE, comme un humain : le raccourci
// clavier de Jitsi « Activer / désactiver la mosaïque » (touche w, bouton « tileview » de la barre d'outils), jamais par
// l'API de l'application. Le store n'est que LU, pour savoir si la mosaïque est refusée. Un échec est DIT.

export const TOUCHE_MOSAIQUE = 'w'
// Mosaïque automatique pas encore affichée (< 3 participants) : le premier appui l'active, le second la refuse.
export const APPUIS_SCENE_MAX = 2
export const ATTENTE_SCENE_MS = 1000
// La fenêtre d'un participant ; en scène, celle d'un écran d'élève (le serveur plafonne la vidéo à 360 p :
// config.resolution = 360), pour que la grande vidéo demande ce qu'un vrai élève demanderait.
export const VIEWPORT = Object.freeze({ width: 640, height: 360 })
export const VIEWPORT_SCENE = Object.freeze({ width: 1280, height: 720 })

// Exécuté DANS la page : la mosaïque choisie (true), refusée (false), automatique ('auto'), ou illisible (null).
export function mosaiqueChoisie() {
  const disposition = window.APP?.store?.getState?.()?.['features/video-layout']
  if (!disposition) return null
  return typeof disposition.tileViewEnabled === 'boolean' ? disposition.tileViewEnabled : 'auto'
}

/** On appuie tant que la mosaïque n'est pas refusée ; jamais à l'aveugle (disposition illisible). */
export function doitAppuyer(choix) {
  return choix === true || choix === 'auto'
}

/** Le geste : la touche, au plus APPUIS_SCENE_MAX fois, jusqu'à ce que la mosaïque soit refusée. Rend le constat. */
export async function passerEnScene(page) {
  const scene = { avant: await page.evaluate(mosaiqueChoisie).catch(() => null), appuis: 0, apres: null }
  let choix = scene.avant
  while (doitAppuyer(choix) && scene.appuis < APPUIS_SCENE_MAX) {
    await page.keyboard.press(TOUCHE_MOSAIQUE)
    scene.appuis += 1
    await page.waitForTimeout(ATTENTE_SCENE_MS)
    choix = await page.evaluate(mosaiqueChoisie).catch(() => null)
  }
  scene.apres = choix
  return scene
}

const nom = (choix) => ({ true: 'choisie', false: 'refusée', auto: 'automatique' })[String(choix)] ?? 'illisible'

/** La ligne du diagnostic : la disposition avant et après, et les appuis. */
export function ligneScene(scene) {
  if (!scene) return 'scène : aucune'
  if (scene.erreurOutil) return `scène : erreur de l’outil (${scene.erreurOutil})`
  return `scène : mosaïque ${nom(scene.avant)} avant ; ${scene.appuis} appui(s) sur « ${TOUCHE_MOSAIQUE} » ; `
    + `mosaïque ${nom(scene.apres)} après${scene.apres === false ? '' : ' : scène NON obtenue'}`
}
