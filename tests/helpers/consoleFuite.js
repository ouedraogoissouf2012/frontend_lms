/**
 * Détecteur de fuite d'un secret dans la console, partagé par les tests qui le vérifient
 * (code d'inscription #447, lien d'activation #418). Ce n'est pas un test : Vitest ne
 * collecte que les `*.test.*`.
 *
 * Les erreurs sont mises à plat AVANT `JSON.stringify` : celui-ci applique
 * `AxiosError.toJSON()` avant tout replacer, et `toJSON()` omet `response`. Un secret
 * renvoyé dans le corps d'une réponse d'erreur passait donc inaperçu.
 */
import { vi } from 'vitest'

const METHODES = ['log', 'info', 'warn', 'error', 'debug']

/**
 * Met à plat, RÉCURSIVEMENT, ce que la console a reçu : une erreur devient ce qu'elle peut
 * porter d'un échange HTTP (message, pile, corps envoyé et reçu), à toute profondeur
 * (`{ contexte: { error } }` compris). Une garde de cycles rend `[cycle]` au lieu de boucler.
 * @param {unknown} valeur
 * @param {WeakSet<object>} [vus]
 */
export function aplatir(valeur, vus = new WeakSet()) {
  if (valeur === null || typeof valeur !== 'object') return valeur
  if (vus.has(valeur)) return '[cycle]'
  vus.add(valeur)
  if (valeur instanceof Error) {
    return {
      message: valeur.message,
      stack: valeur.stack,
      envoye: aplatir(valeur.config?.data ?? null, vus),
      recu: aplatir(valeur.response?.data ?? null, vus),
    }
  }
  if (Array.isArray(valeur)) return valeur.map((v) => aplatir(v, vus))
  return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, aplatir(v, vus)]))
}

/**
 * Espionne (et rend muettes) les méthodes de la console.
 * @returns {{ contient: (secret: string) => boolean, appelee: (methode: string) => boolean, restaurer: () => void }}
 */
export function espionnerConsole() {
  const espions = Object.fromEntries(METHODES.map((m) => [m, vi.spyOn(console, m).mockImplementation(() => {})]))
  return {
    contient: (secret) => Object.values(espions).some((s) => s.mock.calls.some((args) => JSON.stringify(aplatir(args)).includes(secret))),
    appelee: (methode) => espions[methode].mock.calls.length > 0,
    restaurer: () => Object.values(espions).forEach((s) => s.mockRestore()),
  }
}
