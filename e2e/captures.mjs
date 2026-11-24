// Captures PLEINE PAGE des écrans de calendrier, en clair et en sombre (#628, FullCalendar 6 → 7) : la vérification
// visuelle exige des paires AVANT (v6) / APRÈS (v7) sous les MÊMES noms de fichiers. La capture du parcours des écrans
// (parcours.mjs) ne montre que la fenêtre (1280×720) : la grille du calendrier est sous la ligne de flottaison. Ici,
// la page entière, en clair puis en sombre, sans recharger.

/** Les écrans qui portent un calendrier : l'agenda unifié (enseignant, élève) et le widget du tableau de bord admin. */
export const CALENDRIERS = Object.freeze(['/teacher/schedule', '/student/schedule', '/admin/dashboard'])

/** Les noms de la paire pleine page, à côté de la capture du parcours : `x.png` → `x_pleine_clair.png`, `x_pleine_sombre.png`. */
export const nomsPleinePage = (capture) => ({
  clair: capture.replace(/\.png$/, '_pleine_clair.png'),
  sombre: capture.replace(/\.png$/, '_pleine_sombre.png'),
})

/**
 * Capture la page entière en clair, puis en sombre EXACTEMENT comme l'application (`useTheme` : classe `dark` sur
 * <html>, `data-theme`), et revient en clair pour l'écran suivant. Une panne de l'outil ne casse pas le parcours.
 * @param {import('playwright').Page} page
 * @param {{ clair: string, sombre: string }} chemins - les chemins des deux fichiers PNG
 */
export async function capturesCalendrier(page, chemins) {
  const basculer = (sombre) => page.evaluate((s) => {
    document.documentElement.classList.toggle('dark', s)
    document.documentElement.setAttribute('data-theme', s ? 'dark' : 'light')
  }, sombre)
  try {
    await page.screenshot({ path: chemins.clair, fullPage: true })
    await basculer(true)
    await page.waitForTimeout(400)
    await page.screenshot({ path: chemins.sombre, fullPage: true })
  } catch {
    // La capture est une preuve visuelle, pas un verdict : son échec n'est jamais un ROUGE.
  } finally {
    await basculer(false).catch(() => {})
  }
}
