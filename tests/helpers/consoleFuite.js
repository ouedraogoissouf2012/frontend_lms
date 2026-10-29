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

/** Ce qu'une erreur peut porter d'un échange HTTP : message, pile, corps envoyé et reçu. */
export function aplatir(valeur) {
  if (!(valeur instanceof Error)) return valeur
  return {
    message: valeur.message,
    stack: valeur.stack,
    envoye: valeur.config?.data ?? null,
    recu: valeur.response?.data ?? null,
  }
}

/**
 * Espionne (et rend muettes) les méthodes de la console.
 * @returns {{ contient: (secret: string) => boolean, appelee: (methode: string) => boolean, restaurer: () => void }}
 */
export function espionnerConsole() {
  const espions = Object.fromEntries(METHODES.map((m) => [m, vi.spyOn(console, m).mockImplementation(() => {})]))
  return {
    contient: (secret) => Object.values(espions).some((s) => s.mock.calls.some((args) => JSON.stringify(args.map(aplatir)).includes(secret))),
    appelee: (methode) => espions[methode].mock.calls.length > 0,
    restaurer: () => Object.values(espions).forEach((s) => s.mockRestore()),
  }
}
