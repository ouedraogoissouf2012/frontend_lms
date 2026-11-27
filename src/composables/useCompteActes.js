import { computed, reactive, ref } from 'vue'
import { modifierCompte, desactiverCompte, definirMotDePasse } from '@/services/adminUsers'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { rangerRefus } from '@/utils/refusDeCompte'

/**
 * Les trois actes sur un compte de l'annuaire (#656, lot b), sur le modèle de la création (`useCompteCreation`, #648) :
 * contrôle local d'abord, sans appel réseau ; puis les refus du serveur rangés par `rangerRefus` (422 sous le champ,
 * acte INCERTAIN sans réponse ou en 5xx, message du catalogue sinon).
 *
 * Chaque acte vise l'id LOCAL de la ligne (`lms_id`), le seul que comprennent les routes de compte (lms#1728, #1275).
 * Les actes offerts sont décidés en amont (`gestionDeCompte`) ; le serveur reste juge.
 *
 * Un succès appelle `onFait({ acte })` ; un acte incertain, `onIncertain()`, pour que l'écran relise sa liste.
 */

const MOT_DE_PASSE_MIN = 8
const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Le champ de l'écran pour un champ du contrat serveur. */
const CHAMP_DU_SERVEUR = Object.freeze({
  name: 'nom', email: 'courriel', role: 'role', password: 'motDePasse', password_confirmation: 'confirmation',
})

/** L'état commun d'un formulaire d'acte : erreurs par champ, message général, annonce, verrou d'envoi. */
function etatDeFormulaire(champs) {
  const erreurs = reactive(Object.fromEntries(champs.map((c) => [c, ''])))
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)
  const reinitialiser = () => {
    for (const c of champs) erreurs[c] = ''
    erreur.value = ''
    annonce.value = ''
  }

  /** Envoie l'acte une fois, range son refus ; rend vrai sur un succès. */
  async function envoyer(appel, { onIncertain }) {
    if (occupe.value) return false
    occupe.value = true
    try {
      await appel()
      return true
    } catch (err) {
      const incertain = rangerRefus(err, {
        erreurs, erreur, champDuServeur: CHAMP_DU_SERVEUR, incertitude: ERROR_MESSAGES.compteActeIncertain,
      })
      if (incertain) onIncertain()
      return false
    } finally {
      occupe.value = false
    }
  }

  return { erreurs, erreur, annonce, occupe, reinitialiser, envoyer }
}

/**
 * Modifier : nom, courriel, rôle. Seuls les champs CHANGÉS partent (le serveur ne change que ceux reçus) ; rien de
 * changé, aucun appel. Le rôle offert vient de `roles` (`rolesAttribuables`, miroir d'`AssignableRole`).
 *
 * @param {{ ligne: import('vue').Ref<object>, roles: import('vue').Ref<string[]>, onFait: Function, onIncertain: Function }} options
 */
export function useCompteModification({ ligne, roles, onFait, onIncertain }) {
  const etat = etatDeFormulaire(['nom', 'courriel', 'role'])
  const initial = computed(() => ({ nom: ligne.value?.name ?? '', courriel: ligne.value?.email ?? '', role: ligne.value?.role_brut ?? '' }))
  const saisie = reactive({ ...initial.value })

  function changements() {
    const nom = saisie.nom.trim()
    const courriel = saisie.courriel.trim()
    const corps = {}
    if (nom !== initial.value.nom) corps.name = nom
    if (courriel !== initial.value.courriel) corps.email = courriel
    if (saisie.role !== initial.value.role) corps.role = saisie.role
    if (corps.name !== undefined && !nom) etat.erreurs.nom = ERROR_MESSAGES.compteNomRequis
    if (corps.email !== undefined && !COURRIEL.test(courriel)) etat.erreurs.courriel = ERROR_MESSAGES.compteCourrielRequis
    if (corps.role !== undefined && !roles.value.includes(corps.role)) etat.erreurs.role = ERROR_MESSAGES.compteRoleRequis
    return Object.values(etat.erreurs).some(Boolean) ? null : corps
  }

  async function modifier() {
    etat.reinitialiser()
    const corps = changements()
    if (!corps) return false
    if (Object.keys(corps).length === 0) {
      etat.erreur.value = ERROR_MESSAGES.compteRienAModifier
      return false
    }
    const fait = await etat.envoyer(() => modifierCompte(ligne.value.lms_id, corps), { onIncertain })
    if (fait) onFait({ acte: 'modifie' })
    return fait
  }

  return { saisie, ...etat, modifier }
}

/**
 * Désactiver : suppression LOGIQUE côté serveur (dossier conservé, sessions fermées). La confirmation est l'affaire
 * du composant ; ici, l'acte.
 *
 * @param {{ ligne: import('vue').Ref<object>, onFait: Function, onIncertain: Function }} options
 */
export function useCompteDesactivation({ ligne, onFait, onIncertain }) {
  const etat = etatDeFormulaire([])

  async function desactiver() {
    etat.reinitialiser()
    const fait = await etat.envoyer(() => desactiverCompte(ligne.value.lms_id), { onIncertain })
    if (fait) onFait({ acte: 'desactive' })
    return fait
  }

  return { ...etat, desactiver }
}

/**
 * Définir le mot de passe : 8 caractères au moins, confirmation identique (`DefinirLeMotDePasseRequest`). La saisie est
 * VIDÉE après un succès comme après un refus du serveur : un mot de passe ne reste pas à l'écran.
 *
 * @param {{ ligne: import('vue').Ref<object>, onFait: Function, onIncertain: Function }} options
 */
export function useCompteMotDePasse({ ligne, onFait, onIncertain }) {
  const etat = etatDeFormulaire(['motDePasse', 'confirmation'])
  const saisie = reactive({ motDePasse: '', confirmation: '' })
  const vider = () => { saisie.motDePasse = ''; saisie.confirmation = '' }

  async function definir() {
    etat.reinitialiser()
    if (saisie.motDePasse.length < MOT_DE_PASSE_MIN) etat.erreurs.motDePasse = ERROR_MESSAGES.motDePasseTropCourt
    else if (saisie.confirmation !== saisie.motDePasse) etat.erreurs.confirmation = ERROR_MESSAGES.motDePasseConfirmationDifferente
    if (etat.erreurs.motDePasse || etat.erreurs.confirmation) return false

    const valeurs = { motDePasse: saisie.motDePasse, confirmation: saisie.confirmation }
    const fait = await etat.envoyer(() => definirMotDePasse(ligne.value.lms_id, valeurs), { onIncertain })
    vider()
    if (fait) {
      etat.annonce.value = `Mot de passe de « ${ligne.value.name} » défini. Ses sessions ouvertes sont fermées : transmettez-lui le nouveau mot de passe.`
      onFait({ acte: 'mot_de_passe' })
    }
    return fait
  }

  return { saisie, ...etat, definir }
}
