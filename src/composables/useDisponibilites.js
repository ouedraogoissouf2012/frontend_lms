import { computed, onMounted, reactive, ref } from 'vue'
import { profilEnseignantService } from '@/services/profilEnseignant'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const JOURS_OUVRES = [1, 2, 3, 4, 5, 6]
let suivante = 0
const versEcran = (c) => ({ cle: c.id ? `d${c.id}` : `n${++suivante}`, jour: c.jour, debut: c.debut, fin: c.fin, disponible: c.disponible === true })
const creneauVide = () => ({ ouvert: false, cle: null, jour: 1, debut: '', fin: '', disponible: 'oui' })
const exceptionVide = () => ({ date: '', debut: '', fin: '', disponible: 'non', motif: '' })

/**
 * Les disponibilités d'un enseignant (#673), pour la page « Mes disponibilités » de l'enseignant et pour l'onglet de la
 * fiche (gestion) : la semaine type, composée à l'écran puis enregistrée d'un bloc ; les exceptions datées, ajoutées et
 * retirées une à une. Du lundi au samedi, le dimanche s'il porte un créneau. Un refus du serveur est dit par le
 * catalogue des motifs ; la saisie reste.
 *
 * @param {() => number} enseignantId l'id LOCAL du compte
 */
export function useDisponibilites(enseignantId) {
  const semaine = ref([])
  const exceptions = ref([])
  const chargement = ref(true)
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)
  const creneau = reactive(creneauVide())
  const erreurCreneau = ref('')
  const nouvelleException = reactive(exceptionVide())
  const erreurException = ref('')

  const jours = computed(() => (semaine.value.some((c) => c.jour === 7) ? [...JOURS_OUVRES, 7] : JOURS_OUVRES))
  const duJour = (jour) => semaine.value.filter((c) => c.jour === jour).sort((a, b) => a.debut.localeCompare(b.debut))

  function retenir(d) {
    semaine.value = d.semaine.map(versEcran)
    exceptions.value = d.exceptions
  }

  async function agir(action) {
    if (occupe.value) return
    occupe.value = true
    erreur.value = ''
    annonce.value = ''
    try {
      await action()
    } catch (err) {
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
    } finally {
      occupe.value = false
    }
  }

  async function charger() {
    try {
      retenir(await profilEnseignantService.lireDisponibilites(enseignantId()))
    } catch (err) {
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
    } finally {
      chargement.value = false
    }
  }

  const ouvrirSur = (jour) => { Object.assign(creneau, creneauVide(), { ouvert: true, jour }); erreurCreneau.value = '' }
  const ouvrirCreneau = (c) => { Object.assign(creneau, { ouvert: true, cle: c.cle, jour: c.jour, debut: c.debut, fin: c.fin, disponible: c.disponible ? 'oui' : 'non' }); erreurCreneau.value = '' }
  const fermer = () => Object.assign(creneau, creneauVide())

  function validerCreneau() {
    if (!creneau.debut || !creneau.fin) { erreurCreneau.value = ERROR_MESSAGES.disponibiliteHoraireRequis; return }
    if (creneau.fin <= creneau.debut) { erreurCreneau.value = ERROR_MESSAGES.disponibiliteFinAvantDebut; return }
    const ligne = { cle: creneau.cle, jour: creneau.jour, debut: creneau.debut, fin: creneau.fin, disponible: creneau.disponible === 'oui' }
    const i = semaine.value.findIndex((c) => c.cle === ligne.cle)
    if (i >= 0) semaine.value.splice(i, 1, ligne)
    else semaine.value.push(versEcran(ligne))
    fermer()
  }

  function retirerCreneau() {
    semaine.value = semaine.value.filter((c) => c.cle !== creneau.cle)
    fermer()
  }

  const enregistrer = () => agir(async () => {
    retenir(await profilEnseignantService.enregistrerSemaine(enseignantId(), semaine.value))
    annonce.value = 'Disponibilités enregistrées.'
  })

  function verifierException() {
    if (!nouvelleException.date) return ERROR_MESSAGES.exceptionDateRequise
    if (Boolean(nouvelleException.debut) !== Boolean(nouvelleException.fin)) return ERROR_MESSAGES.exceptionCreneauIncomplet
    if (nouvelleException.debut && nouvelleException.fin <= nouvelleException.debut) return ERROR_MESSAGES.disponibiliteFinAvantDebut
    return ''
  }

  const ajouterException = () => {
    erreurException.value = verifierException()
    if (erreurException.value) return Promise.resolve()
    return agir(async () => {
      const ajoutee = await profilEnseignantService.ajouterException(enseignantId(), { ...nouvelleException, disponible: nouvelleException.disponible === 'oui' })
      exceptions.value = [...exceptions.value, ajoutee].sort((a, b) => a.date.localeCompare(b.date))
      Object.assign(nouvelleException, exceptionVide())
      annonce.value = 'Exception ajoutée.'
    })
  }

  const retirerException = (e) => agir(async () => {
    await profilEnseignantService.retirerException(enseignantId(), e.id)
    exceptions.value = exceptions.value.filter((x) => x.id !== e.id)
    annonce.value = 'Exception retirée.'
  })

  onMounted(charger)

  return {
    semaine, exceptions, chargement, erreur, annonce, occupe, jours, duJour, creneau, erreurCreneau, nouvelleException, erreurException,
    ouvrirSur, ouvrirCreneau, fermer, validerCreneau, retirerCreneau, enregistrer, ajouterException, retirerException,
  }
}
