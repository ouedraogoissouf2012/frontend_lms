import { ref } from 'vue'
import { extractList } from '@/utils/apiList'
import { trainingSessionsService } from '@/services/trainingSessions'
import { useConfirm } from '@/composables/useConfirm'
import { IRREVERSIBLES, LIBELLES_TRANSITION } from '@/constants/trainingSessionTransitions'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const PHASES = {
  a_venir: 'À venir',
  inscriptions_ouvertes: 'Inscriptions ouvertes',
  en_cours: 'En cours',
  terminee: 'Terminée',
}

const STATUTS = {
  brouillon: 'Brouillon',
  publiee: 'Publiée',
  annulee: 'Annulée',
  cloturee: 'Clôturée',
  archivee: 'Archivée',
  purgee: 'Purgée',
}

/**
 * #606 : ce qu'on peut faire d'une session, selon son statut. SEUL le graphe des transitions est affirmé, chaque
 * phrase prouvée par le back (TrainingSessionTransitionService, ADR-845-01 ; relevé validé par la superviseure).
 * Rien sur la visibilité, les dates d'inscription, les listes ou l'attestation : le back ne le garantit pas
 * (lms_backend#1208). `purgee` n'a aucun texte : aucune route n'y mène.
 */
const DESCRIPTIONS_STATUT = Object.freeze({
  brouillon: 'En préparation. Elle peut être publiée (une date de début est exigée) ou annulée.',
  publiee: 'Elle peut être clôturée ou annulée.',
  cloturee: 'Close. Elle ne peut plus qu’être archivée.',
  annulee: 'Annulée : cela ne se défait pas, et aucune inscription n’est retirée. Elle ne peut plus qu’être archivée.',
  archivee: 'Archivée : plus aucune action n’est possible.',
})

/** @returns {string|null} le texte du statut, ou null s'il n'en a pas (rien n'est inventé). */
export function descriptionStatut(status) {
  return typeof status === 'string' && Object.hasOwn(DESCRIPTIONS_STATUT, status) ? DESCRIPTIONS_STATUT[status] : null
}

export function libellePhase(phase) {
  return PHASES[phase] || phase || '—'
}

export function libelleStatut(status) {
  return STATUTS[status] || status || '—'
}

/**
 * #606 : la borne DÉCLARÉE de lecture des programmes, en pages de 100 (2 000 formations). Au-delà, la lecture s'arrête
 * et l'écran le dit, au lieu de prétendre tout lister.
 */
export const PROGRAMMES_PAGES_MAX = 20

/** Libellé d'un programme dans la liste : son titre, et sa version quand il en a plusieurs. */
export function libelleProgramme(p) {
  return Number.isInteger(p?.version) && p.version > 1 ? `${p.titre} (version ${p.version})` : String(p?.titre ?? '—')
}

