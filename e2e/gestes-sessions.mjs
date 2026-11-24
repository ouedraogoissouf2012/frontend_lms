// Les gestes de l'écran « Sessions de formation » (#611, #606), communs à ses parcours fonctionnels.
import { ATTENTE, appel, bouton, refusServeur } from './gestes.mjs'

/**
 * Crée un programme, puis une session de ce programme, PAR L'ÉCRAN. Depuis #606, la formation se CHOISIT dans la liste
 * (`<select id="program_id">`, remplie par GET /programs) par son titre : le geste prouve que le programme créé y figure.
 * @param {import('playwright').Page} page - l'écran des sessions, ouvert
 * @param {{ programme: string, session: string, debut?: string }} donnees - `debut` au format AAAA-MM-JJ, facultatif
 * @returns {Promise<object>} `{}` si les deux créations réussissent, `{ rouge }` sinon
 */
export async function creerProgrammeEtSession(page, { programme, session, debut }) {
  await page.fill('#titre', programme)
  const reponseProgramme = appel(page, 'POST', '/programs')
  await bouton(page, 'Créer le programme').click()
  const refusProgramme = await refusServeur(page, reponseProgramme, 'la création du programme')
  if (refusProgramme) return refusProgramme
  // La liste est relue après la création : on attend que le programme y figure, puis on le CHOISIT par son titre.
  const liste = page.locator('select#program_id')
  await liste.locator('option', { hasText: programme }).first().waitFor({ state: 'attached', timeout: ATTENTE })
  await liste.selectOption({ label: programme })
  await page.fill('#libelle', session)
  if (debut) await page.fill('#starts_on', debut)
  const reponseSession = appel(page, 'POST', '/training-sessions')
  await bouton(page, 'Créer la période').click()
  return (await refusServeur(page, reponseSession, 'la création de la session')) ?? {}
}
