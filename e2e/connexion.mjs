// La connexion par l'ÉCRAN, commune au parcours des écrans et aux parcours fonctionnels.

/**
 * @returns {Promise<{ connecte: boolean, alerte: string }>} l'alerte affichée quand la connexion échoue
 */
export async function connecter(page, base, email, motDePasse) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('#username', email)
  await page.fill('#password', motDePasse)
  await page.click('button[type="submit"]')
  const connecte = await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 }).then(() => true, () => false)
  const alerte = connecte ? '' : (await page.locator('[role="alert"]').allInnerTexts()).join(' ').trim()
  return { connecte, alerte }
}
