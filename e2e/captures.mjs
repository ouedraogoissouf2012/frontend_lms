// Captures PLEINE PAGE des écrans de calendrier, en clair et en sombre (#628, FullCalendar 6 → 7) : la vérification
// visuelle exige des paires AVANT (v6) / APRÈS (v7) sous les MÊMES noms de fichiers. La capture du parcours des écrans
// (parcours.mjs) ne montre que la fenêtre (1280×720) : la grille du calendrier est sous la ligne de flottaison.
//
// `fullPage` de Playwright ne suffit pas : l'application ne fait pas défiler le DOCUMENT, mais sa zone de contenu
// (`.content-area` de DashboardLayout, `overflow-y: auto`). La fenêtre est donc AGRANDIE à la hauteur de ce contenu le
// temps des deux captures, puis rendue à sa taille.

/** Les écrans qui portent un calendrier : l'agenda unifié (enseignant, élève) et le widget du tableau de bord admin. */
export const CALENDRIERS = Object.freeze(['/teacher/schedule', '/student/schedule', '/admin/dashboard'])

/** La zone qui défile dans l'application (DashboardLayout). */
export const ZONE_DEFILANTE = '.content-area'

/**
 * Le widget du tableau de bord admin est chargé À LA DEMANDE (DashboardCalendarPanel) : sans ce clic, la capture ne
 * montre que « Calendrier non chargé. ». Un écran sans ce bouton n'est pas touché.
 */
export const BOUTON_CALENDRIER = 'Afficher le calendrier'

/** Plafond de hauteur de fenêtre : une page démesurée ne doit pas produire une image géante. */
export const HAUTEUR_MAX = 6000

/** Les noms de la paire pleine page, à côté de la capture du parcours : `x.png` → `x_pleine_clair.png`, `x_pleine_sombre.png`. */
export const nomsPleinePage = (capture) => ({
  clair: capture.replace(/\.png$/, '_pleine_clair.png'),
  sombre: capture.replace(/\.png$/, '_pleine_sombre.png'),
})

/**
 * La hauteur de fenêtre qui montre TOUT le contenu : le haut de la zone défilante plus sa hauteur défilable, jamais
 * moins que la fenêtre d'origine, jamais plus que HAUTEUR_MAX. Sans zone mesurée : la fenêtre d'origine.
 * @param {{ fenetre: number, haut?: number|null, defilable?: number|null }} mesure
 * @returns {number}
 */
export function hauteurUtile({ fenetre, haut, defilable }) {
  if (!Number.isFinite(haut) || !Number.isFinite(defilable)) return fenetre
  return Math.min(HAUTEUR_MAX, Math.max(fenetre, Math.ceil(haut + defilable)))
}

/**
 * Capture tout le contenu en clair, puis en sombre EXACTEMENT comme l'application (`useTheme` : classe `dark` sur
 * <html>, `data-theme`), et rend la fenêtre et le thème clair à l'écran suivant. Une panne de l'outil ne casse pas le
 * parcours.
 * @param {import('playwright').Page} page
 * @param {{ clair: string, sombre: string }} chemins - les chemins des deux fichiers PNG
 */
export async function capturesCalendrier(page, chemins) {
  const basculer = (sombre) => page.evaluate((s) => {
    document.documentElement.classList.toggle('dark', s)
    document.documentElement.setAttribute('data-theme', s ? 'dark' : 'light')
  }, sombre)
  const origine = page.viewportSize()
  try {
    const bouton = page.getByRole('button', { name: BOUTON_CALENDRIER })
    if (await bouton.count()) {
      await bouton.first().click()
      await bouton.first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(800)
    }
    const mesure = await page.evaluate((sel) => {
      const zone = document.querySelector(sel)
      return { fenetre: window.innerHeight, haut: zone?.getBoundingClientRect().top ?? null, defilable: zone?.scrollHeight ?? null }
    }, ZONE_DEFILANTE)
    if (origine) await page.setViewportSize({ width: origine.width, height: hauteurUtile(mesure) })
    await page.waitForTimeout(400)
    await page.screenshot({ path: chemins.clair, fullPage: true })
    await basculer(true)
    await page.waitForTimeout(400)
    await page.screenshot({ path: chemins.sombre, fullPage: true })
  } catch {
    // La capture est une preuve visuelle, pas un verdict : son échec n'est jamais un ROUGE.
  } finally {
    await basculer(false).catch(() => {})
    if (origine) await page.setViewportSize(origine).catch(() => {})
  }
}
