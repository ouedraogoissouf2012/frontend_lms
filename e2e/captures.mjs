// Captures en thème SOMBRE des écrans de calendrier (#628, FullCalendar 6 → 7) : la vérification visuelle exige des
// paires AVANT (v6) / APRÈS (v7), en clair ET en sombre, sous les MÊMES noms de fichiers. La capture claire est celle
// du parcours des écrans (parcours.mjs) ; celle-ci la double en sombre, sur le même écran, sans recharger.

/** Les écrans qui portent un calendrier : l'agenda unifié (enseignant, élève) et le widget du tableau de bord admin. */
export const CALENDRIERS = Object.freeze(['/teacher/schedule', '/student/schedule', '/admin/dashboard'])

/** Le nom de la capture sombre, à côté de la claire : `x.png` → `x_sombre.png`. */
export const nomSombre = (capture) => capture.replace(/\.png$/, '_sombre.png')

/**
 * Bascule la page en sombre EXACTEMENT comme l'application (`useTheme` : classe `dark` sur <html>, `data-theme`),
 * capture, puis revient en clair pour l'écran suivant. Une panne de l'outil ne casse pas le parcours.
 * @param {import('playwright').Page} page
 * @param {string} chemin - le chemin du fichier PNG sombre
 */
export async function captureSombre(page, chemin) {
  const basculer = (sombre) => page.evaluate((s) => {
    document.documentElement.classList.toggle('dark', s)
    document.documentElement.setAttribute('data-theme', s ? 'dark' : 'light')
  }, sombre)
  try {
    await basculer(true)
    await page.waitForTimeout(400)
    await page.screenshot({ path: chemin })
  } catch {
    // La capture est une preuve visuelle, pas un verdict : son échec n'est jamais un ROUGE.
  } finally {
    await basculer(false).catch(() => {})
  }
}
