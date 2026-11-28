import { ref, computed } from 'vue'
import { auth } from '@/services/api'
import { ROLES, hasRole } from '@/constants/roles'
import { displayMessage } from '@/services/displayMessage'
import { toast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { lireDossier, ecrireDossier, ajouterTuteur, modifierTuteur, retirerTuteur } from '@/services/dossierEleve'

const DOUBLON = 'doublon_possible'

/**
 * front#664 (contrat back #1797) : la fiche d'un élève. Lit le dossier ; écrit l'identité et les tuteurs.
 *
 * - `modifiable` : la GESTION (coordinateur, admin ; superAdmin se range sous admin) d'une école AUTONOME
 *   (`source === 'lms'`). Le serveur reste juge ; l'écran ne propose pas ce qu'il refuserait.
 * - Un doublon possible (409) garde la saisie et expose ses `candidats` ; `confirmerDoublon()` la renvoie avec
 *   `confirmer_doublon: true`.
 * - Chaque écriture remplace l'état par la réponse du serveur, jamais par la saisie.
 *
 * @param {number} eleveId l'id LOCAL du compte
 */
export function useFicheEleve(eleveId) {
  const chargement = ref(true)
  const erreur = ref('')
  const source = ref(null)
  const dossier = ref(null)
  const enCours = ref(false)
  const doublon = ref(null)

  const modifiable = computed(() => source.value === 'lms' && hasRole(auth.getUser(), [ROLES.COORDINATEUR, ROLES.ADMIN]))
  const tuteurs = computed(() => dossier.value?.tuteurs ?? [])
  // La source du dossier est normalisée ICI (OCP, épique #325) : le composant n'affiche qu'une raison, ou rien.
  const raisonLectureSeule = computed(() => (source.value === 'klassci'
    ? 'Ce dossier est tenu par KLASSCI : il se consulte ici et se modifie dans KLASSCI.'
    : ''))

  async function charger() {
    chargement.value = true
    erreur.value = ''
    try {
      const lu = await lireDossier(eleveId)
      source.value = lu.source
      dossier.value = lu.dossier
    } catch (err) {
      erreur.value = displayMessage(err, 'La fiche de l’élève n’a pas pu être lue.')
    } finally {
      chargement.value = false
    }
  }

  /** @returns {Promise<boolean>} vrai si le dossier est enregistré */
  async function enregistrerIdentite(identite, confirmer = false) {
    enCours.value = true
    try {
      const ecrit = await ecrireDossier(eleveId, identite, confirmer)
      dossier.value = ecrit.dossier
      doublon.value = null
      toast.success('Dossier de l’élève enregistré')
      return true
    } catch (err) {
      const corps = err?.response?.data
      if (err?.response?.status === 409 && corps?.reason === DOUBLON) {
        doublon.value = { identite, candidats: Array.isArray(corps.candidats) ? corps.candidats : [], message: corps.message }
      } else {
        toast.error(displayMessage(err, 'Le dossier n’a pas pu être enregistré.'))
      }
      return false
    } finally {
      enCours.value = false
    }
  }

  function confirmerDoublon() {
    return doublon.value ? enregistrerIdentite(doublon.value.identite, true) : Promise.resolve(false)
  }

  function renoncerAuDoublon() {
    doublon.value = null
  }

  async function geste(acte, succes, echec) {
    enCours.value = true
    try {
      await acte()
      toast.success(succes)
      return true
    } catch (err) {
      toast.error(displayMessage(err, echec))
      return false
    } finally {
      enCours.value = false
    }
  }

  const remplacerTuteurs = (liste) => { dossier.value = { ...dossier.value, tuteurs: liste } }

  const tuteursActions = {
    ajouter: (saisie) => geste(async () => {
      remplacerTuteurs([...tuteurs.value, await ajouterTuteur(eleveId, saisie)])
    }, 'Tuteur ajouté', 'Le tuteur n’a pas pu être ajouté.'),

    modifier: (id, coordonnees) => geste(async () => {
      const ecrit = await modifierTuteur(id, coordonnees)
      remplacerTuteurs(tuteurs.value.map((t) => (t.id === id ? { ...ecrit, relation: ecrit.relation ?? t.relation } : t)))
    }, 'Tuteur mis à jour', 'Le tuteur n’a pas pu être modifié.'),

    async retirer(tuteur) {
      const ok = await useConfirm().confirm({
        title: 'Retirer le tuteur',
        message: `${tuteur.nom} ne sera plus lié à cet élève.`,
        confirmLabel: 'Retirer',
        variant: 'danger',
      })
      if (!ok) return false
      return geste(async () => {
        await retirerTuteur(eleveId, tuteur.id)
        remplacerTuteurs(tuteurs.value.filter((t) => t.id !== tuteur.id))
      }, 'Tuteur retiré', 'Le tuteur n’a pas pu être retiré.')
    },
  }

  return {
    chargement, erreur, dossier, tuteurs, enCours, doublon, modifiable, raisonLectureSeule,
    charger, enregistrerIdentite, confirmerDoublon, renoncerAuDoublon, tuteursActions,
  }
}
