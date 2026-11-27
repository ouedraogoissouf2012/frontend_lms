import { reactive, ref } from 'vue'
import { creerCompte } from '@/services/adminUsers'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { ROLES, getRoleDisplayName } from '@/constants/roles'

/**
 * Créer un compte dans une école autonome (#648), `POST /users` (CreateUserRequest) : un MOT DE PASSE INITIAL choisi
 * par l'admin, aucun lien d'activation.
 *
 * Contrôle local d'abord, sans appel réseau (nom, courriel, rôle, 8 caractères au moins, confirmation identique). Puis
 * les refus du serveur, chacun à SA place :
 *   - un 422 de validation : chaque erreur sous SON champ (`name`, `email`, `role`, `password`,
 *     `password_confirmation`) ; une erreur sur un champ absent de l'écran va au message général ;
 *   - sans réponse, en 5xx ou sur un succès illisible : le serveur a PEUT-ÊTRE créé le compte. La création est dite
 *     incertaine et la liste est relue, pour qu'un second clic ne heurte pas un compte déjà né ;
 *   - tout autre refus (403 `no_institution`, 429) : le message du catalogue, rien n'a été créé.
 * La saisie est GARDÉE sur un refus, VIDÉE sur un succès (mots de passe compris).
 */
export const CHAMPS_COMPTE = Object.freeze(['nom', 'courriel', 'role', 'motDePasse', 'confirmation'])

/** Le champ de l'écran pour un champ du contrat serveur. */
const CHAMP_DU_SERVEUR = Object.freeze({
  name: 'nom', email: 'courriel', role: 'role', password: 'motDePasse', password_confirmation: 'confirmation',
})

const MOT_DE_PASSE_MIN = 8
const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const vide = () => Object.fromEntries(CHAMPS_COMPTE.map((c) => [c, '']))

/**
 * @param {{ roles: import('vue').Ref<string[]>, onCree: (compte: object) => void, onIncertain: () => void }} options
 */
export function useCompteCreation({ roles, onCree, onIncertain }) {
  const saisie = reactive(vide())
  const erreurs = reactive(vide())
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  const effacer = (cible) => { for (const c of CHAMPS_COMPTE) cible[c] = '' }

  function controler() {
    const nom = saisie.nom.trim()
    const courriel = saisie.courriel.trim()
    if (!nom) erreurs.nom = ERROR_MESSAGES.compteNomRequis
    if (!COURRIEL.test(courriel)) erreurs.courriel = ERROR_MESSAGES.compteCourrielRequis
    if (!roles.value.includes(saisie.role)) erreurs.role = ERROR_MESSAGES.compteRoleRequis
    if (saisie.motDePasse.length < MOT_DE_PASSE_MIN) erreurs.motDePasse = ERROR_MESSAGES.compteMotDePasseCourt
    else if (saisie.confirmation !== saisie.motDePasse) erreurs.confirmation = ERROR_MESSAGES.compteConfirmationDifferente
    if (CHAMPS_COMPTE.some((c) => erreurs[c])) return null
    return { nom, courriel, role: saisie.role, motDePasse: saisie.motDePasse, confirmation: saisie.confirmation }
  }

  /** Range un refus du serveur à sa place ; rend true si la création est peut-être faite. */
  function ranger(err) {
    const parChamp = err?.fieldErrors
    if (parChamp) {
      const ailleurs = []
      for (const [cle, textes] of Object.entries(parChamp)) {
        const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ')
        const champ = CHAMP_DU_SERVEUR[cle]
        if (champ) erreurs[champ] = texte || ERROR_MESSAGES.validation
        else ailleurs.push(texte)
      }
      if (ailleurs.length) erreur.value = ailleurs.join(' ') || ERROR_MESSAGES.validation
      return false
    }
    const message = err?.userMessage || ERROR_MESSAGES.unknown
    const status = err?.response?.status
    if (status == null || status >= 500) {
      erreur.value = `${message} ${ERROR_MESSAGES.compteCreationIncertaine}`
      return true
    }
    erreur.value = message
    return false
  }

  /** L'annonce du succès : qui, avec quel rôle, et ce que l'admin doit transmettre. */
  function annoncer(valeurs) {
    const base = `Compte « ${valeurs.nom} » créé (${getRoleDisplayName(valeurs.role)}). Transmettez-lui son courriel et son mot de passe initial.`
    // Les élèves de la liste sont lus dans les classes : un élève sans classe n'y figure pas encore (lms_backend#1619).
    return valeurs.role === ROLES.ETUDIANT
      ? `${base} Il apparaîtra dans la liste une fois inscrit dans une classe (code d'inscription ou import).`
      : base
  }

  async function creer() {
    if (occupe.value) return false
    effacer(erreurs)
    erreur.value = ''
    annonce.value = ''
    const valeurs = controler()
    if (!valeurs) return false
    occupe.value = true
    try {
      const reponse = await creerCompte(valeurs)
      const compte = reponse?.data
      if (!compte || typeof compte !== 'object') throw Object.assign(new Error('réponse illisible'), { userMessage: ERROR_MESSAGES.unknown })
      annonce.value = annoncer(valeurs)
      effacer(saisie)
      onCree(compte)
      return true
    } catch (err) {
      if (ranger(err)) onIncertain()
      return false
    } finally {
      occupe.value = false
    }
  }

  return { saisie, erreurs, erreur, annonce, occupe, creer }
}