export function useAdminTrainingSessions() {
  const periodes = ref([])
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')
  const page = ref(1)
  const lastPage = ref(1)
  const dernierProgrammeId = ref(null)
  const saving = ref(false)
  // #611 : les archivées sont masquées par défaut (lms_backend#1290) ; la case de l'écran les montre.
  const voirArchivees = ref(false)
  // #606 : la liste des formations (GET /programs), pour CHOISIR celle d'une session.
  const programmes = ref([])
  const programmesErreur = ref('')
  const programmesTronques = ref(false)
  // Périodes dont une transition est en cours (revue #441, A1) : un ENSEMBLE, car
  // plusieurs cartes peuvent être en vol. Remplacé à chaque écriture (réactivité).
  const occupees = ref(new Set())
  const estOccupee = (id) => occupees.value.has(id)
  const occuper = (id) => { occupees.value = new Set([...occupees.value, id]) }
  const liberer = (id) => { const s = new Set(occupees.value); s.delete(id); occupees.value = s }

  /** @returns {Promise<boolean>} true si la liste a été rechargée. */
  async function load(cible = page.value) {
    loading.value = true
    error.value = ''
    try {
      const response = await trainingSessionsService.list(cible, { archivees: voirArchivees.value })
      periodes.value = extractList(response)
      page.value = response.meta?.current_page ?? cible
      lastPage.value = response.meta?.last_page ?? 1
      return true
    } catch (err) {
      error.value = err.userMessage || 'Impossible de charger les sessions.'
      periodes.value = []
      return false
    } finally {
      loading.value = false
    }
  }

  /** Coche ou décoche « Voir les périodes archivées » : la liste repart de sa première page. */
  async function basculerArchivees(valeur) {
    voirArchivees.value = valeur === true
    return load(1)
  }

  /**
   * Une période que le serveur dit ARCHIVÉE, case décochée : elle quitte la liste aussitôt. Si c'était la dernière
   * ligne de la page alors que d'autres pages existent, la page précédente (ou la première) est relue : jamais
   * une page vide trompeuse.
   */
  async function retirerArchivee(id) {
    periodes.value = periodes.value.filter((p) => p.id !== id)
    notice.value = ERROR_MESSAGES.periodeArchiveeMasquee
    if (periodes.value.length === 0 && lastPage.value > 1) {
      await load(Math.max(1, page.value - 1))
      notice.value = ERROR_MESSAGES.periodeArchiveeMasquee
    }
  }

  /**
   * Lit TOUS les programmes, page par page, dans la borne déclarée. Un échec ne laisse AUCUN programme : une liste
   * partielle ferait croire qu'une formation n'existe pas. L'écran désactive alors la création de session.
   * @returns {Promise<boolean>} true si la liste est lue
   */
  async function chargerProgrammes() {
    programmesErreur.value = ''
    const lus = []
    try {
      let cible = 1
      let derniere = 1
      do {
        const response = await trainingSessionsService.listPrograms(cible)
        lus.push(...extractList(response))
        derniere = response.meta?.last_page ?? cible
        cible += 1
      } while (cible <= derniere && cible <= PROGRAMMES_PAGES_MAX)
      programmes.value = lus
      programmesTronques.value = derniere > PROGRAMMES_PAGES_MAX
      return true
    } catch (err) {
      programmes.value = []
      programmesErreur.value = err?.userMessage || ERROR_MESSAGES.unknown
      return false
    }
  }

  async function creerProgramme(titre, description) {
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await trainingSessionsService.createProgram({ titre, description })
      dernierProgrammeId.value = response.data?.id ?? null
      notice.value = 'Programme créé.'
      // #606 : la liste est relue, pour que le programme créé puisse être choisi.
      await chargerProgrammes()
      return true
    } catch (err) {
      error.value = err.userMessage || 'La création du programme a échoué.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function creerPeriode(payload) {
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      await trainingSessionsService.createPeriod(payload)
      notice.value = 'Session de formation créée.'
      await load(1)
      return true
    } catch (err) {
      error.value = err.userMessage || 'La création de la période a échoué.'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Fait avancer une période (#391, ADR-845-01). Annuler et archiver ne se défont
   * pas : une confirmation les précède. Au succès, la période est remplacée par la
   * réponse du serveur (statut et phase font foi). Sur 409, l'état a changé
   * ailleurs : la liste est rechargée, et le message ne dit « actualisée » que si ce
   * rechargement a RÉUSSI (revue #441, B2/A2) — sinon l'erreur du rechargement reste.
   * Le catalogue `conflict` reste neutre : il sert aussi des 409 qui ne rechargent rien.
   * @returns {Promise<boolean>} true si le serveur a appliqué la transition.
   */
  async function transitionner(periode, action) {
    if (IRREVERSIBLES.includes(action)) {
      // Deux libellés DISTINCTS (revue #441, B1) : sur une action irréversible, le
      // texte des boutons doit suffire à les distinguer, pas leur couleur (WCAG 1.4.1).
      const ok = await useConfirm().confirm({
        message: `${LIBELLES_TRANSITION[action]} « ${periode.libelle} » ? Cette opération est irréversible ; les inscriptions déjà faites sont conservées.`,
        variant: 'danger',
        confirmLabel: `${LIBELLES_TRANSITION[action]} la période`,
        cancelLabel: 'Garder la période',
      })
      if (!ok) return false
    }

    occuper(periode.id)
    error.value = ''
    notice.value = ''
    try {
      const response = await trainingSessionsService.transition(periode.id, action)
      // #611 : le statut RELU décide, pas le bouton cliqué.
      if (response.data?.status === 'archivee' && !voirArchivees.value) {
        await retirerArchivee(periode.id)
        return true
      }
      const index = periodes.value.findIndex((p) => p.id === periode.id)
      // #658 : la réponse d'une transition ne porte pas `en_cours`. Hors de l'état publiée, le serveur a
      // libéré la marque (invariant en base) : l'écran ne garde pas un « en cours » périmé.
      const enCours = response.data?.status === 'publiee' ? periodes.value[index]?.en_cours : false
      if (index !== -1) periodes.value[index] = { ...periodes.value[index], ...response.data, en_cours: enCours }
      notice.value = 'Période mise à jour.'
      return true
    } catch (err) {
      const message = err?.userMessage || ERROR_MESSAGES.unknown
      if (err?.response?.status !== 409) {
        error.value = message
      } else if (await load(page.value)) {
        error.value = `${message} ${ERROR_MESSAGES.listeActualisee}`
      }
      return false
    } finally {
      liberer(periode.id)
    }
  }

  /** #658 : garde la période RELUE du serveur après une modification. */
  function majPeriode(relue) {
    periodes.value = periodes.value.map((p) => (p.id === relue.id ? { ...p, ...relue } : p))
    notice.value = 'Période modifiée.'
  }

  /** #658 : supprimer un brouillon, après confirmation ; le refus nommé passe par le catalogue. */
  async function supprimer(periode) {
    const ok = await useConfirm().confirm({
      message: `Supprimer le brouillon « ${periode.libelle} » ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer le brouillon',
      cancelLabel: 'Garder le brouillon',
    })
    if (!ok) return false
    return geste(periode, async () => {
      await trainingSessionsService.supprimer(periode.id)
      periodes.value = periodes.value.filter((p) => p.id !== periode.id)
      notice.value = 'Brouillon supprimé.'
    })
  }

  /** #658 : désigner la période en cours ; la liste est RELUE (ordre et drapeaux changent ailleurs). */
  async function designerEnCours(periode) {
    return geste(periode, async () => {
      await trainingSessionsService.designerEnCours(periode.id)
      await load(page.value)
      notice.value = `« ${periode.libelle} » est la période en cours.`
    })
  }

  async function geste(periode, operation) {
    occuper(periode.id)
    error.value = ''
    notice.value = ''
    try {
      await operation()
      return true
    } catch (err) {
      error.value = err?.userMessage || ERROR_MESSAGES.unknown
      return false
    } finally {
      liberer(periode.id)
    }
  }

  return {
    periodes, loading, error, notice, page, lastPage,
    dernierProgrammeId, saving, estOccupee, voirArchivees, programmes, programmesErreur, programmesTronques,
    load, creerProgramme, creerPeriode, transitionner, basculerArchivees, chargerProgrammes,
    majPeriode, supprimer, designerEnCours,
  }
}
